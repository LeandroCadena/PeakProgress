import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";

import { attachGuestData, GUEST_USER_ID } from "../database/guestAccount";
import { AUTH_CONFIRMATION_URL } from "../services/authRedirect";
import { getGoogleIdToken } from "../services/googleSignIn";
import { supabase } from "../services/supabase";

const guest = { id: GUEST_USER_ID };
type AccountIssue = "startupAccountError" | "startupLinkError" | "emailConfirmationError";

type AuthContextType = {
    user: User | typeof guest;
    session: Session | null;
    loading: boolean;
    issue: AccountIssue | null;
    retry: () => void;
    continueOffline: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;
    confirmEmailCode: (email: string, token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState<AccountIssue | null>(null);
    const [attempt, setAttempt] = useState(0);
    const offlineOnly = useRef(false);
    const confirmingLink = useRef(false);
    const linkedUser = useRef<string | null>(null);
    const processedLinks = useRef(new Set<string>());
    const operation = useRef(Promise.resolve());

    const applySession = useCallback((next: Session | null, initial = false) => {
        const pending = operation.current.then(async () => {
            if (next && linkedUser.current !== next.user.id) {
                try {
                    await attachGuestData(next.user.id);
                    linkedUser.current = next.user.id;
                } catch (error) {
                    console.warn("Unable to link guest data:", error);
                    setIssue("startupLinkError");
                    setLoading(false);
                    return;
                }
            }

            if (!next) linkedUser.current = null;
            setSession(next);
            if (initial && confirmingLink.current) return;
            setIssue(null);
            setLoading(false);
        });

        operation.current = pending;
        return pending;
    }, []);

    useEffect(() => {
        let active = true;
        let acceptingInitialSession = true;
        let authRevision = 0;

        const timeout = setTimeout(() => {
            if (active && acceptingInitialSession && !confirmingLink.current) {
                acceptingInitialSession = false;
                setIssue("startupAccountError");
                setLoading(false);
            }
        }, 8_000);

        const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
            if (event === "INITIAL_SESSION" || (next && offlineOnly.current)) return;
            authRevision += 1;
            clearTimeout(timeout);
            // Supabase holds the auth lock while notifying listeners.
            void applySession(next);
        });

        void supabase.auth
            .getSession()
            .then(({ data, error }) => {
                if (error) throw error;
                if (
                    active &&
                    acceptingInitialSession &&
                    !offlineOnly.current &&
                    authRevision === 0
                ) {
                    clearTimeout(timeout);
                    return applySession(data.session, true);
                }
            })
            .catch((error: unknown) => {
                if (
                    active &&
                    acceptingInitialSession &&
                    !offlineOnly.current &&
                    authRevision === 0
                ) {
                    clearTimeout(timeout);
                    console.warn("Unable to restore session:", error);
                    setIssue("startupAccountError");
                    setLoading(false);
                }
            });

        return () => {
            active = false;
            clearTimeout(timeout);
            listener.subscription.unsubscribe();
        };
    }, [applySession, attempt]);

    useEffect(() => {
        async function confirmEmail(url: string | null) {
            if (!url || processedLinks.current.has(url)) return;
            const [path, query] = url.split("?");
            if (path.split("#")[0] !== AUTH_CONFIRMATION_URL) return;
            processedLinks.current.add(url);
            confirmingLink.current = true;
            setLoading(true);

            try {
                offlineOnly.current = false;
                const code = new URLSearchParams(query?.split("#")[0]).get("code");
                if (!code) throw new Error("Missing confirmation code");
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) throw error;
            } catch {
                setIssue("emailConfirmationError");
                setLoading(false);
            } finally {
                confirmingLink.current = false;
            }
        }

        void Linking.getInitialURL()
            .then(confirmEmail)
            .catch(() => {});
        const subscription = Linking.addEventListener("url", ({ url }) => void confirmEmail(url));
        return () => subscription.remove();
    }, []);

    function retry() {
        offlineOnly.current = false;
        setIssue(null);
        setLoading(true);
        setAttempt((current) => current + 1);
    }

    async function continueOffline() {
        if (issue === "emailConfirmationError") {
            setIssue(null);
            return;
        }
        offlineOnly.current = true;
        await applySession(null);
    }

    async function signInWithGoogle() {
        const token = await getGoogleIdToken();
        if (!token) return;

        offlineOnly.current = false;
        const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token });
        if (error) throw error;
    }

    async function signIn(email: string, password: string) {
        offlineOnly.current = false;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    }

    async function resendConfirmation(email: string) {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: AUTH_CONFIRMATION_URL },
        });
        if (error) throw error;
    }

    async function confirmEmailCode(email: string, token: string) {
        offlineOnly.current = false;
        const { error } = await supabase.auth.verifyOtp({ type: "email", email, token });
        if (error) throw error;
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? guest,
                session,
                loading,
                issue,
                retry,
                continueOffline,
                signIn,
                signInWithGoogle,
                resendConfirmation,
                confirmEmailCode,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
}

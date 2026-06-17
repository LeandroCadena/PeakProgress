import { ScrollView, StyleSheet } from "react-native";
import { ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export default function RoutineDetailLayout({ children }: Props) {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {children}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    contentContainer: {
        paddingBottom: 40,
    },
});
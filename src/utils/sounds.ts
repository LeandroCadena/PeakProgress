import { AudioPlayer, createAudioPlayer } from "expo-audio";

let timerPlayer: AudioPlayer | null = null;
let personalRecordPlayer: AudioPlayer | null = null;
let soundsEnabled = true;

export function setSoundsEnabled(value: boolean) {
    soundsEnabled = value;
}

export function initializeSounds() {
    if (timerPlayer) return;

    timerPlayer = createAudioPlayer(require("../../assets/sounds/timer-finished.wav"));

    personalRecordPlayer = createAudioPlayer(require("../../assets/sounds/personal-record.wav"));
}

export function playTimerFinishedSound() {
    if (!soundsEnabled) return;

    try {
        if (!timerPlayer) return;

        timerPlayer.seekTo(0);
        timerPlayer.play();
    } catch (error) {
        console.log("Timer sound error:", error);
    }
}

export function playPersonalRecordSound() {
    if (!soundsEnabled) return;

    try {
        if (!personalRecordPlayer) return;

        personalRecordPlayer.seekTo(0);
        personalRecordPlayer.play();
    } catch (error) {
        console.log("Personal record sound error:", error);
    }
}

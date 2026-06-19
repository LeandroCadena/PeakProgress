import { Audio } from "expo-av";

export async function playTimerFinishedSound() {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
            require("../../assets/sounds/timer-finished.wav"),
            { shouldPlay: true, volume: 1.0 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.log("Sound error:", error);
    }
}
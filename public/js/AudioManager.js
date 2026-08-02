// js/AudioManager.js
export class AudioManager {
    constructor() {
        // Lista de canciones basadas en tus archivos
        this.playlist = [
            'audio/perfect-beauty.mp3',
            'audio/relaxing-ambient.mp3',
            'audio/space-shuttle.mp3'
        ];
        this.currentSongIndex = 0;

        // Reproductor principal de música ambiental
        this.musicPlayer = new Audio(this.playlist[this.currentSongIndex]);
        this.musicPlayer.loop = false;
        this.musicPlayer.volume = 0.4;

        // Escuchar cuando la canción actual termina para pasar a la siguiente
        this.musicPlayer.addEventListener('ended', () => {
            this.nextSong();
        });

        // Reproductor de la voz en off
        this.voiceOver = new Audio('audio/Voz_En_Off.mp3');
        this.voiceOver.volume = 1;

        this.isInitialized = false;
    }

    init() {
        if (!this.isInitialized) {
            this.musicPlayer.play().catch(e => console.log("Audio waiting for interaction"));
            this.isInitialized = true;
        }
    }

    nextSong() {
        // Avanza al siguiente índice de manera circular
        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.musicPlayer.src = this.playlist[this.currentSongIndex];
        this.musicPlayer.play().catch(e => console.log("Next song play prevented"));
    }

    playVoiceOver() {
        this.voiceOver.currentTime = 0;
        this.voiceOver.play().catch(e => console.log("Voiceover play prevented"));
    }
}
// js/AudioManager.js
export class AudioManager {
    constructor() {
        // Música ambiental en bucle
        this.ambientMusic = new Audio('../audio/perfect-beauty.mp3');
        this.ambientMusic.loop = true;
        this.ambientMusic.volume = 0.4; // Volumen moderado de fondo

        // Voz en off conceptual
        this.voiceOver = new Audio('../audio/space-shuttle.mp3');
        this.voiceOver.volume = 0.8;

        this.isInitialized = false;
    }

    // Los navegadores bloquean el audio automático hasta que hay una interacción del usuario (clic/tecla)
    init() {
        if (!this.isInitialized) {
            this.ambientMusic.play().catch(e => console.log("Audio waiting for interaction"));
            this.isInitialized = true;
        }
    }

    playVoiceOver() {
        // Reinicia y reproduce la voz en off con la frase conceptual
        this.voiceOver.currentTime = 0;
        this.voiceOver.play().catch(e => console.log("Audio play prevented"));
    }
}
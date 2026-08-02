// js/InputManager.js
import { CONFIG } from './Config.js';

export class InputManager {
    constructor(socket) {
        this.socket = socket;
        
        // Estados limpios para los 3 usuarios
        this.users = Array.from({ length: 3 }, () => ({
            joystick: { x: 0, y: 0 }, // Normalizado -1 a 1
            encoder: 0,               // Valor crudo acumulado
            buttonPressed: false,
            buttonTriggered: false     // Flanco de subida (one-shot)
        }));

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Asume que server.js envía 'serialData' con el formato definido anteriormente
        this.socket.on('serialData', (dataCruda) => {
            this.parseHardwareData(dataCruda);
        });
    }

    parseHardwareData(data) {
        let usersData = data.split('|');
        if (usersData.length !== 3) return;

        for (let i = 0; i < 3; i++) {
            let parts = usersData[i].split(':');
            if (parts.length !== 2) continue;
            
            let values = parts[1].split(',').map(Number);
            if (values.length !== 4) continue;

            let user = this.users[i];

            // --- NUEVO: Filtro Deadzone del 15% ---
            const DEADZONE = 0.15;
            let normX = (values[0] - 512) / 512;
            let normY = (values[1] - 512) / 512;

            user.joystick.x = Math.abs(normX) < DEADZONE ? 0 : normX;
            user.joystick.y = Math.abs(normY) < DEADZONE ? 0 : normY;

            user.encoder = values[2];

            let currentBtnState = (values[3] === 1);
            user.buttonTriggered = (currentBtnState && !user.buttonPressed);
            user.buttonPressed = currentBtnState;
        }
    }

    // Getters limpios
    getJoystickVec(userId) {
        //userId 0, 1, 2
        return createVector(this.users[userId].joystick.x, this.users[userId].joystick.y);
    }

    getEncoderVal(userId) {
        return this.users[userId].encoder;
    }

    isButtonTriggered(userId) {
        return this.users[userId].buttonTriggered;
    }
}
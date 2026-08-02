// js/Attractor.js
import { CONFIG } from './Config.js';

export class Attractor {
    constructor(id, x, y, colorCode) {
        this.id = id;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        
        // Curaduría artística: masa inicial y color fijo
        this.mass = 100; 
        this.color = color(colorCode);
        
        // Inercia del atractor (difícil de mover para el usuario)
        this.joystickSensitivity = 0.8; 
    }

    // Aplica las señales limpias del InputManager
    update(joyVec, encVal) {
        // 1. Movimiento vía Joystick (Inercia)
        // Escalamos la aceleración según masa (F=ma -> a=F/m)
        this.acc.add(joyVec.mult(this.joystickSensitivity));
        
        this.vel.mult(0.92); // Damping específico para atractores
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset

        // 2. Control de Masa vía Encoder
        // Mapeamos el encoder acumulado a rangos seguros definidos en Config
        this.mass = map(encVal, -50, 50, CONFIG.MIN_ATTRACTOR_MASS, CONFIG.MAX_ATTRACTOR_MASS, true);
    }

    display() {
        // Visualización del núcleo de gravedad
        fill(this.color);
        noStroke();
        // El tamaño visual depende de la masa controlada por encoder
        circle(this.pos.x, this.pos.y, map(this.mass, CONFIG.MIN_ATTRACTOR_MASS, CONFIG.MAX_ATTRACTOR_MASS, 20, 60));
        
        // Núcleo negro para contraste
        fill(0);
        circle(this.pos.x, this.pos.y, 5);
    }
}
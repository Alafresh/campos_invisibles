// js/Attractor.js
import { CONFIG } from './Config.js';

export class Attractor {
    constructor(id, x, y, colorCode) {
        this.id = id;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        
        this.mass = CONFIG.MIN_ATTRACTOR_MASS; 
        this.color = color(colorCode);
        this.joystickSensitivity = 0.8; 
        
        this.trappedParticles = 0;
        this.baseCapacity = 180;     // Capacidad base cuando es pequeño
        this.maxCapacity = 180;      // Capacidad dinámica actual
        
        // --- SOLUCIÓN AL ENCODER ---
        this.encoderOffset = 0;     // Captura el "cero virtual" tras una explosión
        
        this.isAwake = false;
        this.idleFrames = 0;
        this.lastEncVal = 0;
        
        this.cooldown = 0;       
        this.flashAlpha = 0;     
    }

    update(joyVec, encVal) { 
        if (this.cooldown > 0) {
            this.cooldown--;
            this.isAwake = false;
            this.vel.mult(0.92);
            this.pos.add(this.vel);
        } else {
            let isInputActive = (joyVec.magSq() > 0) || (encVal !== this.lastEncVal);
            this.lastEncVal = encVal;

            if (isInputActive) {
                this.isAwake = true;
                this.idleFrames = 0;
            } else {
                this.idleFrames++;
                if (this.idleFrames > 180) { 
                    this.isAwake = false;
                }
            }

            if (this.isAwake) {
                this.acc.add(joyVec.mult(this.joystickSensitivity));
            }
            this.vel.mult(0.92); 
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0); 
        }

        if (this.pos.x < 0) { this.pos.x = 0; this.vel.x = 0; } 
        else if (this.pos.x > width) { this.pos.x = width; this.vel.x = 0; }
        if (this.pos.y < 0) { this.pos.y = 0; this.vel.y = 0; } 
        else if (this.pos.y > height) { this.pos.y = height; this.vel.y = 0; }

        // --- 1. CÁLCULO NETO DEL ENCODER (Sin límites superiores) ---
        let netEncoder = encVal - this.encoderOffset;
        // La masa crece indefinidamente a partir del mínimo
        this.mass = CONFIG.MIN_ATTRACTOR_MASS + Math.max(0, netEncoder * 2.5);

        // --- 2. INESTABILIDAD: MÁS MASA = MENOS CAPACIDAD ---
        // Entre más grande sea el atractor, menor cantidad de partículas soporta antes de estallar
        let massFactor = (this.mass - CONFIG.MIN_ATTRACTOR_MASS);
        this.maxCapacity = Math.max(10, this.baseCapacity - (massFactor * 0.3));

        if (this.flashAlpha > 0) {
            this.flashAlpha -= 15; 
        }
    }

    display() {
        // Al no tener límite superior, limitamos visualmente el radio máximo en pantalla para que no rompa el diseño
        let visualSize = map(this.mass, CONFIG.MIN_ATTRACTOR_MASS, 500, 20, 150, true);
        
        let fillRatio = constrain(this.trappedParticles / this.maxCapacity, 0, 1);

        push();
        colorMode(HSB, 360, 100, 100, 255);
        let h = hue(this.color);
        let s = map(fillRatio, 0, 1, 40, 100);
        let b = 100; 
        let a = this.isAwake ? map(fillRatio, 0, 1, 100, 255) : 50;

        fill(h, s, b, a);
        noStroke();
        circle(this.pos.x, this.pos.y, visualSize);
        pop();
        
        fill(0, this.isAwake ? 255 : 80);
        noStroke();
        circle(this.pos.x, this.pos.y, 5);

        if (this.flashAlpha > 0) {
            fill(255, this.flashAlpha); 
            noStroke();
            circle(this.pos.x, this.pos.y, visualSize * 2.5);
        }
    }
}
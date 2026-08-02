// js/Attractor.js
import { CONFIG } from './Config.js';

export class Attractor {
    constructor(id, x, y, colorCode) {
        this.id = id;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        
        this.mass = 100; 
        this.color = color(colorCode);
        this.joystickSensitivity = 0.8; 
        
        this.trappedParticles = 0;
        this.maxCapacity = 180; 
        
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

        this.mass = map(encVal, -50, 50, CONFIG.MIN_ATTRACTOR_MASS, CONFIG.MAX_ATTRACTOR_MASS, true);
        
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 15; 
        }
    }

    display() {
        let currentSize = map(this.mass, CONFIG.MIN_ATTRACTOR_MASS, CONFIG.MAX_ATTRACTOR_MASS, 20, 60);
        
        // Ratio de llenado de partículas (de 0.0 a 1.0)
        let fillRatio = constrain(this.trappedParticles / this.maxCapacity, 0, 1);

        push();
        // Cambiamos a modo HSB para controlar orgánicamente la saturación y el alpha
        colorMode(HSB, 360, 100, 100, 255);
        
        let h = hue(this.color);
        // La saturación sube desde un tono apagado (40) hasta el color vivo (100) al llenarse
        let s = map(fillRatio, 0, 1, 40, 100);
        let b = 100; 
        // El alpha sube desde transparente (100) hasta totalmente opaco (255)
        let a = this.isAwake ? map(fillRatio, 0, 1, 100, 255) : 20;

        fill(h, s, b, a);
        noStroke();
        circle(this.pos.x, this.pos.y, currentSize);
        pop();
        
        // Núcleo negro central
        fill(0, this.isAwake ? 255 : 80);
        noStroke();
        circle(this.pos.x, this.pos.y, 5);

        // Destello de explosión final por sobrecarga
        if (this.flashAlpha > 0) {
            fill(255, this.flashAlpha); 
            noStroke();
            circle(this.pos.x, this.pos.y, currentSize * 3.5);
        }
    }
}
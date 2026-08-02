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
        this.maxCapacity = 80; 
        
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
        
        this.color.setAlpha(this.isAwake ? 255 : 80);
        
        fill(this.color);
        noStroke();
        circle(this.pos.x, this.pos.y, currentSize);
        
        if (this.trappedParticles > 0) {
            noFill();
            stroke(255, this.isAwake ? 150 : 50);
            strokeWeight(3);
            let overloadRatio = this.trappedParticles / this.maxCapacity;
            arc(this.pos.x, this.pos.y, currentSize + 15, currentSize + 15, 0, TWO_PI * overloadRatio);
        }
        
        // Volvemos al núcleo siempre negro 
        fill(0, this.isAwake ? 255 : 80);
        noStroke();
        circle(this.pos.x, this.pos.y, 5);

        if (this.flashAlpha > 0) {
            fill(255, this.flashAlpha); 
            noStroke();
            circle(this.pos.x, this.pos.y, currentSize * 3.5);
        }
    }
}
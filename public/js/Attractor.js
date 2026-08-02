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
        
        // Almacena los objetos partícula reales
        this.orbitingParticles = [];
        
        this.baseCapacity = 180;     
        this.maxCapacity = 180;      
        
        this.encoderOffset = 0;     
        
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
                if (this.idleFrames > 600) { 
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

        if (this.pos.x < 0) { this.pos.x = width; } 
        else if (this.pos.x > width) { this.pos.x = 0; }
        if (this.pos.y < 0) { this.pos.y = height; } 
        else if (this.pos.y > height) { this.pos.y = 0; }

        let netEncoder = encVal - this.encoderOffset;
        this.mass = CONFIG.MIN_ATTRACTOR_MASS + Math.max(0, netEncoder * 2.5);

        let massFactor = (this.mass - CONFIG.MIN_ATTRACTOR_MASS);
        this.maxCapacity = Math.max(10, this.baseCapacity - (massFactor * 0.3));

        if (this.flashAlpha > 0) {
            this.flashAlpha -= 15; 
        }
    }

    display() {
        let visualSize = map(this.mass, CONFIG.MIN_ATTRACTOR_MASS, 500, 20, 150, true);
        
        let fillRatio = constrain(this.orbitingParticles.length / this.maxCapacity, 0, 1);

        push();
        colorMode(HSB, 360, 100, 100, 255);
        let h = hue(this.color);
        let s = map(fillRatio, 0, 1, 40, 100);
        // Este valor sube de 100 a 255 según se va llenando de partículas
        let dynamicAlpha = this.isAwake ? map(fillRatio, 0, 1, 100, 255) : 50;

        // 1. Dibujar el disco de acreción exterior
        this.drawNeonGlow(h, s, dynamicAlpha, visualSize);

        // 2. DIBUJAR PARTÍCULAS ORBITANDO
        push();
        translate(this.pos.x, this.pos.y);
        rotate(frameCount * 0.015 + this.id); 
        blendMode(ADD); 
        
        for (let p of this.orbitingParticles) {
            p.orbitAngle += p.orbitSpeed;
            
            let px = cos(p.orbitAngle) * p.orbitRadius;
            let py = sin(p.orbitAngle) * p.orbitRadius * 0.55;

            let pxPrev = cos(p.orbitAngle - p.orbitSpeed * 4) * p.orbitRadius;
            let pyPrev = sin(p.orbitAngle - p.orbitSpeed * 4) * p.orbitRadius * 0.55;

            stroke(p.color); 
            strokeWeight(2);
            line(pxPrev, pyPrev, px, py);
        }
        pop();

        // 3. Dibujar el horizonte de sucesos (Agujero Negro)
        fill(0); 
        
        // --- CAMBIO AQUÍ: Usamos dynamicAlpha en el stroke del borde ---
        stroke(h, 100, 100, dynamicAlpha); 
        strokeWeight(3.5); 
        circle(this.pos.x, this.pos.y, visualSize);
        pop();

        // Destello por sobrecarga
        if (this.flashAlpha > 0) {
            push();
            colorMode(HSB, 360, 100, 100, 255);
            fill(h, 30, 100, this.flashAlpha * 0.4);
            noStroke();
            circle(this.pos.x, this.pos.y, visualSize * 3.2);

            fill(255, this.flashAlpha); 
            circle(this.pos.x, this.pos.y, visualSize * 1.5);
            pop();
        }
    }

    drawNeonGlow(h, s, baseAlpha, visualSize) {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(frameCount * 0.015 + this.id); 

        let layers = 6;
        noStroke();

        for (let i = layers; i >= 1; i--) {
            let rOuter = map(i, 1, layers, visualSize * 0.6, visualSize * 2.0);
            let layerAlpha = (baseAlpha / layers) * (1 - i / (layers + 2)) * 0.7;

            fill(h, s, 100, layerAlpha);
            ellipse(0, 0, rOuter * 2, rOuter * 0.55);
        }

        stroke(h, s * 0.6, 100, baseAlpha * 0.8);
        strokeWeight(1.5);
        noFill();
        ellipse(0, 0, visualSize * 1.4, visualSize * 0.75);
        
        pop();
    }
}
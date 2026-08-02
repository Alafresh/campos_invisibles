// js/sketch.js
import { CONFIG } from './Config.js';
import { InputManager } from './InputManager.js';
import { Particle } from './Particle.js';
import { Attractor } from './Attractor.js';
import { PhysicsManager } from './PhysicsManager.js';
import { getNextSequentialPreset, getForcePreset } from './Presets.js';

let socket;
let inputManager;
let physicsManager;
let stardust = [];
let userAttractors = [];
let shakeTime = 0;

// Configuración p5.js global (Requerido para ES6 modules en p5)
window.setup = function() {
    createCanvas(windowWidth, windowHeight);
    ellipseMode(CENTER);

    socket = io();
    inputManager = new InputManager(socket);
    physicsManager = new PhysicsManager();

    for (let i = 0; i < CONFIG.TOTAL_PARTICLES; i++) {
        let species = int(random(CONFIG.NUM_SPECIES)); 
        stardust.push(new Particle(random(width), random(height), species));
    }

    userAttractors.push(new Attractor(0, width * 0.25, height * 0.5, '#FF3366'));
    userAttractors.push(new Attractor(1, width * 0.50, height * 0.5, '#33CCFF'));
    userAttractors.push(new Attractor(2, width * 0.75, height * 0.5, '#66FF66'));

    // --- TEMPORIZADOR DE MUTACIÓN (Cada 1 Minuto) ---
    setInterval(changeRandomPreset, 1 * 60 * 1000);
};

window.draw = function() {
    // Fondo oscuro con leve rastro (Alpha poético)
    background(0, 0, 0, 45); 

    push(); // Guardamos el estado original del lienzo
    if (shakeTime > 0) {
        // Sacudida aleatoria en los ejes X e Y
        translate(random(-10, 10), random(-10, 10)); 
        shakeTime--;
    }

    // === LÓGICA / MATEMÁTICAS (Physics Update) ===
    physicsManager.applyFrictionlessPhysics(stardust, userAttractors);

    // === RENDERIZADO / DIBUJO ===
    userAttractors.forEach((attractor, i) => {
        let rawEnc = inputManager.getEncoderVal(i);
        
        attractor.update(inputManager.getJoystickVec(i), rawEnc);
        attractor.display();

        if (attractor.isAwake) {
            for (let j = stardust.length - 1; j >= 0; j--) {
                let p = stardust[j];
                let distSq = (p.pos.x - attractor.pos.x)**2 + (p.pos.y - attractor.pos.y)**2;
                let captureRadius = 5; 
                
                if (distSq < captureRadius * captureRadius) {
                    stardust.splice(j, 1); 
                    attractor.trappedParticles++;
                }
            }

            if (attractor.trappedParticles >= attractor.maxCapacity) {
                explodeParticles(attractor, true, rawEnc); 
            } else if (inputManager.isButtonTriggered(i)) {
                if (attractor.trappedParticles > 0) {
                    explodeParticles(attractor, false, rawEnc); 
                }
            }
            
        } else {
            if (attractor.trappedParticles > 0 && frameCount % 3 === 0) {
                attractor.trappedParticles--;
                let species = int(random(CONFIG.NUM_SPECIES));
                let newP = new Particle(attractor.pos.x, attractor.pos.y, species);
                newP.vel = p5.Vector.random2D().mult(random(0.2, 0.8)); 
                stardust.push(newP);
            }
        }
    });

    // 3. Dibujar Stardust con Mezcla Aditiva
    blendMode(ADD); 
    for (let particle of stardust) {
        particle.display(); 
    }
    blendMode(BLEND); 

    pop(); // Restauramos el lienzo tras el Screen Shake

    // === INTEGRACIÓN (Mover entidades al final) ===
    // 4. Aplicar aceleraciones y mover partículas (el wrap-around ya ocurre dentro de particle.integrate())
    for (let particle of stardust) {
        particle.integrate(); 
    }
    
    // Mostrar info técnica opcional
    drawDebug();
};

function drawDebug() {
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    text(`Stardust: ${stardust.length} | FPS: ${int(frameRate())}`, 10, height - 20);
}

function changeRandomPreset() {
    const nextPresetId = getNextSequentialPreset(); 
    CONFIG.INTERACTION_MATRIX = getForcePreset(nextPresetId, CONFIG.NUM_SPECIES);
    console.log(`[Cuna de Mundos] Ecosistema mutado en secuencia. Preset ID: ${nextPresetId}`);
}

function explodeParticles(attractor, isOverload, currentEncRaw) {
    let amountToShoot = isOverload ? attractor.trappedParticles : Math.min(15, attractor.trappedParticles);
    
    for (let i = 0; i < amountToShoot; i++) {
        let species = int(random(CONFIG.NUM_SPECIES));
        let newP = new Particle(attractor.pos.x, attractor.pos.y, species);
        
        let explosionForce = isOverload ? random(15, 25) : random(8, 15);
        newP.vel = p5.Vector.random2D().mult(explosionForce); 
        
        stardust.push(newP);
    }
    
    attractor.trappedParticles -= amountToShoot;
    
    if (isOverload) {
        attractor.flashAlpha = 255; 
        attractor.cooldown = 120; 
        shakeTime = 25; 
        attractor.encoderOffset = currentEncRaw; 
    }
}

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
};
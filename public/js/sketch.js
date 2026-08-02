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

let bgImages = [];
let currentBg;

// Eliminamos window.preload por completo

window.setup = function() {
    createCanvas(windowWidth, windowHeight);
    ellipseMode(CENTER);
    
    // --- SOLUCIÓN DEFINITIVA: Carga asíncrona segura para módulos ES6 ---
    let paths = ['images/SkyBox_1_169.png', 'images/SkyBox_2_169.png', 'images/SkyBox_3_169.png'];
    paths.forEach(path => {
        loadImage(path, (img) => {
            bgImages.push(img);
            // En cuanto cargue la primera imagen, la asignamos para que se muestre de inmediato
            if (!currentBg) {
                currentBg = img;
            }
        });
    });
    
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

    setInterval(changeRandomPreset, 1 * 10 * 1000);
    
};

window.draw = function() {
    background(0, 0, 0, 50); 
    
    // Solo dibujará cuando la imagen haya terminado de descargar asíncronamente
    if (currentBg && currentBg.width > 0) {
        push();
        // Subí el Alpha a 80 para que la veas. Si es muy invasiva, bájalo de nuevo a 30 o 40.
        tint(255, 40); 
        image(currentBg, 0, 0, width, height);
        pop();
    }
    
    push(); 
    if (shakeTime > 0) {
        translate(random(-10, 10), random(-10, 10)); 
        shakeTime--;
    }

    physicsManager.applyFrictionlessPhysics(stardust, userAttractors);

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
                    let capturedParticle = stardust.splice(j, 1)[0]; 
                    
                    let visualSize = map(attractor.mass, CONFIG.MIN_ATTRACTOR_MASS, 500, 20, 150, true);
                    capturedParticle.orbitAngle = random(TWO_PI);
                    capturedParticle.orbitRadius = random(visualSize * 0.7, visualSize * 2.2);
                    capturedParticle.orbitSpeed = random(0.03, 0.1);
                    
                    attractor.orbitingParticles.push(capturedParticle);
                }
            }

            if (attractor.orbitingParticles.length >= attractor.maxCapacity) {
                explodeParticles(attractor, true, rawEnc); 
            } else if (inputManager.isButtonTriggered(i)) {
                if (attractor.orbitingParticles.length > 0) {
                    explodeParticles(attractor, false, rawEnc); 
                }
            }
            
        } else {
            if (attractor.orbitingParticles.length > 0 && frameCount % 3 === 0) {
                let p = attractor.orbitingParticles.pop();
                p.pos.x = attractor.pos.x;
                p.pos.y = attractor.pos.y;
                p.vel = p5.Vector.random2D().mult(random(0.2, 0.8)); 
                stardust.push(p);
            }
        }
    });

    blendMode(ADD); 
    for (let particle of stardust) {
        particle.display(); 
    }
    blendMode(BLEND); 

    pop(); 

    for (let particle of stardust) {
        particle.integrate(); 
    }
    
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
    
    // Cambia el fondo aleatoriamente solo si las imágenes ya cargaron en memoria
    if (bgImages.length > 0) {
        currentBg = random(bgImages);
    }
    
    console.log(`[Cuna de Mundos] Ecosistema mutado en secuencia. Preset ID: ${nextPresetId}`);
}

function explodeParticles(attractor, isOverload, currentEncRaw) {
    let amountToShoot = isOverload ? attractor.orbitingParticles.length : Math.min(15, attractor.orbitingParticles.length);
    
    for (let i = 0; i < amountToShoot; i++) {
        let p = attractor.orbitingParticles.shift(); 
        
        p.pos.x = attractor.pos.x;
        p.pos.y = attractor.pos.y;
        
        let explosionForce = isOverload ? random(35, 55) : random(25, 35);
        p.vel = p5.Vector.random2D().mult(explosionForce); 
        
        stardust.push(p); 
    }
    
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
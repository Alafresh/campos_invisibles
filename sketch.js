import { CONFIG } from './Config.js';
import { Particle } from './Particle.js';
import { Attractor } from './Attractor.js';
import { PhysicsManager } from './PhysicsManager.js';
import { getNextSequentialPreset, getForcePreset } from './Presets.js';
import { AudioManager } from './AudioManager.js';

let physicsManager;
let audioManager;
let stardust = [];
let userAttractors = [];
let shakeTime = 0;

let bgImages = [];
let currentBg;

// Variables de estado para el teclado
let simEncoderVal = 0;
let simButtonPressed = false;
let increaseMass = false;
let decreaseMass = false;

window.setup = function() {
    createCanvas(windowWidth, windowHeight);
    ellipseMode(CENTER);
    
    let paths = ['./SkyBox_1_169.png', './SkyBox_2_169.png', './SkyBox_3_169.png'];
    paths.forEach(path => {
        loadImage(path, (img) => {
            bgImages.push(img);
            if (!currentBg) {
                currentBg = img;
            }
        });
    });
    
    physicsManager = new PhysicsManager();
    audioManager = new AudioManager(); 

    for (let i = 0; i < CONFIG.TOTAL_PARTICLES; i++) {
        let species = int(random(CONFIG.NUM_SPECIES)); 
        stardust.push(new Particle(random(width), random(height), species));
    }

    // Creamos UN SOLO atractor centrado en la pantalla para el demo web
    userAttractors.push(new Attractor(0, width * 0.5, height * 0.5, '#FF3366'));

    // Ecosistema muta cada 1 minuto
    setInterval(changeRandomPreset, 0.5 * 60 * 1000);

    // Voz en off suena cada 3 minutos independientes
    setInterval(() => {
        if (audioManager && audioManager.isInitialized) {
            audioManager.playVoiceOver();
        }
    }, 3 * 60 * 1000);
};

window.draw = function() {
    background(0, 0, 0, 45); 
    
    if (currentBg && currentBg.width > 0) {
        push();
        tint(255, 35); 
        let noiseX = noise(frameCount * 0.003) * 40 - 20;
        let noiseY = noise(frameCount * 0.003 + 500) * 40 - 20;
        image(currentBg, noiseX - 20, noiseY - 20, width + 40, height + 40);
        pop();
    }
    
    push(); 
    if (shakeTime > 0) {
        translate(random(-10, 10), random(-10, 10)); 
        shakeTime--;
    }

    physicsManager.applyFrictionlessPhysics(stardust, userAttractors);

    // Actualizar valor simulado del encoder según las teclas Q y E
    if (decreaseMass) simEncoderVal -= 3;
    if (increaseMass) simEncoderVal += 3;
    
    // Evitar valores negativos en el acumulador
    simEncoderVal = Math.max(0, simEncoderVal);

    let { joyVec, isBtnPressed } = getKeyboardInputs();

    if (!audioManager.isInitialized && (joyVec.magSq() > 0 || isBtnPressed || increaseMass || decreaseMass)) {
        audioManager.init();
    }
    
    let attractor = userAttractors[0];
    
    attractor.update(joyVec, simEncoderVal);
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
            explodeParticles(attractor, true, simEncoderVal); 
        } else if (isBtnPressed) {
            if (attractor.orbitingParticles.length > 0) {
                explodeParticles(attractor, false, simEncoderVal); 
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

    blendMode(ADD); 
    for (let particle of stardust) {
        particle.display(); 
    }
    blendMode(BLEND); 

    pop(); 

    for (let particle of stardust) {
        particle.integrate(); 
    }
};

// --- CONTROLADOR POR TECLADO ---
function getKeyboardInputs() {
    let joyVec = createVector(0, 0);
    let isBtn = simButtonPressed;
    
    simButtonPressed = false;

    // Movimiento con Flechas o WASD
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) joyVec.x -= 1;  
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) joyVec.x += 1; 
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) joyVec.y -= 1;     
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) joyVec.y += 1;   

    if (joyVec.magSq() > 0) joyVec.normalize();

    return { joyVec: joyVec, isBtnPressed: isBtn };
}

// Eventos robustos de teclado mediante banderas para Q, E y Espacio
window.keyPressed = function() {
    if (keyCode === 32) { 
        simButtonPressed = true; // Espacio
    }
    if (key === 'e' || key === 'E' || keyCode === 69) {
        increaseMass = true;
    }
    if (key === 'q' || key === 'Q' || keyCode === 81) {
        decreaseMass = true;
    }
};

window.keyReleased = function() {
    if (key === 'e' || key === 'E' || keyCode === 69) {
        increaseMass = false;
    }
    if (key === 'q' || key === 'Q' || keyCode === 81) {
        decreaseMass = false;
    }
};

function changeRandomPreset() {
    const nextPresetId = getNextSequentialPreset(); 
    CONFIG.INTERACTION_MATRIX = getForcePreset(nextPresetId, CONFIG.NUM_SPECIES);
    
    if (bgImages.length > 0) {
        currentBg = random(bgImages);
    }
    
    console.log(`[Campos Invisibles] Ecosistema mutado. Preset ID: ${nextPresetId}`);
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
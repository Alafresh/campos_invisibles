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

// Variables de estado para simular los Encoders y Botones con el teclado
let simEncoders = [0, 0, 0];
let simButtons = [false, false, false];

window.setup = function() {
    // Para la versión de PC Full, quitamos pixelDensity(1) para máxima resolución
    createCanvas(windowWidth, windowHeight);
    ellipseMode(CENTER);
    
    let paths = ['images/SkyBox_1_169.png', 'images/SkyBox_2_169.png', 'images/SkyBox_3_169.png'];
    paths.forEach(path => {
        loadImage(path, (img) => {
            bgImages.push(img);
            if (!currentBg) {
                currentBg = img;
            }
        });
    });
    
    // Eliminamos socket e InputManager, instanciamos directamente las físicas
    physicsManager = new PhysicsManager();
    audioManager = new AudioManager(); 

    for (let i = 0; i < CONFIG.TOTAL_PARTICLES; i++) {
        let species = int(random(CONFIG.NUM_SPECIES)); 
        stardust.push(new Particle(random(width), random(height), species));
    }

    userAttractors.push(new Attractor(0, width * 0.25, height * 0.5, '#FF3366'));
    userAttractors.push(new Attractor(1, width * 0.50, height * 0.5, '#33CCFF'));
    userAttractors.push(new Attractor(2, width * 0.75, height * 0.5, '#66FF66'));

    // Ecosistema muta cada 1 minuto
    setInterval(changeRandomPreset, 1 * 60 * 1000);

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

    userAttractors.forEach((attractor, i) => {
        // Obtenemos las entradas simuladas por teclado en lugar del Arduino
        let { joyVec, rawEnc, isBtnPressed } = getKeyboardInputs(i);

        if (!audioManager.isInitialized && (joyVec.magSq() > 0 || isBtnPressed)) {
            audioManager.init();
        }
        
        attractor.update(joyVec, rawEnc);
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
            } else if (isBtnPressed) {
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
    
    // drawDebug();
};

// --- SIMULADOR DE HARDWARE POR TECLADO ---
function getKeyboardInputs(i) {
    let joyVec = createVector(0, 0);
    let isBtn = false;

    // Consumir el botón si fue presionado este frame
    if (simButtons[i]) {
        isBtn = true;
        simButtons[i] = false;
    }

    // Mapeo de controles por Atractor
    if (i === 0) {
        // Atractor 1: Movimiento W,A,S,D | Masa Q/E
        if (keyIsDown(65)) joyVec.x -= 1; // A
        if (keyIsDown(68)) joyVec.x += 1; // D
        if (keyIsDown(87)) joyVec.y -= 1; // W
        if (keyIsDown(83)) joyVec.y += 1; // S
        if (keyIsDown(81)) simEncoders[0] -= 1; // Q
        if (keyIsDown(69)) simEncoders[0] += 1; // E
    } else if (i === 1) {
        // Atractor 2: Movimiento Flechas | Masa O/P
        if (keyIsDown(LEFT_ARROW)) joyVec.x -= 1;
        if (keyIsDown(RIGHT_ARROW)) joyVec.x += 1;
        if (keyIsDown(UP_ARROW)) joyVec.y -= 1;
        if (keyIsDown(DOWN_ARROW)) joyVec.y += 1;
        if (keyIsDown(79)) simEncoders[1] -= 1; // O
        if (keyIsDown(80)) simEncoders[1] += 1; // P
    } else if (i === 2) {
        // Atractor 3: Movimiento I,J,K,L | Masa U/Y
        if (keyIsDown(74)) joyVec.x -= 1; // J
        if (keyIsDown(76)) joyVec.x += 1; // L
        if (keyIsDown(73)) joyVec.y -= 1; // I
        if (keyIsDown(75)) joyVec.y += 1; // K
        if (keyIsDown(85)) simEncoders[2] -= 1; // U
        if (keyIsDown(89)) simEncoders[2] += 1; // Y
    }

    // Normalizamos para simular el comportamiento del joystick (magnitud max 1)
    if (joyVec.magSq() > 0) joyVec.normalize();

    return { joyVec: joyVec, rawEnc: simEncoders[i], isBtnPressed: isBtn };
}

// Escuchador global de teclado para eventos de 1 solo clic (Los botones arcade)
window.keyPressed = function() {
    if (keyCode === 32) simButtons[0] = true; // Espacio para Atractor 1
    if (keyCode === ENTER) simButtons[1] = true; // Enter para Atractor 2
    if (keyCode === SHIFT) simButtons[2] = true; // Shift para Atractor 3
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
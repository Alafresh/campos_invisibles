// js/sketch.js
import { CONFIG } from './Config.js';
import { InputManager } from './InputManager.js';
import { Particle } from './Particle.js';
import { Attractor } from './Attractor.js';
import { PhysicsManager } from './PhysicsManager.js';
import { PRESET_TYPES, getForcePreset } from './Presets.js';

let socket;
let inputManager;
let physicsManager;
let stardust = [];
let userAttractors = [];

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

    // --- NUEVO: TEMPORIZADOR DE MUTACIÓN ---
    // Cambia el preset cada 3 minutos (3 * 60 * 1000 milisegundos)
    setInterval(changeRandomPreset, 3 * 60 * 1000); 
};

window.draw = function() {
    // Fondo oscuro con leve rastro (Alpha poético)
    background(10, 10, 20, 25); 

    // === LÓGICA / MATEMÁTICAS (Physics Update) ===
    
    // 1. Calcular Física N-body pairwise (O(N^2)) y Macro.
    physicsManager.applyFrictionlessPhysics(stardust, userAttractors);

    // === RENDERIZADO / DIBUJO ===
    
    // 2. Dibujar y gestionar Atractores de Usuario
    // CORRECCIÓN: Se unifica la variable a "attractor" con doble 't'
    userAttractors.forEach((attractor, i) => {
        attractor.update(inputManager.getJoystickVec(i), inputManager.getEncoderVal(i));
        attractor.display();

        if (attractor.isAwake) {
            // A. LÓGICA DE ABSORCIÓN (Solo si está despierto)
            for (let j = stardust.length - 1; j >= 0; j--) {
                let p = stardust[j];
                let distSq = (p.pos.x - attractor.pos.x)**2 + (p.pos.y - attractor.pos.y)**2;
                
                let captureRadius = attractor.mass * 0.4; 
                
                if (distSq < captureRadius * captureRadius) {
                    stardust.splice(j, 1); 
                    attractor.trappedParticles++;
                }
            }

            // B. LÓGICA DE DISPARO Y EXPLOSIÓN
            if (attractor.trappedParticles >= attractor.maxCapacity) {
                explodeParticles(attractor, true); 
            } else if (inputManager.isButtonTriggered(i) && attractor.trappedParticles > 0) {
                explodeParticles(attractor, false); 
            }
            
        } else {
            // C. LÓGICA DE AUTOLIMPIEZA (Estado Dormido)
            // Si está inactivo y tiene partículas, suelta una lentamente cada varios frames
            if (attractor.trappedParticles > 0 && frameCount % 3 === 0) {
                attractor.trappedParticles--;
                let species = int(random(CONFIG.NUM_SPECIES));
                // CORRECCIÓN: Aquí estaba el error de tipeo
                let newP = new Particle(attractor.pos.x, attractor.pos.y, species);
                // Las suelta con mucha delicadeza, sin explotar
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

    // === INTEGRACIÓN (Mover entidades al final) ===
    
    // 4. Aplicar aceleraciones calculadas en el punto 1 y mover partículas.
    for (let particle of stardust) {
        particle.integrate(); 
        
        // Wrap-around poético de pantalla (no rebote)
        if (particle.pos.x < 0) particle.pos.x = width;
        if (particle.pos.x > width) particle.pos.x = 0;
        if (particle.pos.y < 0) particle.pos.y = height;
        if (particle.pos.y > height) particle.pos.y = 0;
    }
    
    // Mostrar info técnica opcional
    drawDebug();
};

function injectParticles(attractor) {
    // Inyectar 10 partículas de especie aleatoria desde el núcleo
    for (let i = 0; i < 10; i++) {
        let species = int(random(CONFIG.NUM_SPECIES));
        let newP = new Particle(attractor.pos.x, attractor.pos.y, species);
        // Explosión inicial pequeña
        newP.vel = p5.Vector.random2D().mult(2); 
        stardust.push(newP);
    }
    // Límite de seguridad para RPi
    if (stardust.length > CONFIG.TOTAL_PARTICLES * 1.5) {
        stardust.splice(0, 10);
    }
}

function drawDebug() {
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    text(`Stardust: ${stardust.length} | FPS: ${int(frameRate())}`, 10, height - 20);
}

// Esta función elige una regla aleatoria y cambia el ecosistema en vivo
function changeRandomPreset() {
    // Obtenemos un array con todos los IDs numéricos de los presets
    const presetIds = Object.values(PRESET_TYPES);
    
    // Elegimos un ID al azar
    const randomId = random(presetIds); 
    
    // Generamos la nueva matriz y se la inyectamos a la simulación
    CONFIG.INTERACTION_MATRIX = getForcePreset(randomId, CONFIG.NUM_SPECIES);
    
    console.log(`[Cuna de Mundos] Ecosistema mutado automáticamente. Nuevo preset ID: ${randomId}`);
}

function explodeParticles(attractor, isOverload) {
    // Si se sobrecargó, expulsa todo. Si disparó el botón, expulsa ráfagas de 15.
    let amountToShoot = isOverload ? attractor.trappedParticles : Math.min(15, attractor.trappedParticles);
    
    for (let i = 0; i < amountToShoot; i++) {
        let species = int(random(CONFIG.NUM_SPECIES));
        let newP = new Particle(attractor.pos.x, attractor.pos.y, species);
        
        // La explosión por sobrecarga dispara las partículas con más fuerza
        let explosionForce = isOverload ? random(8, 15) : random(3, 6);
        newP.vel = p5.Vector.random2D().mult(explosionForce); 
        
        stardust.push(newP);
    }
    
    attractor.trappedParticles -= amountToShoot;
    
    // --- LÓGICA DEL DESTELLO Y REPOSO ---
    if (isOverload) {
        // Dispara el destello visual al 100% de opacidad
        attractor.flashAlpha = 255; 
        
        // Forzar reposo (120 frames = ~2 segundos a 60 FPS)
        // Durante este tiempo, el atractor soltará el joystick y dejará de atraer partículas
        attractor.cooldown = 120; 
    }
}

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
};
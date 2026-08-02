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
    // Esto llena las aceleraciones (p.acc) sin moverlas aún.
    physicsManager.applyFrictionlessPhysics(stardust, userAttractors);

    // === RENDERIZADO / DIBUJO ===
    
    // 2. Dibujar Atractores de Usuario (sobre el polvo)
    userAttractors.forEach((atractor, i) => {
        // Actualizar atractor según hardware limpio
        atractor.update(inputManager.getJoystickVec(i), inputManager.getEncoderVal(i));
        atractor.display();

        // Lógica de inyección de partículas (Pulsador)
        if (inputManager.isButtonTriggered(i)) {
            injectParticles(atractor);
        }
    });

    // 3. Dibujar Stardust con Mezcla Aditiva
    blendMode(ADD); // Crítico para la estética de "Cuna de Mundos"
    
    for (let particle of stardust) {
        particle.display(); // Dibuja la entidad en pos.x, pos.y
    }
    
    blendMode(BLEND); // Restaurar para el fondo del próximo frame

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

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
};
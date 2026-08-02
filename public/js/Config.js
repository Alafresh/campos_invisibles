// js/Config.js

export const CONFIG = {
    // Especificaciones del Ecosistema
    TOTAL_PARTICLES: 1200, // Balance entre estética y rendimiento en RPi
    NUM_SPECIES: 7,
    PARTICLE_MIN_MASS: 0.8,
    PARTICLE_MAX_MASS: 1.2,
    
    // Parámetros de Física Poética
    FRICTION: 0.96,           // Evita que el sistema colapse por calor
    G_MACRO: 1.5,             // Constante gravitacional modificada de Atractores
    MAX_ATTRACTOR_MASS: 300,  // Límite del encoder
    MIN_ATTRACTOR_MASS: 20,
    
    // Parámetros Particle Life (Micro)
    R_MAX: 120,               // Radio máximo de influencia micro (en píxeles)
    BETA: 0.3,                // Radio de repulsión universal (beta * R_MAX)
    MICRO_FORCE_FACTOR: 0.5,  // Intensidad base de fuerzas micro
    
    // Estética
    PARTICLE_SIZE: 3,
    PARTICLE_ALPHA: 180,       // Para blendMode(ADD)
    COLORS: [
        '#FF3366', // Rosa (Especie 0)
        '#33CCFF', // Cian
        '#66FF66', // Verde
        '#FFFF99', // Amarillo
        '#CC99FF', // Violeta
        '#FF9933', // Naranja
        '#FFFFFF'  // Blanco (Especie 6)
    ]
};

// Generación de la Matriz de Atracción 7x7 (Artistic Variability)
// Valores entre -1 (repulsión máxima) y 1 (atracción máxima).
export const INTERACTION_MATRIX = Array.from({ length: CONFIG.NUM_SPECIES }, () =>
    Array.from({ length: CONFIG.NUM_SPECIES }, () => Math.random() * 2 - 1)
);

console.log("Cuna de Mundos - Matriz de Interacción inicializada:");
console.table(INTERACTION_MATRIX);
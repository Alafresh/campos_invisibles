// js/Config.js
import { PRESET_TYPES, getForcePreset } from './Presets.js';

const NUM_SPECIES = 7;

export const CONFIG = {
    // Especificaciones del Ecosistema
    TOTAL_PARTICLES: 1250, 
    NUM_SPECIES: NUM_SPECIES,
    PARTICLE_MIN_MASS: 0.5,
    PARTICLE_MAX_MASS: 1.2,
    
    // Parámetros de Física Poética
    FRICTION: 0.46,           
    G_MACRO: 1.5,             
    MAX_ATTRACTOR_MASS: 400,  
    MIN_ATTRACTOR_MASS: 20,
    
    // Parámetros Particle Life (Micro)
    R_MAX: 120,               
    BETA: 0.3,                
    MICRO_FORCE_FACTOR: 0.35,  
    
    // Estética
    PARTICLE_SIZE: 3,
    PARTICLE_ALPHA: 180,       
    COLORS: [
        '#FF3366', '#00FFFF', '#39FF14', '#FCFF00', '#FF3EA5', '#FF5F1F', '#BC13FE'
    ],
    
    // La matriz ahora vive dentro de CONFIG para poder sobreescribirla cada 3 minutos
    INTERACTION_MATRIX: [] 
};

// Generación inicial de la Matriz (Random por defecto)
CONFIG.INTERACTION_MATRIX = getForcePreset(PRESET_TYPES.RANDOM, CONFIG.NUM_SPECIES);

console.log("Cuna de Mundos - Matriz de Interacción inicializada.");
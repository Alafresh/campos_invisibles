import { CONFIG } from './Config.js';

export class PhysicsManager {
    constructor() {
        // Ya no necesitamos un tempVec de p5, el motor de JS procesa
        // variables numéricas primitivas de forma nativa e instantánea.
    }

    applyFrictionlessPhysics(particles, attractors) {
        // CACHÉ DE CONSTANTES: Leer propiedades de objetos (CONFIG.x) es más lento 
        // que leer una variable local. Guardamos todo antes del bucle crítico.
        const len = particles.length;
        const rMax = CONFIG.R_MAX;
        const rMaxSq = rMax * rMax;
        const beta = CONFIG.BETA;
        const microForceFactor = CONFIG.MICRO_FORCE_FACTOR;
        const gMacro = CONFIG.G_MACRO;
        const interactionMatrix = CONFIG.INTERACTION_MATRIX;

        // N = TOTAL_PARTICLES. Loop O(N^2)
        for (let i = 0; i < len; i++) {
            let p1 = particles[i];
            
            // Caché de la posición de p1 para no acceder al objeto repetidas veces
            let p1x = p1.pos.x;
            let p1y = p1.pos.y;
            let sp1 = p1.species;

            // Variables primitivas en lugar de createVector() para evitar el Garbage Collection
            let accMicroX = 0;
            let accMicroY = 0;
            let accMacroX = 0;
            let accMacroY = 0;

            // --- FÍSICA MICRO (Particle Life) ---
            for (let j = 0; j < len; j++) {
                if (i === j) continue;
                let p2 = particles[j];

                let dx = p2.pos.x - p1x;
                let dy = p2.pos.y - p1y;
                let distSq = dx * dx + dy * dy;

                if (distSq > 0 && distSq < rMaxSq) {
                    let dist = Math.sqrt(distSq);
                    let r_norm = dist / rMax;
                    let f = 0;

                    // INLINING MATEMÁTICO: Evita llamar a una función externa
                    if (r_norm < beta) {
                        f = r_norm / beta - 1; // Repulsión universal cercana
                    } else {
                        // Matriz de atracción/repulsión
                        let m = interactionMatrix[sp1][p2.species];
                        let scale = 1 - Math.abs(2 * r_norm - 1 - beta) / (1 - beta);
                        f = m * scale;
                    }

                    // ÁLGEBRA OPTIMIZADA: Agrupamos escalares en un solo multiplicador
                    let forceMultiplier = (f * p2.mass) / dist; 
                    
                    accMicroX += dx * forceMultiplier;
                    accMicroY += dy * forceMultiplier;
                }
            }
            
            accMicroX *= microForceFactor;
            accMicroY *= microForceFactor;

            // --- FÍSICA MACRO (Gravitación) ---
            for (let a = 0; a < attractors.length; a++) {
                let attractor = attractors[a];
                if (!attractor.isAwake) continue;

                let adx = attractor.pos.x - p1x;
                let ady = attractor.pos.y - p1y;
                let adistSq = adx * adx + ady * ady;
                
                // Evitamos Math.max() usando un condicional simple
                if (adistSq < 100) adistSq = 100; 

                // Cálculo de la gravedad
                let magMacro = (gMacro * attractor.mass) / adistSq;
                let adist = Math.sqrt(adistSq);
                
                let forceAttractor = magMacro / adist;
                accMacroX += adx * forceAttractor;
                accMacroY += ady * forceAttractor;
            }

            // --- SUMA DE FUERZAS ---
            // Modificamos directamente las propiedades .x y .y de p1.acc
            // Esto evita usar el método .add() de p5.Vector, que es considerablemente más lento.
            p1.acc.x += accMicroX + accMacroX;
            p1.acc.y += accMicroY + accMacroY;
        }
    }
}
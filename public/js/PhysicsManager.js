// js/PhysicsManager.js
import { CONFIG, INTERACTION_MATRIX } from './Config.js';

export class PhysicsManager {
    constructor() {
        this.interactionMatrix = INTERACTION_MATRIX;
        // Reutilización de vectores para evitar Garbage Collection masivo en RPi
        this.tempVec = createVector(0, 0); 
    }

    // Lógica central: calcula fuerzas Micro (Stardust) y Macro (Gravity)
    // Desacoplado de la actualización de posición (Integración)
    applyFrictionlessPhysics(particles, attractors) {
        
        // Requerimos cálculos vectoriales nativos para velocidad.
        // N = TOTAL_PARTICLES. Loop pairwise O(N^2) crítico.
        for (let i = 0; i < particles.length; i++) {
            let p1 = particles[i];
            let totalAccMicro = createVector(0,0);
            let totalAccMacro = createVector(0,0);

            // --- FÍSICA MICRO (Particle Life: N-body problem) ---
            // Optimizamos usando simetría (p1 vs p2 == p2 vs p1)? 
            // No, porque las fuerzas son ASIMÉTRICAS según la matriz.
            for (let j = 0; j < particles.length; j++) {
                if (i === j) continue;
                let p2 = particles[j];

                // Vector de p1 a p2
                let dx = p2.pos.x - p1.pos.x;
                let dy = p2.pos.y - p1.pos.y;
                
                // Distancia cuadrada primero para optimization (evitar sqrt)
                let distSq = dx*dx + dy*dy;
                let rMaxSq = CONFIG.R_MAX * CONFIG.R_MAX;

                if (distSq > 0 && distSq < rMaxSq) {
                    let dist = Math.sqrt(distSq);
                    
                    // Cálculo de la fuerza micro poética (F = m1*m2*f(r))
                    // f(r) depende de si es repulsión universal cercana o matriz de especie
                    let f = this.calculateMicroForcePotential(dist, p1.species, p2.species);
                    
                    // Normalizar vector manualmente (más rápido que .normalize())
                    dx /= dist;
                    dy /= dist;

                    // Newton: Aceleración += Fuerza / masa. f ya incorpora intensidad.
                    // Escalar dirección por fuerza y aplicar a p1
                    totalAccMicro.x += dx * f * p2.mass;
                    totalAccMicro.y += dy * f * p2.mass;
                }
            }
            
            // Aplicar intensidad Micro
            totalAccMicro.mult(CONFIG.MICRO_FORCE_FACTOR);

            // --- FÍSICA MACRO (Gravitación Universal Atractores) ---
            for (let attractor of attractors) {
                let dx = attractor.pos.x - p1.pos.x;
                let dy = p1.pos.y - p1.pos.y; // Error de tipeo poético corregido dx,dy vs pos.x,pos.y
                // dx, dy deben ser locales al loop.
                dx = attractor.pos.x - p1.pos.x;
                dy = attractor.pos.y - p1.pos.y;

                let distSq = dx*dx + dy*dy;
                // Evitar división por cero y "Zoomies effect" a muy corta distancia
                let safeDistSq = Math.max(distSq, 100); 

                // Ley de Newton simplificada: F = G * (M * m) / r^2
                // Aceleración macro para p1 (a = F/m -> a = G * M / r^2)
                let magMacro = (CONFIG.G_MACRO * attractor.mass) / safeDistSq;
                
                let dist = Math.sqrt(safeDistSq);
                
                totalAccMacro.x += (dx / dist) * magMacro;
                totalAccMacro.y += (dy / dist) * magMacro;
            }

            // --- SUMA DE FUERZAS POÉTICAS ---
            // La macro anula a la micro a distancias muy cortas por safeDistSq vs calculateMicroForcePotential
            p1.acc.add(totalAccMicro);
            p1.acc.add(totalAccMacro);
        }
    }

    // Referencia matemática: Tom Mohr's Particle Life
    // dist es 0 a R_MAX. Beta es 0 a 1 (normalizado).
    calculateMicroForcePotential(dist, speciesA, speciesB) {
        let r_norm = dist / CONFIG.R_MAX;
        
        if (r_norm < CONFIG.BETA) {
            // 1. Repulsión universal cercana (independiente de especie)
            // Escala linealmente de repulsión máxima a cero en Beta.
            return r_norm / CONFIG.BETA - 1;
        } else {
            // 2. Atracción/Repulsión según la matriz 7x7
            // Valor de matriz normalizado (m). m > 0 atracción, m < 0 repulsión.
            let m = INTERACTION_MATRIX[speciesA][speciesB];
            
            // Escala lineal de Beta (0) a R_MAX (0) con pico en medio.
            // Factor de damping lineal para que la fuerza desaparezca en R_MAX
            let scale = 1 - Math.abs(2 * r_norm - 1 - CONFIG.BETA) / (1 - CONFIG.BETA);
            return m * scale;
        }
    }
}
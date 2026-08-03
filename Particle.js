// js/Particle.js
import { CONFIG } from './Config.js';

export class Particle {
    constructor(x, y, speciesId) {
        // Estado físico (p5.Vector para operaciones optimizadas)
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        
        // Atributos biológicos/estéticos
        this.species = speciesId;
        // Masa variable para realismo gravitatorio
        this.mass = random(CONFIG.PARTICLE_MIN_MASS, CONFIG.PARTICLE_MAX_MASS); 
        this.color = color(CONFIG.COLORS[this.species]);
        // Aplicar alpha para mezcla aditiva
        this.color.setAlpha(CONFIG.PARTICLE_ALPHA); 
    }

    // Integración de Euler (Separado de la física pairwise)
    integrate() {
        // Friction espacial (física poética para damping)
        this.vel.mult(CONFIG.FRICTION); 
        
        // Newton: v = v + a*dt (dt=1)
        this.vel.add(this.acc);
        // Newton: p = p + v*dt (dt=1)
        this.pos.add(this.vel);
        
        // --- WRAP-AROUND / TELEPORT CONTINUO ---
        if (this.pos.x < 0) {
            this.pos.x = width;
        } else if (this.pos.x > width) {
            this.pos.x = 0;
        }

        if (this.pos.y < 0) {
            this.pos.y = height;
        } else if (this.pos.y > height) {
            this.pos.y = 0;
        }
        
        // Reset de aceleración para el próximo frame
        this.acc.mult(0); 
    }

    // Renderizado simple. El blendMode se maneja en el sketch principal.
    display() {
        fill(this.color);
        noStroke();
        // Usar constantes para tamaño permite optimization
        circle(this.pos.x, this.pos.y, CONFIG.PARTICLE_SIZE); 
    }
}
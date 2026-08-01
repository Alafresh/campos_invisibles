let socket;
let potValue = 0;
let btnState = 0;

// Variables de la simulación
let particles = [];
const NUM_PARTICLES = 500; // Puedes subirlo a 2000+ si la Pi 4 aguanta bien los 60 FPS

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    noStroke();
    
    // 1. Conexión WebSocket
    socket = io();
    
    // 2. Parseo de la trama Serial (Ej: "POT:512.50,BTN:0")
    socket.on('serialData', (data) => {
        let parts = data.split(',');
        if (parts.length === 2) {
            let potPart = parts[0].split(':');
            let btnPart = parts[1].split(':');
            
            if (potPart[0] === 'POT' && btnPart[0] === 'BTN') {
                potValue = parseFloat(potPart[1]);
                btnState = parseInt(btnPart[1]);
            }
        }
    });

    // 3. Inicialización del sistema de partículas
    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    // Fondo con rastro (efecto de estela/nebulosa)
    background(10, 10, 20);

    // Mapeamos el potenciómetro (0 a 1023) a un multiplicador de gravedad (0.1 a 10.0)
    let gravityMultiplier = map(potValue, 0, 1023, 0.1, 10.0);

    // Renderizamos las partículas
    for (let p of particles) {
        // Si el botón está presionado, dispersamos las partículas (Supernova)
        if (btnState === 1) {
            p.applyExplosion();
        } else {
            // De lo contrario, aplicamos la atracción gravitacional hacia el centro
            p.attractTo(0, 0, gravityMultiplier);
        }
        
        p.update();
        p.display();
    }
    
    // Lógica futura: Aquí leeremos tu control de Play con la Gamepad API
    readGamepad();
}

// Clase Partícula
class Particle {
    constructor() {
        this.pos = createVector(random(-width/2, width/2), random(-height/2, height/2), random(-200, 200));
        this.vel = createVector(random(-1, 1), random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0, 0);
        this.mass = random(1, 4);
    }

    // Ley de Gravedad simplificada hacia un punto
    attractTo(tx, ty, gForce) {
        let target = createVector(tx, ty, 0);
        let force = p5.Vector.sub(target, this.pos);
        let dsq = force.magSq();
        dsq = constrain(dsq, 100, 1000); // Evitar división por cero o fuerzas infinitas
        
        let strength = (gForce * this.mass) / dsq;
        force.setMag(strength);
        this.acc.add(force);
    }

    applyExplosion() {
        let center = createVector(0, 0, 0);
        let force = p5.Vector.sub(this.pos, center);
        force.setMag(0.5); // Fuerza de repulsión constante
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(5); // Límite de velocidad
        this.pos.add(this.vel);
        this.acc.mult(0); // Resetear aceleración cada frame
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        // El color cambia ligeramente según la velocidad
        fill(100 + this.vel.mag() * 30, 150, 255);
        sphere(this.mass);
        pop();
    }
}

// Función placeholder para tu control genérico USB
function readGamepad() {
    let pads = navigator.getGamepads();
    if (pads && pads[0]) {
        let pad = pads[0];
        // Ejemplo: Leer eje X e Y del joystick izquierdo
        let xAxis = pad.axes[0]; 
        let yAxis = pad.axes[1];
        // En el futuro, usaremos esto para mover el agujero negro
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
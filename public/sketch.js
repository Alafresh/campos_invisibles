let socket;

// Arreglo para almacenar el estado y los valores crudos (debug) de los 3 usuarios
let players = [
    { x: 200, y: 200, mass: 50, btn: 0, rawX: 0, rawY: 0, rawEncoder: 0, color: '#FF3366' }, // Jugador 1: Rosa
    { x: 400, y: 200, mass: 50, btn: 0, rawX: 0, rawY: 0, rawEncoder: 0, color: '#33CCFF' }, // Jugador 2: Azul
    { x: 600, y: 200, mass: 50, btn: 0, rawX: 0, rawY: 0, rawEncoder: 0, color: '#66FF66' }  // Jugador 3: Verde
];

let particles = [];
const NUM_PARTICLES = 600;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();

    // 1. Conexión WebSocket
    socket = io();

    // 2. Parseo de la trama Serial de 3 usuarios
    // 2. Parseo de la trama Serial de 3 usuarios
    socket.on('serialData', (data) => {
        // --- INICIO DEL DEBUG ---
        console.log("1. Dato crudo recibido:", data);
        
        // Si data llega como Buffer, forzamos su conversión a texto
        let dataString = String(data).trim(); 
        
        let usersData = dataString.split('|');
        console.log("2. Fragmentos detectados (deben ser 3):", usersData.length);
        console.log("3. Contenido del array:", usersData);
        // --- FIN DEL DEBUG ---
        
        if (usersData.length === 3) {
            for (let i = 0; i < 3; i++) {
                let parts = usersData[i].split(':'); 
                if (parts.length === 2) {
                    let values = parts[1].split(','); // [X, Y, Encoder, Boton]
                    
                    if (values.length === 4) {
                        // Guardar valores crudos para el Debug
                        players[i].rawX = parseFloat(values[0]);
                        players[i].rawY = parseFloat(values[1]);
                        players[i].rawEncoder = parseInt(values[2]);
                        players[i].btn = parseInt(values[3]);

                        // SEPARACIÓN POR ZONAS: Dividimos la pantalla en 3 columnas
                        let zoneWidth = width / 3;
                        let startX = zoneWidth * i;       // Inicio de la zona del jugador
                        let endX = zoneWidth * (i + 1);   // Fin de la zona del jugador

                        // Mapear el joystick solo dentro de su zona correspondiente
                        players[i].x = map(players[i].rawX, 0, 1023, startX, endX);
                        players[i].y = map(players[i].rawY, 0, 1023, 0, height);
                        
                        // Mapear el Encoder a la masa gravitacional
                        players[i].mass = constrain(50 + (players[i].rawEncoder * 5), 10, 200); 
                    }
                }
            }
        }
    });

    // 3. Inicializar universo de partículas
    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    // Fondo oscuro con estela (Alpha 40)
    background(10, 10, 20, 40);

    // Dibujar divisiones de zonas (Opcional, te ayuda a ver los límites visualmente)
    stroke(255, 30);
    line(width / 3, 0, width / 3, height);
    line((width / 3) * 2, 0, (width / 3) * 2, height);
    noStroke();

    // Renderizar a los jugadores y sus textos de Debug
    for (let i = 0; i < 3; i++) {
        let p = players[i];
        
        // Efecto visual si el botón está presionado
        if (p.btn === 1) {
            fill(255); 
            circle(p.x, p.y, p.mass * 1.5);
        } else {
            fill(color(p.color));
            circle(p.x, p.y, p.mass);
            fill(0);
            circle(p.x, p.y, p.mass * 0.5);
        }

        // ==========================================
        // HUD DE DEBUG (TEXTOS FLOTANTES)
        // ==========================================
        fill(255);
        textSize(14);
        textAlign(CENTER, BOTTOM);
        
        // Imprimir Joystick
        text(`Joy X: ${Math.round(p.rawX)} | Y: ${Math.round(p.rawY)}`, p.x, p.y - (p.mass / 2) - 25);
        // Imprimir Encoder y Masa
        text(`Enc: ${p.rawEncoder} | Masa: ${p.mass}`, p.x, p.y - (p.mass / 2) - 10);
    }

    // Actualizar físicas de partículas
    for (let particle of particles) {
        particle.update(players);
        particle.display();
    }
}

// Clase para calcular la simulación física interactiva
class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-2, 2), random(-2, 2));
        this.acc = createVector(0, 0);
        this.maxSpeed = 8;
    }

    update(activePlayers) {
        for (let i = 0; i < activePlayers.length; i++) {
            let p = activePlayers[i];
            let target = createVector(p.x, p.y);
            
            let force = p5.Vector.sub(target, this.pos);
            let distanceSq = force.magSq();
            distanceSq = constrain(distanceSq, 100, 5000); 
            
            let strength = (p.mass * 0.8) / distanceSq;
            force.setMag(strength);
            
            if (p.btn === 1) {
                force.mult(-10); 
            }
            this.acc.add(force);
        }

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0); 
        
        if (this.pos.x <= 0 || this.pos.x >= width) this.vel.x *= -1;
        if (this.pos.y <= 0 || this.pos.y >= height) this.vel.y *= -1;
    }

    display() {
        fill(255, 180);
        circle(this.pos.x, this.pos.y, 3);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
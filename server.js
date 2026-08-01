const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Habilitar la carpeta 'public' para servir el HTML, CSS y JS del frontend
app.use(express.static('public'));

// Configuración del puerto serial En Raspberry Pi ttyACM0 

const portName = '/dev/ttyACM0'; 

const serialPort = new SerialPort({ path: portName, baudRate: 115200 }, (err) => {
  if (err) {
    console.error('Error al abrir el puerto serial:', err.message);
  } else {
    console.log(`Conectado al Arduino en ${portName}`);
  }
});

// El parser lee los datos hasta encontrar un salto de línea (\n)
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

io.on('connection', (socket) => {
    console.log('Frontend de p5.js conectado vía WebSocket');
});

// Cuando el Arduino envía un dato, lo retransmitimos inmediatamente al frontend
parser.on('data', (data) => {
    io.emit('serialData', data.trim());
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor local corriendo en http://localhost:${PORT}`);
});
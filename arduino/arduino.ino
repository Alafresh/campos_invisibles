// ==========================================
// PINES DE LAS CAJAS (Según conexión previa)
// ==========================================
// Caja 1
const int X1 = A0, Y1 = A1, CLK1 = 2, DT1 = 3, BTN1 = 4;
// Caja 2
const int X2 = A2, Y2 = A3, CLK2 = 5, DT2 = 6, BTN2 = 7;
// Caja 3
const int X3 = A4, Y3 = A5, CLK3 = 8, DT3 = 9, BTN3 = 10;

// ==========================================
// VARIABLES DE ESTADO
// ==========================================
// Contadores de los encoders
int enc1 = 0, enc2 = 0, enc3 = 0;

// Estados anteriores de los pines CLK para detectar giros
int lastCLK1, lastCLK2, lastCLK3;

// Variables filtradas de los Joysticks
float valX1 = 0, valY1 = 0;
float valX2 = 0, valY2 = 0;
float valX3 = 0, valY3 = 0;

// Factor de suavizado para Joysticks (0.0 a 1.0)
const float alpha = 0.2; 

// Control de tiempo para el envío serial
unsigned long lastSend = 0;
const int SEND_INTERVAL = 30; // Envío de datos cada 30ms (~33 fps)

void setup() {
  Serial.begin(115200);

  // Configurar Botones Rojos con resistencia interna
  pinMode(BTN1, INPUT_PULLUP);
  pinMode(BTN2, INPUT_PULLUP);
  pinMode(BTN3, INPUT_PULLUP);

  // Configurar pines de Encoders
  pinMode(CLK1, INPUT); pinMode(DT1, INPUT);
  pinMode(CLK2, INPUT); pinMode(DT2, INPUT);
  pinMode(CLK3, INPUT); pinMode(DT3, INPUT);

  // Guardar estado inicial de los Encoders
  lastCLK1 = digitalRead(CLK1);
  lastCLK2 = digitalRead(CLK2);
  lastCLK3 = digitalRead(CLK3);
}

// Función reutilizable para leer cualquier encoder
void updateEncoder(int clkPin, int dtPin, int &lastClk, int &encValue) {
  int currentClk = digitalRead(clkPin);
  // Si hay un cambio en CLK y es un flanco de subida
  if (currentClk != lastClk && currentClk == 1) {
    if (digitalRead(dtPin) != currentClk) {
      encValue++; // Giro a la derecha
    } else {
      encValue--; // Giro a la izquierda
    }
  }
  lastClk = currentClk;
}

void loop() {
  // 1. LEER ENCODERS CONSTANTEMENTE (Polling rápido)
  // Esto debe ir sin delays para no perder pasos al girar rápido
  updateEncoder(CLK1, DT1, lastCLK1, enc1);
  updateEncoder(CLK2, DT2, lastCLK2, enc2);
  updateEncoder(CLK3, DT3, lastCLK3, enc3);

  // 2. ENVIAR DATOS A NODE.JS CADA CIERTO TIEMPO
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    // Leer y filtrar Joysticks
    valX1 = (alpha * analogRead(X1)) + ((1.0 - alpha) * valX1);
    valY1 = (alpha * analogRead(Y1)) + ((1.0 - alpha) * valY1);
    
    valX2 = (alpha * analogRead(X2)) + ((1.0 - alpha) * valX2);
    valY2 = (alpha * analogRead(Y2)) + ((1.0 - alpha) * valY2);
    
    valX3 = (alpha * analogRead(X3)) + ((1.0 - alpha) * valX3);
    valY3 = (alpha * analogRead(Y3)) + ((1.0 - alpha) * valY3);

    // Leer Botones (Invertimos la lógica: 1 = presionado, 0 = suelto)
    int b1 = (digitalRead(BTN1) == LOW) ? 1 : 0;
    int b2 = (digitalRead(BTN2) == LOW) ? 1 : 0;
    int b3 = (digitalRead(BTN3) == LOW) ? 1 : 0;

    // 3. CONSTRUIR LA TRAMA DE DATOS Y ENVIARLA
    // Formato: U1:X,Y,E,B|U2:X,Y,E,B|U3:X,Y,E,B
    
    // Usuario 1
    Serial.print("U1:"); Serial.print(int(valX1)); Serial.print(","); Serial.print(int(valY1)); 
    Serial.print(","); Serial.print(enc1); Serial.print(","); Serial.print(b1);
    
    // Separador principal
    Serial.print("|");
    
    // Usuario 2
    Serial.print("U2:"); Serial.print(int(valX2)); Serial.print(","); Serial.print(int(valY2)); 
    Serial.print(","); Serial.print(enc2); Serial.print(","); Serial.print(b2);
    
    // Separador principal
    Serial.print("|");
    
    // Usuario 3
    Serial.print("U3:"); Serial.print(int(valX3)); Serial.print(","); Serial.print(int(valY3)); 
    Serial.print(","); Serial.print(enc3); Serial.print(","); Serial.println(b3);
  }
}
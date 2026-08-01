// Asignación de pines
const int pinPot = A0; // Tu único potenciómetro
const int pinBtn = 2;  // Tu botón físico

// Variable para el filtro de suavizado
float valPot = 0;
const float alpha = 0.1; // Factor de suavizado

void setup() {
  Serial.begin(115200);
  pinMode(pinBtn, INPUT_PULLUP);
}

void loop() {
  // 1. Leer valores crudos
  int rawPot = analogRead(pinPot);

  // 2. Aplicar filtro EMA
  valPot = (alpha * rawPot) + ((1.0 - alpha) * valPot);

  // 3. Leer estado del botón (invertido por PULLUP)
  int btnState = (digitalRead(pinBtn) == LOW) ? 1 : 0;

  // 4. Enviar trama simplificada
  Serial.print("POT:");
  Serial.print(valPot);
  Serial.print(",BTN:");
  Serial.println(btnState);

  // 5. Esperar ~33ms
  delay(33); 
}
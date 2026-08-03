## 📖 Descripción del Proyecto

**Fuerza Fundamental elegida:** Gravedad

**Campos Invisibles** es una experiencia interactiva multiusuario diseñada para un espacio de 5m². Para visualizar la fuerza fundamental de la Gravedad, esta instalación no se limita a mostrar objetos cayendo, sino que divide la gravedad en dos escalas simuladas computacionalmente:

1. **Gravedad Micro (Particle Life):** Un ecosistema de polvo estelar obedece reglas dinámicas y asimétricas de atracción y repulsión, simulando la complejidad matemática de las interacciones a pequeña escala.
2. **Gravedad Macro (Gravitación Universal):** A través de una interfaz analógica, de 1 a 3 visitantes introducen "masas súper-densas" en el lienzo. Al alterar estas masas, los usuarios deforman instantáneamente el tejido del polvo estelar.

La instalación traduce la manipulación de variables físicas reales (masa, vector de posición, fuerza centrífuga) en una simulación visual y sonora proyectada en tiempo real.

### 🎯 Dinámica de Interacción (UX)

* **El usuario:** Utiliza joysticks como los de ps2 para desplazarse por el espacio **coordenadas (x, y)**, encoders que funcional como perillas para **aumentar o disminuir** la masa gravitacional de su "atractor", y pulsometros que funcional como botones de arcade para expulsar particulas de polvo estelar.
* **El sistema:** Las partículas en pantalla reaccionan orgánicamente a las masas introducidas por los usuarios. Si un atractor captura demasiada materia en su órbita debido a su alta densidad, se sobrecarga y expulsa la materia violentamente, simulando el comportamiento de un Quásar o la radiación de un agujero negro.
* **El aprendizaje:** El visitante comprende que la gravedad es un baile de influencias invisibles que da forma a la estructura de nuestro universo. Experimentan de forma intuitiva conceptos complejos como la mecánica orbital, los campos de influencia gravitacional, los límites de densidad de la materia y el colapso astrofísico.

## 🏗️ Arquitectura de Hardware y Software

El sistema está construido bajo una arquitectura modular cliente-servidor orientada a eventos. Esta separación de responsabilidades (Frontend visual vs. Backend de hardware) permite que el proyecto sea altamente escalable y ofrezca dos modos de despliegue según el hardware disponible en sala:

### Modos de Despliegue (Modularidad)
1. **Modo Standalone (Todo-en-uno):** La Raspberry Pi 4 se encarga de leer el microcontrolador y, simultáneamente, renderiza la experiencia en pantalla usando Chromium en modo Kiosk. Ideal para espacios con presupuesto o espacio limitado.
2. **Modo Distribuido (Recomendado para Alto Rendimiento):** La Raspberry Pi opera en modo *headless* (sin interfaz gráfica) dedicando el 100% de su CPU a procesar las señales de Arduino y correr el servidor Node.js. Un PC externo (con GPU dedicada) se conecta a la red local de la Raspberry Pi via ssh para procesar el motor gráfico p5.js, logrando el máximo de fotogramas por segundo (FPS) sin latencia.

### Componentes de la Arquitectura
* **Física y Renderizado (Frontend):** `p5.js` Aunque motores como Unity representan mi entorno de desarrollo habitual descarté su uso para esta arquitectura por tres razones estratégicas orientadas a la viabilidad en sala:
  1. **Desempeño en hardware limitado (Raspberry Pi):** Un motor compilado como Unity introduce un *overhead* (consumo excesivo de recursos base) innecesario para una simulación 2D de este tipo. p5.js permite renderizado directo en un navegador ligero (Chromium en modo Kiosk).
  2. **Naturaleza Web y Conectividad:** Al basarse en la web, p5.js se integra de manera nativa y transparente con `Node.js` y `Socket.io`, reduciendo la latencia de las lecturas del Arduino a prácticamente cero, sin los intermediarios o plugins de red que exigiría un motor de videojuegos.
  3. **Mantenimiento y Prototipado Ágil:** Dado el límite de ejecución de 72 horas para la prueba técnica, p5.js permitió iterar fórmulas matemáticas y arte generativo en tiempo real, ofreciendo un código abierto y altamente mantenible.
* **Backend y Comunicación:** `Node.js` con `Socket.io` para emitir eventos de hardware al canvas visual en tiempo real.
* **Microcontrolador:** `Arduino` encargado de leer las señales analógicas/digitales (joysticks, encoders, botones) y enviarlas por protocolo Serial.

### Flujo de Datos
`Sensores Físicos` ➔ `Arduino` ➔ `Puerto Serial (USB)` ➔ `Servidor Node.js (Raspberry Pi)` ➔ `WebSockets (Red Local)` ➔ `Cliente p5.js (Proyección)`

## 🎛️ Rider Técnico y Lista de Materiales

El hardware está pensado para soportar la interacción de 1 a 3 visitantes en simultáneo. A continuación se detalla el hardware exacto utilizado para el prototipado y su función en la arquitectura, contemplando las dos vías de despliegue (Standalone vs. Distribuido):

| Categoría | Componente | Cant. | Función en el Módulo |
| :--- | :--- | :---: | :--- |
| **Cómputo Base** | Raspberry Pi 4 | 1 | Nodo central. Lee sensores y corre el servidor Node.js (En modo *Standalone* también renderiza el motor gráfico). |
| **Cómputo Ext.** | Computador (PC con GPU) | 1 | *(Opcional - Modo Distribuido)*. Se utiliza para procesar el cliente web a máximos FPS si se requiere proyección de alto rendimiento. |
| **Microcontrolador** | Arduino Mega 2560 | 1 | Seleccionado por su amplia cantidad de pines analógicos/digitales para leer 3 interfaces de usuario completas simultáneamente. |
| **Sensórica** | Módulo Rotatorio Encoder (KY-040) | 3 | Control preciso para aumentar/disminuir la masa de los atractores gravitacionales. |
| **Sensórica** | Módulo Joystick Analógico | 3 | Control vectorial continuo (x, y) para desplazar los atractores en el lienzo. |
| **Sensórica** | Pulsador Rojo Chasis Corto NA (12.5mm) | 3 | Gatillo de acción instantánea para eventos de colapso/explosión gravitacional. |
| **Salida A/V** | Proyector HDMI (Ej. marca Redflag) | 1 | Proyección de la experiencia sobre la superficie física del espacio de 5m². |
| **Conectividad** | Cables de video (Micro-HDMI a HDMI / HDMI a HDMI) | 2 | Enrutamiento de señal de video dependiendo de si el render se hace desde la Raspberry Pi o desde el PC. |
| **Ensamblaje** | Protoboard, Cables Jumper (~80x), Tornillería (12x) | Kit | Materiales para el prototipado rápido, ruteo electrónico y fijación mecánica de los módulos. |
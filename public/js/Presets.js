// js/Presets.js

export const PRESET_TYPES = {
    RANDOM: 0,
    SYMMETRIC: 1,
    SNAKE: 2,
    ROCK_PAPER_SCISSORS: 3,
    BIPARTITE: 4,
    DIMERS: 5
    // ... añade más id según el snippet provisto ...
};

// --- Generadores Adaptados del Snippet del Usuario ---

function makeRandomRulesMatrix(numTypes) {
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            // Fuerza aleatoria entre -1 (repulsión) y 1 (atracción)
            m[i][j] = Math.random() * 2 - 1; 
        }
    }
    return m;
}

function rpsGenerator(numTypes) {
    const A = 0.9, R = -0.7, S = -0.1;
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            if (j === i) m[i][j] = S;
            else if (j === (i + 1) % numTypes) m[i][j] = A;
            else if (j === (i + numTypes - 1) % numTypes) m[i][j] = R;
            else m[i][j] = 0;
        }
    }
    return m;
}

function dimersGenerator(numTypes) {
    const STRONG = 1.0, REP = -0.9, SELF = 0.0;
    // Lógica para emparejar especies (0<->1, 2<->3, etc.)
    const partner = (t) => t ^ 1; 
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            if (j === i) m[i][j] = SELF;
            else if (j === partner(i)) m[i][j] = STRONG;
            else m[i][j] = REP;
        }
    }
    return m;
}

// Mapa de ID a Generador
const GENERATORS = {
    [PRESET_TYPES.RANDOM]: makeRandomRulesMatrix,
    [PRESET_TYPES.ROCK_PAPER_SCISSORS]: rpsGenerator,
    [PRESET_TYPES.DIMERS]: dimersGenerator,
    // ... mapear el resto ...
};

export function getForcePreset(id, numTypes) {
    const gen = GENERATORS[id] || makeRandomRulesMatrix;
    const matrix = gen(numTypes);

    // Redondear a 2 decimales para estabilidad numérica (como en tu snippet)
    for (let i = 0; i < numTypes; i++) {
        for (let j = 0; j < numTypes; j++) {
            matrix[i][j] = Math.round(matrix[i][j] * 100) / 100;
        }
    }
    return matrix;
}
// js/Presets.js

export const PRESET_TYPES = {
    RANDOM: 0,
    SNAKE: 1,
    CHAINS_1: 2,
    DIMERS: 3,
    PATCHWORK: 4
};

// Secuencia exacta solicitada: 3 Randoms -> Snake -> 3 Randoms -> Chains -> 3 Randoms -> Dimers -> 3 Randoms -> Patchwork
const PRESET_SEQUENCE = [
    PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.SNAKE,
    PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.CHAINS_1,
    PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.DIMERS,
    PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.RANDOM, PRESET_TYPES.PATCHWORK
];

let sequenceIndex = 0;

export function getNextSequentialPreset() {
    const id = PRESET_SEQUENCE[sequenceIndex];
    sequenceIndex = (sequenceIndex + 1) % PRESET_SEQUENCE.length;
    return id;
}

// --- Generadores Activos ---

function makeRandomRulesMatrix(numTypes) {
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            m[i][j] = Math.random() * 2 - 1; 
        }
    }
    return m;
}

function snakeGenerator(numTypes) {
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            if (j === i) m[i][j] = 1;
            else if (j === (i + 1) % numTypes) m[i][j] = 0.2;
            else m[i][j] = 0;
        }
    }
    return m;
}

function chains1Generator(numTypes) {
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m[i] = [];
        for (let j = 0; j < numTypes; j++) {
            if (j === i || j === (i + 1) % numTypes || j === (i + numTypes - 1) % numTypes) m[i][j] = 1;
            else m[i][j] = -1;
        }
    }
    return m;
}

function dimersAndChainsGenerator(numTypes) {
    const STRONG = 1.0, REP = -0.9, SELF = 0;
    const partner = (t) => t ^ 1; 
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m.push([]);
        for (let j = 0; j < numTypes; j++) {
            if (j === i) m[i].push(SELF);
            else if (j === partner(i)) m[i].push(STRONG);
            else m[i].push(REP);
        }
    }
    return m;
}

function patchworkGenerator(numTypes) {
    const p = 0.35, POS = 0.9, NEG = -0.9, SELF = 0.0;
    const rnd = (i, j) => Math.abs((Math.sin(i * 73856093 ^ j * 19349663) * 43758.5453) % 1);
    const m = [];
    for (let i = 0; i < numTypes; i++) {
        m.push([]);
        for (let j = 0; j < numTypes; j++) {
            if (i === j) m[i].push(SELF);
            else {
                const r = rnd(i, j);
                m[i].push(r < p ? POS : (r < 2 * p ? NEG : 0));
            }
        }
    }
    return m;
}

const GENERATORS = {
    [PRESET_TYPES.RANDOM]: makeRandomRulesMatrix,
    [PRESET_TYPES.SNAKE]: snakeGenerator,
    [PRESET_TYPES.CHAINS_1]: chains1Generator,
    [PRESET_TYPES.DIMERS]: dimersAndChainsGenerator,
    [PRESET_TYPES.PATCHWORK]: patchworkGenerator
};

export function getForcePreset(id, numTypes) {
    const gen = GENERATORS[id] || makeRandomRulesMatrix;
    const finalMatrix = gen(numTypes);

    for (let i = 0; i < numTypes; i++) {
        for (let j = 0; j < numTypes; j++) {
            const value = finalMatrix[i] && typeof finalMatrix[i][j] === 'number' ? finalMatrix[i][j] : 0;
            finalMatrix[i][j] = Math.round(value * 100) / 100;
        }
    }
    return finalMatrix;
}
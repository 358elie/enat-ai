export const C = {
  bgDeep:      '#020810',
  bgCard:      '#050f1e',
  bgPanel:     '#071525',
  neonBlue:    '#00d4ff',
  neonCyan:    '#00fff7',
  neonGreen:   '#00ff88',
  neonOrange:  '#ff6b00',
  neonPurple:  '#b400ff',
  neonRed:     '#ff2255',
  textPrimary: '#e0f4ff',
  textDim:     '#4a7a99',
  borderDim:   'rgba(0,212,255,0.15)',
  borderBright:'rgba(0,212,255,0.6)',
};

// ─── Paramètres llama.cpp ───────────────────────────────────────────────────
export const DEFAULT_PORT    = 8080;
export const DEFAULT_THREADS = 4;
export const DEFAULT_CTX     = 4096;
export const DEFAULT_BATCH   = 512;
export const DEFAULT_TEMP    = 0.7;
export const MAX_TOKENS      = 2048;

// Timeout long pour les gros modèles (90 sec)
export const FETCH_TIMEOUT_MS = 90_000;

export const GGUF_NAME = 'Qwen3.5 9B Uncensored';
export const GGUF_PATH = '/storage/emulated/0/Download/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q6_K.gguf';

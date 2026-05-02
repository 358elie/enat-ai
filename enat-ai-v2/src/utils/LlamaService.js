/**
 * LlamaService — communication optimisée avec llama.cpp
 * Conçu pour les gros modèles GGUF (7B–70B)
 */

import { FETCH_TIMEOUT_MS } from '../theme';

// ─── Timeout helper ──────────────────────────────────────────────────────────
function withTimeout(promise, ms = FETCH_TIMEOUT_MS) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`TIMEOUT après ${ms / 1000}s — modèle trop lent ou serveur mort`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// ─── Vérifier si le serveur est actif ────────────────────────────────────────
export async function checkServer(port) {
  try {
    const res = await withTimeout(
      fetch(`http://127.0.0.1:${port}/health`),
      4000
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Récupérer les infos du modèle chargé ────────────────────────────────────
export async function fetchModelInfo(port) {
  try {
    const res = await withTimeout(
      fetch(`http://127.0.0.1:${port}/props`),
      5000
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Chat completion avec streaming ──────────────────────────────────────────
export async function streamChat({ port, modelName, history, settings, onToken, onDone, onError }) {
  const { threads, ctx, temp, maxTokens } = settings;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: history,
        max_tokens: maxTokens || 2048,
        temperature: temp || 0.7,
        stream: true,
        // Optimisations pour gros modèles
        stop: ['<|im_end|>', '<|end|>', '</s>', '[INST]'],
        repeat_penalty: 1.1,
        top_p: 0.9,
        top_k: 40,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — llama.cpp sur port ${port} actif ?`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // garder l'éventuel fragment

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') { onDone(fullText); return; }

        try {
          const json = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            onToken(token, fullText);
          }
        } catch {
          // fragment JSON incomplet, continuer
        }
      }
    }

    onDone(fullText);
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      onError('⏱ TIMEOUT — Le modèle met trop de temps à répondre.\n▸ Réduis --ctx-size ou utilise un modèle Q4_K');
    } else {
      onError(e.message);
    }
  }
}

// ─── Chat sans streaming (fallback) ──────────────────────────────────────────
export async function sendChat({ port, modelName, history, settings }) {
  const { temp, maxTokens } = settings;

  const res = await withTimeout(
    fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: history,
        max_tokens: maxTokens || 2048,
        temperature: temp || 0.7,
        stream: false,
        repeat_penalty: 1.1,
        top_p: 0.9,
      }),
    })
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Générer la commande llama-server optimisée ───────────────────────────────
export function buildLlamaCommand({ modelPath, port, threads, ctx, batch, gpuLayers }) {
  return [
    `cd llama.cpp`,
    `./build/bin/llama-server`,
    `-m "${modelPath}"`,
    `--host 127.0.0.1`,
    `--port ${port}`,
    `--ctx-size ${ctx}`,
    `--threads ${threads}`,
    `--batch-size ${batch}`,
    `--n-gpu-layers ${gpuLayers}`,
    `--cont-batching`,
    `--flash-attn`,
    `--mlock`,
  ].join(' \\\n  ');
}

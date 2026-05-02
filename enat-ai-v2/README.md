# 🤖 ENAT AI v2 — Offline LLM Manager for Android

> Run local GGUF models on Android via llama.cpp — no cloud, no censorship.

## ✨ Nouveautés v2
- **Streaming réel** — les tokens arrivent en temps réel (plus d'attente !)
- **Bouton STOP** — interrompt la génération à tout moment
- **Timeout intelligent** — 90s pour les gros modèles lents
- **Auto-ping** — détecte automatiquement le serveur toutes les 15s
- **Config dynamique** — génère la commande llama-server optimisée dans l'app
- **Guide quantisation** — tableau Q2/Q4/Q5/Q6/Q8 avec RAM requise

## 🚀 Installation

```bash
git clone https://github.com/358elie/enat_ai.git
cd enat_ai
npm install
npx expo start
```

## 📡 Utilisation

1. Lance llama.cpp dans **Termux** (onglet Setup)
2. L'app détecte automatiquement le serveur
3. Va dans **Chat** → mode **⚡ STREAM**
4. Tape ton prompt → les tokens arrivent en temps réel !

## ⚡ Commande llama.cpp optimisée

```bash
cd llama.cpp && ./build/bin/llama-server \
  -m /storage/emulated/0/Download/ton-modele.gguf \
  --host 127.0.0.1 --port 8080 \
  --ctx-size 4096 --threads 4 \
  --batch-size 512 \
  --cont-batching --flash-attn --mlock
```

## 📦 Stack
React Native + Expo SDK 51 + llama.cpp OpenAI API

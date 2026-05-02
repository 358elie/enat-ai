# 🤖 ENAT AI — Offline LLM Manager for Android

> **Run local AI models on your Android phone — no cloud, no subscription, no censorship.**

ENAT AI is a React Native (Expo) app that connects to a [llama.cpp](https://github.com/ggml-org/llama.cpp) server running locally in [Termux](https://termux.dev) on Android. It gives you a sleek cyberpunk interface to load, manage, and chat with any GGUF model — entirely offline.

---

## ✨ Features

- **⚡ Local inference** — connects to llama.cpp via its OpenAI-compatible API (`/v1/chat/completions`)
- **🌐 Online fallback** — optional Claude API mode when wifi is available
- **📦 Model library** — preset models (Qwen, Mistral, Phi-3) + pick any `.gguf` from storage
- **💬 Chat screen** — multi-turn conversation with history, port selector, session reset
- **🛠️ Setup guide** — step-by-step Termux + llama.cpp installation with one-tap copy commands
- **⚙️ Settings** — configure threads, context length, GPU layers, temperature
- **🎨 Cyberpunk UI** — dark neon aesthetic with monospace typography

---

## 📱 Screenshots

| Home / Dashboard | Chat | Models | Setup |
|---|---|---|---|
| System metrics, model card, terminal log | Local / API modes, multi-turn chat | GGUF presets + file picker | Termux commands, server check |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- Android phone with **Termux** installed (see Setup tab in app)

### Install & Run

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/enat-ai.git
cd enat-ai

# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on Android (scan QR with Expo Go app)
npm run android
```

> **Note:** For production builds, use [EAS Build](https://docs.expo.dev/build/introduction/): `npm run build`

---

## 📡 Connecting to llama.cpp

The app connects to llama.cpp running in **Termux** on the same device.

### 1 — Install Termux (from F-Droid only)

```
https://f-droid.org → search "Termux"
```
> ⚠️ **Don't use the Play Store version** — it's outdated and breaks compilation.

### 2 — Setup Termux

```bash
pkg update -y && pkg upgrade -y
pkg install clang cmake git -y
termux-setup-storage   # grant storage access
```

### 3 — Compile llama.cpp (~10–20 min)

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build -DLLAMA_CURL=OFF
cmake --build build --config Release -j$(nproc)
```

### 4 — Launch the server

```bash
./build/bin/llama-server \
  -m /storage/emulated/0/Download/YOUR_MODEL.gguf \
  --host 127.0.0.1 \
  --port 8080 \
  --ctx-size 4096 \
  --n-predict 1024 \
  --threads 4
```

Wait for: `llama server listening on 127.0.0.1:8080`  
Then open ENAT AI → **Chat** → **⚡ LOCAL** → start chatting!

---

## 🤖 Recommended Models

| Model | Size | RAM | Best for |
|---|---|---|---|
| [Qwen3.5 9B Q6_K](https://huggingface.co/) | ~7.5 GB | 8 GB+ | Quality & reasoning |
| [Qwen2.5 7B Q4_K_M](https://huggingface.co/) | ~4.1 GB | 6 GB+ | Balanced |
| [Mistral 7B v0.3 Q5_K_M](https://huggingface.co/) | ~5.2 GB | 6 GB+ | General purpose |
| [Phi-3 Mini 128K Q4_K_M](https://huggingface.co/) | ~2.4 GB | 4 GB+ | Low-end devices |

Download `.gguf` files from [Hugging Face](https://huggingface.co/models?library=gguf) into your Android `Downloads/` folder.

---

## 🗂️ Project Structure

```
enat-ai/
├── App.js                      # Root — navigation & layout
├── app.json                    # Expo config
├── package.json
├── babel.config.js
└── src/
    ├── theme.js                # Colors, constants (port, model path)
    ├── components/
    │   └── AppHeader.js        # Top header with live clock & status
    └── screens/
        ├── HomeScreen.js       # Dashboard — metrics, model card, log
        ├── ChatScreen.js       # Chat — local llama.cpp or Claude API
        ├── ModelsScreen.js     # Model library + GGUF file picker
        ├── SetupScreen.js      # Termux setup guide + server check
        └── SettingsScreen.js   # Thread / ctx / GPU / temp config
```

---

## ⚙️ Configuration

Edit `src/theme.js` to set your defaults:

```js
// Path to your GGUF model on the device
export const GGUF_PATH = '/storage/emulated/0/Download/YOUR_MODEL.gguf';

// Display name
export const GGUF_NAME = 'Your Model Name';

// llama.cpp server port
export const LLAMA_PORT = 8080;
```

---

## 🌐 API Mode (Claude)

The Chat screen has a **🌐 API** mode that calls the Anthropic Claude API instead of the local server. This requires an internet connection and an Anthropic API key set in the request headers inside `ChatScreen.js`.

> This is useful as a fallback when the local server isn't running.

---

## 🛠️ Performance Tips

- **Low RAM?** Use `Q4_K_M` quantization instead of `Q6_K`
- **Crashes?** Reduce `--ctx-size` to `2048`
- **Slow?** Increase `--threads` (up to your CPU core count)
- **GPU?** Add `--n-gpu-layers 32` if your device supports Vulkan

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <strong>ENAT AI // OFFLINE LLM MANAGER // ANDROID</strong><br>
  <sub>Built with React Native + Expo + llama.cpp</sub>
</div>

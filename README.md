# PAA — Personal Autonomous Agent & Floating Desktop Companion

PAA is a private, local-first autonomous digital employee and floating desktop companion that lives directly on your Windows desktop, works autonomously, and reacts in real-time.

---

## 👾 Two Display Modes

1. **Floating Desktop Pet / Widget Mode (Recommended)**:
   - Sits directly on your Windows screen as a **transparent, borderless, floating companion**.
   - Stays on top of all your applications (VS Code, Chrome, Terminal, etc.).
   - Can be **dragged anywhere** on your screen via the top handle.
   - Click the arrow to expand the mini prompt bar and give instructions from anywhere.
2. **Full Browser Dashboard**:
   - Available at `http://localhost:3001` with dual-column analytics, step-by-step logs, and state previews.

---

## ⚡ How to Run

Open your terminal in `D:\Personal_project\paa`:

### Step 1: Start Agent Kernel Server
```bash
npm run dev:api
```
*(Listens on port 4000)*

### Step 2: Start UI Dev Server
```bash
npm run dev:ui
```
*(Listens on port 3001)*

### Step 3: Launch Floating Desktop Companion
In a new terminal:
```bash
npm run dev:desktop
```
✨ Your animated mascot will now appear floating on your desktop screen!

---

## 💾 Running Local Models from Pendrive / External SSD

To run Ollama completely off your external drive:

```powershell
# Set model storage to external drive (e.g. E:\ollama\models)
[System.Environment]::SetEnvironmentVariable('OLLAMA_MODELS', 'E:\ollama\models', 'User')

# Start Ollama
ollama serve

# Download model weights to external drive
ollama pull qwen2.5-coder:7b
```

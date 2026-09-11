# 🎙️ Dhruv's Voice Launcher

A modern, hands-free Chrome Extension and Web Launcher that allows you to open and close websites using voice commands.

---

## ✨ Features

- **Hands-free Voice Navigation**: Speak commands like `"Open YouTube"`, `"Open Netflix"`, or `"Close"` to manage tabs.
- **Smart URL Resolver**: Maps popular services directly (e.g., YouTube, Netflix, Prime Video, Gemini, ChatGPT, Spotify, GitHub, and more) or opens spoken domain names automatically.
- **Visual Feedback**: Celebratory confetti burst when opening websites via voice.
- **Samsung Internet & Mobile Compatibility**: Includes a dedicated fullscreen Web Launcher (`samsung_launcher.html`) optimized for mobile browsers and touch/voice interaction.
- **Persistent Voice Recognition**: Uses Chrome's `offscreen` API document with auto-restart and watchdog loops to keep listening smoothly.

---

## 🚀 Installation Guide

1. Clone or download this repository:
   ```bash
   git clone https://github.com/dhruvsaini83/dhruvs-voice-launcher.git
   ```
2. Open Google Chrome (or any Chromium-based browser like Brave, Edge, Opera).
3. Navigate to `chrome://extensions`.
4. Toggle **Developer mode** in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select this project folder.
7. Click the extension icon and grant microphone permission when prompted.

---

## 🗣️ Supported Commands

| Command | Action | Example |
| :--- | :--- | :--- |
| **"Open [site]"** | Opens specified website in a new tab | *"Open Netflix"*, *"Open YouTube"* |
| **"Close"** | Closes the currently active tab | *"Close"* |
| **"Close [site]"** | Closes tab matching specified domain | *"Close YouTube"* |

---

## 🛠️ Project Structure

- `manifest.json` — Manifest V3 configuration for the extension.
- `background.js` — Service worker managing tabs, commands, and offscreen listener lifecycle.
- `offscreen.html` & `offscreen.js` — Offscreen document hosting the SpeechRecognition engine.
- `popup.html` & `popup.js` — Quick extension popup interface.
- `samsung_launcher.html` & `samsung_launcher.js` — Fullscreen web-based voice hub.
- `setup.html` & `setup.js` — One-time microphone permission setup page.
- `icons/` — Extension icons.

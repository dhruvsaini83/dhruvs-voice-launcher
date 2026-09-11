# 🎙️ Dhruv's Voice Launcher

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hands-Free](https://img.shields.io/badge/Listening-Hands--Free%2024%2F7-22c55e)](#-features)

A modern, truly **hands-free Chrome Extension** and **Web Launcher** that allows you to open and close websites directly using voice commands — **no clicking required!**

Just say **"Open YouTube"** or **"Open Netflix"** anywhere in your browser, and the site launches instantly.

---

## ✨ Features

- 🗣️ **Truly Hands-Free Navigation**: Speak commands without touching your mouse or opening the popup every time.
- ⚡ **Zero-Latency Instant Matching**: Recognizes interim speech streams in real time with debounce cooldown — websites open the moment you finish your command.
- 🌐 **Smart Website Resolver**:
  - Direct mappings for popular platforms: YouTube, Netflix, Prime Video, Disney+ Hotstar, JioCinema, Amazon India, Flipkart, ChatGPT, Gemini, Claude, WhatsApp Web, Telegram, Instagram, Twitter/X, Spotify, GitHub, LinkedIn, Reddit, Cricbuzz, and more.
  - Generic fallback for any spoken website (e.g., *"Open apple.com"*, *"Open moneycontrol"*).
- 🇮🇳 **Bilingual & Natural Variations**: Supports natural speech patterns including `"Open YouTube"`, `"YouTube open"`, `"Open karo YouTube"`, `"Launch Netflix"`, `"Go to Google"`, and `"Close"`.
- 🎉 **Visual Confetti Burst**: Celebratory confetti effect injected into newly opened pages upon voice launch.
- 🛡️ **Self-Healing Offscreen Engine**: Runs a resilient Chrome `offscreen` document with continuous audio keepalive and watchdog alarms to ensure listening stays active in the background.
- 📱 **Samsung Internet & Mobile Compatibility**: Includes a dedicated fullscreen Web Launcher (`samsung_launcher.html`) optimized for mobile browsers and touch/voice interaction.

---

## 🚀 Installation & Setup Guide

### 1. Load the Extension in Chrome
1. Clone or download this repository:
   ```bash
   git clone https://github.com/dhruvsaini83/dhruvs-voice-launcher.git
   ```
2. Open **Google Chrome** (or any Chromium browser like Edge, Brave, Opera).
3. Navigate to `chrome://extensions` in the address bar.
4. Toggle **Developer mode** in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select this project directory.

### 2. Enable Microphone (One-Time Setup)
Upon loading, the **Setup Page** (`setup.html`) will automatically open in a tab:
- Click **"Allow Microphone Access"**.
- Choose **Allow** in the browser permission prompt.
- That's it! Hands-free background listening is now active. You can close the setup tab.

*(Note: You can re-open the setup page anytime via the extension popup or by clicking "Options" on `chrome://extensions`.)*

---

## 🗣️ Supported Voice Commands

| Command Pattern | Spoken Examples | Result |
| :--- | :--- | :--- |
| **"Open [site]"** | *"Open YouTube"*, *"Open Netflix"*, *"Open ChatGPT"* | Launches website in a new tab |
| **"[site] Open"** | *"YouTube open"*, *"Google open"*, *"WhatsApp open"* | Launches website in a new tab |
| **"Launch / Go to [site]"** | *"Launch Prime Video"*, *"Go to Spotify"* | Launches website in a new tab |
| **"Open karo [site]"** | *"Open karo Hotstar"*, *"JioCinema kholo"* | Launches website in a new tab |
| **"Close"** | *"Close"*, *"Close tab"*, *"Band karo"* | Closes the currently active tab |
| **"Close [site]"** | *"Close YouTube"*, *"Close Netflix"* | Closes the tab matching that site |

### Popular Pre-Mapped Services
- **Video / Streaming:** YouTube, Netflix, Amazon Prime Video, Disney+ Hotstar, JioCinema, Twitch
- **AI Assistants:** ChatGPT, Google Gemini, Claude (Anthropic)
- **Social & Messaging:** WhatsApp Web, Telegram, Instagram, Twitter/X, Facebook, LinkedIn, Reddit
- **Shopping:** Amazon India, Flipkart
- **Productivity & Google Apps:** Gmail, Google Drive, Google Maps, Google Calendar, Google Meet, Google Translate
- **Music & Media:** Spotify
- **Developer Tools:** GitHub, Stack Overflow, Canva, Speedtest
- **Sports & News:** Cricbuzz, Google News, Aaj Tak, NDTV

---

## 🛠️ Project Structure

```
Voice Chrome Ext/
├── manifest.json         # Chrome MV3 manifest with offscreen & scripting permissions
├── background.js        # Background service worker (tab control, alarms, confetti injection)
├── offscreen.html       # Headless DOM container for continuous microphone listening
├── offscreen.js         # SpeechRecognition engine with audio keepalive and smart URL resolver
├── popup.html           # Modern extension popup displaying real-time hands-free status
├── popup.js             # Popup logic and status synchronization
├── setup.html           # One-time microphone permission setup page
├── setup.js             # Permission acquisition and offscreen initialization
├── samsung_launcher.html# Fullscreen mobile/web voice launcher hub
├── samsung_launcher.js  # Interactive web launcher engine
└── icons/               # Extension icons (16px, 32px, 48px, 128px)
```

---

## 💡 Troubleshooting

- **Microphone blocked?** Click the camera/microphone icon in the Chrome URL bar on the `setup.html` page and select *"Always allow"*.
- **Extension not hearing commands?** Open `chrome://extensions` and click the **Reload (🔄)** icon on Dhruv's Voice Launcher. Make sure microphone permission is granted.
- **Microphone sleep on Windows?** Ensure Windows Settings > Privacy & Security > Microphone has allowed desktop apps to access the microphone.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

# 🎙️ Dhruv's Voice Launcher

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hands-Free](https://img.shields.io/badge/Listening-Hands--Free-22c55e)](#-features)
[![Privacy Friendly](https://img.shields.io/badge/Microphone-Auto--Sleep%20on%20Close-blue)](#-features)

A modern, truly **hands-free Chrome Extension** and **Web Launcher** that allows you to open and close websites directly using voice commands — **no clicking required!**

Just say **"Open YouTube"** or **"Open Netflix"** anywhere in your browser, and the site launches instantly.

---

## ✨ Features

### 🗣️ Voice Control
- **Truly Hands-Free Navigation**: Speak commands without touching your mouse or opening the popup — just talk and it works.
- **Bilingual & Natural Variations**: Understands multiple natural speech patterns:
  - `"Open YouTube"` / `"YouTube open"` / `"Open karo YouTube"` / `"YouTube kholo"`
  - `"Launch Netflix"` / `"Go to Spotify"` / `"Open karo Hotstar"` / `"JioCinema kholo"`
  - `"Close"` / `"Close tab"` / `"Band karo"` / `"Close YouTube"`
- **Zero-Latency Instant Matching**: Processes interim speech in real time with debounce cooldown — sites open the moment your command is complete.
- **Smart Close — Last Tab Protection**: If you say *"Close YouTube"* and it's the **only tab open**, the extension automatically opens a new tab first so your browser stays alive, then closes the target tab.

### 🌐 Smart Website Resolver
- **50+ Pre-Mapped Sites**: Direct voice-to-URL mappings for:
  - 🎬 **Streaming:** YouTube, Netflix, Amazon Prime Video, Disney+ Hotstar, JioCinema
  - 🤖 **AI Assistants:** ChatGPT, Google Gemini, Claude (Anthropic)
  - 💬 **Social & Messaging:** WhatsApp Web, Telegram, Instagram, Twitter/X, Facebook, LinkedIn, Reddit
  - 🛍️ **Shopping:** Amazon India, Flipkart
  - 📧 **Google Apps:** Gmail, Google Drive, Google Maps, Google Calendar, Google Meet, Google Translate
  - 🎵 **Music:** Spotify
  - 👨‍💻 **Dev Tools:** GitHub, Stack Overflow, Canva, Speedtest
  - 📰 **News & Sports:** Cricbuzz, Google News, Aaj Tak, NDTV
- **Generic Fallback Resolver**: Any site not in the dictionary is automatically resolved — say *"Open moneycontrol"* or *"Open apple.com"* and it works.
- **Dot Notation Support**: Say *"google dot com"* and it converts to `google.com` automatically.

### 🔒 Privacy & Lifecycle
- **Mic Active Only While Browser is Open**: Microphone hardware tracks are strictly held **only when at least one browser window is open**.
- **Instant Release on Browser Close**: When all Chrome windows are closed, speech recognition is immediately aborted and all audio stream tracks are released — the mic indicator on Windows disappears instantly.
- **Auto-Resume on Browser Open**: Re-opening Chrome automatically restarts the voice listener with no prompts or clicks needed.
- **Healthcheck Alarm Guard**: A background alarm verifies the listener is healthy while Chrome is open, and skips any restart if no browser windows are detected.

### 🛡️ Reliability
- **Self-Healing Offscreen Engine**: Runs a resilient Chrome `offscreen` document with continuous audio keepalive and watchdog timer alarms to keep listening active while Chrome is open.
- **Concurrency-Safe Offscreen Management**: Serialized offscreen document creation prevents race conditions when multiple triggers fire simultaneously.
- **Watchdog Timer**: Every 4 seconds checks if recognition has silently died and restarts it automatically.
- **Recognition Error Handling**: Handles `no-speech`, `audio-capture`, and `not-allowed` errors gracefully without crashing the listener.

### 🎉 Visual Feedback
- **Confetti Burst on Open**: A celebratory confetti animation is injected into the newly opened page when a site is launched by voice.
- **Real-Time Status Popup**: The extension popup shows live status — *"Listening Hands-Free"*, last spoken command, and mic permission state.

### 📱 Mobile & Samsung Internet
- **Fullscreen Web Launcher** (`samsung_launcher.html`): A dedicated standalone voice launcher page optimized for mobile browsers and Samsung Internet with a large tap-to-speak interface.

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
| **"Open karo / Kholo [site]"** | *"Open karo Hotstar"*, *"JioCinema kholo"* | Launches website in a new tab |
| **"Close"** | *"Close"*, *"Close tab"*, *"Band karo"* | Closes the currently active tab (opens new tab if it's the last one) |
| **"Close [site]"** | *"Close YouTube"*, *"Close Netflix"* | Closes the matching tab (opens new tab if it's the last one) |

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
- **Does it use the mic when Chrome is closed?** **No.** The extension automatically detects when all browser windows are closed and immediately releases the microphone — the Windows taskbar mic indicator will disappear.
- **Why did a new tab open when I closed a site?** This is intentional! If you close the last remaining tab via voice, the extension opens a new tab first so Chrome doesn't shut down and lose the voice listener.
- **Microphone access in Windows:** Ensure Windows Settings > Privacy & Security > Microphone has allowed desktop apps to access the microphone.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

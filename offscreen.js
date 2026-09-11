console.log("[Dhruv's Voice Launcher - offscreen] script loaded");

let recognition = null;
let running = false;
let starting = false;
let shouldBeRunning = false;
let lastCommandTime = 0;
const COMMAND_COOLDOWN_MS = 1800; // prevents duplicate triggers from continuous speech fragments
let activeAudioStream = null;

// Rich dictionary of popular websites
const KNOWN_SITES = [
  { phrases: ['youtube', 'yt'], url: 'https://www.youtube.com' },
  { phrases: ['google'], url: 'https://www.google.com' },
  { phrases: ['netflix'], url: 'https://www.netflix.com' },
  { phrases: ['prime video', 'amazon prime', 'prime'], url: 'https://www.primevideo.com' },
  { phrases: ['hotstar', 'disney hotstar', 'disney plus hotstar'], url: 'https://www.hotstar.com' },
  { phrases: ['jiocinema', 'jio cinema'], url: 'https://www.jiocinema.com' },
  { phrases: ['amazon', 'amazon in', 'amazon india'], url: 'https://www.amazon.in' },
  { phrases: ['flipkart'], url: 'https://www.flipkart.com' },
  { phrases: ['gemini', 'google gemini'], url: 'https://gemini.google.com' },
  { phrases: ['chatgpt', 'chat gpt', 'openai'], url: 'https://chatgpt.com' },
  { phrases: ['claude', 'anthropic'], url: 'https://claude.ai' },
  { phrases: ['facebook', 'fb'], url: 'https://www.facebook.com' },
  { phrases: ['instagram', 'insta'], url: 'https://www.instagram.com' },
  { phrases: ['twitter', 'x'], url: 'https://x.com' },
  { phrases: ['whatsapp', 'whatsapp web'], url: 'https://web.whatsapp.com' },
  { phrases: ['telegram', 'telegram web'], url: 'https://web.telegram.org' },
  { phrases: ['spotify'], url: 'https://open.spotify.com' },
  { phrases: ['gmail', 'google mail', 'email', 'mail'], url: 'https://mail.google.com' },
  { phrases: ['google maps', 'maps'], url: 'https://maps.google.com' },
  { phrases: ['google drive', 'drive'], url: 'https://drive.google.com' },
  { phrases: ['google calendar', 'calendar'], url: 'https://calendar.google.com' },
  { phrases: ['google meet', 'meet'], url: 'https://meet.google.com' },
  { phrases: ['google translate', 'translate'], url: 'https://translate.google.com' },
  { phrases: ['linkedin'], url: 'https://www.linkedin.com' },
  { phrases: ['reddit'], url: 'https://www.reddit.com' },
  { phrases: ['github'], url: 'https://github.com' },
  { phrases: ['wikipedia', 'wiki'], url: 'https://www.wikipedia.org' },
  { phrases: ['cricbuzz'], url: 'https://www.cricbuzz.com' },
  { phrases: ['canva'], url: 'https://www.canva.com' },
  { phrases: ['pinterest'], url: 'https://www.pinterest.com' },
  { phrases: ['aaj tak', 'aajtak'], url: 'https://www.aajtak.in' },
  { phrases: ['ndtv'], url: 'https://www.ndtv.com' },
  { phrases: ['news', 'google news'], url: 'https://news.google.com' },
  { phrases: ['speedtest', 'speed test'], url: 'https://www.speedtest.net' },
  { phrases: ['stackoverflow', 'stack overflow'], url: 'https://stackoverflow.com' }
];

async function ensureAudioStream() {
  if (activeAudioStream && activeAudioStream.active) return true;
  try {
    activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("[Dhruv's Voice Launcher - offscreen] audio stream acquired, tracks:", activeAudioStream.getAudioTracks().length);
    return true;
  } catch (err) {
    console.warn("[Dhruv's Voice Launcher - offscreen] getUserMedia failed:", err.name, err.message);
    return false;
  }
}

async function beginDetection() {
  console.log("[Dhruv's Voice Launcher - offscreen] beginDetection called, running=", running);
  shouldBeRunning = true;
  await ensureAudioStream();
  if (running) return;
  startRecognition();
}

function startRecognition() {
  if (starting || running) return;
  starting = true;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("[Dhruv's Voice Launcher - offscreen] SpeechRecognition not available in this context");
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Speech recognition not supported' });
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || 'en-IN';

  recognition.onstart = () => {
    running = true;
    starting = false;
    console.log("[Dhruv's Voice Launcher - offscreen] now actively listening hands-free");
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Listening Hands-Free' });
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.toLowerCase().trim();
      console.log("[Dhruv's Voice Launcher - offscreen] heard (" + (result.isFinal ? "final" : "interim") + "):", transcript);
      handleTranscript(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'audio-capture') {
      console.warn("[Dhruv's Voice Launcher - offscreen] mic permission not granted, pausing auto-restart loop.");
      shouldBeRunning = false;
      chrome.runtime.sendMessage({ 
        type: 'STATUS_UPDATE', 
        status: 'Microphone blocked - please open setup page to grant permission' 
      });
      return;
    }

    if (event.error !== 'no-speech') {
      console.error("[Dhruv's Voice Launcher - offscreen] recognition error:", event.error);
    }
  };

  recognition.onend = () => {
    running = false;
    starting = false;
    console.log("[Dhruv's Voice Launcher - offscreen] recognition session ended, shouldBeRunning=", shouldBeRunning);
    if (shouldBeRunning) {
      setTimeout(startRecognition, 300);
    } else {
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Stopped' });
    }
  };

  try {
    recognition.start();
  } catch (err) {
    starting = false;
    console.error("[Dhruv's Voice Launcher - offscreen] failed to start recognition:", err.name, err.message);
    if (err.name === 'NotAllowedError') {
      shouldBeRunning = false;
      return;
    }
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Mic error: ' + err.name + ' - ' + err.message });
    if (shouldBeRunning) {
      setTimeout(startRecognition, 1500);
    }
  }
}

// Watchdog: ensures listening stays active in background
setInterval(() => {
  if (shouldBeRunning && !running && !starting) {
    console.log("[Dhruv's Voice Launcher - offscreen] watchdog: restarting session");
    startRecognition();
  }
}, 4000);

function handleTranscript(transcript) {
  // Support both "open <site>" and "<site> open" / "<site> kholo" / "launch <site>"
  const openMatch = transcript.match(/\b(open|launch|go to|kholo)\b/);
  const closeMatch = transcript.match(/\b(close|band karo)\b/);

  if (closeMatch && (!openMatch || closeMatch.index > openMatch.index)) {
    handleClose(transcript, closeMatch);
  } else if (openMatch) {
    handleOpen(transcript, openMatch);
  } else {
    // If user says directly "[site] open" or just "[site]"
    for (const site of KNOWN_SITES) {
      for (const phrase of site.phrases) {
        if (transcript.includes(phrase + ' open') || transcript === phrase) {
          triggerOpenSite(phrase, site.url);
          return;
        }
      }
    }
  }
}

function handleOpen(transcript, match) {
  let afterWord = transcript.slice(match.index + match[0].length).trim();
  
  // If matched at the end (e.g. "youtube open"), take what came before
  if (!afterWord) {
    afterWord = transcript.slice(0, match.index).trim();
  }

  if (!afterWord) return;

  afterWord = cleanFiller(afterWord);
  const url = resolveUrl(afterWord);
  if (!url) return;

  triggerOpenSite(afterWord, url);
}

function triggerOpenSite(spokenText, url) {
  const now = performance.now();
  if (now - lastCommandTime < COMMAND_COOLDOWN_MS) {
    console.log("[Dhruv's Voice Launcher - offscreen] ignoring, cooldown active:", spokenText);
    return;
  }

  console.log("[Dhruv's Voice Launcher - offscreen] >>> OPEN MATCHED - \"" + spokenText + "\" ->", url);
  lastCommandTime = now;
  chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', action: 'open', spoken: spokenText, url });
}

function handleClose(transcript, match) {
  let target = transcript.slice(match.index + match[0].length).trim();
  if (!target) {
    target = transcript.slice(0, match.index).trim();
  }

  const now = performance.now();
  if (now - lastCommandTime < COMMAND_COOLDOWN_MS) {
    console.log("[Dhruv's Voice Launcher - offscreen] ignoring, cooldown active for close");
    return;
  }

  target = cleanFiller(target);
  let url = null;
  if (target) {
    url = resolveUrl(target);
  }

  console.log("[Dhruv's Voice Launcher - offscreen] >>> CLOSE MATCHED - \"" + (target || '(active tab)') + "\" ->", url || '(active tab)');
  lastCommandTime = now;
  chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', action: 'close', spoken: target, url });
}

function cleanFiller(text) {
  text = text.replace(/\b(please|for me|now|thanks|thank you|it|that|this|tab|window|karo|bhai|website|site|page)\b/g, '').trim();
  text = text.replace(/[.,!?]+$/g, '').trim();
  return text;
}

function resolveUrl(spoken) {
  if (!spoken) return null;

  // 1. Check known site dictionary
  for (const site of KNOWN_SITES) {
    for (const phrase of site.phrases) {
      if (spoken === phrase || spoken.includes(phrase)) {
        return site.url;
      }
    }
  }

  // 2. Format spoken dots (e.g. "google dot com" -> "google.com")
  let cleaned = spoken.replace(/\s*dot\s*/g, '.');

  // 3. Remove all remaining spaces for domain creation
  cleaned = cleaned.replace(/\s+/g, '');
  if (!cleaned) return null;

  if (cleaned.includes('.')) {
    return 'https://www.' + cleaned.replace(/^www\./, '');
  }
  return 'https://www.' + cleaned + '.com';
}

function endDetection() {
  shouldBeRunning = false;
  if (recognition) {
    recognition.stop();
  }
  if (activeAudioStream) {
    activeAudioStream.getTracks().forEach(t => t.stop());
    activeAudioStream = null;
  }
  console.log("[Dhruv's Voice Launcher - offscreen] stop requested");
}

chrome.runtime.onMessage.addListener((msg) => {
  console.log("[Dhruv's Voice Launcher - offscreen] received message", msg);
  if (msg.type === 'START_LISTENING' || msg.type === 'BEGIN_CLAP_DETECTION') beginDetection();
  if (msg.type === 'STOP_LISTENING' || msg.type === 'END_CLAP_DETECTION') endDetection();
});

// Start immediately on initialization
beginDetection();

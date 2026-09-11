const micRing = document.getElementById('micRing');
const mainMicBtn = document.getElementById('mainMicBtn');
const statusLabel = document.getElementById('statusLabel');
const transcriptCard = document.getElementById('transcriptCard');

let isListening = false;
let recognition = null;

const KNOWN_SITES = [
  { phrases: ['netflix'], url: 'https://www.netflix.com' },
  { phrases: ['prime video', 'amazon prime', 'prime'], url: 'https://www.primevideo.com' },
  { phrases: ['hotstar', 'disney hotstar', 'disney plus hotstar'], url: 'https://www.hotstar.com' },
  { phrases: ['amazon'], url: 'https://www.amazon.in' },
  { phrases: ['gemini', 'google gemini'], url: 'https://gemini.google.com' },
  { phrases: ['chatgpt', 'chat gpt'], url: 'https://chat.openai.com' },
  { phrases: ['claude'], url: 'https://claude.ai' },
  { phrases: ['facebook'], url: 'https://www.facebook.com' },
  { phrases: ['instagram', 'insta'], url: 'https://www.instagram.com' },
  { phrases: ['twitter', 'x'], url: 'https://www.twitter.com' },
  { phrases: ['youtube'], url: 'https://www.youtube.com' },
  { phrases: ['gmail', 'google mail'], url: 'https://mail.google.com' },
  { phrases: ['google maps', 'maps'], url: 'https://maps.google.com' },
  { phrases: ['google drive', 'drive'], url: 'https://drive.google.com' },
  { phrases: ['google calendar', 'calendar'], url: 'https://calendar.google.com' },
  { phrases: ['google'], url: 'https://www.google.com' },
  { phrases: ['whatsapp', 'whatsapp web'], url: 'https://web.whatsapp.com' },
  { phrases: ['spotify'], url: 'https://open.spotify.com' },
  { phrases: ['linkedin'], url: 'https://www.linkedin.com' },
  { phrases: ['reddit'], url: 'https://www.reddit.com' },
  { phrases: ['github'], url: 'https://github.com' },
  { phrases: ['wikipedia'], url: 'https://www.wikipedia.org' }
];

function resolveUrl(spoken) {
  for (const site of KNOWN_SITES) {
    for (const phrase of site.phrases) {
      if (spoken === phrase || spoken.includes(phrase)) {
        return site.url;
      }
    }
  }
  let cleaned = spoken.replace(/\s*dot\s*/g, '.').replace(/\s+/g, '');
  if (!cleaned) return null;
  if (cleaned.includes('.')) {
    return 'https://www.' + cleaned.replace(/^www\./, '');
  }
  return 'https://www.' + cleaned + '.com';
}

function cleanFiller(text) {
  text = text.replace(/\b(please|for me|now|thanks|thank you|it|that|this|tab|window)\b/g, '').trim();
  text = text.replace(/[.,!?]+$/g, '').trim();
  return text;
}

function executeCommand(transcript) {
  transcriptCard.style.display = 'block';
  transcriptCard.textContent = `Heard: "${transcript}"`;

  const openMatch = transcript.match(/\bopen\b/);
  const closeMatch = transcript.match(/\bclose\b/);

  if (openMatch) {
    let afterWord = cleanFiller(transcript.slice(openMatch.index + openMatch[0].length).trim());
    const targetUrl = resolveUrl(afterWord);
    if (targetUrl) {
      statusLabel.textContent = `🚀 Launching ${afterWord}...`;
      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: targetUrl });
        } else {
          window.location.href = targetUrl;
        }
      }, 400);
    } else {
      statusLabel.textContent = `Couldn't recognize site: "${afterWord}"`;
    }
  } else if (closeMatch) {
    statusLabel.textContent = "Closing current tab...";
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.remove) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) chrome.tabs.remove(tabs[0].id);
      });
    } else {
      window.close();
    }
  } else {
    const directUrl = resolveUrl(transcript);
    if (directUrl) {
      statusLabel.textContent = `🚀 Launching ${transcript}...`;
      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: directUrl });
        } else {
          window.location.href = directUrl;
        }
      }, 400);
    } else {
      statusLabel.textContent = `Say "Open [site]" to launch`;
    }
  }
}

let activeAudioStream = null;

async function requestMicAccess() {
  if (activeAudioStream) return true;
  try {
    // Keep the stream alive so the browser keeps the microphone indicator and permission active
    activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (err) {
    console.warn("getUserMedia error:", err);
    return false;
  }
}

function releaseMicAccess() {
  if (activeAudioStream) {
    activeAudioStream.getTracks().forEach(track => track.stop());
    activeAudioStream = null;
  }
}

function setupSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusLabel.textContent = 'Speech recognition not supported in this browser version';
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language || 'en-US';

  rec.onstart = () => {
    isListening = true;
    micRing.classList.add('active');
    statusLabel.textContent = 'Listening continuously... Speak now';
  };

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const heard = e.results[i][0].transcript.toLowerCase().trim();
        executeCommand(heard);
      }
    }
  };

  rec.onerror = (e) => {
    console.warn("Speech error:", e.error);
    if (e.error === 'not-allowed' || e.error === 'audio-capture') {
      statusLabel.innerHTML = '<span style="color:#f87171;">Microphone blocked!</span><br><small style="color:#94a3b8;">Address bar me lock icon par tap karke Microphone Allow karein.</small>';
      stopListening();
    } else if (e.error === 'network') {
      statusLabel.innerHTML = '<span style="color:#fbbf24;">Speech Network Error</span><br><small style="color:#94a3b8;">Microphone active hai. Retry kar rahe hain...</small>';
    } else if (e.error !== 'no-speech') {
      statusLabel.textContent = 'Error: ' + e.error;
    }
  };

  rec.onend = () => {
    // If the user intended to keep listening, immediately restart session without closing mic
    if (isListening) {
      setTimeout(() => {
        if (isListening && recognition) {
          try { recognition.start(); } catch (_) {}
        }
      }, 200);
    } else {
      stopListening();
    }
  };

  return rec;
}

async function startListening() {
  if (isListening) return;

  statusLabel.textContent = 'Connecting microphone...';
  const hasAccess = await requestMicAccess();
  if (!hasAccess) {
    statusLabel.innerHTML = '<span style="color:#f87171;">Microphone blocked in browser/system!</span><br><small style="color:#94a3b8;">Address bar me lock/mic icon par Allow karein.</small>';
    return;
  }

  isListening = true;
  if (!recognition) {
    recognition = setupSpeech();
  }
  if (!recognition) return;
  try {
    recognition.start();
  } catch (err) {
    console.warn("Speech start warning:", err);
  }
}

function stopListening() {
  isListening = false;
  micRing.classList.remove('active');
  releaseMicAccess();
  if (recognition) {
    try { recognition.stop(); } catch (_) {}
  }
  if (!statusLabel.textContent.includes('Launching') && !statusLabel.textContent.includes('blocked')) {
    statusLabel.textContent = 'Tap mic to speak';
  }
}

mainMicBtn.addEventListener('click', () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

const commandForm = document.getElementById('commandForm');
const commandInput = document.getElementById('commandInput');

if (commandForm && commandInput) {
  commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = commandInput.value.trim();
    if (val) {
      executeCommand(val);
      commandInput.value = '';
    }
  });
}

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const cmd = chip.getAttribute('data-cmd');
    if (commandInput) commandInput.value = cmd;
    executeCommand(cmd);
  });
});

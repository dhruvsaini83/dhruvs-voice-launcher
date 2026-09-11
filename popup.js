const micToggleBtn = document.getElementById('micToggleBtn');
const statusEl = document.getElementById('status');
const heardBox = document.getElementById('heardBox');

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

function handleTranscript(transcript) {
  heardBox.style.display = 'block';
  heardBox.textContent = `Heard: "${transcript}"`;

  const openMatch = transcript.match(/\bopen\b/);
  const closeMatch = transcript.match(/\bclose\b/);

  if (closeMatch && (!openMatch || closeMatch.index > openMatch.index)) {
    let afterWord = cleanFiller(transcript.slice(closeMatch.index + closeMatch[0].length).trim());
    statusEl.textContent = 'Closing tab...';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'VOICE_COMMAND',
        action: 'close',
        spoken: afterWord,
        url: afterWord ? resolveUrl(afterWord) : null
      });
    }
  } else if (openMatch) {
    let afterWord = cleanFiller(transcript.slice(openMatch.index + openMatch[0].length).trim());
    const targetUrl = resolveUrl(afterWord);
    if (targetUrl) {
      statusEl.textContent = `Opening ${afterWord}...`;
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: targetUrl });
      } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'VOICE_COMMAND',
          action: 'open',
          spoken: afterWord,
          url: targetUrl
        });
      } else {
        window.open(targetUrl, '_blank');
      }
    }
  }
}

function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusEl.textContent = 'Speech recognition not supported in this view';
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  // Use device language or fallback to en-US for better network recognition
  rec.lang = navigator.language || 'en-US';

  rec.onstart = () => {
    isListening = true;
    micToggleBtn.classList.add('active');
    statusEl.textContent = 'Listening... Speak now';
  };

  rec.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const text = event.results[i][0].transcript.toLowerCase().trim();
        handleTranscript(text);
      }
    }
  };

  rec.onerror = (e) => {
    console.warn("Recognition error:", e.error);
    if (e.error === 'audio-capture' || e.error === 'not-allowed') {
      statusEl.innerHTML = '<span style="color:#f87171;">Microphone access blocked!</span><br><button id="grantNowBtn" style="margin-top:6px;padding:4px 8px;font-size:11px;border-radius:4px;border:none;background:#2563eb;color:white;cursor:pointer;">Click to Grant Permission</button>';
      const grantBtn = document.getElementById('grantNowBtn');
      if (grantBtn) {
        grantBtn.onclick = () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
          } else {
            window.open('setup.html', '_blank');
          }
        };
      }
    } else if (e.error === 'network') {
      statusEl.innerHTML = '<span style="color:#fbbf24;">Speech Network Error</span><br><small style="color:#94a3b8;">Check internet or retry</small>';
    } else {
      statusEl.textContent = 'Error: ' + e.error;
    }
    stopListening();
  };

  rec.onend = () => {
    stopListening();
  };

  return rec;
}

function startListening() {
  if (!recognition) {
    recognition = setupRecognition();
  }
  if (!recognition) return;
  try {
    recognition.start();
  } catch (err) {
    console.error(err);
  }
}

function stopListening() {
  isListening = false;
  micToggleBtn.classList.remove('active');
  statusEl.textContent = 'Status: tap mic to speak';
  if (recognition) {
    try { recognition.stop(); } catch (_) {}
  }
}

micToggleBtn.addEventListener('click', () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

// Sync status from background if storage is available
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['lastStatus'], (data) => {
    if (data && data.lastStatus) {
      statusEl.textContent = 'Status: ' + data.lastStatus;
    }
  });
}

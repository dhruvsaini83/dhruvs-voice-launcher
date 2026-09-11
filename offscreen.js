console.log("[Dhruv's Voice Launcher - offscreen] script loaded");

let recognition = null;
let running = false;
let starting = false; // guards against overlapping start attempts (e.g. watchdog firing mid-startup)
let shouldBeRunning = false; // tracks intent, so onend can decide whether to auto-restart
let lastCommandTime = 0;
const COMMAND_COOLDOWN_MS = 1500; // guards against the same utterance firing twice

const WAKE_WORD_OPEN = 'open';
const WAKE_WORD_CLOSE = 'close';

// Known multi-word or oddly-named sites get an exact mapping, so "prime"
// goes to Prime Video rather than a guessed primevideo.com typo, and
// "gmail"/"maps" resolve to their real subdomains instead of gmail.com.
// Anything NOT in this list still works via the generic fallback below -
// that's what makes this "any website", not just these examples.
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

function beginDetection() {
  console.log("[Dhruv's Voice Launcher - offscreen] beginDetection called, running=", running);
  shouldBeRunning = true;
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
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  recognition.onstart = () => {
    running = true;
    starting = false;
    console.log("[Dhruv's Voice Launcher - offscreen] now listening for \"open\"/\"close\" + a site name");
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Listening' });
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) continue;
      const transcript = result[0].transcript.toLowerCase().trim();
      console.log("[Dhruv's Voice Launcher - offscreen] heard:", transcript);
      handleTranscript(transcript);
    }
  };

  recognition.onerror = (event) => {
    // 'no-speech' fires constantly during normal silence - that's expected,
    // not a real error, so don't spam the console for it.
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
    // The browser's speech API stops itself periodically even in
    // continuous mode (e.g. after a long silence). If we're still
    // supposed to be listening, just start a fresh session.
    if (shouldBeRunning) {
      setTimeout(startRecognition, 500);
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
      setTimeout(startRecognition, 2000);
    }
  }
}

// Safety net: checks every few seconds, but only if shouldBeRunning is explicitly true
setInterval(() => {
  if (shouldBeRunning && !running) {
    console.log("[Dhruv's Voice Launcher - offscreen] watchdog: restarting session");
    startRecognition();
  }
}, 5000);

function handleTranscript(transcript) {
  const openMatch = transcript.match(/\bopen\b/);
  const closeMatch = transcript.match(/\bclose\b/);

  // If both words somehow appear, go with whichever was said last -
  // that's the one the person actually meant as their command.
  if (closeMatch && (!openMatch || closeMatch.index > openMatch.index)) {
    handleClose(transcript, closeMatch);
  } else if (openMatch) {
    handleOpen(transcript, openMatch);
  }
}

function handleOpen(transcript, match) {
  let afterWord = transcript.slice(match.index + match[0].length).trim();
  if (!afterWord) return; // just "open" with nothing after it - nothing to do

  const now = performance.now();
  if (now - lastCommandTime < COMMAND_COOLDOWN_MS) {
    console.log("[Dhruv's Voice Launcher - offscreen] ignoring, too soon after last command:", afterWord);
    return;
  }

  afterWord = cleanFiller(afterWord);
  const url = resolveUrl(afterWord);
  if (!url) return;

  console.log("[Dhruv's Voice Launcher - offscreen] OPEN MATCHED - \"" + afterWord + "\" ->", url);
  lastCommandTime = now;
  chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', action: 'open', spoken: afterWord, url });
}

function handleClose(transcript, match) {
  let afterWord = transcript.slice(match.index + match[0].length).trim();

  const now = performance.now();
  if (now - lastCommandTime < COMMAND_COOLDOWN_MS) {
    console.log("[Dhruv's Voice Launcher - offscreen] ignoring, too soon after last command: close", afterWord);
    return;
  }

  afterWord = cleanFiller(afterWord);

  // "close" alone (nothing named after it) means "close whatever tab
  // is currently active" - the common case of "I'm on the site I just
  // opened, close it". "close netflix" instead targets that site
  // specifically, even from a different active tab.
  let url = null;
  if (afterWord) {
    url = resolveUrl(afterWord);
    if (!url) return;
  }

  console.log("[Dhruv's Voice Launcher - offscreen] CLOSE MATCHED - \"" + (afterWord || '(active tab)') + "\" ->", url || '(active tab)');
  lastCommandTime = now;
  chrome.runtime.sendMessage({ type: 'VOICE_COMMAND', action: 'close', spoken: afterWord, url });
}

function cleanFiller(text) {
  // Strip trailing filler ("please", "for me", "now") so "open netflix
  // please" still resolves to plain "netflix".
  text = text.replace(/\b(please|for me|now|thanks|thank you|it|that|this|tab|window)\b/g, '').trim();
  text = text.replace(/[.,!?]+$/g, '').trim();
  return text;
}

function resolveUrl(spoken) {
  // 1. Known-site table first, so common names get their real address
  //    (e.g. "prime" -> primevideo.com) instead of a wrong guess.
  for (const site of KNOWN_SITES) {
    for (const phrase of site.phrases) {
      if (spoken === phrase || spoken.includes(phrase)) {
        return site.url;
      }
    }
  }

  // 2. "example dot com" style speech -> "example.com"
  let cleaned = spoken.replace(/\s*dot\s*/g, '.');

  // 3. Generic fallback for literally any other site: strip remaining
  //    spaces (domains don't have spaces) and assume ".com" unless a
  //    domain/TLD was already spoken.
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
  console.log("[Dhruv's Voice Launcher - offscreen] stop requested");
}

chrome.runtime.onMessage.addListener((msg) => {
  console.log("[Dhruv's Voice Launcher - offscreen] received message", msg);
  if (msg.type === 'BEGIN_CLAP_DETECTION') beginDetection();
  if (msg.type === 'END_CLAP_DETECTION') endDetection();
});

// Start immediately on load rather than waiting for a message - a
// message sent right after this document is created can arrive
// before this script has finished loading and get silently dropped.
beginDetection();

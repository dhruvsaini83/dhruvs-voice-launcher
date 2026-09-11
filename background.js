// Multiple triggers (onInstalled, onStartup, cold-start, popup/options
// clicks) can call this around the same time. getContexts() +
// createDocument() isn't atomic, so two calls can both see "none exists
// yet" and both try to create one - only the first succeeds, the
// second throws. We serialize with a shared in-flight promise, and
// also swallow that specific error if it slips through anyway.
let creatingOffscreen = null;

async function ensureOffscreen() {
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  // Graceful fallback for mobile / Samsung Internet where chrome.offscreen is unavailable
  if (!chrome.offscreen || typeof chrome.offscreen.createDocument !== 'function') {
    console.warn("[Dhruv's Voice Launcher - background] chrome.offscreen is not supported in this browser (Samsung Internet/Mobile). Voice commands work via Popup or Web Launcher.");
    return;
  }

  creatingOffscreen = (async () => {
    const existing = chrome.runtime.getContexts
      ? await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })
      : [];
    console.log("[Dhruv's Voice Launcher - background] existing offscreen docs:", existing.length);
    if (existing.length > 0) return;

    try {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Listen to microphone to detect claps or voice commands'
      });
      console.log("[Dhruv's Voice Launcher - background] offscreen document created");
    } catch (err) {
      if (err.message && err.message.includes('single offscreen document')) {
        console.log("[Dhruv's Voice Launcher - background] offscreen document already exists (race), ignoring");
      } else {
        console.warn("[Dhruv's Voice Launcher - background] offscreen creation skipped/failed:", err.message);
      }
    }
  })();

  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

async function autoStartIfGranted() {
  const { micGranted } = await chrome.storage.local.get(['micGranted']);
  console.log("[Dhruv's Voice Launcher - background] autoStartIfGranted, micGranted=", micGranted);
  if (micGranted) {
    await ensureOffscreen();
  }
}

chrome.runtime.onStartup.addListener(autoStartIfGranted);
chrome.runtime.onInstalled.addListener(autoStartIfGranted);

// A second layer of self-healing, at the extension level rather than
// inside the offscreen document: chrome.alarms keeps firing even after
// the background service worker itself has gone idle and been unloaded,
// so this periodically confirms the offscreen document (where listening
// actually happens) is still alive, and recreates it if Chrome ever
// tore it down for its own reasons.
chrome.alarms.create('voice-launcher-healthcheck', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'voice-launcher-healthcheck') return;
  const { micGranted } = await chrome.storage.local.get(['micGranted']);
  if (!micGranted) return;

  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length === 0) {
    console.log("[Dhruv's Voice Launcher - background] healthcheck: offscreen document missing, recreating");
    await ensureOffscreen();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[Dhruv's Voice Launcher - background] received message", msg);

  if (msg.type === 'START_LISTENING') {
    ensureOffscreen();
  }

  if (msg.type === 'VOICE_COMMAND') {
    if (msg.action === 'open') {
      console.log("[Dhruv's Voice Launcher - background] opening", msg.spoken, '->', msg.url);
      openSiteWithConfetti(msg.url);
    } else if (msg.action === 'close') {
      handleCloseCommand(msg.url, msg.spoken);
    }
  }

  if (msg.type === 'STATUS_UPDATE') {
    chrome.storage.local.set({ lastStatus: msg.status });
  }

  return true;
});

// Also try on service worker cold-start, in case onStartup/onInstalled
// already fired before this load (e.g. after an extension reload).
autoStartIfGranted();

function hostnameOf(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function handleCloseCommand(targetUrl, spoken) {
  if (!targetUrl) {
    // Plain "close" - close whichever tab is currently active in the
    // currently focused window (the "I'm looking at it, close it" case).
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTab) {
      console.log("[Dhruv's Voice Launcher - background] closing active tab:", activeTab.url);
      chrome.tabs.remove(activeTab.id);
    } else {
      console.log("[Dhruv's Voice Launcher - background] \"close\" heard but no active tab found");
    }
    return;
  }

  // "close <site>" - find a tab whose domain matches, even if it isn't
  // the currently focused one. Prefer the active tab if it happens to
  // match, otherwise take the most recently accessed matching tab.
  const targetHost = hostnameOf(targetUrl);
  const allTabs = await chrome.tabs.query({});
  const matches = allTabs.filter(t => hostnameOf(t.url) === targetHost);

  if (matches.length === 0) {
    console.log("[Dhruv's Voice Launcher - background] \"close\"", spoken, "\" heard but no matching tab is open");
    return;
  }

  const toClose = matches.find(t => t.active) ||
    matches.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
  console.log("[Dhruv's Voice Launcher - background] closing tab matching", spoken, '->', toClose.url);
  chrome.tabs.remove(toClose.id);
}

async function openSiteWithConfetti(url) {
  const tab = await chrome.tabs.create({ url });
  const tabId = tab.id;

  // Wait for the page to actually finish loading before injecting -
  // injecting into a blank/loading page either fails or gets wiped out
  // by the navigation that follows.
  function onUpdated(updatedTabId, changeInfo) {
    if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(onUpdated);

    if (!chrome.scripting || typeof chrome.scripting.executeScript !== 'function') {
      console.log("[Dhruv's Voice Launcher - background] chrome.scripting not supported on this platform, skipping confetti.");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      func: dhruvVoiceLauncherConfettiBurst
    }).catch(err => {
      // Some pages (chrome:// pages, the Web Store, etc.) block script
      // injection entirely - that's expected sometimes, not a real bug.
      console.log("[Dhruv's Voice Launcher - background] confetti skipped (page does not allow injection):", err.message);
    });
  }
  chrome.tabs.onUpdated.addListener(onUpdated);
}

// Runs INSIDE the newly opened page (via chrome.scripting.executeScript),
// not in the extension itself - so it can only use standard web APIs,
// nothing from the rest of this file.
function dhruvVoiceLauncherConfettiBurst() {
  const EXISTING_ID = '__dhruv_voice_launcher_confetti__';
  if (document.getElementById(EXISTING_ID)) return; // don't stack bursts

  const canvas = document.createElement('canvas');
  canvas.id = EXISTING_ID;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2147483647'; // above virtually anything a page could set
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.documentElement.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#4caf50', '#ff5252', '#ffca28', '#42a5f5', '#ab47bc', '#ff7043', '#26c6da'];
  const pieces = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -30 - Math.random() * canvas.height * 0.4,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12
    });
  }

  const start = performance.now();
  const duration = 2600;

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}

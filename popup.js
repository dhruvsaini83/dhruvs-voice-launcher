const micToggleBtn = document.getElementById('micToggleBtn');
const statusEl = document.getElementById('status');
const heardBox = document.getElementById('heardBox');
const statusPill = document.getElementById('statusPill');
const statusPillText = document.getElementById('statusPillText');
const micAlert = document.getElementById('micAlert');
const grantMicBtn = document.getElementById('grantMicBtn');
const voicePowerToggle = document.getElementById('voicePowerToggle');
const toggleStateText = document.getElementById('toggleStateText');

// --- ON/OFF Toggle Logic ---
function applyVoiceState(isEnabled) {
  voicePowerToggle.checked = isEnabled;
  if (isEnabled) {
    toggleStateText.textContent = 'ON';
    toggleStateText.className = 'toggle-state-text on';
    statusPill.className = 'status-pill';
    statusPillText.textContent = 'Hands-Free Active';
    micToggleBtn.classList.add('active');
    statusEl.textContent = 'Listening hands-free in browser';
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'START_LISTENING' }).catch(() => {});
    }
  } else {
    toggleStateText.textContent = 'OFF';
    toggleStateText.className = 'toggle-state-text off';
    statusPill.className = 'status-pill warning';
    statusPillText.textContent = 'Voice Paused';
    micToggleBtn.classList.remove('active');
    statusEl.textContent = 'Voice listening is OFF';
    heardBox.style.display = 'none';
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'STOP_LISTENING' }).catch(() => {});
    }
  }
}

voicePowerToggle.addEventListener('change', () => {
  const isEnabled = voicePowerToggle.checked;
  chrome.storage.local.set({ voiceEnabled: isEnabled });
  applyVoiceState(isEnabled);
});

// --- Mic permission check & initial state ---
async function checkMicStatus() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const { micGranted, lastStatus, voiceEnabled } = await chrome.storage.local.get(['micGranted', 'lastStatus', 'voiceEnabled']);

    if (!micGranted) {
      statusPill.className = 'status-pill warning';
      statusPillText.textContent = 'Mic Inactive';
      micAlert.style.display = 'block';
      statusEl.textContent = 'Microphone permission required';
      micToggleBtn.classList.remove('active');
      // Also reflect as OFF in toggle when mic not granted
      voicePowerToggle.checked = false;
      toggleStateText.textContent = 'OFF';
      toggleStateText.className = 'toggle-state-text off';
      return;
    }

    micAlert.style.display = 'none';

    // voiceEnabled defaults to true if never set before
    const enabled = (voiceEnabled === undefined || voiceEnabled === true);
    applyVoiceState(enabled);
    if (enabled && lastStatus) {
      statusEl.textContent = lastStatus;
    }
  }
}

if (grantMicBtn) {
  grantMicBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('setup.html', '_blank');
    }
  });
}

// Listen for status updates from background
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'STATUS_UPDATE' && msg.status) {
      statusEl.textContent = msg.status;
    }
    if (msg.type === 'VOICE_COMMAND' && msg.spoken) {
      heardBox.style.display = 'block';
      heardBox.textContent = `Command: "${msg.spoken}" ➔ ${msg.action}`;
    }
  });
}

micToggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['micGranted', 'voiceEnabled'], (data) => {
    if (!data.micGranted) {
      window.open('setup.html', '_blank');
    } else if (data.voiceEnabled !== false) {
      statusEl.textContent = 'Speak now: "Open YouTube"';
      chrome.runtime.sendMessage({ type: 'START_LISTENING' });
    }
  });
});

checkMicStatus();

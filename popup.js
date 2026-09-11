const micToggleBtn = document.getElementById('micToggleBtn');
const statusEl = document.getElementById('status');
const heardBox = document.getElementById('heardBox');
const statusPill = document.getElementById('statusPill');
const statusPillText = document.getElementById('statusPillText');
const micAlert = document.getElementById('micAlert');
const grantMicBtn = document.getElementById('grantMicBtn');

let isPopupListening = false;
let popupRecognition = null;

async function checkMicStatus() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const { micGranted, lastStatus } = await chrome.storage.local.get(['micGranted', 'lastStatus']);
    if (!micGranted) {
      statusPill.className = 'status-pill warning';
      statusPillText.textContent = 'Mic Inactive';
      micAlert.style.display = 'block';
      statusEl.textContent = 'Microphone permission required';
      micToggleBtn.classList.remove('active');
    } else {
      statusPill.className = 'status-pill';
      statusPillText.textContent = 'Hands-Free Active';
      micAlert.style.display = 'none';
      micToggleBtn.classList.add('active');
      statusEl.textContent = lastStatus || 'Listening hands-free in browser';
      
      // Ensure background listener is running
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'START_LISTENING' });
      }
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
  // Clicking the mic in popup can manually trigger quick recognition or open setup
  chrome.storage.local.get(['micGranted'], (data) => {
    if (!data.micGranted) {
      window.open('setup.html', '_blank');
    } else {
      statusEl.textContent = 'Speak now: "Open YouTube"';
      micToggleBtn.classList.toggle('active');
      chrome.runtime.sendMessage({ type: 'START_LISTENING' });
    }
  });
});

checkMicStatus();

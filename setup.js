const grantBtn = document.getElementById('grantBtn');
const statusEl = document.getElementById('status');

grantBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Requesting access...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ micGranted: true });
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'START_LISTENING' });
    }
    statusEl.innerHTML = '<b style="color:#4ade80;">Microphone enabled!</b> You can now close this tab and use the extension popup.';
    grantBtn.textContent = 'Enabled';
    grantBtn.disabled = true;
    grantBtn.style.background = '#16a34a';
  } catch (err) {
    statusEl.innerHTML = '<span style="color:#f87171;">Permission denied: ' + err.name + ' - ' + err.message + '</span><br>Please click the camera/mic icon in the browser address bar to Allow.';
  }
});

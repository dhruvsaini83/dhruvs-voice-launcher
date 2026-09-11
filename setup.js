const grantBtn = document.getElementById('grantBtn');
const statusEl = document.getElementById('status');

async function checkExistingPermission() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const { micGranted } = await chrome.storage.local.get(['micGranted']);
    if (micGranted) {
      statusEl.innerHTML = '<b style="color:#4ade80;">🟢 Microphone is already enabled!</b><br><span style="color:#94a3b8;font-size:13px;">Hands-Free Voice Launcher is active in the background. You can close this tab and say "Open YouTube" anytime!</span>';
      grantBtn.textContent = 'Active & Listening';
      grantBtn.disabled = true;
      grantBtn.style.background = '#16a34a';
      return;
    }
  }
}

grantBtn.addEventListener('click', async () => {
  statusEl.innerHTML = '<span style="color:#60a5fa;">Requesting microphone access... Please click "Allow" on the browser prompt.</span>';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks from this temporary setup probe
    stream.getTracks().forEach(t => t.stop());

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ micGranted: true });
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'START_LISTENING' });
    }

    statusEl.innerHTML = '<b style="color:#4ade80;font-size:16px;">🎉 Microphone Access Granted!</b><br><span style="color:#cbd5e1;font-size:13.5px;">Hands-Free Voice is now running in the background. You can close this tab now and speak commands like <b>"Open YouTube"</b> directly!</span>';
    grantBtn.textContent = 'Ready & Active ✓';
    grantBtn.disabled = true;
    grantBtn.style.background = '#16a34a';
  } catch (err) {
    console.error("Mic grant error:", err);
    statusEl.innerHTML = '<span style="color:#f87171;"><b>Permission Denied:</b> ' + err.name + ' - ' + err.message + '</span><br><span style="color:#94a3b8;font-size:12.5px;">Please click the camera/mic icon in the browser address bar, select "Always allow", and reload.</span>';
  }
});

checkExistingPermission();

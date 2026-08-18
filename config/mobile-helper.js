// Mobile Helper for noVNC - Instant Phone Keyboard, Audio Streamer & Touch Controls
(function() {
  let audioElement = null;
  let isAudioPlaying = false;

  function initMobileHelper() {
    if (document.getElementById('mobile-quick-toolbar')) return;

    // Create toolbar container
    const bar = document.createElement('div');
    bar.id = 'mobile-quick-toolbar';
    bar.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      display: flex;
      gap: 6px;
      background: rgba(24, 24, 37, 0.90);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 6px 10px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // 1. Audio Toggle Button
    const audioBtn = document.createElement('button');
    audioBtn.id = 'mobile-audio-toggle';
    audioBtn.innerHTML = '🔊 Audio';
    audioBtn.style.cssText = `
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      touch-action: manipulation;
    `;

    // 2. Keyboard Toggle Button
    const kbBtn = document.createElement('button');
    kbBtn.innerHTML = '⌨️ Keyboard';
    kbBtn.style.cssText = `
      background: #89b4fa;
      color: #11111b;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      touch-action: manipulation;
    `;

    // 3. Send Text / Paste Prompt Button
    const pasteBtn = document.createElement('button');
    pasteBtn.innerHTML = '💬 Paste';
    pasteBtn.style.cssText = `
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      padding: 8px 11px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
    `;

    // 4. Zoom / Fit Toggle Button
    const fitBtn = document.createElement('button');
    fitBtn.innerHTML = '🔍 Fit Screen';
    fitBtn.style.cssText = `
      background: #a6e3a1;
      color: #11111b;
      border: 1px solid #a6e3a1;
      padding: 8px 11px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      touch-action: manipulation;
    `;

    // Audio Play/Pause Handler
    audioBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.preload = 'none';
      }

      if (!isAudioPlaying) {
        audioElement.src = '/audio.mp3?t=' + Date.now();
        audioElement.play().then(() => {
          isAudioPlaying = true;
          audioBtn.style.background = '#a6e3a1';
          audioBtn.style.color = '#11111b';
          audioBtn.innerHTML = '🔊 Audio: ON';
        }).catch(err => {
          console.error("Audio autoplay error:", err);
          alert("Please tap again to allow audio playback.");
        });
      } else {
        audioElement.pause();
        audioElement.src = '';
        isAudioPlaying = false;
        audioBtn.style.background = '#313244';
        audioBtn.style.color = '#cdd6f4';
        audioBtn.innerHTML = '🔇 Audio: OFF';
      }
    });

    // Create a real text input element for triggering mobile native keyboard
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'text';
    hiddenInput.autocapitalize = 'none';
    hiddenInput.autocomplete = 'off';
    hiddenInput.autocorrect = 'off';
    hiddenInput.spellcheck = false;
    hiddenInput.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      width: calc(100% - 20px);
      max-width: 400px;
      background: #1e1e2e;
      color: #cdd6f4;
      border: 2px solid #89b4fa;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      display: none;
      z-index: 1000000;
    `;

    // Add hidden input submit behavior
    hiddenInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const text = hiddenInput.value;
        if (text && window.rfb) {
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            window.rfb.sendKey(charCode, null, true);
            window.rfb.sendKey(charCode, null, false);
          }
          window.rfb.sendKey(0xff0d, null, true); // Enter
          window.rfb.sendKey(0xff0d, null, false);
        }
        hiddenInput.value = '';
        hiddenInput.style.display = 'none';
      }
    });

    // Event: Tap Keyboard Button
    kbBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const novncKb = document.getElementById('noVNC_keyboard_button');
      if (novncKb) {
        novncKb.click();
      }
      const novncInput = document.getElementById('noVNC_keyboardinput');
      if (novncInput) {
        novncInput.focus();
      } else {
        hiddenInput.style.display = hiddenInput.style.display === 'none' ? 'block' : 'none';
        if (hiddenInput.style.display === 'block') {
          hiddenInput.focus();
        }
      }
    });

    // Event: Tap Type/Paste Button
    pasteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const input = prompt('Enter or paste text to send to your PC:');
      if (input && window.rfb) {
        for (let i = 0; i < input.length; i++) {
          const code = input.charCodeAt(i);
          window.rfb.sendKey(code, null, true);
          window.rfb.sendKey(code, null, false);
        }
      }
    });

    // Event: Fit screen toggle (Smooth scaling without oversized elements)
    fitBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.rfb) {
        window.rfb.scaleViewport = !window.rfb.scaleViewport;
        fitBtn.style.background = window.rfb.scaleViewport ? '#a6e3a1' : '#313244';
        fitBtn.style.color = window.rfb.scaleViewport ? '#11111b' : '#cdd6f4';
        fitBtn.innerHTML = window.rfb.scaleViewport ? '🔍 Fit: ON' : '🔍 Fit: OFF';
      }
    });

    bar.appendChild(audioBtn);
    bar.appendChild(kbBtn);
    bar.appendChild(pasteBtn);
    bar.appendChild(fitBtn);
    document.body.appendChild(bar);
    document.body.appendChild(hiddenInput);

    // Expose rfb globally when UI initializes and prevent server-side downscaling
    const checkRFB = setInterval(function() {
      if (window.UI && window.UI.rfb) {
        window.rfb = window.UI.rfb;
        window.rfb.scaleViewport = true;
        window.rfb.resizeSession = false; // Never shrink server resolution to phone CSS pixels
        clearInterval(checkRFB);
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileHelper);
  } else {
    initMobileHelper();
  }
})();

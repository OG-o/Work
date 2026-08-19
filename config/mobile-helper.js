// Mobile Helper for noVNC - Draggable Floating Toolbar, Instant Keyboard & Audio
(function() {
  let audioElement = null;
  let isAudioPlaying = false;

  // Dynamic Auto-Resize to exact phone/screen dimensions
  function autoResizeToScreen() {
    if (!window.rfb) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(window.innerWidth * dpr);
    let h = Math.round(window.innerHeight * dpr);

    w = w % 2 === 0 ? w : w - 1;
    h = h % 2 === 0 ? h : h - 1;
    w = Math.max(w, 640);
    h = Math.max(h, 640);

    try {
      if (window.rfb._sock && window.rfb._sock.rQwait) {
        window.rfb.requestDesktopSize(w, h);
      }
    } catch (e) {
      console.warn("Dynamic resize request failed:", e);
    }
  }

  function initMobileHelper() {
    if (document.getElementById('mobile-quick-toolbar')) return;

    // Create draggable floating toolbar container
    const bar = document.createElement('div');
    bar.id = 'mobile-quick-toolbar';
    bar.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(24, 24, 37, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 6px 10px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.20);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: grab;
      transition: box-shadow 0.2s, transform 0.1s;
    `;

    // Restore saved position from localStorage
    try {
      const savedX = localStorage.getItem('cloudpc_toolbar_x');
      const savedY = localStorage.getItem('cloudpc_toolbar_y');
      if (savedX !== null && savedY !== null) {
        bar.style.left = `${Math.min(Math.max(10, parseInt(savedX, 10)), window.innerWidth - 200)}px`;
        bar.style.top = `${Math.min(Math.max(10, parseInt(savedY, 10)), window.innerHeight - 60)}px`;
        bar.style.right = 'auto';
      }
    } catch (e) {}

    // 0. Drag Grip Handle Indicator
    const grip = document.createElement('div');
    grip.id = 'mobile-toolbar-grip';
    grip.innerHTML = '⋮⋮';
    grip.title = 'Drag me anywhere';
    grip.style.cssText = `
      color: #a6adc8;
      font-size: 16px;
      font-weight: bold;
      padding: 0 4px;
      cursor: grab;
      letter-spacing: -2px;
      touch-action: none;
    `;

    // 1. Dynamic Mode Toggle Button (Mobile vs Desktop)
    const modeBtn = document.createElement('button');
    modeBtn.id = 'mobile-mode-toggle';
    modeBtn.innerHTML = '📱 Auto-Fit';
    modeBtn.style.cssText = `
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

    // 2. Audio Toggle Button
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

    // 3. Keyboard Toggle Button
    const kbBtn = document.createElement('button');
    kbBtn.innerHTML = '⌨️ KB';
    kbBtn.style.cssText = `
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

    // 4. Send Text / Paste Prompt Button
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

    // ==========================================
    // 🖐️ DRAG & DROP ENGINE (Touch + Mouse)
    // ==========================================
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let barStartX = 0;
    let barStartY = 0;
    let hasMoved = false;

    function onPointerDown(clientX, clientY) {
      isDragging = true;
      hasMoved = false;
      dragStartX = clientX;
      dragStartY = clientY;

      const rect = bar.getBoundingClientRect();
      barStartX = rect.left;
      barStartY = rect.top;

      bar.style.cursor = 'grabbing';
      bar.style.transform = 'scale(1.03)';
      bar.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.8)';
    }

    function onPointerMove(clientX, clientY) {
      if (!isDragging) return;

      const deltaX = clientX - dragStartX;
      const deltaY = clientY - dragStartY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMoved = true;
      }

      let newX = barStartX + deltaX;
      let newY = barStartY + deltaY;

      // Clamp within screen boundaries
      const maxX = window.innerWidth - bar.offsetWidth - 6;
      const maxY = window.innerHeight - bar.offsetHeight - 6;
      newX = Math.max(6, Math.min(newX, maxX));
      newY = Math.max(6, Math.min(newY, maxY));

      bar.style.left = `${newX}px`;
      bar.style.top = `${newY}px`;
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      bar.style.cursor = 'grab';
      bar.style.transform = 'scale(1.0)';
      bar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';

      if (hasMoved) {
        try {
          const rect = bar.getBoundingClientRect();
          localStorage.setItem('cloudpc_toolbar_x', Math.round(rect.left));
          localStorage.setItem('cloudpc_toolbar_y', Math.round(rect.top));
        } catch (e) {}
      }
    }

    // Touch events for mobile phones
    bar.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        onPointerDown(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        onPointerMove(touch.clientX, touch.clientY);
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', onPointerUp, { passive: true });
    window.addEventListener('touchcancel', onPointerUp, { passive: true });

    // Mouse events for desktop/laptop
    bar.addEventListener('mousedown', function(e) {
      if (e.target.tagName !== 'BUTTON') {
        onPointerDown(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', function(e) {
      if (isDragging) {
        onPointerMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', onPointerUp);

    // Click handler helper (ignores click if user was dragging)
    function safeClick(handler) {
      return function(e) {
        if (hasMoved) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        handler(e);
      };
    }

    // Auto-Fit / Mode Switcher
    modeBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      autoResizeToScreen();
      modeBtn.style.background = '#a6e3a1';
      setTimeout(() => { modeBtn.style.background = '#89b4fa'; }, 500);
    }));

    // Audio Play/Pause Handler
    audioBtn.addEventListener('click', safeClick(function(e) {
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
    }));

    // Hidden input for mobile keyboard
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

    hiddenInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const text = hiddenInput.value;
        if (text && window.rfb) {
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            window.rfb.sendKey(charCode, null, true);
            window.rfb.sendKey(charCode, null, false);
          }
          window.rfb.sendKey(0xff0d, null, true);
          window.rfb.sendKey(0xff0d, null, false);
        }
        hiddenInput.value = '';
        hiddenInput.style.display = 'none';
      }
    });

    // Keyboard trigger
    kbBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      const novncKb = document.getElementById('noVNC_keyboard_button');
      if (novncKb) novncKb.click();
      const novncInput = document.getElementById('noVNC_keyboardinput');
      if (novncInput) {
        novncInput.focus();
      } else {
        hiddenInput.style.display = hiddenInput.style.display === 'none' ? 'block' : 'none';
        if (hiddenInput.style.display === 'block') hiddenInput.focus();
      }
    }));

    // Paste prompt
    pasteBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      const input = prompt('Enter or paste text to send to your PC:');
      if (input && window.rfb) {
        for (let i = 0; i < input.length; i++) {
          const code = input.charCodeAt(i);
          window.rfb.sendKey(code, null, true);
          window.rfb.sendKey(code, null, false);
        }
      }
    }));

    bar.appendChild(grip);
    bar.appendChild(modeBtn);
    bar.appendChild(audioBtn);
    bar.appendChild(kbBtn);
    bar.appendChild(pasteBtn);
    document.body.appendChild(bar);
    document.body.appendChild(hiddenInput);

    // Auto-resizing setup
    const checkRFB = setInterval(function() {
      if (window.UI && window.UI.rfb) {
        window.rfb = window.UI.rfb;
        window.rfb.scaleViewport = true;
        window.rfb.resizeSession = true;

        setTimeout(autoResizeToScreen, 1000);
        window.addEventListener('resize', () => {
          setTimeout(autoResizeToScreen, 300);
        });

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

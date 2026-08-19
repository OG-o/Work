// Mobile Helper for noVNC - Draggable Floating Toolbar, Resolution Switcher, App Launcher, Task Switcher, Keyboard & Audio
(function() {
  let audioElement = null;
  let isAudioPlaying = false;
  let isKeyboardDisabled = false;

  try {
    isKeyboardDisabled = localStorage.getItem('cloudpc_keyboard_disabled') === 'true';
  } catch (e) {}

  // High-Density Retina Auto-Resizer
  function autoResizeToScreen() {
    if (!window.rfb) return;

    // Use higher DPR multiplier (2.5x - 3.0x) for ultra-sharp mobile rendering
    const dpr = Math.max(window.devicePixelRatio || 1, 2.5);
    let w = Math.round(window.innerWidth * dpr);
    let h = Math.round(window.innerHeight * dpr);

    w = w % 2 === 0 ? w : w - 1;
    h = h % 2 === 0 ? h : h - 1;
    w = Math.max(w, 1080);
    h = Math.max(h, 1080);

    try {
      if (window.rfb._sock && window.rfb._sock.rQwait) {
        window.rfb.requestDesktopSize(w, h);
      }
    } catch (e) {
      console.warn("Dynamic resize request failed:", e);
    }
  }

  // ==========================================
  // 📺 RESOLUTION SWITCHER MODAL
  // ==========================================
  function showResolutionModal() {
    let modal = document.getElementById('cloudpc-res-modal');
    if (modal) {
      modal.remove();
      return;
    }

    modal = document.createElement('div');
    modal.id = 'cloudpc-res-modal';
    modal.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 24px);
      max-width: 440px;
      background: rgba(24, 24, 37, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 18px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      z-index: 1000003;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #cdd6f4;
      animation: slideUp 0.2s ease-out;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    header.innerHTML = `
      <div style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
        <span>📺 Display Resolution Selector</span>
      </div>
      <button id="close-res-modal-btn" style="background: none; border: none; color: #a6adc8; font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
    `;
    modal.appendChild(header);

    const resolutions = [
      { name: '1080p Full HD', res: '1920x1080', icon: '🌟', badge: 'Crisp Landscape' },
      { name: '2K Quad HD', res: '2560x1440', icon: '🚀', badge: 'Ultra Sharp' },
      { name: 'Mobile FHD+', res: '1080x2400', icon: '📱', badge: 'Modern Phone' },
      { name: 'Mobile FHD', res: '1080x1920', icon: '📱', badge: 'Standard Phone' },
      { name: '720p HD', res: '1280x720', icon: '⚡', badge: 'Balanced' }
    ];

    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    resolutions.forEach(r => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(49, 50, 68, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.15s;
      `;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${r.icon}</span>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #cdd6f4;">${r.name}</div>
            <div style="font-size: 11px; color: #a6adc8;">${r.res}</div>
          </div>
        </div>
        <span style="background: rgba(137, 180, 250, 0.2); color: #89b4fa; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700;">${r.badge}</span>
      `;

      item.addEventListener('click', () => {
        item.style.background = '#89b4fa';
        fetch('/api/resolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution: r.res })
        }).then(() => {
          if (window.rfb) {
            const parts = r.res.split('x');
            try {
              window.rfb.requestDesktopSize(parseInt(parts[0]), parseInt(parts[1]));
            } catch (e) {}
          }
          modal.remove();
        });
      });

      list.appendChild(item);
    });

    modal.appendChild(list);
    document.body.appendChild(modal);

    modal.querySelector('#close-res-modal-btn').addEventListener('click', () => modal.remove());
  }

  // ==========================================
  // 🚀 MOBILE QUICK APP LAUNCHER DRAWER
  // ==========================================
  function showAppDrawerModal() {
    let modal = document.getElementById('cloudpc-app-drawer-modal');
    if (modal) {
      modal.remove();
      return;
    }

    modal = document.createElement('div');
    modal.id = 'cloudpc-app-drawer-modal';
    modal.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 24px);
      max-width: 480px;
      max-height: 80vh;
      background: rgba(24, 24, 37, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 18px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      z-index: 1000002;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #cdd6f4;
      animation: slideUp 0.2s ease-out;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    header.innerHTML = `
      <div style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
        <span>🚀 1-Tap App Launcher</span>
      </div>
      <button id="close-app-drawer-btn" style="background: none; border: none; color: #a6adc8; font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
    `;
    modal.appendChild(header);

    const apps = [
      { key: 'chrome', name: 'Google Chrome', icon: '🌐', desc: 'Fast Web Browser' },
      { key: 'cursor', name: 'Cursor AI', icon: '🤖', desc: 'AI Code Editor' },
      { key: 'code', name: 'VS Code', icon: '📝', desc: 'Desktop Code Studio' },
      { key: 'terminal', name: 'Terminal', icon: '📟', desc: 'Ubuntu Root Shell' },
      { key: 'thunar', name: 'Files', icon: '📂', desc: 'File Manager & Archives' },
      { key: 'gimp', name: 'GIMP Studio', icon: '🎨', desc: 'Image & Photo Editor' },
      { key: 'mpv', name: 'MPV Player', icon: '🎬', desc: 'Video & Music Player' },
      { key: 'abiword', name: 'Word Docs', icon: '📄', desc: 'Document Editor' },
      { key: 'gnumeric', name: 'Excel Sheets', icon: '📊', desc: 'Spreadsheet Calc' },
      { key: 'synaptic', name: 'App Store', icon: '📦', desc: 'Software Manager' },
      { key: 'calculator', name: 'Calculator', icon: '🧮', desc: 'Scientific Calc' },
      { key: 'baobab', name: 'Disk Usage', icon: '💾', desc: 'Storage Analyzer' },
      { key: 'settings', name: 'Settings', icon: '⚙️', desc: 'Control Center' },
      { key: 'bluestacks', name: 'BlueStacks', icon: '🎮', desc: 'Android Player' }
    ];

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      overflow-y: auto;
      max-height: 55vh;
      padding: 4px 0;
    `;

    apps.forEach(app => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(49, 50, 68, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: transform 0.1s, background 0.15s;
        touch-action: manipulation;
      `;

      card.innerHTML = `
        <div style="font-size: 26px;">${app.icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 700; color: #cdd6f4;">${app.name}</div>
          <div style="font-size: 11px; color: #a6adc8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${app.desc}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        card.style.background = '#89b4fa';
        fetch('/api/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: app.key })
        }).then(() => {
          setTimeout(() => modal.remove(), 250);
        });
      });

      grid.appendChild(card);
    });

    modal.appendChild(grid);
    document.body.appendChild(modal);

    modal.querySelector('#close-app-drawer-btn').addEventListener('click', () => modal.remove());
  }

  // ==========================================
  // 🗂️ MOBILE TASK SWITCHER & WINDOW MANAGER
  // ==========================================
  function showWindowManagerModal() {
    let modal = document.getElementById('cloudpc-window-modal');
    if (modal) {
      modal.remove();
      return;
    }

    modal = document.createElement('div');
    modal.id = 'cloudpc-window-modal';
    modal.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 24px);
      max-width: 480px;
      max-height: 75vh;
      background: rgba(24, 24, 37, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 18px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      z-index: 1000001;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #cdd6f4;
      animation: slideUp 0.2s ease-out;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    header.innerHTML = `
      <div style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
        <span>🗂️ Active Windows & Recent Tabs</span>
      </div>
      <button id="close-modal-btn" style="background: none; border: none; color: #a6adc8; font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
    `;
    modal.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.style.cssText = `
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 50vh;
      padding: 4px 0;
    `;
    listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #a6adc8;">Loading active windows...</div>';
    modal.appendChild(listContainer);

    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const centerAllBtn = document.createElement('button');
    centerAllBtn.innerHTML = '🎯 Center All Windows on Screen';
    centerAllBtn.style.cssText = `
      flex: 1;
      background: #89b4fa;
      color: #11111b;
      border: none;
      padding: 10px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    `;
    footer.appendChild(centerAllBtn);
    modal.appendChild(footer);

    document.body.appendChild(modal);

    modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.remove());

    function loadWindows() {
      fetch('/api/windows')
        .then(r => r.json())
        .then(data => {
          listContainer.innerHTML = '';
          if (!data.windows || data.windows.length === 0) {
            listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #a6adc8;">No application windows open.<br><small style="color: #6c7086;">Tap 🚀 Apps to launch Chrome, Cursor, or Terminal.</small></div>';
            return;
          }

          data.windows.forEach(win => {
            const item = document.createElement('div');
            item.style.cssText = `
              background: rgba(49, 50, 68, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 14px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              transition: background 0.15s;
            `;

            let icon = '💻';
            if (win.app.includes('Chrome')) icon = '🌐';
            else if (win.app.includes('Cursor')) icon = '🤖';
            else if (win.app.includes('Code')) icon = '📝';
            else if (win.app.includes('Terminal')) icon = '📟';
            else if (win.app.includes('File')) icon = '📂';
            else if (win.app.includes('GIMP')) icon = '🎨';
            else if (win.app.includes('MPV')) icon = '🎬';
            else if (win.app.includes('Word')) icon = '📄';
            else if (win.app.includes('Excel')) icon = '📊';
            else if (win.app.includes('Calculator')) icon = '🧮';
            else if (win.app.includes('BlueStacks')) icon = '🎮';

            item.innerHTML = `
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 700; color: #89b4fa; display: flex; align-items: center; gap: 5px;">
                  <span>${icon}</span> <span>${win.app}</span>
                </div>
                <div style="font-size: 12px; color: #a6adc8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                  ${win.title || win.app}
                </div>
              </div>
              <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                <button class="win-action-btn" data-action="center" data-id="${win.id}" style="background: #a6e3a1; color: #11111b; border: none; padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer;">🎯 Center</button>
                <button class="win-action-btn" data-action="maximize" data-id="${win.id}" style="background: #fab387; color: #11111b; border: none; padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer;">📐 Max</button>
                <button class="win-action-btn" data-action="close" data-id="${win.id}" style="background: #f38ba8; color: #11111b; border: none; padding: 6px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer;">✕</button>
              </div>
            `;

            item.addEventListener('click', () => {
              fetch('/api/windows/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: win.id, action: 'center' })
              }).then(() => modal.remove());
            });

            item.querySelectorAll('.win-action-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                fetch('/api/windows/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id, action })
                }).then(() => {
                  if (action === 'close') {
                    item.remove();
                  } else {
                    modal.remove();
                  }
                });
              });
            });

            listContainer.appendChild(item);
          });
        })
        .catch(err => {
          listContainer.innerHTML = `<div style="color: #f38ba8; text-align: center; padding: 15px;">Failed to load windows: ${err}</div>`;
        });
    }

    loadWindows();

    centerAllBtn.addEventListener('click', () => {
      fetch('/api/windows')
        .then(r => r.json())
        .then(data => {
          if (data.windows) {
            data.windows.forEach(w => {
              fetch('/api/windows/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: w.id, action: 'center' })
              });
            });
          }
          modal.remove();
        });
    });
  }

  function initMobileHelper() {
    if (document.getElementById('mobile-quick-toolbar')) return;

    const bar = document.createElement('div');
    bar.id = 'mobile-quick-toolbar';
    bar.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(24, 24, 37, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 6px 8px;
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

    // 1. 1-Tap App Launcher Button
    const appsBtn = document.createElement('button');
    appsBtn.id = 'mobile-apps-btn';
    appsBtn.innerHTML = '🚀 Apps';
    appsBtn.title = '1-Tap App Launcher';
    appsBtn.style.cssText = `
      background: #fab387;
      color: #11111b;
      border: none;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 2. Task Switcher / Recent Windows Button
    const winBtn = document.createElement('button');
    winBtn.id = 'mobile-windows-btn';
    winBtn.innerHTML = '🗂️ Tabs';
    winBtn.title = 'View open apps & recent tabs';
    winBtn.style.cssText = `
      background: #cba6f7;
      color: #11111b;
      border: none;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 3. Resolution Selector Button
    const resBtn = document.createElement('button');
    resBtn.id = 'mobile-res-btn';
    resBtn.innerHTML = '📺 Res';
    resBtn.title = 'Switch display resolution (1080p, 2K, Mobile)';
    resBtn.style.cssText = `
      background: #a6e3a1;
      color: #11111b;
      border: none;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 4. Dynamic Mode Toggle Button (Mobile vs Desktop)
    const modeBtn = document.createElement('button');
    modeBtn.id = 'mobile-mode-toggle';
    modeBtn.innerHTML = '📱 Fit';
    modeBtn.title = 'Auto-fit screen resolution';
    modeBtn.style.cssText = `
      background: #89b4fa;
      color: #11111b;
      border: none;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 5. Audio Toggle Button
    const audioBtn = document.createElement('button');
    audioBtn.id = 'mobile-audio-toggle';
    audioBtn.innerHTML = '🔊 Sound';
    audioBtn.style.cssText = `
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 6. Keyboard Summon Button (Type)
    const kbBtn = document.createElement('button');
    kbBtn.id = 'mobile-keyboard-btn';
    kbBtn.innerHTML = '⌨️ Type';
    kbBtn.title = 'Open phone keyboard';
    kbBtn.style.cssText = `
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      touch-action: manipulation;
    `;

    // 7. Permanent Keyboard Disable / Enable Lock Button
    const kbLockBtn = document.createElement('button');
    kbLockBtn.id = 'mobile-kblock-btn';
    kbLockBtn.title = 'Permanently disable or enable keyboard';
    
    function updateKbLockUI() {
      if (isKeyboardDisabled) {
        kbLockBtn.innerHTML = '🚫 KB: OFF';
        kbLockBtn.style.background = '#f38ba8';
        kbLockBtn.style.color = '#11111b';
        kbLockBtn.style.border = '1px solid #f38ba8';
        kbBtn.style.opacity = '0.4';
        kbBtn.style.pointerEvents = 'none';
      } else {
        kbLockBtn.innerHTML = '✅ KB: ON';
        kbLockBtn.style.background = '#313244';
        kbLockBtn.style.color = '#a6e3a1';
        kbLockBtn.style.border = '1px solid #a6e3a1';
        kbBtn.style.opacity = '1.0';
        kbBtn.style.pointerEvents = 'auto';
      }
    }
    
    kbLockBtn.style.cssText = `
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      touch-action: manipulation;
    `;
    updateKbLockUI();

    // 8. Send Text / Paste Prompt Button
    const pasteBtn = document.createElement('button');
    pasteBtn.innerHTML = '💬 Paste';
    pasteBtn.style.cssText = `
      background: #313244;
      color: #cdd6f4;
      border: 1px solid #45475a;
      padding: 7px 9px;
      border-radius: 20px;
      font-size: 12px;
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

    bar.addEventListener('mousedown', function(e) {
      if (e.target.tagName !== 'BUTTON') {
        onPointerDown(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', function(e) {
      if (isDragging) onPointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', onPointerUp);

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

    // App Drawer Button
    appsBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      showAppDrawerModal();
    }));

    // Windows / Tabs Modal Switcher
    winBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      showWindowManagerModal();
    }));

    // Resolution Switcher Button
    resBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      showResolutionModal();
    }));

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
          audioBtn.innerHTML = '🔊 ON';
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
        audioBtn.innerHTML = '🔇 OFF';
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

    kbBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      if (isKeyboardDisabled) return;

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

    kbLockBtn.addEventListener('click', safeClick(function(e) {
      e.stopPropagation();
      isKeyboardDisabled = !isKeyboardDisabled;
      try {
        localStorage.setItem('cloudpc_keyboard_disabled', isKeyboardDisabled ? 'true' : 'false');
      } catch (err) {}

      if (isKeyboardDisabled) {
        hiddenInput.style.display = 'none';
        hiddenInput.blur();
        const novncInput = document.getElementById('noVNC_keyboardinput');
        if (novncInput) novncInput.blur();
      }
      updateKbLockUI();
    }));

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
    bar.appendChild(appsBtn);
    bar.appendChild(winBtn);
    bar.appendChild(resBtn);
    bar.appendChild(modeBtn);
    bar.appendChild(audioBtn);
    bar.appendChild(kbBtn);
    bar.appendChild(kbLockBtn);
    bar.appendChild(pasteBtn);
    document.body.appendChild(bar);
    document.body.appendChild(hiddenInput);

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

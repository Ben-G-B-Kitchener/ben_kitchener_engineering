/* ZX Spectrum Elite player: JSSpeccy runtime is installed by install_player.py */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const start = $('elite-start'), open = $('elite-open'), fullscreen = $('elite-fullscreen');
  const placeholder = $('elite-placeholder'), display = $('elite-emulator'), status = $('elite-status');
  let emu = null, busy = false;
  const tell = message => { status.textContent = message; };
  const fail = error => { busy = false; start.disabled = false; placeholder.hidden = false; tell('Emulator error: ' + (error.message || error)); };
  const startGame = () => {
    if (busy || emu) return;
    busy = true; start.disabled = true;
    tell('Starting ZX Spectrum 48K…');
    const boot = () => {
      try {
        if (typeof JSSpeccy !== 'function') throw Error('JSSpeccy was not loaded. Run the included installer.');
        // A private test image can be loaded by a separate button after the emulator initialises.
        emu = JSSpeccy(display, { machine: 48, zoom: 2, autoStart: true, autoLoadTapes: true,
          uiEnabled: true, sandbox: false });
        placeholder.hidden = true;
        open.disabled = false; fullscreen.disabled = false;
        tell('Emulator ready. Press Open game file and select your Elite image.');
        if (typeof emu.onReady === 'function') emu.onReady(() => {
          tell('ZX Spectrum running. Open your Elite snapshot or tape file.');
          // Only attempt private copy if it was explicitly installed; otherwise harmless 404.
          fetch('games/elite-spectrum/private-game.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null)
            .then(info => { if (info && /^elite-private\.(sna|z80|szx|tap|tzx)$/i.test(info.file)) {
              emu.openUrl('games/elite-spectrum/' + info.file);
              tell('Loading Elite from your local test installation…');
            }}).catch(() => {});
        });
        busy = false;
      } catch (e) { fail(e); }
    };
    if (typeof window.JSSpeccy === 'function') return boot();
    const script = document.createElement('script');
    script.src = 'games/elite-spectrum/jsspeccy/jsspeccy.js';
    script.onload = boot;
    script.onerror = () => fail(Error('JSSpeccy files are missing. Run: python games/elite-spectrum/install_player.py'));
    document.head.appendChild(script);
  };
  start.addEventListener('click', startGame);
  open.addEventListener('click', () => { if (emu) emu.openFileDialog(); });
  fullscreen.addEventListener('click', () => { if (emu) emu.enterFullscreen(); });
})();

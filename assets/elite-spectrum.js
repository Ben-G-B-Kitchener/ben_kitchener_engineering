/* JSSpeccy 3 adapter for the site's separate Elite page. */
(() => {
  'use strict';
  const startButton = document.getElementById('elite-start');
  const openButton = document.getElementById('elite-open');
  const fullscreenButton = document.getElementById('elite-fullscreen');
  const status = document.getElementById('elite-status');
  const placeholder = document.getElementById('elite-placeholder');
  const emulatorNode = document.getElementById('elite-emulator');
  let emulator = null;
  let loading = false;
  function setStatus(message) { status.textContent = message; }

  startButton.addEventListener('click', () => {
    if (loading || emulator) return;
    loading = true;
    startButton.disabled = true;
    setStatus('Starting ZX Spectrum emulator…');
    const initialize = () => {
      if (typeof window.JSSpeccy !== 'function') throw new Error('JSSpeccy runtime was not found.');
      placeholder.hidden = true;
      emulator = window.JSSpeccy(emulatorNode, {
        machine: 48,
        zoom: 2,
        autoStart: true,
        autoLoadTapes: true,
        uiEnabled: false,
        sandbox: false
      });
      if (emulator && typeof emulator.onReady === 'function') {
        emulator.onReady(() => setStatus('Spectrum ready. Select Open game file to load your Elite image.'));
      } else {
        setStatus('Emulator launched. Select Open game file to load your Elite image.');
      }
      openButton.disabled = false;
      fullscreenButton.disabled = false;
      loading = false;
    };
    try {
      if (typeof window.JSSpeccy === 'function') {
        initialize();
        return;
      }
      const script = document.createElement('script');
      script.src = 'games/elite-spectrum/jsspeccy/jsspeccy.js';
      script.onload = () => {
        try { initialize(); }
        catch (err) { fail(err); }
      };
      script.onerror = () => fail(new Error('JSSpeccy release files are missing. Install them as described in games/elite-spectrum/README.md.'));
      document.head.appendChild(script);
    } catch (err) { fail(err); }
  });
  function fail(err) {
    loading = false;
    startButton.disabled = false;
    setStatus('Could not start: ' + (err && err.message ? err.message : String(err)));
    placeholder.hidden = false;
  }
  openButton.addEventListener('click', () => {
    if (!emulator) return;
    try { emulator.openFileDialog(); setStatus('Select your legally obtained Elite snapshot or tape image.'); }
    catch (err) { setStatus('File chooser error: ' + err.message); }
  });
  fullscreenButton.addEventListener('click', () => {
    if (!emulator) return;
    try { emulator.enterFullscreen(); }
    catch (err) { setStatus('Fullscreen error: ' + err.message); }
  });
})();

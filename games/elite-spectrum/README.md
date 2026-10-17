# ZX Spectrum Elite player — setup

The page `/elite-spectrum.html` and its CSS/JavaScript integration are included in this repository.

## Required emulator files

1. Download the official **JSSpeccy 3 release** from https://github.com/gasman/jsspeccy3/releases .
2. Copy **all contents** of the release archive's `jsspeccy/` directory into `games/elite-spectrum/jsspeccy/` (not an extra nested folder). In particular `games/elite-spectrum/jsspeccy/jsspeccy.js` must exist. Keep `.wasm`, `.js` and subfolders in their original relative arrangement.
3. Keep the upstream GPLv3 licence and attribution/source availability requirements for any redistributed emulator files. Consult https://github.com/gasman/jsspeccy3 for documentation.
4. Obtain your own lawful Spectrum Elite game file in a supported `.z80`, `.sna`, `.szx`, `.tap`, `.tzx` or `.zip` format. **Do not add a game image to this public GitHub repository without explicit redistribution permission.**
5. Push your files to GitHub Pages, open `elite-spectrum.html`, press **Start emulator**, then **Open game file** and select the local game file. No game file is uploaded to the website by these controls; it is opened in the browser.

## Notes

* The emulator files were not packaged here because the official release could not be downloaded in this environment. No game ROM or Elite binary is included.
* This site version deliberately uses the emulator file picker rather than embedding an unlicensed image or external third-party asset URL.
* Game state persistence is not yet implemented or verified. The site does not promise saved commander support.
* Use `python -m http.server 8000` from the repository root and visit `http://localhost:8000/elite-spectrum.html` for local tests. Opening HTML directly with `file://` may cause WebAssembly, worker or asset loading failures.
* The existing `index.html` title/meta section and other pages' title/meta sections have been left unchanged.

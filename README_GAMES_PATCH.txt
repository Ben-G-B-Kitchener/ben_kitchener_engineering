GAMES + DOOM WEBSITE PATCH (add / update only)

Extract the ZIP at the root of your live GitHub Pages repo, preserving folders.
Commit/push. Visit /games.html and then /doom/.

IMPORTANT: The already-working doom/engine/ directory is intentionally NOT included and must be retained untouched in the repository. DO NOT delete or overwrite it.

Existing pages: navigation only (Games between Articles and Contact). The existing <head> metadata is preserved exactly.
New games.html: two cards (DOOM and Galactic Trader, marked under development).
New doom/index.html: inherits site styling and has CRT screen filter + scanline overlay; hides the engine's #pad touchscreen keypad in its same-origin iframe. The engine itself and WebAssembly remain unchanged.

If the game doesn't display, ensure the already working doom/engine/index.html still exists in your GitHub repository. No local server required.

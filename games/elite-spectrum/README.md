# ZX Spectrum Elite player

The website page is `elite-spectrum.html`. It uses JSSpeccy 3, separate from Galactic Trader.

## Install emulator (one command)

From the repository root, with Python 3 installed:

```bash
python games/elite-spectrum/install_player.py
```

This fetches the latest official JSSpeccy 3 GitHub release and unpacks the required JavaScript, worker, ROM, and WASM files into `games/elite-spectrum/jsspeccy/` (retaining upstream structure). Download requires Internet access. The runtime is GPLv3; comply with its licence if you publish it. The emulator runtime can be committed and deployed after complying with the GPLv3 licensing and source-availability requirements.

## For private local gameplay test

```bash
python games/elite-spectrum/install_player.py --private-game
python -m http.server 8000
```

Open http://localhost:8000/elite-spectrum.html and press **Start emulator**. The private testing option fetches the emulatable Spectrum Elite distribution published in Ian Bell's personal archive and configures auto-loading. If that archive's format has changed, obtain a compatible `.sna`, `.z80`, `.szx`, `.tap`, or `.tzx` image yourself and select **Open game file**. The download location does **not** by itself grant public redistribution permission.

**Important:** Do not add `elite-private.*` or `private-game.json` to your public GitHub Pages branch. They are excluded by `.gitignore`. To ship an auto-playing public copy you need distribution permission for the game files, distinct from JSSpeccy's GPL licence. The public player still supports local file loading.

## Public deployment

If you have established the right to distribute the game file, make the game available as `games/elite-spectrum/elite-private.z80` (or another recognised extension) and add `games/elite-spectrum/private-game.json` containing `{"file":"elite-private.z80"}`. Allow these files in the build only after verifying permission. Add the emulator runtime files to the deployed site as well. HTML and existing metadata are unchanged.

## Limitations

A browser gameplay test was not possible in the packaging environment (outbound access to GitHub binary downloads was unavailable). Installer and JavaScript were checked syntactically, but startup, the game's load sequence, original controls and save behaviour must be tested in your local browser. JSSpeccy's sandbox, audio policy and file formats are documented at https://github.com/gasman/jsspeccy3 .

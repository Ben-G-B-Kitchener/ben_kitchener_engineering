# Elite 1985 / ZX Spectrum 48K

This site contains the game player and an installer, not the copyrighted Elite game file.

## One-time emulator setup (GitHub Pages)

After applying this patch and pushing to GitHub, open **Actions → Install ZX Spectrum emulator → Run workflow**. This manually triggered workflow downloads the official JSSpeccy 3 release, checks for its JavaScript and WebAssembly files, then commits only the emulator runtime into the repository. This requires Actions write permission in the repository settings. If this fails, inspect the Actions logs.

Alternatively install locally with `python games/elite-spectrum/install_player.py` and commit `games/elite-spectrum/jsspeccy/`.

## To play

Open `elite-spectrum.html`, click **Start emulator**, then **Open game file** and select a legally obtained Elite 48K `.z80`, `.sna`, `.tap`, `.tzx` or ZIP image stored on your computer. It is not uploaded to the website. For local preview run `python -m http.server 8000` from the website root.

Ian Bell's historical archive (https://www.elitehomepage.org/archive/) lists `a5100000.zip` as the 48K Spectrum Elite image, but its availability does not necessarily grant permission to redistribute it. Do not publish game binaries without the relevant permission.

## Licence

JSSpeccy 3 is GPL-3.0 and is distributed by its upstream author: https://github.com/gasman/jsspeccy3 . Keep its licence and notices in any local distribution. The original Elite game is separately copyrighted.

## Status

Player HTML and installer syntax are checked, but end-to-end browser gameplay has NOT been verified in this environment. GitHub Actions runtime installation is a new, untested route. This is deliberately not labelled as a complete playable build until successfully tested.

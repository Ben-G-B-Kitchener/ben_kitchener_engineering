#!/usr/bin/env python3
"""Install JSSpeccy 3 into the static website. Optional private Elite setup.
Usage: python games/elite-spectrum/install_player.py [--private-game]
Private game installs must not be pushed to a public repository without permission.
"""
from pathlib import Path
import argparse, io, json, shutil, urllib.request, zipfile
ROOT = Path(__file__).resolve().parents[2]
DEST = Path(__file__).resolve().parent
USER_AGENT = 'EliteSpectrumWebsiteInstaller/1.0'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()

def unpack_runtime(data):
    archive = zipfile.ZipFile(io.BytesIO(data))
    members = [p for p in archive.namelist() if p.rstrip('/').endswith('/jsspeccy.js') or p == 'jsspeccy.js']
    if not members:
        raise RuntimeError('Release archive has no jsspeccy/jsspeccy.js; release format may have changed')
    prefix = members[0][:-len('jsspeccy.js')]
    target = DEST / 'jsspeccy'
    target.mkdir(parents=True, exist_ok=True)
    written = 0
    for member in archive.infolist():
        name = member.filename
        if not name.startswith(prefix) or member.is_dir():
            continue
        rel = Path(name[len(prefix):])
        if not rel.parts or rel.is_absolute() or '..' in rel.parts:
            continue
        dest = target / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(archive.read(member))
        written += 1
    if not (target / 'jsspeccy.js').is_file() or not any(target.rglob('*.wasm')):
        raise RuntimeError('Incomplete JSSpeccy installation: JavaScript or WebAssembly runtime missing')
    print(f'Installed JSSpeccy: {written} files at {target}')

def install_emulator():
    releases = json.loads(fetch('https://api.github.com/repos/gasman/jsspeccy3/releases/latest'))
    assets = releases.get('assets', [])
    choices = [a for a in assets if a['name'].lower().endswith('.zip')]
    if not choices:
        raise RuntimeError('JSSpeccy release ZIP not found. Check https://github.com/gasman/jsspeccy3/releases')
    asset = next((a for a in choices if 'jsspeccy' in a['name'].lower()), choices[0])
    print(f'Downloading JSSpeccy {releases.get("tag_name", "latest")}: {asset["name"]}')
    unpack_runtime(fetch(asset['browser_download_url']))

def install_private_game():
    url = 'https://www.elitehomepage.org/archive/a5100000.zip'
    print('Downloading from Ian Bell\'s Elite archive for PRIVATE LOCAL TESTING: ' + url)
    game_zip = zipfile.ZipFile(io.BytesIO(fetch(url)))
    allowed = ('.sna', '.z80', '.szx', '.tap', '.tzx')
    members = [i for i in game_zip.infolist() if not i.is_dir() and i.filename.lower().endswith(allowed)]
    if not members:
        print('Archive contents:', game_zip.namelist())
        raise RuntimeError('No supported game image in archive; choose one manually from the author archive')
    selected = members[0]
    # create a single named output; do not add game files to git
    out = DEST / ('elite-private' + Path(selected.filename).suffix.lower())
    out.write_bytes(game_zip.read(selected))
    (DEST / 'private-game.json').write_text(json.dumps({'file':out.name}), encoding='utf-8')
    print(f'Private local game: {out.name} ({out.stat().st_size} bytes)')
    print('DO NOT commit or publish this game binary without redistribution rights.')
    print('Local test: python -m http.server 8000; open http://localhost:8000/elite-spectrum.html')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--private-game', action='store_true', help='Also fetch author-hosted Elite game for PRIVATE local testing only')
    args = parser.parse_args()
    install_emulator()
    if args.private_game:
        install_private_game()
    print('Runtime installed. To load Elite, select a local game image in the player.')

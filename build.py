#!/usr/bin/env python3
"""Bundle the whole game into one self-contained HTML file you can email or drop in a chat.

    python3 build.py        ->  dist/everything-is-fine-downstairs.html

Re-run it after changing anything in js/. The single file keeps its own graveyard and
bestiary (browsers store them per file), separate from the folder version's.
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent
html = (root / 'index.html').read_text(encoding='utf-8')


def inline(match):
    src = match.group(1)
    code = (root / src).read_text(encoding='utf-8')
    if '</script' in code.lower():
        raise SystemExit(f'{src} contains "</script", which would end the inline script early')
    return f'<script>\n// ---- {src} ----\n{code}\n</script>'


bundled, count = re.subn(r'<script src="([^"]+)"></script>', inline, html)
out = root / 'dist' / 'everything-is-fine-downstairs.html'
out.parent.mkdir(exist_ok=True)
out.write_text(bundled, encoding='utf-8')
print(f'Bundled {count} scripts into {out.relative_to(root)} ({out.stat().st_size // 1024} KB)')

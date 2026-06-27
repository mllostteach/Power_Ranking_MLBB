from pathlib import Path
import re

root = Path(r'd:\MLBB List')
for path in root.glob('*.html'):
    if path.name in {'pickem.html', 'pickem-admin.html'}:
        continue
    text = path.read_text(encoding='utf-8')
    if 'class="navbar"' not in text and "class='navbar'" not in text:
        continue
    if 'href="pickem.html"' in text:
        continue
    pattern = re.compile(r'(<div\s+class=["\']nav-links["\']>\s*)', re.IGNORECASE)
    if not pattern.search(text):
        continue
    new_text = pattern.sub(r'\1\n<a href="pickem.html">Pick\'Em MSC</a>', text, count=1)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        print(path.name)

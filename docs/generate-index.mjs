#!/usr/bin/env node
/**
 * Génère docs/index.html : lecture des ADR dans le navigateur (fichier autonome, hors ligne).
 * Usage : node docs/generate-index.mjs
 *
 * Le contenu des ADR est intégré dans la page : elle s'ouvre directement depuis
 * l'explorateur (file://), sans serveur ni dépendance.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const adrDir = join(here, 'adr')

/* ── Markdown → HTML (sous-ensemble utilisé par les ADR) ─────────────────── */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const inline = s =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => {
      const m = href.match(/^(\d{4})-[\w-]+\.md$/)
      if (m) return `<a href="#adr-${m[1]}">${t}</a>`
      if (href.endsWith('.md')) return `<a href="adr/${href}">${t}</a>`

      return `<a href="${href}" target="_blank" rel="noopener">${t}</a>`
    })
    .replace(/ADR-(\d{4})(?![^<]*<\/a>)/g, '<a href="#adr-$1">ADR-$1</a>')

function md(src) {
  const lines = src.replace(/\r/g, '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) {
      const buf = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`)
      i++
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`)
      i++
      continue
    }
    if (/^\|/.test(line)) {
      const rows = []
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++])
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
      const [head, , ...body] = rows
      out.push(
        `<div class="table"><table><thead><tr>${cells(head).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body
          .map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      )
      continue
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      // Liste (un niveau d'imbrication : éléments indentés de 2 espaces ou plus)
      const items = []
      const isItem = l => /^\s*([-*]|\d+\.)\s+/.test(l)
      while (i < lines.length && (isItem(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        const l = lines[i]
        const indent = l.match(/^\s*/)[0].length
        if (isItem(l)) {
          const text = l.replace(/^\s*([-*]|\d+\.)\s+/, '')
          const ordered = /^\s*\d+\./.test(l)
          if (indent >= 2 && items.length) items[items.length - 1].children.push({ text, ordered })
          else items.push({ text, ordered, children: [] })
        } else if (items.length) {
          const last = items[items.length - 1]
          if (last.children.length) last.children[last.children.length - 1].text += ' ' + l.trim()
          else last.text += ' ' + l.trim()
        }
        i++
      }
      const tag = items[0].ordered ? 'ol' : 'ul'
      out.push(
        `<${tag}>${items
          .map(it => {
            const sub = it.children.length
              ? `<${it.children[0].ordered ? 'ol' : 'ul'}>${it.children.map(c => `<li>${inline(c.text)}</li>`).join('')}</${it.children[0].ordered ? 'ol' : 'ul'}>`
              : ''

            return `<li>${inline(it.text)}${sub}</li>`
          })
          .join('')}</${tag}>`
      )
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#|```|\||\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) para.push(lines[i++])
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }

  return out.join('\n')
}

/* ── Lecture des ADR ─────────────────────────────────────────────────────── */
const files = readdirSync(adrDir)
  .filter(f => /^\d{4}-.+\.md$/.test(f))
  .sort()

const adrs = files.map(file => {
  const src = readFileSync(join(adrDir, file), 'utf8')
  const num = file.slice(0, 4)
  const title = (src.match(/^#\s+ADR-\d{4}\s+[—-]\s+(.+)$/m)?.[1] ?? file).trim()
  const status = (src.match(/\*\*Statut\*\*\s*:\s*(.+)$/m)?.[1] ?? '—').trim()
  const date = (src.match(/\*\*Date\*\*\s*:\s*(.+)$/m)?.[1] ?? '').trim()
  const context = (src.split(/^## Contexte\s*$/m)[1] ?? '').split(/^## /m)[0].replace(/[`*]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim()
  // Retire le titre et les métadonnées, déjà affichés dans l'en-tête de la page
  const body = src.replace(/^#\s+.+\n/, '').replace(/^(- \*\*(Statut|Date|Projet)\*\*.*\n)+/m, '')

  return { num, file, title, status, date, summary: context.slice(0, 180) + (context.length > 180 ? '…' : ''), html: md(body), text: src.toLowerCase() }
})

const generatedAt = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
const statusClass = s => (/accept/i.test(s) ? 'ok' : /propos/i.test(s) ? 'draft' : /rempla|dépréc|deprec/i.test(s) ? 'old' : 'draft')

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ADR · Brain Flash API</title>
<style>
:root{--bg:#f6f7f6;--card:#fff;--fg:#14211a;--muted:#5e6b63;--line:#e3e7e4;--brand:#174E26;--brand-2:#0F3A1B;--tint:#e8f0ea;--leaf:#8DBE48;--orange:#F0A020;--code:#f1f4f2;--shadow:0 1px 2px rgba(16,24,40,.05)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f1512;--card:#151d18;--fg:#e6ece8;--muted:#9aa8a0;--line:#26322b;--brand:#8DBE48;--brand-2:#a9d06a;--tint:#1c2a21;--code:#1b241f;--shadow:none}}
:root[data-theme=dark]{--bg:#0f1512;--card:#151d18;--fg:#e6ece8;--muted:#9aa8a0;--line:#26322b;--brand:#8DBE48;--brand-2:#a9d06a;--tint:#1c2a21;--code:#1b241f;--shadow:none}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.65 Inter,"Segoe UI",system-ui,-apple-system,Arial,sans-serif}
a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
.layout{display:grid;grid-template-columns:320px minmax(0,1fr);min-height:100vh}
aside{position:sticky;top:0;height:100vh;overflow:auto;border-right:1px solid var(--line);background:var(--card);padding:20px 14px}
.brand{display:flex;align-items:center;gap:10px;padding:0 6px 16px;border-bottom:1px solid var(--line);margin-bottom:14px}
.logo{width:34px;height:34px;border-radius:9px;background:#174E26;color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.brand b{display:block;font-size:15px}.brand small{color:var(--muted);font-size:12px}
.search{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit;font-size:14px;margin-bottom:10px}
.search:focus{outline:2px solid color-mix(in srgb,var(--brand) 35%,transparent);border-color:var(--brand)}
nav a{display:flex;gap:10px;align-items:baseline;padding:8px 10px;border-radius:8px;color:var(--fg);font-size:13.5px;line-height:1.35}
nav a:hover{background:var(--tint);text-decoration:none}
nav a.active{background:var(--tint);color:var(--brand);font-weight:600}
nav a .n{font:600 11.5px ui-monospace,Consolas,monospace;color:var(--muted);flex:none}
nav a.active .n{color:var(--brand)}
.home-link{font-weight:600;margin-bottom:6px}
.empty{color:var(--muted);font-size:13px;padding:8px 10px;display:none}
main{padding:40px clamp(16px,5vw,64px) 80px;max-width:980px;width:100%}
.top{display:flex;justify-content:flex-end;gap:8px;margin-bottom:8px}
.btn{border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:8px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer}
.btn:hover{border-color:var(--brand);color:var(--brand)}
.menu-btn{display:none}
.eyebrow{font:600 12px ui-monospace,Consolas,monospace;color:var(--brand);letter-spacing:.04em}
h1{font-size:clamp(24px,3vw,32px);line-height:1.2;margin:6px 0 12px;letter-spacing:-.01em}
.meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--muted);font-size:13px;margin-bottom:26px}
.badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600}
.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.badge.ok{background:#EAF3DB;color:#4C7A1E}.badge.draft{background:#FDF1DC;color:#9A6200}.badge.old{background:#F1F2F4;color:#6B7280}
.doc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px clamp(18px,3vw,36px) 26px;box-shadow:var(--shadow)}
.doc h2{font-size:17px;margin:28px 0 8px;padding-top:4px;color:var(--brand-2)}
:root[data-theme=dark] .doc h2{color:var(--brand)}
.doc p,.doc li{max-width:72ch}
.doc ul,.doc ol{padding-left:22px}.doc li{margin:4px 0}
code{font:13px ui-monospace,Consolas,monospace;background:var(--code);padding:1px 5px;border-radius:5px}
pre{background:var(--code);border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow:auto}
pre code{background:none;padding:0;font-size:12.5px;line-height:1.55}
.table{overflow-x:auto;margin:12px 0}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border-bottom:1px solid var(--line);padding:9px 12px;text-align:left;vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);background:var(--bg)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;color:var(--fg);box-shadow:var(--shadow)}
.card:hover{border-color:var(--brand);text-decoration:none}
.card .eyebrow{display:flex;justify-content:space-between;align-items:center}
.card h3{font-size:15px;margin:6px 0;line-height:1.35}
.card p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}
.lead{color:var(--muted);max-width:70ch;margin:0 0 24px}
.pager{display:flex;justify-content:space-between;gap:12px;margin-top:18px}
.pager a{flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 14px;background:var(--card);font-size:13px}
.pager a:hover{border-color:var(--brand);text-decoration:none}
.pager .next{text-align:right}
.pager small{display:block;color:var(--muted)}
footer{margin-top:40px;color:var(--muted);font-size:12px}
@media (max-width:860px){
 .layout{grid-template-columns:1fr}
 aside{position:fixed;inset:0 auto 0 0;width:min(320px,86vw);z-index:20;transform:translateX(-102%);transition:transform .2s;box-shadow:0 0 40px rgba(0,0,0,.2)}
 body.nav-open aside{transform:none}
 .menu-btn{display:inline-block;margin-right:auto}
 main{padding-top:20px}
}
@media print{aside,.top,.pager{display:none}.layout{display:block}.doc{border:none;box-shadow:none;padding:0}main{max-width:none;padding:0}}
</style>
</head>
<body>
<div class="layout">
  <aside>
    <div class="brand"><div class="logo">API</div><div><b>Brain Flash</b><small>API · décisions d'architecture</small></div></div>
    <input class="search" id="q" type="search" placeholder="Rechercher (titre, contenu)…" aria-label="Rechercher un ADR">
    <nav id="nav">
      <a href="#" class="home-link" data-home>Vue d'ensemble</a>
      ${adrs.map(a => `<a href="#adr-${a.num}" data-num="${a.num}"><span class="n">${a.num}</span><span>${esc(a.title)}</span></a>`).join('\n      ')}
    </nav>
    <div class="empty" id="empty">Aucun ADR ne correspond.</div>
  </aside>
  <main>
    <div class="top">
      <button class="btn menu-btn" id="menu" aria-label="Ouvrir la liste">☰ ADR</button>
      <button class="btn" id="theme" title="Basculer clair / sombre">◐ Thème</button>
      <button class="btn" onclick="window.print()">Imprimer</button>
    </div>
    <div id="view"></div>
    <footer>Généré le ${generatedAt} depuis <code>docs/adr/*.md</code> — régénérer avec <code>node docs/generate-index.mjs</code>.</footer>
  </main>
</div>
<script>
const ADRS = ${JSON.stringify(adrs).replace(/<\//g, '<\\/')};
const statusClass = ${statusClass.toString()};
const view = document.getElementById('view');
const navLinks = [...document.querySelectorAll('#nav a[data-num]')];
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function home() {
  document.title = 'ADR · Brain Flash API';
  view.innerHTML = '<div class="eyebrow">DOCS / ADR</div><h1>Décisions d\\'architecture</h1>'
    + '<p class="lead">Décisions structurantes de l\\'API BOBRAINFLASHAPI (NestJS) : authentification, droits, réception des pesées, supervision, ERP. Chaque fiche suit le format de Michael Nygard : contexte, décision, conséquences, alternatives.</p>'
    + '<div class="grid">' + ADRS.map(a => '<a class="card" href="#adr-' + a.num + '"><div class="eyebrow"><span>ADR-' + a.num + '</span><span class="badge ' + statusClass(a.status) + '">' + esc(a.status) + '</span></div><h3>' + esc(a.title) + '</h3><p>' + esc(a.summary) + '</p></a>').join('') + '</div>';
}

function show(num) {
  const i = ADRS.findIndex(a => a.num === num);
  if (i < 0) return home();
  const a = ADRS[i], prev = ADRS[i - 1], next = ADRS[i + 1];
  document.title = 'ADR-' + a.num + ' · ' + a.title;
  view.innerHTML = '<div class="eyebrow">ADR-' + a.num + '</div><h1>' + esc(a.title) + '</h1>'
    + '<div class="meta"><span class="badge ' + statusClass(a.status) + '">' + esc(a.status) + '</span>' + (a.date ? '<span>' + esc(a.date) + '</span>' : '') + '<span>·</span><a href="adr/' + a.file + '">' + a.file + '</a></div>'
    + '<article class="doc">' + a.html + '</article>'
    + '<div class="pager">' + (prev ? '<a href="#adr-' + prev.num + '"><small>← Précédent</small>' + esc(prev.title) + '</a>' : '<span></span>')
    + (next ? '<a class="next" href="#adr-' + next.num + '"><small>Suivant →</small>' + esc(next.title) + '</a>' : '<span></span>') + '</div>';
}

function route() {
  const m = location.hash.match(/^#adr-(\\d{4})$/);
  m ? show(m[1]) : home();
  navLinks.forEach(l => l.classList.toggle('active', !!m && l.dataset.num === m[1]));
  document.querySelector('[data-home]').classList.toggle('active', !m);
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();

document.getElementById('q').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  let shown = 0;
  navLinks.forEach(l => {
    const a = ADRS.find(x => x.num === l.dataset.num);
    const ok = !q || a.num.includes(q) || a.title.toLowerCase().includes(q) || a.text.includes(q);
    l.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });
  document.getElementById('empty').style.display = shown ? 'none' : 'block';
});

document.getElementById('menu').onclick = () => document.body.classList.toggle('nav-open');
const root = document.documentElement;
try { const t = localStorage.getItem('adr-theme'); if (t) root.dataset.theme = t; } catch {}
document.getElementById('theme').onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('adr-theme', root.dataset.theme); } catch {}
};
</script>
</body>
</html>
`

writeFileSync(join(here, 'index.html'), html)
console.log(`docs/index.html généré (${adrs.length} ADR)`)

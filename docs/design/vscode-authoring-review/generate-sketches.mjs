// Editable vector proposals, not captures of implemented VS Code behavior.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'site/pages/010-bl-133/images');
const repo = path.resolve(root, '../../..');
const preview = await readFile(path.join(repo, 'site/pages/010-features/images/navigation-single-desktop.png'));
const photo = `data:image/png;base64,${preview.toString('base64')}`;
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function sketch({ mode = 'overview', dark = false, compact = false } = {}) {
  const W = compact ? 900 : 1280, H = 770, A = 54, S = compact ? 372 : 440, E = A + S;
  const c = dark
    ? { bg: '#181818', side: '#202020', editor: '#181818', bar: '#242424', border: '#414141', text: '#e4e4e4', muted: '#a7a7a7', active: '#173c55', blue: '#72c5ff', code: '#97d8b0', note: '#33312c' }
    : { bg: '#ffffff', side: '#f6f6f6', editor: '#ffffff', bar: '#eeeeee', border: '#d4d4d4', text: '#252526', muted: '#666666', active: '#dbeaff', blue: '#005fb8', code: '#007348', note: '#faf2e3' };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc"><title id="title">${escape(mode)} – förslag 2 för BL-133 VS Code Page Files</title><desc id="desc">Schematisk VS Code-vy. En egen Norna-ingång visar startsidan som rot, verkliga filer och pages-kataloger. Sidnamn ersätter numrerade katalognamn. Detta är ett gränssnittsförslag.</desc><defs><clipPath id="sidebar"><rect x="${A}" y="76" width="${S - 1}" height="${H - 104}"/></clipPath><clipPath id="editor"><rect x="${E + 1}" y="108" width="${W - E - 2}" height="${H - 138}"/></clipPath></defs>`;
  const rect = (x, y, w, h, fill, stroke, rx = 0) => { s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''} rx="${rx}"/>`; };
  const line = (x1, y1, x2, y2, color = c.border, width = 1) => { s += `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"/>`; };
  const text = (x, y, value, { size = 15, fill = c.text, bold = false, mono = false, anchor = 'start' } = {}) => {
    s += `<text${mono ? ' xml:space="preserve"' : ''} x="${x}" y="${y}" font-family="${mono ? 'SFMono-Regular, Menlo, monospace' : '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'}" font-size="${size}" font-weight="${bold ? 600 : 400}" text-anchor="${anchor}" fill="${fill}">${escape(value)}</text>`;
  };
  const circle = (x, y, r, fill) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`; };
  const marker = (n, x, y) => { circle(x, y, 12, '#a43e13'); text(x, y + 5, n, { size: 14, bold: true, fill: '#fff', anchor: 'middle' }); };
  const chevron = (x, y, open) => { s += `<path d="${open ? `M${x - 4} ${y - 2}l4 4 4-4` : `M${x - 2} ${y - 4}l4 4-4 4`}" fill="none" stroke="${c.muted}" stroke-width="1.6"/>`; };
  const icon = (kind, x, y, color = c.muted) => {
    const shapes = {
      file: 'M3 1h9l5 5v16H3z M12 1v6h5',
      files: 'M8 3H3v20h13v-4 M8 0h12v18H8z',
      image: 'M1 2h21v18H1z M3 17l6-7 5 5 3-3 4 5 M15 7h1',
      folder: 'M1 5h8l3 3h11v13H1z',
      search: 'M18 18l6 6 M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
      branch: 'M5 4v16 M6 13h8q6 0 6-6 M5 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6 M5 19a3 3 0 1 1 0 6 3 3 0 0 1 0-6 M20 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6',
      blocks: 'M1 1h9v9H1z M14 1h9v9h-9z M1 14h9v9H1z M14 14h9v9h-9z',
      settings: 'M12 1v4 M12 19v4 M1 12h4 M19 12h4 M4 4l3 3 M17 17l3 3 M4 20l3-3 M17 7l3-3 M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
      norna: 'M3 22V2l18 20V2',
    };
    s += `<path d="${shapes[kind] ?? shapes.file}" transform="translate(${x} ${y}) scale(.78)" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const plus = (x, y) => { line(x - 5, y, x + 5, y, c.text, 1.5); line(x, y - 5, x, y + 5, c.text, 1.5); };
  let y = 143;
  const row = (label, { level = 0, open = null, kind = 'file', selected = false, action = false } = {}) => {
    const center = y - 5, x = A + 24 + level * 18, labelX = x + 29;
    if (selected) rect(A + 1, y - 22, S - 2, 30, c.active);
    if (open !== null) chevron(x - 11, center, open);
    icon(kind, x + 3, y - 19, kind === 'image' ? c.code : c.muted);
    const maxChars = Math.floor((E - labelX - (action ? 42 : 17)) / 7.4);
    const display = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
    s += `<g><title>${escape(label)}</title>`;
    text(labelX, y, display, { size: 15 });
    s += '</g>';
    if (action) plus(E - 23, center);
    const position = { x: labelX, y: center };
    y += 30;
    return position;
  };
  const note = (title, lines, at = 498) => {
    rect(E + 28, at, W - E - 56, 48 + lines.length * 26, c.note, c.border, 5);
    text(E + 47, at + 29, title, { size: 17, bold: true });
    lines.forEach((value, i) => text(E + 47, at + 58 + i * 26, value, { size: 15 }));
  };

  rect(0, 0, W, H, c.bg);
  rect(0, 0, W, 38, c.bar);
  [0, 1, 2].forEach((i) => circle(17 + i * 18, 19, 5, ['#db5e58', '#d4ac45', '#57a460'][i]));
  rect((W - 360) / 2, 8, 360, 23, c.side, c.border, 5);
  text(W / 2, 24, 'site — Visual Studio Code', { size: 13, fill: c.muted, anchor: 'middle' });
  text(W - 15, 24, 'FÖRSLAG 2', { size: 12, bold: true, fill: c.muted, anchor: 'end' });
  rect(0, 38, A, H - 66, c.bar);
  rect(A, 38, S, H - 66, c.side);
  rect(E, 38, W - E, H - 66, c.editor);
  line(A, 38, A, H - 28);
  line(E, 38, E, H - 28);
  for (const [kind, cy] of [['files', 72], ['search', 126], ['branch', 180], ['blocks', 234]]) icon(kind, 17, cy - 10);
  rect(0, 269, 3, 44, c.blue);
  icon('norna', 17, 280, c.text);
  icon('settings', 17, H - 62);
  text(A + 20, 64, 'NORNA', { size: 13, bold: true });
  text(E - 23, 62, '···', { size: 20, fill: c.muted, anchor: 'end' });
  rect(A + 1, 83, S - 2, 29, c.bar);
  chevron(A + 15, 97, true);
  text(A + 29, 102, 'SITE TREE', { size: 13, bold: true });

  const local = mode === 'local-theme', global = mode === 'site-theme', home = mode === 'home-theme';
  const empty = mode === 'empty', deep = mode === 'deep', shared = mode === 'public', add = mode === 'add';
  const imageOpen = ['image', 'overview', 'dark', 'compact'].includes(mode);
  const tabLabel = home ? 'page-theme.yaml' : local || global ? 'theme.yaml' : shared ? 'logo.svg' : imageOpen ? 'navigation-single-desktop.png' : 'content.md';
  rect(E, 38, W - E, 39, c.bar);
  rect(E, 38, Math.min(W - E, 342), 39, c.editor);
  icon(imageOpen || shared ? 'image' : 'file', E + 13, 49, imageOpen || shared ? c.code : c.blue);
  text(E + 42, 64, tabLabel);
  line(E, 77, W, 77);
  const breadcrumb = home ? 'site  ›  page-theme.yaml' : global ? 'site  ›  theme.yaml' : local ? 'What Norna Does  ›  theme.yaml' : shared ? 'site  ›  public  ›  logo.svg' : empty ? 'Install Norna  ›  content.md' : deep ? 'Guides  ›  Installation  ›  macOS  ›  content.md' : imageOpen ? 'What Norna Does  ›  images' : 'What Norna Does  ›  content.md';
  text(E + 19, 99, breadcrumb, { size: 13, fill: c.muted });
  line(E, 107, W, 107);

  let rootRow, themeRow, pagesRow, pageRow, filesRow, imageRow;
  s += '<g clip-path="url(#sidebar)">';
  rootRow = row('Norna', { open: true });
  row('config.yaml', { level: 1 });
  themeRow = row('theme.yaml', { level: 1, selected: global });
  if (home) row('page-theme.yaml', { level: 1, selected: true });
  row('sitewide-content.yaml', { level: 1 });
  row('images/', { level: 1, kind: 'folder' });
  pagesRow = row('pages/', { level: 1, kind: 'folder', open: true, action: add || mode === 'overview', selected: add });
  if (deep) {
    row('Guides', { level: 2, open: true });
    row('theme.yaml', { level: 3 });
    row('images/', { level: 3, kind: 'folder', open: false });
    row('pages/', { level: 3, kind: 'folder', open: true });
    row('Installation', { level: 4, open: true });
    row('theme.yaml', { level: 5 });
    row('pages/', { level: 5, kind: 'folder', open: true });
    row('macOS', { level: 6, selected: true });
  } else if (empty) {
    row('What Norna Does', { level: 2, open: false });
    row('Getting Started', { level: 2, kind: 'folder', open: true });
    row('category.yaml', { level: 3 });
    row('pages/', { level: 3, kind: 'folder', open: true });
    row('Install Norna', { level: 4, selected: true });
    row('Reference', { level: 2, kind: 'folder', open: false });
  } else {
    const expanded = ['overview', 'files', 'image', 'dark', 'compact', 'local-theme'].includes(mode);
    pageRow = row('What Norna Does', { level: 2, open: expanded, selected: mode === 'page' });
    if (expanded) {
      if (local) row('theme.yaml', { level: 3, selected: true });
      filesRow = row('images/', { level: 3, kind: 'folder', open: true });
      imageRow = row('navigation-single-desktop.png', { level: 4, kind: 'image', selected: imageOpen });
      row('navigation-top-desktop.png', { level: 4, kind: 'image' });
      row('navigation-nested-desktop.png', { level: 4, kind: 'image' });
    }
    row('Getting Started', { level: 2, kind: 'folder', open: false });
    row('Examples', { level: 2, open: false });
    row('Reference', { level: 2, kind: 'folder', open: false });
    row('FAQ', { level: 2, kind: 'folder', open: false });
    row('Resources', { level: 2, open: false });
  }
  if (shared) {
    row('public/', { level: 1, kind: 'folder', open: true });
    row('logo.svg', { level: 2, kind: 'image', selected: true });
  }
  s += '</g>';

  s += '<g clip-path="url(#editor)">';
  if (imageOpen) {
    const px = E + 30, py = 143, pw = W - E - 60, ph = 378;
    rect(px, py, pw, ph, dark ? '#292929' : '#ededed', c.border);
    s += `<image href="${photo}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet"/>`;
    text(E + 30, 562, 'navigation-single-desktop.png', { size: 16, bold: true });
    text(E + 30, 592, 'Bilden öppnas i VS Codes bildvisning.', { fill: c.muted });
    text(E + 30, 620, 'Sidans Markdown ändras inte.', { fill: c.muted });
  } else if (shared) {
    rect(E + 30, 142, W - E - 60, 305, c.side, c.border);
    text(E + (W - E) / 2, 315, 'Norna', { size: 62, bold: true, anchor: 'middle' });
    note('Att diskutera: visa även public/', ['Logotyp, ikoner och nedladdningar.', 'logo.svg är en illustrativ exempelfil.', 'Öppna befintliga filer — ingen import.']);
  } else {
    const codeLines = home
      ? ['# Startsidan, utan arv till undersidor','layout:', '  textWidth: wide', '', '# Exempel på en befintlig lokal fil.']
      : local
        ? ['# Den här sidan och dess undersidor','layout:', '  textWidth: narrow', '', '# Exempel på en befintlig lokal fil.']
        : global
          ? ['# Gemensamma inställningar för sajten', 'palette: near-monochrome', 'appearance:', '  default: light']
          : empty
            ? ['# Install Norna', '', 'Create a site and open its local preview.', '', '## Before you start', '', 'Install Node.js and ImageMagick.']
            : deep
              ? ['# macOS', '', 'This page belongs to Installation.', '', '## Before you start', '', 'Follow the steps for your computer.']
              : ['# What Norna Does', '', 'Norna starts with things you can inspect:', 'Markdown, images, page folders and a', 'small theme file.', '', '## Let Files Become A Site', '', 'Each page has its own content.md.'];
    codeLines.forEach((value, i) => {
      text(E + 31, 150 + i * 29, i + 1, { size: 14, fill: c.muted, mono: true, anchor: 'end' });
      text(E + 54, 150 + i * 29, value, { size: 16, mono: true, fill: value.startsWith('#') ? c.blue : c.text });
    });
    if (home) note('Startsidan kan ha ett eget utseende', ['site/page-theme.yaml påverkar bara startsidan.', 'Filen visas endast när den finns.', 'I denna skiss är den ett illustrativt exempel.']);
    if (global) note('Samma rot, olika räckvidd', ['site/theme.yaml styr sajtens gemensamma tema.', 'Norna-raden öppnar i stället site/content.md.', 'Konfiguration ligger före pages/ i trädet.']);
    if (local) note('Sidans tema ligger under sidan', ['theme.yaml gäller sidan och ärvs av undersidor.', 'Filen ligger före images/ och pages/.', 'Den extra temafilen här är ett exempel.']);
    if (deep) note('Samma mönster på varje nivå', ['Sidtiteln representerar sin verkliga katalog.', 'Undersidor ligger i sidans pages/.', 'Exempelstruktur: Guides → Installation → macOS.']);
    if (empty) note('Sidtexten finns, extra filer saknas', ['Klick på Install Norna öppnar content.md.', 'Inga påhittade images/ eller pages/ visas.', 'Att öppna trädet skapar inga filer.']);
    if (add) note('Skapa på den nivå där du står', ['Add page på denna pages/ skapar ett barn till Norna.', 'På en djupare pages/ skapas ett barn där.', 'Knappens utformning är ett förslag.']);
  }
  s += '</g>';

  if (mode === 'overview') {
    marker(1, 27, 291);
    marker(2, E - 23, rootRow.y);
    marker(3, E - 23, themeRow.y);
    marker(4, E - 57, pagesRow.y);
  }
  if (mode === 'page') marker(1, E - 23, pageRow.y);
  if (mode === 'files') marker(2, E - 23, filesRow.y);
  if (mode === 'image') marker(3, E - 23, imageRow.y);
  if (add) {
    rect(E - 157, pagesRow.y + 17, 146, 38, c.editor, c.border, 4);
    plus(E - 136, pagesRow.y + 36);
    text(E - 120, pagesRow.y + 41, 'Add page…', { size: 14 });
  }
  rect(0, H - 28, W, 28, c.bar);
  line(0, H - 28, W, H - 28);
  text(16, H - 9, 'Norna', { size: 12 });
  text(W - 17, H - 9, 'Illustration av föreslagen funktion', { size: 12, fill: c.muted, anchor: 'end' });
  rect(.5, .5, W - 1, H - 1, 'none', c.border);
  return s + '</svg>\n';
}

await mkdir(output, { recursive: true });
const scenes = {
  'overview.svg': {},
  'open-page.svg': { mode: 'page' },
  'show-files.svg': { mode: 'files' },
  'open-image.svg': { mode: 'image' },
  'site-theme.svg': { mode: 'site-theme' },
  'home-theme.svg': { mode: 'home-theme' },
  'local-theme.svg': { mode: 'local-theme' },
  'add-page.svg': { mode: 'add' },
  'shared-files.svg': { mode: 'public' },
  'deep-tree.svg': { mode: 'deep' },
  'empty-page.svg': { mode: 'empty' },
  'dark.svg': { mode: 'dark', dark: true },
  'compact.svg': { mode: 'compact', compact: true },
};
for (const [name, options] of Object.entries(scenes)) await writeFile(path.join(output, name), sketch(options));
console.log(`Generated ${Object.keys(scenes).length} SVG proposals in ${path.relative(repo, output)}.`);

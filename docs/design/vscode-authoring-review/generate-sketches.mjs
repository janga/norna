// Editable vector proposals, not captures of implemented VS Code behavior.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'site/pages/010-bl-133/images');
const repo = path.resolve(root, '../../..');
const preview = await readFile(path.join(repo, 'site/pages/010-features/images/navigation-single-desktop.png'));
const photo = `data:image/png;base64,${preview.toString('base64')}`;
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function sketch({ mode = 'overview', dark = false, compact = false, explorer = false, pane = false } = {}) {
  const W = compact ? 820 : 1200, H = 740, A = 54, S = compact ? 320 : 420, E = A + S;
  const c = dark
    ? { bg: '#181818', side: '#202020', editor: '#181818', bar: '#242424', border: '#414141', text: '#e4e4e4', muted: '#a7a7a7', active: '#173c55', blue: '#72c5ff', code: '#97d8b0', note: '#33312c' }
    : { bg: '#ffffff', side: '#f6f6f6', editor: '#ffffff', bar: '#eeeeee', border: '#d4d4d4', text: '#252526', muted: '#666666', active: '#dbeaff', blue: '#005fb8', code: '#007348', note: '#faf2e3' };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc"><title id="title">${escape(mode)} – förslag för BL-133 VS Code Page Files</title><desc id="desc">Schematisk VS Code-vy. Norna visar läsbara sidnamn, sidans filer och gemensamma inställningar. Markerade kontroller är förslag.</desc><defs><clipPath id="sidebar"><rect x="${A}" y="76" width="${S - 1}" height="636"/></clipPath><clipPath id="editor"><rect x="${E + 1}" y="106" width="${W-E-2}" height="604"/></clipPath></defs>`;
  const rect = (x,y,w,h,fill,stroke,rx=0) => { s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''} rx="${rx}"/>`; };
  const line = (x1,y1,x2,y2,color=c.border,width=1) => { s += `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"/>`; };
  const text = (x,y,value,{ size=16, fill=c.text, bold=false, mono=false, anchor='start' }={}) => {
    s += `<text x="${x}" y="${y}" font-family="${mono ? 'SFMono-Regular, Menlo, monospace' : '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'}" font-size="${size}" font-weight="${bold ? 600 : 400}" text-anchor="${anchor}" fill="${fill}">${escape(value)}</text>`;
  };
  const circle = (x,y,r,fill,stroke) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''}/>`; };
  const marker = (n,x,y) => { circle(x,y,13,'#a43e13'); text(x,y+5,n,{size:15,bold:true,fill:'#fff',anchor:'middle'}); };
  const chevron = (x,y,open) => { s += `<path d="${open ? `M${x-4} ${y-2}l4 4 4-4` : `M${x-2} ${y-4}l4 4-4 4`}" fill="none" stroke="${c.muted}" stroke-width="1.6"/>`; };
  const icon = (kind,x,y,color=c.muted) => {
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
  let y = 115;
  const row = (label,{level=0,open=null,kind='file',selected=false,muted=false}={}) => {
    const center = y - 6;
    if (selected) rect(A+1,y-24,S-2,33,c.active);
    const x = A+24+level*20;
    if (open !== null) chevron(x-11,center,open);
    if (kind) icon(kind,x+3,y-20,kind==='image' ? c.code : c.muted);
    text(x+(kind ? 30 : 4),y,label,{size:16,fill:muted?c.muted:c.text});
    const out = {x:x+27,y:center};
    y += 33;
    return out;
  };
  const section = (label,at) => { if(at)y=at; rect(A+1,y-24,S-2,31,c.bar); chevron(A+15,y-7,true); text(A+29,y-1,label,{size:13,bold:true}); y+=37; };

  rect(0,0,W,H,c.bg);
  rect(0,0,W,38,c.bar);
  [0,1,2].forEach((i)=>circle(17+i*18,19,5,['#db5e58','#d4ac45','#57a460'][i]));
  rect(Math.max(120,(W-360)/2),8,360,23,c.side,c.border,5);
  text(W/2,24,'site — Visual Studio Code',{size:13,fill:c.muted,anchor:'middle'});
  text(W-15,24,'SKISS · BL-133',{size:12,bold:true,fill:c.muted,anchor:'end'});
  rect(0,38,A,H-66,c.bar); rect(A,38,S,H-66,c.side); rect(E,38,W-E,H-66,c.editor);
  line(A,38,A,H-28); line(E,38,E,H-28);
  const tools = [['files',72],['search',126],['branch',180],['blocks',234]];
  for(const [kind,cy] of tools) icon(kind,17,cy-10,explorer&&kind==='files'?c.text:c.muted);
  if(!explorer){rect(0,269,3,44,c.blue);icon('norna',17,280,c.text);}
  else rect(0,52,3,43,c.blue);
  icon('settings',17,H-62);
  text(A+20,64,explorer?'EXPLORER':'NORNA',{size:13,bold:true}); text(E-23,62,'···',{size:20,fill:c.muted,anchor:'end'});
  const isLocal = mode==='local-theme', isGlobal=mode==='site-theme', isPublic=mode==='public';
  const imageOpen = ['image','overview','pane','dark','compact','explorer'].includes(mode);
  const empty=mode==='empty', deep=mode==='deep';
  const tabLabel=isLocal?'theme.yaml · What Norna Does':isGlobal?'theme.yaml · site':imageOpen?'navigation-single-desktop.png':'content.md';
  rect(E,38,W-E,39,c.bar); rect(E,38,Math.min(W-E,354),39,c.editor);
  icon(imageOpen?'image':'file',E+13,49,imageOpen?c.code:c.blue);
  text(E+42,64,tabLabel,{size:15});
  line(E,77,W,77);
  text(E+19,99,isGlobal?'site  ›  theme.yaml':isLocal?'What Norna Does  ›  theme.yaml':empty?'Getting Started  ›  Install Norna  ›  content.md':deep?'Guides  ›  content.md':imageOpen?'What Norna Does  ›  images':'What Norna Does  ›  content.md',{size:13,fill:c.muted});
  line(E,107,W,107);
  let pageRow, filesRow, imageRow, settingsRow;
  s+='<g clip-path="url(#sidebar)">';
  if(explorer){section('SITE',108);row('pages',{kind:'folder',open:false});row('public',{kind:'folder',open:false});row('config.yaml');row('theme.yaml');section('NORNA: SITE TREE',288);}
  else section('SITE TREE',110);
  row('Norna',{kind:'norna'});
  pageRow=row('What Norna Does',{open:pane?null:!empty&&!deep,selected:mode==='page'});
  if(!empty&&!deep&&!pane){
    filesRow=row('Page files',{level:1,kind:'folder',open:mode!=='page'&&!isPublic});
    if(mode!=='page'&&!isPublic){
      row('Images',{level:2,kind:'folder',open:true});
      imageRow=row(compact?'navigation-single-desktop…':'navigation-single-desktop.png',{level:3,kind:'image',selected:imageOpen});
      row(compact?'navigation-top-desktop…':'navigation-top-desktop.png',{level:3,kind:'image'});
      row(compact?'navigation-nested-desktop…':'navigation-nested-desktop.png',{level:3,kind:'image'});
      if(isLocal)row('theme.yaml · local',{level:2,selected:true});
    }
  }
  row('Getting Started',{kind:'folder',open:empty});
  if(empty){row('Install Norna',{level:1,open:true,selected:true});row('Page files · none',{level:2,kind:'folder',muted:true});}
  row('Examples',{open:false});
  row('Reference',{kind:'folder',open:deep});
  if(deep){row('Guides',{level:1,open:true,selected:true});filesRow=row('Page files',{level:2,kind:'folder',open:true});row('theme.yaml · local',{level:3});row('Installation',{level:2,open:true});row('Page files',{level:3,kind:'folder',open:false});row('Configuration',{level:3,open:false});}
  if(!explorer&&!deep){row('FAQ',{kind:'folder',open:false});row('Resources',{open:false});}
  if(pane){
    section('PAGE FILES',430);text(A+21,458,'What Norna Does',{size:15,bold:true});y=494;
    row('Images',{kind:'folder',open:true});
    imageRow=row('navigation-single-desktop.png',{level:1,kind:'image',selected:true});
    row('navigation-top-desktop.png',{level:1,kind:'image'});
    row('navigation-nested-desktop.png',{level:1,kind:'image'});
  }
  if(isGlobal||isPublic){
    settingsRow={x:A+S-22,y:isPublic?413:541};section('SITE SETTINGS',isPublic?420:548);
    row('config.yaml · site address');row('theme.yaml · site appearance',{selected:isGlobal});row('sitewide-content.yaml');
    if(isPublic){section('SHARED FILES · public/',null);row('logo.svg',{kind:'image'});}
  }else if(!explorer){
    settingsRow={x:E-25,y:680};rect(A+1,658,S-2,38,c.bar);chevron(A+16,677,false);text(A+30,683,'SITE SETTINGS',{size:13,bold:true});
  }
  s+='</g>';
  s+='<g clip-path="url(#editor)">';
  const codeLines = isLocal
    ? ['# Lokalt tema: exempel för diskussion','layout:','  textWidth: narrow','  contentSpacing: compact','','# Gäller sidan och dess undersidor.']
    : isGlobal
      ? ['# Webbplatsens befintliga tema','palette: near-monochrome','appearance:','  default: dark','','# Gäller hela webbplatsen.']
      : empty
        ? ['# Install Norna','','Create a site and open its local preview.','','## Before you start','','Install Node.js and ImageMagick.']
        : deep
          ? ['# Guides','','A parent page can have content and files,','as well as child pages.','','## Start here','','Choose the guide for your next task.']
          : ['# What Norna Does','','Norna starts with things you can inspect:','Markdown, images, page folders and a','small theme file.','','## Let Files Become A Site','','Each page is a directory containing','content.md and, when needed, an adjacent','images/ directory.'];
  if(imageOpen){
    const px=E+30,py=137,pw=W-E-60,ph=390;
    rect(px,py,pw,ph,dark?'#292929':'#ededed',c.border);
    s+=`<image href="${photo}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet"/>`;
    text(E+30,566,'navigation-single-desktop.png',{size:16,bold:true});
    text(E+30,593,'Bilden visas i VS Codes bildvisning.',{size:15,fill:c.muted});
    text(E+30,618,'Sidans Markdown ändras inte.',{size:15,fill:c.muted});
  }else{
    codeLines.forEach((value,i)=>{text(E+31,148+i*29,i+1,{size:14,fill:c.muted,mono:true,anchor:'end'});text(E+54,148+i*29,value,{size:16,mono:true,fill:value.startsWith('#')?c.blue:c.text});});
    if(isLocal||isGlobal){
      rect(E+28,460,W-E-56,114,c.note,c.border,5);
      text(E+47,490,isLocal?'Exempel: lokalt tema':'Befintligt: webbplatsens tema',{size:17,bold:true});
      text(E+47,518,isLocal?'Filen är tillagd i skissen.':'Samma fil som öppnas från Explorer.',{size:15});
      text(E+47,544,'Öppnas med vanlig YAML-hjälp.',{size:15});
    }
  }
  s+='</g>';
  if(mode==='overview'){marker(1,27,291);marker(2,E-24,filesRow.y);marker(3,E-24,680);}
  if(mode==='page')marker(1,E-24,pageRow.y);
  if(mode==='files')marker(2,E-24,filesRow.y);
  if(mode==='image')marker(3,E-24,imageRow.y);
  if(mode==='deep')marker(1,E-24,filesRow.y);
  if(isPublic){rect(E+28,462,W-E-56,160,c.note,c.border,5);text(E+47,495,'Möjlig utökning: Shared files',{size:18,bold:true});text(E+47,526,'Logotyp, ikoner och nedladdningar.',{size:16});text(E+47,557,'Filer i public/ hör till webbplatsen.',{size:16});text(E+47,587,'Exempelfiler — eget beslut om omfattning.',{size:14,fill:c.muted});}
  rect(0,H-28,W,28,c.bar);line(0,H-28,W,H-28);
  text(16,H-9,'Norna',{size:12});text(W-17,H-9,'Illustration av föreslagen funktion',{size:12,fill:c.muted,anchor:'end'});
  rect(.5,.5,W-1,H-1,'none',c.border);
  return s+'</svg>\n';
}

await mkdir(output,{recursive:true});
for(const [name,options] of Object.entries({
  'overview.svg':{},
  'open-page.svg':{mode:'page'},
  'show-files.svg':{mode:'files'},
  'open-image.svg':{mode:'image'},
  'local-theme.svg':{mode:'local-theme'},
  'site-theme.svg':{mode:'site-theme'},
  'explorer.svg':{mode:'explorer',explorer:true},
  'selected-page-pane.svg':{mode:'pane',pane:true},
  'shared-files.svg':{mode:'public'},
  'deep-tree.svg':{mode:'deep'},
  'empty-page.svg':{mode:'empty'},
  'dark.svg':{mode:'dark',dark:true},
  'compact.svg':{mode:'compact',compact:true},
})) await writeFile(path.join(output,name),sketch(options));
console.log(`Generated 13 SVG proposals in ${path.relative(repo,output)}.`);

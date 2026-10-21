/* ============================================================
   CARTE DU NET
   Une forteresse de données se dessine sur une sous-grille : vingt colonnes
   de A à T, vingt lignes de 1 à 20 (Livre du Net, p. 85). On y pose des CPU,
   leurs mémoires, des murs de données, des grilles codées, des fichiers et
   les programmes de défense ; la légende et la fiche du système se montent
   toutes seules, et le tout s'imprime.
   ============================================================ */
'use strict';

const NET_COLS = 20, NET_LIGNES = 20;
const colLettre = i => String.fromCharCode(65 + i);      // 0 → A … 19 → T

/* ---------- La palette ----------
   « g » est le glyphe de la police Netrunner, « k » la touche du clavier qui
   la produit. Le livre impose le cercle barré d'une croix pour la CPU ; le
   reste suit l'usage des plans de forteresse. */
const NET_PAL = [
  { id: 'cpu', t: 'CPU', g: 'c', cl: 'maitre', aide: 'Unité centrale. +3 INT au système, 10 000 €$, quatre mémoires adjacentes.' },
  { id: 'memoire', t: 'Mémoire', g: 'm', bref: 1, aide: '10 unités mémoire. Se place dans une case adjacente à sa CPU.' },
  { id: 'mur', t: 'Mur de données', g: 'b', cl: 'mur', bref: 2, aide: 'Blindage du système. Note sa FOR ; il faut le percer ou le contourner.' },
  { id: 'grille', t: 'Grille codée', g: 'v', aide: 'Porte de code : le passage prévu, pour qui a le mot de passe.' },
  { id: 'fichier', t: 'Fichier', g: 'p', aide: 'Données stockées. Note son volume en UM et ce qu’il contient.' },
  { id: 'programme', t: 'Programme', g: 'l', cl: 'ice', aide: 'ICE en patrouille ou en garde. Note sa FOR et son nom.' },
  { id: 'mortel', t: 'Programme mortel', g: 's', cl: 'danger', aide: 'Anti-personnel létal. Niveau 4 seulement, en principe.' },
  { id: 'daemon', t: 'Daemon', g: 'n', aide: 'Programme autonome attaché à une tâche du système.' },
  { id: 'terminal', t: 'Terminal', g: 't', aide: 'Poste de travail physique : une entrée possible depuis le monde réel.' },
  { id: 'lld', t: 'Liaison longue distance', g: 'K', cl: 'lien', aide: 'Sortie vers une autre grille de ville. Note son niveau de pistage.' },
  { id: 'ascenseur', t: 'Ascenseur', g: 'h', cl: 'lien', aide: 'Passage vers une autre sous-grille du même système.' },
  { id: 'reseau', t: 'Nœud de réseau', g: 'Z', aide: 'Concentrateur reliant plusieurs sous-systèmes.' },
  { id: 'serveur', t: 'Serveur', g: 'S', aide: 'Baie physique : paye, archives, production.' },
  { id: 'bdd', t: 'Base de données', g: 'M', aide: 'Gros volume de données, souvent la cible du run.' },
  { id: 'camera', t: 'Caméra', g: 'C', aide: 'Surveillance physique pilotée depuis le système.' },
  { id: 'drone', t: 'Drone', g: 'D', aide: 'Appareil contrôlé par le système. Dangereux côté réel.' },
  { id: 'antenne', t: 'Antenne', g: 'W', aide: 'Liaison sans fil : une porte d’entrée pour qui s’approche.' },
  { id: 'robot', t: 'Robot', g: 'R', aide: 'Machine de manutention ou de sécurité sous contrôle du système.' },
  { id: 'satellite', t: 'Satellite', g: 'G', aide: 'Relais orbital. Niveau de sécurité élevé par nature.' },
  { id: 'note', t: 'Repère', g: 'a', aide: 'Point d’intérêt libre : ce que tu veux y mettre.' }
];
const netType = id => NET_PAL.find(p => p.id === id) || NET_PAL[0];

/* ---------- Stockage ----------
   Les cartes vivent à côté des personnages, dans le même entrepôt. */
const NETS = {
  all() { const s = STORE._read(); return s.cartes || (s.cartes = []); },
  get(id) { return this.all().find(c => c.id === id) || null; },
  save(c) {
    const l = this.all(), i = l.findIndex(x => x.id === c.id);
    c.maj = new Date().toISOString();
    if (i < 0) l.unshift(c); else l[i] = c;
    STORE._read().carteCourante = c.id;
    STORE._write();
    return c;
  },
  courante() { const s = STORE._read(); return s.carteCourante ? this.get(s.carteCourante) : null; },
  choisir(id) { STORE._read().carteCourante = id; STORE._write(); },
  remove(id) {
    const s = STORE._read();
    s.cartes = this.all().filter(c => c.id !== id);
    if (s.carteCourante === id) s.carteCourante = s.cartes[0] ? s.cartes[0].id : null;
    STORE._write();
  },
  vierge(nom) {
    return {
      id: uid(), nom: nom || 'Forteresse sans nom', proprio: '', secu: 2,
      int: 5, murFor: 0, cout: 0, notes: '', cases: {}, maj: new Date().toISOString()
    };
  }
};

/* ---------- Règles du livre ---------- */
const NET_SECU = [
  { n: 1, t: 'Gris 1 — sécurité faible', d: "Systèmes publics, hôpitaux, petits commerces. Alarme et détection." },
  { n: 2, t: 'Gris 2 — sécurité standard', d: "Entreprises moyennes, services municipaux. ICE de base." },
  { n: 3, t: 'Gris 3 — sécurité renforcée', d: "Grandes entreprises, banques. ICE active, NetWatch alerté." },
  { n: 4, t: 'Noir — sécurité maximale', d: "Corporations majeures, militaire. Anti-personnel létal autorisé." }
];

/** Recalcule ce que le livre fait découler de la carte : INT, coût, mémoire. */
function netBilan(c) {
  const par = {};
  Object.values(c.cases).forEach(e => { par[e.type] = (par[e.type] || 0) + 1; });
  const cpu = par.cpu || 0, mem = par.memoire || 0;
  return {
    par, cpu, mem,
    int: 5 + 3 * cpu,
    ia: 5 + 3 * cpu >= 12,
    cout: cpu * 10000,
    um: mem * 10,
    memAttendue: cpu * 4,
    elements: Object.keys(c.cases).length
  };
}

/** Le système de génération rapide, pas à pas (Livre du Net, p. 85). */
function netGenerer(c, secu) {
  const d6 = () => 1 + Math.floor(Math.random() * 6);
  c.secu = secu;
  c.cases = {};
  const nbCpu = Math.max(1, Math.min(24, d6() * secu));   // 1D6 × niveau, borné par la place
  c.murFor = secu + d6();

  /* On répartit les CPU dans la moitié centrale, chacune avec ses quatre mémoires. */
  const pris = {};
  const libre = (x, y) => x >= 1 && y >= 1 && x < NET_COLS - 1 && y < NET_LIGNES - 1 && !pris[x + ',' + y];
  const pose = (x, y, type, champs) => {
    pris[x + ',' + y] = 1;
    c.cases[x + ',' + y] = Object.assign({ type: type, nom: '', notes: '' }, champs || {});
  };
  let places = 0, essais = 0;
  while (places < nbCpu && essais < 600) {
    essais++;
    const x = 3 + Math.floor(Math.random() * (NET_COLS - 6));
    const y = 3 + Math.floor(Math.random() * (NET_LIGNES - 6));
    const autour = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    if (!libre(x, y) || !autour.every(([a, b]) => libre(a, b))) continue;
    pose(x, y, 'cpu', { nom: 'CPU ' + (places + 1) });
    autour.forEach(([a, b], i) => pose(a, b, 'memoire', { nom: 'Mém. ' + (places + 1) + '.' + (i + 1), um: 10 }));
    places++;
  }

  /* Le mur de données ceinture l'ensemble, avec une grille codée par face. */
  const occ = Object.keys(c.cases).map(k => k.split(',').map(Number));
  const xs = occ.map(p => p[0]), ys = occ.map(p => p[1]);
  const x0 = Math.max(0, Math.min(...xs) - 2), x1 = Math.min(NET_COLS - 1, Math.max(...xs) + 2);
  const y0 = Math.max(0, Math.min(...ys) - 2), y1 = Math.min(NET_LIGNES - 1, Math.max(...ys) + 2);
  const bord = [];
  for (let x = x0; x <= x1; x++) { bord.push([x, y0]); bord.push([x, y1]); }
  for (let y = y0 + 1; y < y1; y++) { bord.push([x0, y]); bord.push([x1, y]); }
  bord.forEach(([x, y]) => { if (!pris[x + ',' + y]) pose(x, y, 'mur', { for: c.murFor }); });
  const portes = [[Math.round((x0 + x1) / 2), y0], [Math.round((x0 + x1) / 2), y1],
  [x0, Math.round((y0 + y1) / 2)], [x1, Math.round((y0 + y1) / 2)]];
  portes.slice(0, 1 + Math.floor(secu / 2)).forEach(([x, y], i) => {
    c.cases[x + ',' + y] = { type: 'grille', nom: 'Grille codée ' + (i + 1), for: c.murFor, notes: '' };
  });

  /* Les programmes de défense, tirés du Livre du Net selon le niveau :
     1 alarme et détection, 2 ajoute l'anti-IC, 3 l'anti-personnel non létal,
     4 tout, y compris le létal. */
  const prog = (DB.net_programs || []);
  /* « effectuer » contient « tuer » : sans frontières de mot, la moitié du
     catalogue passait pour mortelle. */
  const létal = p => /\b(mort|morts|mortel|mortelle|létal|letal|létale|tue|tuer|tuent|fatal|fatale)\b|cardiaque|arrêt du cœur|cerveau/i
    .test((p.desc || '') + ' ' + (p.fonction || ''));
  const parClasse = cl => prog.filter(p => (p.classe || '') === cl);
  const tire = (liste, n) => {
    const l = liste.slice(), out = [];
    while (out.length < n && l.length) out.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]);
    return out;
  };
  const choisis = [].concat(
    tire(parClasse('Détection'), secu >= 3 ? 3 : 2),
    secu >= 2 ? tire(parClasse('Anti-programme'), secu - 1) : [],
    secu >= 3 ? tire(parClasse('Anti-personnel').filter(p => !létal(p)), 1) : [],
    secu >= 4 ? tire(parClasse('Anti-personnel').filter(létal), 2) : [],
    secu >= 4 ? tire(parClasse('Anti-système'), 1) : [],
    secu >= 3 ? tire(parClasse('Daemons').concat(parClasse('Démons')), 1) : []
  ).filter(Boolean);

  choisis.forEach(p => {
    let x, y, t = 0;
    do {
      x = x0 + 1 + Math.floor(Math.random() * Math.max(1, x1 - x0 - 1));
      y = y0 + 1 + Math.floor(Math.random() * Math.max(1, y1 - y0 - 1)); t++;
    } while (c.cases[x + ',' + y] && t < 300);
    if (c.cases[x + ',' + y]) return;
    const estDaemon = /daemon|démon/i.test(p.classe || '');
    c.cases[x + ',' + y] = {
      type: létal(p) ? 'mortel' : (estDaemon ? 'daemon' : 'programme'),
      nom: p.nom || 'Programme',
      for: p.force || secu + 2,
      um: p.um || 0,
      notes: (p.fonction || p.desc || '').slice(0, 150)
    };
  });

  /* Un fichier à voler, sinon à quoi bon entrer. */
  for (let t = 0; t < 400; t++) {
    const fx = x0 + 1 + Math.floor(Math.random() * Math.max(1, x1 - x0 - 1));
    const fy = y0 + 1 + Math.floor(Math.random() * Math.max(1, y1 - y0 - 1));
    if (!c.cases[fx + ',' + fy]) {
      c.cases[fx + ',' + fy] = { type: 'fichier', nom: 'Fichier maître', um: 2 + secu * 2, notes: '', for: 0 };
      break;
    }
  }
  const b = netBilan(c);
  c.int = b.int; c.cout = b.cout;
  return { nbCpu: places, murFor: c.murFor, programmes: choisis.length };
}

/* ---------- Vue ---------- */
const NETE = { outil: 'cpu', sel: null };   // outil courant, case sélectionnée

VIEWS.net = function () {
  const wrap = h('div.view-inner');
  let c = NETS.courante();
  if (!c) { c = NETS.save(NETS.vierge('Forteresse sans nom')); }

  const redessine = () => route();
  const maj = () => { const b = netBilan(c); c.int = b.int; c.cout = b.cout; NETS.save(c); };

  /* --- Barre du haut : la carte choisie, les actions --- */
  const cartes = NETS.all();
  const barre = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h',
      h('h3', 'Carte du Net'),
      h('div.sp'),
      cartes.length > 1 ? h('select', {
        onchange: e => { NETS.choisir(e.target.value); redessine(); }
      }, ...cartes.map(x => h('option', { value: x.id, selected: x.id === c.id ? 'selected' : null },
        x.nom || 'Sans nom'))) : null,
      h('button.btn.p.sm', { onclick: () => { NETS.save(NETS.vierge('Nouvelle forteresse')); redessine(); } }, 'Nouvelle'),
      h('button.btn.g.sm', { onclick: () => window.print() }, 'Imprimer'),
      h('button.btn.g.sm', { onclick: () => netExport(c) }, 'Exporter'),
      h('button.btn.g.sm', { onclick: () => netImport() }, 'Importer'),
      cartes.length > 1 ? h('button.btn.d.sm', {
        onclick: () => confirmer('Supprimer', `Supprimer « ${c.nom} » ?`,
          () => { NETS.remove(c.id); redessine(); })
      }, 'Supprimer') : null));

  /* --- L'en-tête du système --- */
  const champ = (lib, val, onin, attrs) => h('label.net-ch', h('span', lib),
    h('input', Object.assign({ value: val, oninput: e => { onin(e.target.value); } }, attrs || {})));
  const bilan = netBilan(c);
  const entete = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.net-form',
      champ('Nom du système', c.nom, v => { c.nom = v; maj(); majTitre(); }),
      champ('Propriétaire', c.proprio, v => { c.proprio = v; maj(); }),
      h('label.net-ch', h('span', 'Niveau de sécurité'),
        h('select', { onchange: e => { c.secu = +e.target.value; maj(); redessine(); } },
          ...NET_SECU.map(s => h('option', { value: s.n, selected: s.n === c.secu ? 'selected' : null },
            s.t)))),
      champ('FOR du mur de données', c.murFor, v => { c.murFor = +v || 0; maj(); }, { type: 'number', min: 0 })),
    h('p.muted', { style: { margin: '8px 0 0' } }, (NET_SECU.find(s => s.n === c.secu) || {}).d));

  /* --- Le bilan, calculé --- */
  const chiffres = h('div.rz-grid',
    tuile('CPU', bilan.cpu), tuile('INT', bilan.int, bilan.ia ? 'Intelligence artificielle' : null),
    tuile('Mémoires', bilan.mem + ' / ' + bilan.memAttendue), tuile('Capacité', bilan.um + ' UM'),
    tuile('Mur', c.murFor || '—', 'FOR'), tuile('Coût', eb(bilan.cout)));

  /* --- La palette --- */
  const pal = h('div.net-pal');
  NET_PAL.forEach(p => pal.appendChild(h('button.net-o' + (NETE.outil === p.id ? '.on' : ''), {
    title: p.t + ' — ' + p.aide,
    onclick: () => { NETE.outil = p.id; NETE.sel = null; redessine(); }
  }, h('i.nf' + (p.cl ? '.' + p.cl : ''), p.g), h('span', p.t))));
  pal.appendChild(h('button.net-o' + (NETE.outil === 'gomme' ? '.on' : '') + '.gomme', {
    onclick: () => { NETE.outil = 'gomme'; NETE.sel = null; redessine(); }
  }, h('i', '✕'), h('span', 'Effacer')));

  /* --- La grille --- */
  const grille = h('div.net-grille');
  const entete0 = h('div.net-ligne.net-tete', h('div.net-coin'));
  for (let x = 0; x < NET_COLS; x++) entete0.appendChild(h('div.net-col', colLettre(x)));
  grille.appendChild(entete0);
  for (let y = 0; y < NET_LIGNES; y++) {
    const ligne = h('div.net-ligne', h('div.net-num', String(y + 1)));
    for (let x = 0; x < NET_COLS; x++) {
      const cle = x + ',' + y, e = c.cases[cle];
      const t = e ? netType(e.type) : null;
      const cel = h('button.net-c' + (e ? '.plein' : '') + (t && t.cl ? '.' + t.cl : '')
        + (NETE.sel === cle ? '.sel' : ''), {
        title: e ? (e.nom || t.t) : colLettre(x) + (y + 1),
        onclick: () => {
          if (NETE.outil === 'gomme') { delete c.cases[cle]; NETE.sel = null; }
          else if (e && NETE.sel !== cle) { NETE.sel = cle; }
          else if (e && NETE.sel === cle) { NETE.sel = null; }
          else { c.cases[cle] = { type: NETE.outil, nom: '', notes: '', for: 0, um: 0 }; NETE.sel = cle; }
          maj(); redessine();
        }
      }, e ? h('i.nf', t.g) : null);
      ligne.appendChild(cel);
    }
    grille.appendChild(ligne);
  }

  /* --- Le détail de la case choisie --- */
  const detail = h('div.panel.net-detail');
  if (NETE.sel && c.cases[NETE.sel]) {
    const e = c.cases[NETE.sel], t = netType(e.type);
    const [x, y] = NETE.sel.split(',').map(Number);
    detail.appendChild(h('div.panel-h', h('h3', t.t + ' — ' + colLettre(x) + (y + 1)),
      h('div.sp'),
      h('button.btn.d.sm', { onclick: () => { delete c.cases[NETE.sel]; NETE.sel = null; maj(); redessine(); } }, 'Retirer')));
    detail.appendChild(h('p.muted', { style: { marginTop: 0 } }, t.aide));
    detail.appendChild(h('div.net-form',
      champ('Nom', e.nom, v => { e.nom = v; maj(); }),
      champ('FOR', e.for || 0, v => { e.for = +v || 0; maj(); }, { type: 'number', min: 0 }),
      champ('UM', e.um || 0, v => { e.um = +v || 0; maj(); }, { type: 'number', min: 0 }),
      h('label.net-ch', h('span', 'Type'),
        h('select', { onchange: ev => { e.type = ev.target.value; maj(); redessine(); } },
          ...NET_PAL.map(p => h('option', { value: p.id, selected: p.id === e.type ? 'selected' : null }, p.t))))));
    detail.appendChild(h('label.net-ch', { style: { marginTop: '8px' } }, h('span', 'Notes'),
      h('textarea', { rows: 3, oninput: ev => { e.notes = ev.target.value; maj(); } }, e.notes || '')));
  } else {
    detail.appendChild(h('p.muted', { style: { margin: 0 } },
      NETE.outil === 'gomme'
        ? "Touche une case pour la vider."
        : "Choisis un symbole dans la palette, puis touche une case pour le poser. "
        + "Touche un élément déjà posé pour le nommer et le décrire."));
  }

  /* --- La légende, montée depuis la carte --- */
  const leg = netLegende(c);

  wrap.appendChild(h('div.no-print', barre));
  wrap.appendChild(h('div.no-print', entete));
  wrap.appendChild(h('div.panel.no-print', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Génération rapide')),
    h('p.muted', { style: { marginTop: 0 } },
      "Le système du livre : 1D6 × niveau pour les CPU, quatre mémoires chacune, "
      + "mur de données à niveau + 1D6, programmes choisis selon le niveau. Remplace la carte en cours."),
    h('div.row.wrap', ...NET_SECU.map(s => h('button.btn.g.sm', {
      onclick: () => confirmer('Générer', `Remplacer la carte par une forteresse de niveau ${s.n} ?`, () => {
        const r = netGenerer(c, s.n);
        NETS.save(c); NETE.sel = null;
            toast(`${r.nbCpu} CPU, mur de FOR ${r.murFor}, ${r.programmes} programme(s).`, 'ok');
        redessine();
      })
    }, 'Niveau ' + s.n)))));
  wrap.appendChild(h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Le système')), chiffres));
  wrap.appendChild(h('div.no-print', pal));
  wrap.appendChild(h('div.net-plan', h('div.net-titre',
    h('b', c.nom || 'Forteresse sans nom'),
    h('span', (c.proprio ? c.proprio + ' · ' : '') + 'Niveau ' + c.secu
      + ' · INT ' + bilan.int + ' · Mur FOR ' + (c.murFor || '—'))), grille));
  wrap.appendChild(h('div.no-print', detail));
  wrap.appendChild(leg);
  return wrap;
};

/** La légende : un bloc par famille, avec les éléments nommés et leurs cases. */
function netLegende(c) {
  const box = h('div.panel.net-leg', { style: { marginTop: '12px' } },
    h('div.panel-h', h('h3', 'Légende')));
  const parType = {};
  Object.entries(c.cases).forEach(([cle, e]) => (parType[e.type] || (parType[e.type] = [])).push([cle, e]));
  const ordre = NET_PAL.map(p => p.id).filter(id => parType[id]);
  if (!ordre.length) {
    box.appendChild(h('p.muted', { style: { margin: 0 } }, 'Carte vide.'));
    return box;
  }
  const liste = h('div.net-leg-l');
  ordre.forEach(id => {
    const t = netType(id), els = parType[id];
    const cases = els.map(([cle]) => { const [x, y] = cle.split(',').map(Number); return colLettre(x) + (y + 1); });
    /* Les mémoires et les murs se comptent, ils ne se détaillent pas : quarante-huit
       lignes « 10 UM » identiques n'apprennent rien à personne. */
    const nommes = t.bref ? [] : els.filter(([, e]) => e.nom || e.notes || e.for || e.um);
    const resume = t.bref === 1 ? (els.length * 10) + ' UM au total'
      : t.bref === 2 ? 'FOR ' + (els[0][1].for || c.murFor || '—') : null;
    liste.appendChild(h('div.net-leg-i',
      h('i.nf' + (t.cl ? '.' + t.cl : ''), t.g),
      h('div',
        h('b', t.t + ' (' + els.length + ')'),
        resume ? h('span.cases', resume) : null,
        t.bref === 2 ? null
          : h('span.cases', cases.slice(0, 24).join(', ') + (cases.length > 24 ? '…' : '')),
        ...nommes.map(([cle, e]) => {
          const [x, y] = cle.split(',').map(Number);
          const bouts = [e.for ? 'FOR ' + e.for : null, e.um ? e.um + ' UM' : null].filter(Boolean).join(' · ');
          return h('div.net-leg-n', h('b', colLettre(x) + (y + 1)), ' ',
            e.nom || t.t, bouts ? ' — ' + bouts : '', e.notes ? ' — ' + e.notes : '');
        }))));
  });
  box.appendChild(liste);
  if (c.notes) box.appendChild(h('p', { style: { marginBottom: 0 } }, c.notes));
  return box;
}

function netExport(c) {
  const blob = new Blob([JSON.stringify({ app: 'cyberpunk-new-dawn', type: 'carte-net', v: 1, carte: c }, null, 2)],
    { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: (c.nom || 'carte').replace(/[^\w\-]+/g, '_') + '.json' });
  document.body.appendChild(a); a.click(); a.remove();
}

function netImport() {
  const inp = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const o = JSON.parse(fr.result);
        const c = o.carte || o;
        if (!c || !c.cases) throw new Error('pas une carte');
        c.id = uid();
        NETS.save(c);
        toast('Carte importée.', 'ok');
        route();
      } catch (e) { toast('Fichier illisible.', 'no'); }
    };
    fr.readAsText(f);
  };
  document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 1000);
}

/** Le titre du haut suit le nom tapé, sans redessiner la vue. */
function majTitre() {
  const c = NETS.courante(), t = $('.net-titre b');
  if (c && t) t.textContent = c.nom || 'Forteresse sans nom';
}

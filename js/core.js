/* ============================================================
   NOYAU : données, règles, stockage, rendu, routeur
   ============================================================ */
'use strict';

/* ---------- Données ----------
   Les tables du livre vivent dans data/*.json ; app.js les charge au démarrage
   et remplit cet objet avant le premier rendu. */
const DB = {};

/* ---------- Micro-DOM ---------- */
function h(tag, attrs, ...kids) {
  const parts = tag.split(/(?=[.#])/);
  const el = document.createElement(parts[0] || 'div');
  parts.slice(1).forEach(p => p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1)));
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = k => {
    if (k === null || k === undefined || k === false) return;
    if (Array.isArray(k)) return k.forEach(add);
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  };
  kids.forEach(add);
  return el;
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

/* ---------- Utilitaires ---------- */
const uid = () => 'c' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d = n => 1 + Math.floor(Math.random() * n);
const d10 = () => d(10);
const d100 = () => d(100);
const d6 = () => d(6);
const pick = a => a[Math.floor(Math.random() * a.length)];
const eb = n => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('fr-FR') + ' €$';
const noAcc = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = s => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = () => new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

/** Markdown très léger → HTML (titres, listes, gras, italique, sauts) */
function md(src) {
  if (!src) return '';
  const lines = String(src).replace(/\r/g, '').split('\n');
  let out = '', list = null;
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
  const closeList = () => { if (list) { out += `</${list}>`; list = null; } };
  for (let raw of lines) {
    const l = raw.trim();
    if (!l) { closeList(); continue; }
    let m;
    if ((m = l.match(/^###\s+(.*)/))) { closeList(); out += `<h3>${inline(m[1])}</h3>`; }
    else if ((m = l.match(/^##\s+(.*)/))) { closeList(); out += `<h2>${inline(m[1])}</h2>`; }
    else if ((m = l.match(/^#\s+(.*)/))) { closeList(); out += `<h2>${inline(m[1])}</h2>`; }
    else if ((m = l.match(/^[-–•*]\s+(.*)/))) { if (list !== 'ul') { closeList(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\d+[.)]\s+(.*)/))) { if (list !== 'ol') { closeList(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; }
    else { closeList(); out += `<p>${inline(l)}</p>`; }
  }
  closeList();
  return out;
}

/* ---------- Notifications ---------- */
function toast(msg, kind) {
  const box = $('#toasts') || document.body.appendChild(h('div#toasts'));
  const t = h('div.toast' + (kind ? '.' + kind : ''), msg);
  box.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 2900);
}

/* ---------- Modale ---------- */
function modal({ title, body, actions, wide }) {
  const ovl = h('div.ovl', { onclick: e => { if (e.target === ovl) close(); } });
  const close = () => { ovl.remove(); document.body.style.overflow = ''; };
  const m = h('div.modal', wide ? { style: { maxWidth: '900px' } } : null,
    h('div.mh', h('h3', title), h('button.btn.g.sm', { onclick: close, 'aria-label': 'Fermer' }, '✕')),
    h('div.mb', body),
    actions ? h('div.mf', ...actions.map(a =>
      h('button.btn' + (a.cls || '.g'), { onclick: () => { if (a.fn && a.fn() === false) return; if (a.keep !== true) close(); } }, a.label))) : null
  );
  ovl.appendChild(m);
  document.body.appendChild(ovl);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  return { close, el: m };
}
const confirmer = (title, text, onOk) => modal({
  title, body: h('p', { style: { margin: 0, color: 'var(--txt-2)' } }, text),
  actions: [{ label: 'Annuler' }, { label: 'Confirmer', cls: '.d', fn: onOk }]
});

/* ============================================================
   RÈGLES — Cyberpunk : New Dawn
   ============================================================ */
const RULES = {
  STATS: ['INT', 'EMP', 'REF', 'TECH', 'MV', 'BT', 'CON', 'SF', 'CH'],
  STAT_NAMES: {
    INT: 'Intelligence', EMP: 'Empathie', REF: 'Réflexe', TECH: 'Technique', MV: 'Mouvement',
    BT: 'Beauté', CON: 'Constitution', SF: 'Sang-froid', CH: 'Chance'
  },
  STAT_HINT: {
    INT: 'Comprendre, résoudre, retenir',
    EMP: 'Relations, charisme, humanité',
    REF: 'Dextérité, coordination, combat',
    TECH: 'Matériel, réparation, cyber',
    MV: 'Course, saut, initiative',
    BT: 'Aspect, impression, prestance',
    CON: 'Force, endurance, encaissement',
    SF: 'Stress, peur, douleur, torture',
    CH: 'Points de chance par partie'
  },
  POOL: 60, STAT_MIN: 2, STAT_MAX: 10,
  SKILL_BASE: 40,
  PA_START: 2, DEF_MAX_COUNT: 3, DEF_MAX_POINTS: 15,
  SACRIFICE_ADVISED: 5,

  /** Table de l'âge : [PC/an, total PC, niveau de compétence max] */
  AGE: {
    14: [4, 4, 4], 15: [4, 8, 4], 16: [3, 11, 5], 17: [3, 14, 5], 18: [3, 17, 6],
    19: [3, 20, 6], 20: [2, 22, 6], 21: [2, 24, 7], 22: [2, 26, 7], 23: [2, 28, 7],
    24: [1, 29, 7], 25: [1, 30, 8], 26: [1, 31, 8], 27: [1, 32, 8], 28: [1, 33, 8]
  },
  ageRow(age) {
    const a = clamp(Math.round(age || 18), 14, 90);
    if (a <= 28) return { an: RULES.AGE[a][0], tpc: RULES.AGE[a][1], max: RULES.AGE[a][2], extrapole: false };
    return { an: 1, tpc: 33 + (a - 28), max: 8, extrapole: true };
  },
  /** Points de compétence totaux : 40 + [INT+REF] + TPc de l'âge */
  skillPoints(ch) {
    const c = ch.caracs;
    return RULES.SKILL_BASE + (c.INT || 0) + (c.REF || 0) + RULES.ageRow(ch.age).tpc + (ch.pcBonus || 0);
  },
  /** Plafond de niveau à la création */
  skillCap(ch, nom) {
    if (noAcc(nom) === 'adrenaline') return 2;
    if (ch.regleStricte) return ch.specialite === nom ? 5 : 3;
    return RULES.ageRow(ch.age).max;
  },
  skillCoeff(nom) {
    const s = DB.skills.find(x => x.nom === nom);
    return s ? (s.coeff || 1) : 1;
  },
  /** Coût à la création : 1 point par niveau, × coefficient */
  skillCost(nom, niv) { return niv * RULES.skillCoeff(nom); },
  /** Coût en PC pour passer de `niv` à `niv+1` après la création */
  upCost(nom, niv) { return Math.max(1, niv) * 10 * RULES.skillCoeff(nom); },

  /** Modificateur de constitution (bandes de la p.11, qui lèvent le chevauchement de la p.12) */
  mc(con) {
    if (con >= 11) return 5;
    if (con >= 10) return 4;
    if (con >= 7) return 3;
    if (con >= 5) return 2;
    if (con >= 3) return 1;
    return 0;
  },
  mcLabel(con) {
    if (con >= 11) return 'Surhumaine';
    if (con >= 10) return 'Très forte';
    if (con >= 7) return 'Forte';
    if (con >= 5) return 'Moyenne';
    if (con >= 3) return 'Faible';
    return 'Très faible';
  },

  /** Points de caractéristiques alloués (60 − points sacrifiés pour de l'argent) */
  pool(ch) { return RULES.POOL - (ch.sacrifice || 0); },
  statSpent(ch) { return RULES.STATS.reduce((n, s) => n + (ch.caracs[s] || 0), 0); },

  /** Argent de départ : (INT + BT) × 1000, + 1000 par point de carac sacrifié */
  money(ch) { return ((ch.caracs.INT || 0) + (ch.caracs.BT || 0)) * 1000 + (ch.sacrifice || 0) * 1000; },

  /** Valeurs dérivées de la fiche */
  derived(ch) {
    const c = ch.caracs, mc = RULES.mc(c.CON || 0);
    const humMax = (c.EMP || 0) * 10;
    const humPerdue = RULES.humanityLost(ch);
    const empPerte = Math.floor(humPerdue / 10);
    const empAct = Math.max(0, (c.EMP || 0) - empPerte);
    const course = (c.MV || 0) * 5;
    return {
      mc, mcLabel: RULES.mcLabel(c.CON || 0),
      humMax, humPerdue, humRestante: Math.max(0, humMax - humPerdue), empPerte, empAct,
      sauvegarde: c.CON || 0,
      course, saut: Math.ceil(course / 3),
      porte: (c.CON || 0) * 5, deplace: (c.CON || 0) * 10,
      chance: c.CH || 0,
      seuilFracture: 4 + mc, seuilAmputation: 8 + mc,
      argent: RULES.money(ch),
      depense: RULES.spent(ch),
      reste: RULES.money(ch) - RULES.spent(ch),
      pcTotal: RULES.skillPoints(ch),
      pcDepense: RULES.skillSpent(ch),
      pcReste: RULES.skillPoints(ch) - RULES.skillSpent(ch),
      paTotal: RULES.PA_START + RULES.paGained(ch),
      paDepense: RULES.paSpent(ch),
      paReste: RULES.PA_START + RULES.paGained(ch) - RULES.paSpent(ch),
      nbEvenements: Math.max(0, (ch.age || 18) - 14 + 1)
    };
  },

  skillSpent(ch) { return (ch.competences || []).reduce((n, s) => n + RULES.skillCost(s.nom, s.niv), 0); },

  /** Toutes les lignes de cyber, pièces installées et options rattachées confondues */
  cyberFlat(ch) {
    const out = [];
    (ch.cyber || []).forEach(b => {
      out.push(b);
      (b.options || []).forEach(o => out.push(o));
    });
    return out;
  },
  /** Emplacements d'options consommés / disponibles sur une pièce */
  slotsUsed(rig) {
    return (rig.options || []).reduce((n, o) => n + (o.cout_slot === null || o.cout_slot === undefined ? 1 : Number(o.cout_slot)), 0);
  },
  slotsMax(rig) { return (rig.slots === null || rig.slots === undefined) ? null : Number(rig.slots); },
  slotsLeft(rig) {
    const m = RULES.slotsMax(rig);
    return m === null ? Infinity : m - RULES.slotsUsed(rig);
  },

  humanityLost(ch) {
    return Math.round(RULES.cyberFlat(ch).reduce((n, x) => n + (Number(x.humanite_moy) || 0) * (x.qte || 1), 0)
      + (ch.humaniteManuelle || 0));
  },
  spent(ch) {
    const s = a => (a || []).reduce((n, x) => n + (Number(x.prix) || 0) * (x.qte || 1), 0);
    return s(ch.inventaire) + s(RULES.cyberFlat(ch)) + (ch.depensesLibres || 0);
  },
  /** PA gagnés par les défauts (valeurs stockées négatives → gain positif) */
  paGained(ch) { return (ch.traits || []).filter(t => t.type === 'defaut').reduce((n, t) => n + Math.abs(t.cout), 0); },
  paSpent(ch) { return (ch.traits || []).filter(t => t.type === 'avantage').reduce((n, t) => n + Math.abs(t.cout), 0); },
  defectCount(ch) { return (ch.traits || []).filter(t => t.type === 'defaut').length; },
  defectPoints(ch) { return RULES.paGained(ch); },

  /** Contrôles de légalité de la création */
  audit(ch) {
    const dv = RULES.derived(ch), out = [];
    const spent = RULES.statSpent(ch), pool = RULES.pool(ch);
    if (spent !== pool) out.push({ k: 'caracs', bad: true, m: `Caractéristiques : ${spent} / ${pool} points alloués (${spent > pool ? 'dépassement de ' + (spent - pool) : 'reste ' + (pool - spent)}).` });
    RULES.STATS.forEach(s => {
      const v = ch.caracs[s];
      if (v < RULES.STAT_MIN || v > RULES.STAT_MAX) out.push({ k: 'caracs', bad: true, m: `${s} = ${v} : hors des bornes 2–10.` });
    });
    if ((ch.sacrifice || 0) > RULES.SACRIFICE_ADVISED) out.push({ k: 'caracs', bad: false, m: `${ch.sacrifice} points sacrifiés pour de l'argent : le livre conseille de ne pas dépasser 5.` });
    if (dv.pcReste < 0) out.push({ k: 'competences', bad: true, m: `Compétences : ${-dv.pcReste} points de trop.` });
    else if (dv.pcReste > 0) out.push({ k: 'competences', bad: false, m: `${dv.pcReste} point(s) de compétence non dépensés sur ${dv.pcTotal}. Rien ne l'interdit — l'exemple du livre en laisse 16 — mais tu peux encore les placer.` });
    (ch.competences || []).forEach(s => {
      const cap = RULES.skillCap(ch, s.nom);
      if (s.niv > cap) out.push({ k: 'competences', bad: true, m: `${s.nom} à ${s.niv} : le plafond est ${cap}.` });
    });
    if (ch.regleStricte && !ch.specialite && (ch.competences || []).length) out.push({ k: 'competences', bad: false, m: `Règle stricte active : désigne une compétence « spécialité » (la seule autorisée à 5).` });
    if (dv.paReste < 0) out.push({ k: 'traits', bad: true, m: `Avantages : ${-dv.paReste} PA de trop.` });
    if (RULES.defectCount(ch) > RULES.DEF_MAX_COUNT) out.push({ k: 'traits', bad: true, m: `${RULES.defectCount(ch)} défauts : le maximum est 3.` });
    if (RULES.defectPoints(ch) > RULES.DEF_MAX_POINTS) out.push({ k: 'traits', bad: true, m: `${RULES.defectPoints(ch)} points de défauts : le maximum est 15.` });
    if (dv.reste < 0) out.push({ k: 'achats', bad: true, m: `Budget dépassé de ${eb(-dv.reste)}.` });
    (ch.cyber || []).forEach(rig => {
      const m = RULES.slotsMax(rig);
      if (m !== null && RULES.slotsUsed(rig) > m)
        out.push({ k: 'achats', bad: true, m: `${rig.nom} : ${RULES.slotsUsed(rig)} emplacements d'options utilisés pour ${m} disponibles.` });
    });
    if (dv.empAct <= 0 && dv.humPerdue > 0) out.push({ k: 'achats', bad: true, m: `Empathie tombée à 0 : le personnage est un cyberpsychopathe, injouable en tant que PJ.` });
    else if (dv.empPerte > 0) out.push({ k: 'achats', bad: false, m: `${dv.humPerdue} points d'humanité perdus → EMP ${ch.caracs.EMP} ⇒ ${dv.empAct}. Pense aux compétences liées à l'EMP.` });
    const nbEv = (ch.evenements || []).length;
    if (nbEv < dv.nbEvenements) out.push({ k: 'evenements', bad: false, m: `${nbEv} / ${dv.nbEvenements} années d'événements tirées (une par année depuis 14 ans).` });
    return out;
  },

  /** Un personnage vierge */
  blank(over) {
    const c = {};
    RULES.STATS.forEach(s => c[s] = 5);
    return Object.assign({
      id: uid(), v: 1, cree: new Date().toISOString(),
      nom: '', joueur: '', concept: '', nature: '', attitude: '', age: 18,
      caracs: c, sacrifice: 0,
      competences: [], specialite: null, regleStricte: false,
      evenements: [], traits: [], inventaire: [], cyber: [], arts: [],
      humaniteManuelle: 0, depensesLibres: 0, pcBonus: 0,
      description: '', notes: '', journal: [],
      etape: 0, termine: false, quiz: null
    }, over || {});
  }
};

/* ---------- Tirages sur les tables d'événements de vie ----------
   Certaines tables du livre (4A, 5A, 6A) ne sont que des renvois :
   pas de plage de dés, mais une liste de tables à enchaîner.        */
function rollTable(id, ctx) {
  ctx = ctx || { depth: 0, steps: 0 };
  const t = DB.lifepath.tables[id];
  if (!t || ctx.depth > 10 || ctx.steps > 40) return [];
  const chain = nx => {
    const ids = Array.isArray(nx) ? nx : (nx ? [nx] : []);
    let acc = [];
    ids.forEach(nid => { acc = acc.concat(rollTable(nid, { depth: ctx.depth + 1, steps: ctx.steps + acc.length })); });
    return acc;
  };
  if (!(t.lignes || []).length) {
    const head = t.instruction ? [{ table: id, titre: t.titre, des: '—', jet: '—', texte: t.instruction }] : [];
    ctx.steps += head.length;
    return head.concat(chain(t.chaine));
  }
  const faces = /1D100|D100/i.test(t.des || '') ? 100 : 10;
  const r = d(faces);
  const line = t.lignes.find(l => r >= (l.min || 0) && r <= (l.max || 0)) || t.lignes[t.lignes.length - 1];
  if (!line) return [];
  ctx.steps++;
  const step = { table: id, titre: t.titre, des: t.des || `1D${faces}`, jet: r, texte: line.resultat };
  return [step].concat(chain(line.suite || line.chaine));
}
function rollLifeYear(annee) { return { annee, etapes: rollTable('1A') }; }

/* ============================================================
   STOCKAGE
   ============================================================ */
const STORE = {
  KEY: 'cpnd.v1',
  mem: null,
  _read() {
    if (this.mem) return this.mem;
    let raw = null;
    try { raw = localStorage.getItem(this.KEY); } catch (e) { }
    try { this.mem = raw ? JSON.parse(raw) : { chars: [], current: null, prefs: {} }; }
    catch (e) { this.mem = { chars: [], current: null, prefs: {} }; }
    if (!Array.isArray(this.mem.chars)) this.mem.chars = [];
    return this.mem;
  },
  _write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.mem)); return true; }
    catch (e) {
      // Mémoire pleine : on le dit à chaque fois, puisque rien n'est enregistré.
      if (/quota|exceed/i.test(String((e && e.name) + ' ' + (e && e.message)))) {
        toast("La mémoire du navigateur est pleine : rien n’a été enregistré. Exporte tes "
          + "personnages, puis supprime ceux dont tu n’as plus besoin.", 'no');
        return false;
      }
      STORE.warned || toast("Sauvegarde locale indisponible ici : pense à exporter en JSON.", 'no');
      STORE.warned = 1;
      return false;
    }
  },
  all() { return this._read().chars; },
  get(id) { return this.all().find(c => c.id === id) || null; },
  current() { const s = this._read(); return s.current ? this.get(s.current) : null; },
  setCurrent(id) { this._read().current = id; this._write(); },
  save(ch) {
    const s = this._read(), i = s.chars.findIndex(c => c.id === ch.id);
    ch.maj = new Date().toISOString();
    if (i < 0) s.chars.unshift(ch); else s.chars[i] = ch;
    s.current = ch.id; this._write(); return ch;
  },
  remove(id) {
    const s = this._read();
    s.chars = s.chars.filter(c => c.id !== id);
    if (s.current === id) s.current = s.chars[0] ? s.chars[0].id : null;
    this._write();
  },
  prefs() { return this._read().prefs || (this._read().prefs = {}); },
  setPref(k, v) { this.prefs()[k] = v; this._write(); },

  exportAll() {
    const blob = new Blob([JSON.stringify({ app: 'cyberpunk-new-dawn', v: 1, date: new Date().toISOString(), chars: this.all() }, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `cpnd-persos-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.appendChild(a); a.click(); a.remove();
  },
  exportOne(ch) {
    const blob = new Blob([JSON.stringify({ app: 'cyberpunk-new-dawn', v: 1, chars: [ch] }, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${(ch.nom || 'perso').replace(/[^\w\-]+/g, '_')}.json` });
    document.body.appendChild(a); a.click(); a.remove();
  },
  importFile() {
    const inp = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const o = JSON.parse(fr.result);
          const list = Array.isArray(o) ? o : (o.chars || [o]);
          let n = 0;
          list.forEach(c => {
            if (!c || !c.caracs) return;
            const ch = Object.assign(RULES.blank(), c);
            if (STORE.get(ch.id)) ch.id = uid();
            STORE.save(ch); n++;
          });
          toast(n ? `${n} personnage(s) importé(s).` : "Aucun personnage valide dans ce fichier.", n ? 'ok' : 'no');
          route();
        } catch (e) { toast("Fichier illisible.", 'no'); }
      };
      fr.readAsText(f);
    };
    document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 1000);
  }
};

/* ============================================================
   ROUTEUR
   ============================================================ */
const VIEWS = {};
const NAV = [
  { r: 'accueil', ic: '◈', t: 'Accueil', s: 'Accueil' },
  { r: 'quiz', ic: '◉', t: 'Questionnaire', s: 'Quiz' },
  { r: 'creation', ic: '⬢', t: 'Création', s: 'Créer' },
  { r: 'aleatoire', ic: '⚄', t: 'Aléatoire', s: 'Aléa' },
  { r: 'fiche', ic: '▤', t: 'Fiche', s: 'Fiche' },
  { r: 'progression', ic: '▲', t: 'Progression', s: 'Progrès' },
  { r: 'codex', ic: '❑', t: 'Codex', s: 'Codex' }
];
/** Le fichier qui porte chaque section du site */
const PAGES = {
  accueil: 'index.html', quiz: 'questionnaire.html', creation: 'creation.html',
  aleatoire: 'aleatoire.html', fiche: 'fiche.html', progression: 'progression.html',
  codex: 'codex.html'
};
/** Le site existe en deux formes : un vrai site (une page par section) et un fichier
    unique hors ligne, où la navigation se fait par le fragment d'adresse. */
const MONO = !!(document.body && document.body.dataset.mono === '1');
/** La section affichée par la page courante, déclarée par <body data-page="…"> */
const PAGE = MONO ? null : ((document.body && document.body.dataset.page) || 'accueil');

/** L'adresse d'une route : « codex/armures » → « codex.html#armures » */
function lien(r) {
  if (MONO) return '#/' + r;
  const seg = String(r).split('/');
  const f = PAGES[seg[0]] || 'index.html';
  return f + (seg.length > 1 ? '#' + seg.slice(1).join('/') : '');
}
/** Aller à une route : on reste dans la page si c'est la même section, sinon on change de page. */
function go(r) {
  if (MONO) {
    if (location.hash === '#/' + r) route(); else location.hash = '/' + r;
    return;
  }
  const seg = String(r).split('/');
  if (seg[0] !== PAGE) { location.href = lien(r); return; }
  const frag = seg.slice(1).join('/');
  const vise = frag ? '#' + frag : '';
  if (vise === location.hash) route();          // même fragment : pas d'événement, on redessine
  else if (frag) location.hash = frag;          // hashchange → route()
  else { history.replaceState(null, '', location.pathname + location.search); route(); }
}
function currentRoute() {
  const frag = (location.hash || '').replace(/^#\/?/, '');
  if (MONO) {
    const seg = frag.split('/');
    return { r: seg[0] || 'accueil', a: seg.slice(1) };
  }
  return { r: PAGE, a: frag ? frag.split('/') : [] };
}
/** Rafraîchit le bandeau du haut et le pied de page, sans redessiner la vue.
    À utiliser pendant la frappe : redessiner ferait perdre le curseur. */
function majEntete() {
  const ch = STORE.current(), r = currentRoute().r;
  const who = $('#topWho');
  if (who) {
    clear(who);
    if (ch) who.appendChild(h('span', h('b', ch.nom || 'Sans nom'), ' · ',
      (ch.concept || 'sans concept'), ' · ', ch.age + ' ans'));
  }
  const fl = $('#footLabel');
  if (fl) fl.textContent = ch && r !== 'codex' && r !== 'accueil'
    ? (ch.nom || 'Sans nom') : 'Cyberpunk : New Dawn';
}

function route() {
  const { r, a } = currentRoute();
  const v = VIEWS[r] || VIEWS.accueil;
  const host = $('#view');
  if (!host) return;
  clear(host);
  $('#topTitle').textContent = (NAV.find(n => n.r === r) || {}).t || 'Accueil';
  try { majEntete(); } catch (e) { console.error(e); }
  $$('#rail a').forEach(el => el.classList.toggle('on', el.dataset.r === r));
  let contenu;
  try { contenu = v(a) || h('div'); }
  catch (e) { console.error(e); contenu = panneauPanne(e, r, a); }
  host.appendChild(contenu);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------- Filet de sécurité ----------
   Un personnage enregistré peut contenir une donnée que le code n'attend pas
   (fichier importé d'une ancienne version, enregistrement interrompu…). Sans filet,
   la page resterait vide et sans explication, et comme la donnée est enregistrée,
   elle le resterait à chaque visite. On affiche donc l'erreur et, surtout, de quoi
   s'en sortir sans passer par la console du navigateur. */

/** Redessine la vue en isolant chaque personnage, pour repérer celui qui fait planter.
    Aucune écriture pendant le test : la sauvegarde est neutralisée le temps de l'essai. */
function personnagesFautifs(r, a) {
  const v = VIEWS[r] || VIEWS.accueil;
  const s = STORE._read();
  const tous = s.chars.slice(), courant = s.current, ecrire = STORE._write;
  const fautifs = [];
  STORE._write = () => true;
  try {
    tous.forEach(c => {
      s.chars = [c]; s.current = c && c.id;
      try { v(a); } catch (e) { fautifs.push({ ch: c, err: e }); }
    });
  } catch (e) { /* on renvoie ce qu'on a */ }
  finally { s.chars = tous; s.current = courant; STORE._write = ecrire; }
  return fautifs;
}

function panneauPanne(err, r, a) {
  let fautifs = [];
  try { fautifs = personnagesFautifs(r, a); } catch (e) { }
  const nomDe = c => (c && c.nom) || 'Sans nom';
  const detail = String((err && err.message) || err) +
    ((err && err.stack) ? ' — ' + String(err.stack).split('\n')[1].trim() : '');

  const ecarter = c => {
    try { STORE.exportOne(c); } catch (e) { }
    STORE.remove(c.id);
    toast(`« ${nomDe(c)} » a été écarté ; son fichier JSON vient d'être téléchargé.`, 'ok');
    route();
  };

  const p = h('div.panel.rise',
    h('div.tag.a', 'Affichage interrompu'),
    h('h3', { style: { marginTop: '10px' } }, 'Cette page n’a pas pu s’afficher'),
    h('p', { style: { color: 'var(--txt-2)' } },
      fautifs.length
        ? "Un personnage enregistré contient une donnée que le code n’attend pas. Le reste du site fonctionne : il suffit de mettre ce personnage de côté."
        : "Le site a rencontré une erreur en construisant cette page. Tes personnages sont intacts — commence par les exporter, par précaution."),
    h('p.mono', { style: { fontSize: '12px', color: 'var(--txt-2)', wordBreak: 'break-word' } }, detail));

  if (fautifs.length) {
    p.appendChild(h('div.row.wrap', { style: { marginTop: '12px' } },
      ...fautifs.map(f => h('span.chip.m', nomDe(f.ch)))));
  }

  const boutons = h('div.row.wrap', { style: { marginTop: '14px' } },
    h('button.btn.p', { onclick: () => STORE.exportAll() }, 'Tout exporter'),
    ...fautifs.map(f => h('button.btn.d', { onclick: () => ecarter(f.ch) },
      `Écarter « ${nomDe(f.ch)} »`)),
    h('button.btn.g', { onclick: () => route() }, 'Réessayer'),
    h('a.btn.g', { href: lien('accueil') }, 'Accueil'));
  p.appendChild(boutons);

  p.appendChild(h('p.muted', { style: { marginBottom: 0, marginTop: '12px' } },
    "« Écarter » télécharge le personnage en JSON avant de le retirer d’ici : rien n’est perdu, "
    + "et tu peux me le renvoyer pour que la cause soit corrigée. En dernier recours, ",
    h('a', {
      href: 'javascript:void 0',
      onclick: () => confirmer('Tout effacer',
        "Effacer tous les personnages enregistrés dans ce navigateur ? À ne faire qu’après un export.",
        () => { try { localStorage.removeItem(STORE.KEY); } catch (e) { } STORE.mem = null; route(); })
    }, 'tout effacer'), '.'));
  return p;
}
window.addEventListener('hashchange', route);

/* ---------- Fragments partagés ---------- */
function sectionTitle(k, title, desc) {
  return h('div.sect', h('div.k', k), h('h2', title), desc ? h('p', desc) : null);
}
/** Intercalaire noir, repris des pages de chapitre du livre */
function chapDiv(num, titre, sous) {
  return h('div.chapdiv',
    h('div.cw', 'Chapitre'),
    h('div.cb',
      h('div.cn', '- ' + num + ' -'),
      h('div.ct', titre),
      sous ? h('div.cs', sous) : null));
}
function meter(pct, kind) {
  return h('div.meter' + (kind ? '.' + kind : ''), h('i', { style: { width: clamp(pct, 0, 100) + '%' } }));
}
function needChar(msg) {
  return h('div.panel.rise',
    h('div.tag.a', 'Aucun personnage actif'),
    h('p', { style: { color: 'var(--txt-2)' } }, msg || "Crée un personnage ou sélectionnes-en un dans le roster de l'accueil."),
    h('div.row.wrap',
      h('button.btn.p', { onclick: () => { STORE.save(RULES.blank()); go('creation'); } }, 'Nouveau personnage'),
      h('button.btn.g', { onclick: () => go('quiz') }, 'Passer le questionnaire'),
      h('button.btn.g', { onclick: () => go('accueil') }, 'Voir le roster'))
  );
}
/** Tableau générique { colonnes:[], lignes:[[]] } */
function dataTable(cols, rows, numericFrom) {
  return h('div.dt-wrap', h('table.dt',
    h('thead', h('tr', ...cols.map(c => h('th', c)))),
    h('tbody', ...rows.map(r => h('tr', ...r.map((c, i) =>
      h('td' + (numericFrom !== undefined && i >= numericFrom ? '.n' : ''), { html: md(String(c === null || c === undefined ? '—' : c)).replace(/^<p>|<\/p>$/g, '') })))))
  ));
}

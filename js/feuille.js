/* ============================================================
   FEUILLE DE PERSONNAGE — le document de Sandrine, rendu interactif
   Le fond de chaque page est son PDF ; les champs de saisie sont
   posés exactement sur les cases de son document.
   ============================================================ */
'use strict';

/* Correspondance entre le nom des compétences sur la feuille et celui du codex */
const FEUILLE_ALIAS = {
  'Armes Lourdes': ['ARMES LOURDE'],
  'Tir à l’arc / Arbalète': ["TIR A L'ARC / ARBALETE"],
  'Conduite Engin Lourd': ["CONDUITE D'ENGINS LOURDS"],
  'Conduite Automobile': ['CONDUIRE AUTOMOBILE'],
  'Conduite Moto': ['CONDUIRE MOTO'],
  'Education (culture générale)': ['EDUCATION'],
  'Pister': ['SUIVRE / PISTER'],
  'Crochetage': ['CROCHETER'],
  'Photos et Films': ['PHOTOS & FILMS'],
  'Utilisation Caisson Cryo': ['UTILISER CAISSON CRYO'],
  'Resister torture': ['RESISTER TORTURE / DROGUE'],
  'Baratin et persuasion': ['BARATIN & PERSUASION'],
  'Aérotech': ['AV-TECH'],
  'Lutte': ['BAGARRE'],
  'Piloter Avion': ['PILOTER'],
  'Langue 1': ['LANGUES ETRANGÈRES']
};
const alias = nom => [nom].concat(FEUILLE_ALIAS[nom] || []).map(noAcc);

/* Les dix cases de cybernétique de la page 4 et la catégorie de la boutique qui s'y range */
const FICHE_CYB = {
  acc: 'Accessoires de mode', bio: 'Biomatériel', btq: 'Biotech Euro', sex: 'Chirurgie sexuelle',
  imp: 'Implants cybernétiques', neu: 'Neuromatériel', puc: 'Puces', sen: 'Senseurs',
  tra: 'Transplants', aud: 'Cyberaudio'
};
/* Les catégories sans case dédiée sont versées aux implants */
const FICHE_REPLI = { 'Cyberarmes': 'imp', 'Déclencheurs': 'imp', 'Exosquelettes et endosquelettes': 'imp' };
const FICHE_ZONES = ['tete', 'torse', 'brasD', 'brasG', 'jambeD', 'jambeG'];

/* ---------- Modèle ---------- */
function ensureF(ch) {
  const f = ch.f || (ch.f = {});
  const d = (k, v) => { if (f[k] === undefined || f[k] === null) f[k] = v; };
  d('joueur', ''); d('pseudonyme', ''); d('occupation', ''); d('reputation', ''); d('cyberpsychose', '');
  d('initiative', ''); d('psy', 0); d('degats', 0);
  d('idnom', ''); d('idalias', ''); d('genre', ''); d('taille', ''); d('poids', '');
  d('yeux', ''); d('signe', ''); d('ne', ''); d('langues', ''); d('style', ''); d('style2', '');
  d('eurodollars', ''); d('histoire', ''); d('confdesc', ''); d('ressdesc', '');
  d('pa', {}); d('mun', {}); d('specs', {}); d('t', {}); d('g', {}); d('autoFait', []);
  if (!ch.xp) ch.xp = {};
  migrerFeuille(ch, f);
  reparerPA(ch, f);
  return f;
}
/** Reprise des feuilles enregistrées avec la version précédente */
function migrerFeuille(ch, f) {
  if (f.v2) return;
  const t = f.t;
  const cp = (src, blk, cols) => {
    if (!Array.isArray(src)) return;
    src.forEach((r, i) => {
      if (!r || !Object.keys(r).length) return;
      const row = (t[blk] || (t[blk] = {}))[i] || ((t[blk])[i] = {});
      cols.forEach(([a, b]) => { if (r[a] !== undefined && r[a] !== '') row[b] = r[a]; });
    });
  };
  cp(f.ev, 'ev', [['age', 'age'], ['evt', 'evt'], ['cons', 'cons']]);
  cp(f.amis, 'ami', [['nom', 'nom'], ['prof', 'prof'], ['lien', 'lien'], ['loy', 'loy']]);
  cp(f.ennemis, 'enn', [['nom', 'nom'], ['prof', 'prof'], ['conflit', 'conflit'], ['veut', 'veut']]);
  cp(f.rep, 'rep', [['niv', 'niv'], ['quoi', 'quoi'], ['aupres', 'aupres']]);
  cp(f.casier, 'cas', [['crime', 'crime'], ['prio', 'prio'], ['peine', 'peine'], ['statut', 'statut']]);
  cp(f.permis, 'per', [['type', 'type'], ['num', 'num'], ['val', 'val']]);
  cp(f.contacts, 'cont', [['nom', 'nom'], ['occ', 'occ'], ['inf', 'inf'], ['loy', 'loy']]);
  cp(f.blessures, 'bles', [['bl', 'bl'], ['effet', 'effet']]);
  cp(f.armures, 'arm', [['nom', 'nom'], ['type', 'type'], ['empl', 'empl'], ['pa', 'pa'], ['ps', 'ps']]);
  cp(f.armes, 'wpn', [['nom', 'nom'], ['prec', 'prec'], ['dom', 'dom'], ['dissim', 'dissim'],
  ['charcad', 'charcad'], ['fiab', 'fiab']]);
  if (f.ident) {
    const m = { nom: 'idnom', alias: 'idalias', genre: 'genre', taille: 'taille', poids: 'poids',
      yeux: 'yeux', signe: 'signe', ne: 'ne', langues: 'langues', style: 'style' };
    Object.keys(m).forEach(k => { if (f.ident[k]) f[m[k]] = f.ident[k]; });
  }
  if (f.confrerie) f.g.conf = { type: f.confrerie.type, rang: f.confrerie.rang, taille: f.confrerie.taille,
    estime: f.confrerie.a, ressource: f.confrerie.b };
  if (f.confrerie && f.confrerie.desc) f.confdesc = f.confrerie.desc;
  if (f.ressources) f.g.ress = { type: f.ressources.type, rang: f.ressources.rang, taille: f.ressources.taille,
    respect: f.ressources.a, statut: f.ressources.b };
  if (f.ressources && f.ressources.desc) f.ressdesc = f.ressources.desc;
  if (f.membres) {
    const M = { optiqueD: 'opD', optiqueG: 'opG', brasD: 'brD', brasG: 'brG', mainD: 'maD',
      mainG: 'maG', jambeD: 'jaD', jambeG: 'jaG', piedD: 'piD', piedG: 'piG' };
    Object.keys(M).forEach(k => {
      const m = f.membres[k]; if (!m) return;
      const b = M[k];
      if (m.pa || m.ps || m.nopt) t[b] = { 0: { pa: m.pa || '', ps: m.ps || '', nopt: m.nopt || '' } };
      cp(m.rows, b + 'm', [['nom', 'nom'], ['effet', 'effet']]);
    });
  }
  ['ev', 'amis', 'ennemis', 'rep', 'casier', 'permis', 'contacts', 'blessures', 'armures', 'armes',
    'ident', 'confrerie', 'ressources', 'membres', 'cyber'].forEach(k => delete f[k]);
  f.v2 = 1;
}

/** Les premières versions collaient bout à bout les nombres d'une armure à deux valeurs
    (« 18 » et « 14 » devenaient « 1814 ») : on efface ces valeurs aberrantes. */
function reparerPA(ch, f) {
  if (f.paOk) return;
  FICHE_ZONES.forEach(z => {
    const v = parseInt(f.pa[z]);
    if (!isNaN(v) && v > 40) f.pa[z] = '';
  });
  f.paOk = 1;
}

/* ---------- Accès aux valeurs ---------- */
let saveTimer = null;
function touch(ch) { clearTimeout(saveTimer); saveTimer = setTimeout(() => STORE.save(ch), 250); }

function rowObj(f, blk, i) {
  const b = f.t[blk] || (f.t[blk] = {});
  return b[i] || (b[i] = {});
}
function grpObj(f, nom) { return f.g[nom] || (f.g[nom] = {}); }

/** Niveau d'une compétence, en tenant compte des autres orthographes */
function skIndex(ch, nom) {
  const ks = alias(nom);
  return (ch.competences || []).findIndex(x => ks.includes(noAcc(x.nom)));
}
function skGet(ch, nom) { const i = skIndex(ch, nom); return i >= 0 ? ch.competences[i].niv : ''; }
function skSet(ch, nom, v) {
  const list = ch.competences || (ch.competences = []);
  const i = skIndex(ch, nom), n = parseInt(v);
  if (isNaN(n) || n <= 0) { if (i >= 0) list.splice(i, 1); }
  else if (i >= 0) list[i].niv = n;
  else list.push({ nom, niv: n, spec: '' });
}

/* ---------- Vue ---------- */
SOUS.feuille = function () {
  const ch = STORE.current();
  if (!ch) return needChar("La feuille s'applique à un personnage.");
  const f = ensureF(ch);
  if (reporterAchats(ch, f)) STORE.save(ch);

  const wrap = h('div.feuille-wrap');
  const dv = RULES.derived(ch);
  wrap.appendChild(h('div.panel.no-print', { style: { marginBottom: '14px' } },
    h('div.row.wrap',
      h('div.grow',
        h('div', { style: { font: '700 22px/1 var(--f-disp)', textTransform: 'uppercase', letterSpacing: '.03em' } },
          ch.nom || 'Sans nom'),
        h('div.muted', { style: { fontSize: '14px', marginTop: '3px' } },
          `${ch.concept || 'sans concept'} · ${ch.age} ans · ${(ch.competences || []).length} compétences · ${eb(dv.reste)} restants`)),
      h('button.btn.p.sm', { onclick: () => window.print() }, 'Imprimer la feuille'),
      h('button.btn.g.sm', { onclick: () => go('creation') }, 'Création assistée'),
      h('button.btn.g.sm', { onclick: () => STORE.exportOne(ch) }, 'Exporter'),
      h('button.btn.g.sm', { onclick: () => go('accueil') }, 'Changer de personnage')),
    h('p.muted', { style: { margin: '10px 0 0', fontSize: '13.5px' } },
      "Ta feuille, en fond, telle que tu l'as dessinée : les champs sont posés sur tes cases. "
      + "Tout se sauvegarde au fil de la frappe. Les cases calculées (seuils, modificateur, PC) se remplissent seules. "
      + "Dans les compétences, la 1re colonne est le niveau, la 2e l'expérience accumulée. "
      + "L'impression sort les quatre pages à l'identique.")));

  DB.fiche_layout.pages.forEach(pg => wrap.appendChild(pageFiche(ch, f, pg)));
  setTimeout(() => majFiche(ch, f), 0);   // les cases grises, une fois la page en place
  return wrap;
};

function pageFiche(ch, f, pg) {
  const el = h('div.fpage', { dataset: { p: String(pg.n) } });
  pg.fields.forEach(fd => {
    const n = champ(ch, f, fd);
    if (!n) return;
    n.style.left = fd.x + '%'; n.style.top = fd.y + '%';
    n.style.width = fd.w + '%'; n.style.height = fd.h + '%';
    el.appendChild(n);
  });
  return el;
}

/** Fabrique l'élément correspondant à un champ de la carte */
function champ(ch, f, fd) {
  const [type, a, b, c] = fd.r.split(':');
  const cls = 'ff' + (fd.a === 'c' ? ' ctr' : '') + (fd.s ? ' ' + fd.s : '');

  const inp = (get, set, extra) => {
    const el = h('input', Object.assign({
      type: 'text', class: cls, value: get() === undefined || get() === null ? '' : String(get()),
      oninput: e => { set(e.target.value); touch(ch); }
    }, extra || {}));
    return el;
  };
  const libre = (obj, key) => inp(() => obj[key], v => obj[key] = v);

  switch (type) {
    case 'nom': return inp(() => ch.nom, v => { ch.nom = v; });
    case 'age': return inp(() => ch.age, v => { const n = parseInt(v); if (!isNaN(n)) ch.age = clamp(n, 1, 120); majFiche(ch, f); });
    case 'f': return libre(f, a);
    case 'psy': return libre(f, 'psy');
    case 'pa': return libre(f.pa, a);
    case 'mun': return libre(f.mun, fd.r.slice(4));
    case 'spec': return libre(f.specs, fd.r.slice(5));
    case 'grp': return libre(grpObj(f, a), b);
    case 'row': return libre(rowObj(f, a, b), c);
    case 'car': return inp(() => ch.caracs[a], v => {
      const n = parseInt(v); if (!isNaN(n)) ch.caracs[a] = clamp(n, 0, 20); majFiche(ch, f);
    });
    case 'ta': {
      const el = h('textarea', {
        class: 'ff fa' + (fd.s ? ' ' + fd.s : ''),
        oninput: e => { f[a] = e.target.value; touch(ch); }
      }, f[a] || '');
      return el;
    }
    case 'calc': {
      return h('span.ff.calc.ctr' + (fd.s ? '.' + fd.s : ''), { dataset: { calc: a } });
    }
    case 'pv': {
      const n = parseInt(a);
      const el = h('span.pvb' + ((f.degats || 0) > n ? '.on' : ''), {
        dataset: { pv: String(n) },
        onclick: () => {
          f.degats = (f.degats > n) ? n : n + 1;
          touch(ch);
          $$('.pvb').forEach(x => x.classList.toggle('on', f.degats > parseInt(x.dataset.pv)));
        }
      });
      return el;
    }
    case 'sk': {
      const nom = fd.r.slice(3, fd.r.length - 2);
      if (fd.r.endsWith(':n')) {
        return inp(() => skGet(ch, nom), v => { skSet(ch, nom, v); });
      }
      return inp(() => ch.xp[nom], v => { if (v === '') delete ch.xp[nom]; else ch.xp[nom] = v; });
    }
  }
  return null;
}

/** Recalcule les cases grises */
function majFiche(ch, f) {
  const dv = RULES.derived(ch);
  const v = { frac: dv.seuilFracture, amp: dv.seuilAmputation, mc: (dv.mc >= 0 ? '+' : '') + dv.mc,
    pc: RULES.skillSpent(ch) + ' / ' + RULES.skillPoints(ch) };
  $$('.calc').forEach(el => { el.textContent = v[el.dataset.calc] !== undefined ? v[el.dataset.calc] : ''; });
}


/** Les localisations couvertes, d'après le texte « Protège… » de l'armure */
function zonesCouvertes(txt) {
  const t = noAcc(txt || '');
  if (!t || /(toutes les localisations|tout le corps|integral)/.test(t)) return FICHE_ZONES.slice();
  const out = [];
  if (/tete|casque|crane|facial|capuche/.test(t)) out.push('tete');
  if (/torse|buste|poitrine|thorax|gilet/.test(t)) out.push('torse');
  if (/bras|membre/.test(t)) out.push('brasD', 'brasG');
  if (/jambe|pantalon|membre/.test(t)) out.push('jambeD', 'jambeG');
  return out.length ? out : FICHE_ZONES.slice();
}

/** Lit la protection d'une armure : « 14 PA », « PA tête/torse : 18 ; membres : 14 », « +10 PA »… */
function paParZone(sp, zones) {
  const brut = String(sp || '');
  const t = noAcc(brut);
  const nb = (brut.match(/\d+/g) || []).map(Number);
  const couvre = zonesCouvertes(zones);
  const out = { zones: {}, libelle: '', bonus: /^\s*\+/.test(brut) };
  if (!nb.length) return out;
  const tousLes = v => couvre.forEach(z => out.zones[z] = v);
  /* deux valeurs distinctes : tête et torse d'un côté, membres de l'autre */
  if (nb.length >= 2 && /(tete|torse)/.test(t) && /(membre|bras|jambe)/.test(t)) {
    const haut = nb[0], bas = nb[1];
    const met = (z, v) => { if (couvre.includes(z)) out.zones[z] = v; };
    met('tete', haut); met('torse', haut);
    met('brasD', bas); met('brasG', bas); met('jambeD', bas); met('jambeG', bas);
    out.libelle = haut + '/' + bas;
    return out;
  }
  /* une seule valeur de PA — on ignore les PS et autres nombres qui suivent */
  const m = /(\d+)\s*(?:pa|sr|sp)?\b/.exec(t);
  const v = m ? Number(m[1]) : nb[0];
  tousLes(v);
  out.libelle = (out.bonus ? '+' : '') + v;
  return out;
}

/* ---------- Report automatique des achats ---------- */
/** Nombre de lignes réellement disponibles dans chaque bloc de la feuille */
let FICHE_ROWS = null;
function ficheRows() {
  if (FICHE_ROWS) return FICHE_ROWS;
  const R = {};
  DB.fiche_layout.pages.forEach(p => p.fields.forEach(f => {
    const m = /^row:([^:]+):(\d+):/.exec(f.r);
    if (m) R[m[1]] = Math.max(R[m[1]] || 0, parseInt(m[2]) + 1);
  }));
  return (FICHE_ROWS = R);
}

function reporterAchats(ch, f) {
  const R = ficheRows();
  const fait = f.autoFait || (f.autoFait = []);
  const libre = (blk, max) => {
    const t = f.t[blk] || (f.t[blk] = {});
    for (let i = 0; i < max; i++) {
      const r = t[i];
      if (!r || !Object.keys(r).some(k => String(r[k] || '').trim())) return i;
    }
    return -1;
  };
  let n = 0;
  const pose = (blk, cle, vals) => {
    if (fait.includes(cle)) return;
    const i = libre(blk, R[blk] || 0);
    fait.push(cle); n++;
    if (i < 0) return;
    Object.assign(rowObj(f, blk, i), vals);
  };

  /* Cybernétique par catégorie */
  RULES.cyberFlat(ch).forEach((c, k) => {
    const sec = FICHE_REPLI[c.categorie]
      || Object.keys(FICHE_CYB).find(s => FICHE_CYB[s] === c.categorie);
    if (!sec) return;
    pose(sec, 'cyb:' + c.nom + ':' + k, { nom: c.nom, effet: (c.effets || c.desc || '').slice(0, 70) });
  });
  /* Armures et armes */
  (ch.inventaire || []).forEach((it, k) => {
    if (it.type === 'armure') {
      const z = paParZone(it.sp, it.zones);
      pose('arm', 'arm:' + it.nom + ':' + k,
        { nom: it.nom, type: it.zones || '', empl: 'Corps', pa: z.libelle });
      /* le report des PA par localisation ne remplit que les cases encore vides */
      FICHE_ZONES.forEach(zn => {
        const v = z.zones[zn];
        if (v === null || v === undefined) return;
        if (z.bonus) f.pa[zn] = (parseInt(f.pa[zn]) || 0) + v;
        else if (!String(f.pa[zn] || '').trim()) f.pa[zn] = String(v);
      });
    } else if (it.type === 'arme') {
      pose('wpn', 'wpn:' + it.nom + ':' + k, {
        nom: it.nom, prec: it.prec || '', dom: it.degats || '', dissim: it.dissimulation || '',
        charcad: [it.chargeur, it.cadence].filter(Boolean).join('/'),
        fiab: [it.fiabilite, it.portee].filter(Boolean).join('/')
      });
    } else if (it.type === 'munition' && it.calibre) {
      const cal = calibreFeuille(it.calibre);
      if (cal && !fait.includes('mun:' + cal + ':' + k)) {
        fait.push('mun:' + cal + ':' + k); n++;
        f.mun[cal] = String((parseInt(f.mun[cal]) || 0) + (it.nb || 0));
      }
    }
  });
  /* Avantages et défauts */
  (ch.traits || []).forEach((t, k) => {
    const blk = t.type === 'defaut' ? 'df' : 'av';
    pose(blk, 'tr:' + t.nom + ':' + k,
      { nom: t.nom, effet: t.note || '', pa: (t.cout > 0 ? '+' : '') + t.cout });
  });
  return n;
}

/** Le calibre tel qu'il est écrit sur la feuille, ou null */
const FICHE_CAL = ['.38', '.41', '.44', '.45', '.357', '5 mm', '6 mm', '9 mm', '10 mm',
  '11 mm', '12 mm', '14 mm', '15 mm', '5.56', '.177', '25 mm', '7.72', '20 mm'];
const norCal = c => noAcc(String(c || '')).replace(/\s+/g, '').replace(/^cal\./, '.').replace(/^(\d+)ga$/, '.$1');
function calibreFeuille(cal) {
  const n = norCal(cal);
  if (n === '7.62') return '7.72';
  return FICHE_CAL.find(c => norCal(c) === n) || null;
}

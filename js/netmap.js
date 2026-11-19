/* ============================================================
   CARTE DU NET
   Une forteresse de données se dessine sur une sous-grille : vingt colonnes
   de A à T, vingt lignes de 1 à 20 (Livre du Net, p. 85). On y pose des CPU,
   leurs mémoires, des murs de données, des grilles codées, des fichiers et
   les programmes de défense ; la légende et la fiche du système se montent
   toutes seules, et le tout s'imprime.

   Une forteresse tient sur plusieurs NIVEAUX — les sous-grilles du livre,
   celles que relient les ascenseurs. Ils se rangent comme les feuilles d'un
   tableur : un onglet par niveau sous la grille. Chaque niveau a sa propre
   taille ; le 20 × 20 du livre n'est plus qu'un point de départ.
   ============================================================ */
'use strict';

/* La grille du livre, qui reste la taille par défaut d'un niveau neuf. */
const NET_COLS = 20, NET_LIGNES = 20;
/* Les bornes : en dessous il n'y a plus de place, au-dessus la grille ne
   s'imprime plus et devient illisible à l'écran. */
const NET_MIN = 4, NET_COLS_MAX = 40, NET_LIGNES_MAX = 60;

/* L'intelligence du système.
   Le livre écrit « Chaque CPU ajoute 3 à l'INT de base du système (INT de
   base = 5) » — net_rules.json, « Système de génération rapide de forteresse »,
   étape 3. Sandrine tranche autrement pour sa table : une forteresse part de 0
   et ne doit son intelligence qu'à ses CPU. C'est sa règle qui s'applique ici ;
   remettre 5 ci-dessous suffirait à revenir au livre.
   Conséquence : le seuil d'Intelligence Artificielle (INT 12) est atteint à
   quatre CPU au lieu de trois. */
const NET_INT_BASE = 0;
const NET_INT_IA = 12;

/** 0 → A … 25 → Z, 26 → AA : au-delà de la vingt-sixième colonne, on double
    la lettre comme dans un tableur. */
function colLettre(i) {
  let s = '';
  i = Math.max(0, Math.floor(i));
  do { s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26) - 1; } while (i >= 0);
  return s;
}

/* ---------- La palette ----------
   « g » est le glyphe de la police Netrunner, « k » la touche du clavier qui
   la produit. Le livre impose le cercle barré d'une croix pour la CPU ; le
   reste suit l'usage des plans de forteresse.

   « champs » dit ce qu'on peut noter sur CET objet-là, et rien d'autre : un
   terminal n'a ni FOR ni UM, une grille codée a un code, un drone un armement.
   Chaque champ : k la clé enregistrée, t son libellé, f sa forme —
   texte, nombre, zone (plusieurs lignes), choix (liste), niveau (un autre
   niveau de la forteresse). « nom » et « notes » sont communs à tout et ne
   figurent pas ici. */
const NET_PAL = [
  {
    id: 'cpu', t: 'CPU', g: 'c', cl: 'maitre',
    aide: 'Unité centrale. +3 INT au système, 10 000 €$, quatre mémoires adjacentes.',
    champs: []
  },
  {
    id: 'memoire', t: 'Mémoire', g: 'm', bref: 1,
    aide: '10 unités mémoire. Se place dans une case adjacente à sa CPU.',
    champs: [{ k: 'um', t: 'Capacité (UM)', f: 'nombre', d: 10 }]
  },
  {
    id: 'mur', t: 'Mur de données', g: 'b', cl: 'mur', bref: 2,
    aide: 'Blindage du système. Note sa FOR ; il faut le percer ou le contourner.',
    champs: [{ k: 'for', t: 'FOR du mur', f: 'nombre' }]
  },
  {
    id: 'grille', t: 'Grille codée', g: 'v',
    aide: 'Porte de code : le passage prévu, pour qui a le mot de passe.',
    champs: [
      { k: 'for', t: 'FOR', f: 'nombre' },
      { k: 'code', t: 'Code ou mot de passe', f: 'texte' }
    ]
  },
  {
    id: 'fichier', t: 'Fichier', g: 'p',
    aide: 'Données stockées. Note son volume en UM et ce qu’il contient.',
    champs: [
      { k: 'um', t: 'Volume (UM)', f: 'nombre' },
      { k: 'protection', t: 'Protection', f: 'choix', opt: ['', 'Aucune', 'Chiffré', 'Piégé', 'Chiffré et piégé'] }
    ]
  },
  {
    id: 'programme', t: 'Programme', g: 'l', cl: 'ice', livre: 1,
    aide: 'ICE en patrouille ou en garde. Note sa FOR et son nom.',
    champs: [
      { k: 'for', t: 'FOR', f: 'nombre' },
      { k: 'um', t: 'UM', f: 'nombre' },
      { k: 'classe', t: 'Classe', f: 'texte' }
    ]
  },
  {
    id: 'mortel', t: 'Programme mortel', g: 's', cl: 'danger', livre: 1,
    aide: 'Anti-personnel létal. Niveau 4 seulement, en principe.',
    champs: [
      { k: 'for', t: 'FOR', f: 'nombre' },
      { k: 'um', t: 'UM', f: 'nombre' },
      { k: 'classe', t: 'Classe', f: 'texte' }
    ]
  },
  {
    id: 'daemon', t: 'Daemon', g: 'n', livre: 1,
    aide: 'Programme autonome attaché à une tâche du système.',
    champs: [
      { k: 'for', t: 'FOR', f: 'nombre' },
      { k: 'um', t: 'UM', f: 'nombre' },
      { k: 'tache', t: 'Tâche confiée', f: 'texte' }
    ]
  },
  {
    id: 'terminal', t: 'Terminal', g: 't',
    aide: 'Poste de travail physique : une entrée possible depuis le monde réel.',
    champs: [
      { k: 'lieu', t: 'Où il se trouve', f: 'texte' },
      { k: 'acces', t: 'Accès', f: 'choix', opt: ['', 'Libre', 'Badge', 'Mot de passe', 'Biométrie', 'Condamné'] }
    ]
  },
  {
    id: 'lld', t: 'Liaison longue distance', g: 'K', cl: 'lien',
    aide: 'Sortie vers une autre grille de ville. Note son niveau de pistage.',
    champs: [
      { k: 'destination', t: 'Mène à', f: 'texte' },
      { k: 'pistage', t: 'Niveau de pistage', f: 'nombre' }
    ]
  },
  {
    id: 'ascenseur', t: 'Ascenseur', g: 'h', cl: 'lien',
    aide: 'Passage vers une autre sous-grille du même système.',
    champs: [{ k: 'vers', t: 'Mène au niveau', f: 'niveau' }]
  },
  {
    id: 'reseau', t: 'Nœud de réseau', g: 'Z',
    aide: 'Concentrateur reliant plusieurs sous-systèmes.',
    champs: [{ k: 'relie', t: 'Sous-systèmes reliés', f: 'texte' }]
  },
  {
    id: 'serveur', t: 'Serveur', g: 'S',
    aide: 'Baie physique : paye, archives, production.',
    champs: [
      { k: 'role', t: 'À quoi il sert', f: 'texte' },
      { k: 'um', t: 'Volume (UM)', f: 'nombre' }
    ]
  },
  {
    id: 'bdd', t: 'Base de données', g: 'M',
    aide: 'Gros volume de données, souvent la cible du run.',
    champs: [
      { k: 'um', t: 'Volume (UM)', f: 'nombre' },
      { k: 'protection', t: 'Protection', f: 'choix', opt: ['', 'Aucune', 'Chiffrée', 'Piégée', 'Chiffrée et piégée'] }
    ]
  },
  {
    id: 'camera', t: 'Caméra', g: 'C',
    aide: 'Surveillance physique pilotée depuis le système.',
    champs: [{ k: 'champ', t: 'Ce qu’elle couvre', f: 'texte' }]
  },
  {
    id: 'drone', t: 'Drone', g: 'D',
    aide: 'Appareil contrôlé par le système. Dangereux côté réel.',
    champs: [
      { k: 'modele', t: 'Modèle', f: 'texte' },
      { k: 'armement', t: 'Armement', f: 'texte' }
    ]
  },
  {
    id: 'antenne', t: 'Antenne', g: 'W',
    aide: 'Liaison sans fil : une porte d’entrée pour qui s’approche.',
    champs: [{ k: 'portee', t: 'Portée', f: 'texte' }]
  },
  {
    id: 'robot', t: 'Robot', g: 'R',
    aide: 'Machine de manutention ou de sécurité sous contrôle du système.',
    champs: [
      { k: 'modele', t: 'Modèle', f: 'texte' },
      { k: 'armement', t: 'Armement', f: 'texte' }
    ]
  },
  {
    id: 'satellite', t: 'Satellite', g: 'G',
    aide: 'Relais orbital. Niveau de sécurité élevé par nature.',
    champs: [{ k: 'destination', t: 'Relaie vers', f: 'texte' }]
  },
  {
    id: 'note', t: 'Repère', g: 'a',
    aide: 'Point d’intérêt libre : ce que tu veux y mettre.',
    champs: []
  }
];
const netType = id => NET_PAL.find(p => p.id === id) || NET_PAL[0];
/** Les clés que ce type sait montrer, « nom » et « notes » compris. */
const netCles = id => ['nom', 'notes'].concat((netType(id).champs || []).map(x => x.k));

/* ---------- Les niveaux ---------- */

const netBorne = (v, max) => Math.max(NET_MIN, Math.min(max, Math.round(+v) || 0));

/** Met une carte au format à niveaux. Les cartes dessinées avant cette
    version rangeaient leurs cases directement sur la forteresse : elles
    deviennent un premier niveau, sans rien perdre.
    @return vrai si quelque chose a été changé (donc à réenregistrer). */
function netMigrer(c) {
  if (!c || typeof c !== 'object') return false;
  let change = false;
  if (!Array.isArray(c.etages) || !c.etages.length) {
    c.etages = [{
      id: uid(), nom: 'Niveau 1',
      cols: NET_COLS, lignes: NET_LIGNES,
      cases: (c.cases && typeof c.cases === 'object') ? c.cases : {}
    }];
    change = true;
  }
  if ('cases' in c) { delete c.cases; change = true; }
  c.etages.forEach((et, i) => {
    if (!et.id) { et.id = uid(); change = true; }
    if (!et.nom) { et.nom = 'Niveau ' + (i + 1); change = true; }
    if (!et.cases || typeof et.cases !== 'object') { et.cases = {}; change = true; }
    const co = netBorne(et.cols || NET_COLS, NET_COLS_MAX);
    const li = netBorne(et.lignes || NET_LIGNES, NET_LIGNES_MAX);
    if (et.cols !== co) { et.cols = co; change = true; }
    if (et.lignes !== li) { et.lignes = li; change = true; }
  });
  if (!c.etages.some(e => e.id === c.etage)) { c.etage = c.etages[0].id; change = true; }
  return change;
}

/** Le niveau affiché. */
function netEtage(c) {
  return c.etages.find(e => e.id === c.etage) || c.etages[0];
}

/** Un niveau vierge, à la taille du précédent : on dessine rarement un
    sous-sol d'une autre dimension que le rez-de-chaussée. */
function netEtageVierge(c, nom) {
  const d = c.etages[c.etages.length - 1] || {};
  return {
    id: uid(), nom: nom || ('Niveau ' + (c.etages.length + 1)),
    cols: d.cols || NET_COLS, lignes: d.lignes || NET_LIGNES, cases: {}
  };
}

/** Les cases qui tomberaient hors du cadre si on le ramenait à cols × lignes. */
function netHorsCadre(et, cols, lignes) {
  return Object.keys(et.cases).filter(k => {
    const [x, y] = k.split(',').map(Number);
    return x >= cols || y >= lignes;
  });
}

/* ---------- Stockage ----------
   Les cartes vivent à côté des personnages, dans le même entrepôt. */
const NETS = {
  all() {
    const s = STORE._read();
    const l = s.cartes || (s.cartes = []);
    /* Les anciennes cartes se convertissent ici, une fois pour toutes, à la
       première lecture — et nulle part ailleurs : c'est le seul passage obligé. */
    let change = false;
    l.forEach(c => { if (netMigrer(c)) change = true; });
    if (change) STORE._write();
    return l;
  },
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
    const e = { id: uid(), nom: 'Niveau 1', cols: NET_COLS, lignes: NET_LIGNES, cases: {} };
    return {
      id: uid(), nom: nom || 'Forteresse sans nom', proprio: '', secu: 2,
      int: NET_INT_BASE, murFor: 0, cout: 0, notes: '',
      etages: [e], etage: e.id, maj: new Date().toISOString()
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

/** Recalcule ce que le livre fait découler de la carte : INT, coût, mémoire.
    Le compte porte sur TOUS les niveaux : une CPU posée au sous-sol compte
    dans l'intelligence du système autant qu'une CPU du rez-de-chaussée. */
function netBilan(c) {
  const par = {};
  let elements = 0;
  (c.etages || []).forEach(et => Object.values(et.cases).forEach(e => {
    par[e.type] = (par[e.type] || 0) + 1; elements++;
  }));
  const cpu = par.cpu || 0, mem = par.memoire || 0;
  return {
    par, cpu, mem,
    int: NET_INT_BASE + 3 * cpu,
    ia: NET_INT_BASE + 3 * cpu >= NET_INT_IA,
    cout: cpu * 10000,
    um: mem * 10,
    memAttendue: cpu * 4,
    elements,
    niveaux: (c.etages || []).length
  };
}

/** Le système de génération rapide, pas à pas (Livre du Net, p. 85).
    Ne remplit QUE le niveau visé : les autres niveaux ne bougent pas. */
function netGenerer(c, secu, et) {
  et = et || netEtage(c);
  const COLS = et.cols, LIGNES = et.lignes;
  const d6 = () => 1 + Math.floor(Math.random() * 6);
  c.secu = secu;
  et.cases = {};
  /* La place disponible borne le nombre de CPU : chacune occupe cinq cases
     avec ses mémoires, et il faut encore de quoi passer autour. */
  const tient = Math.max(1, Math.floor((COLS - 4) * (LIGNES - 4) / 9));
  const nbCpu = Math.max(1, Math.min(tient, d6() * secu));
  c.murFor = secu + d6();

  /* On répartit les CPU dans la moitié centrale, chacune avec ses quatre mémoires. */
  const pris = {};
  const libre = (x, y) => x >= 1 && y >= 1 && x < COLS - 1 && y < LIGNES - 1 && !pris[x + ',' + y];
  const pose = (x, y, type, champs) => {
    pris[x + ',' + y] = 1;
    et.cases[x + ',' + y] = Object.assign({ type: type, nom: '', notes: '' }, champs || {});
  };
  const marge = Math.min(3, Math.floor(Math.min(COLS, LIGNES) / 4));
  let places = 0, essais = 0;
  while (places < nbCpu && essais < 600) {
    essais++;
    const x = marge + Math.floor(Math.random() * Math.max(1, COLS - 2 * marge));
    const y = marge + Math.floor(Math.random() * Math.max(1, LIGNES - 2 * marge));
    const autour = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    if (!libre(x, y) || !autour.every(([a, b]) => libre(a, b))) continue;
    pose(x, y, 'cpu', { nom: 'CPU ' + (places + 1) });
    autour.forEach(([a, b], i) => pose(a, b, 'memoire', { nom: 'Mém. ' + (places + 1) + '.' + (i + 1), um: 10 }));
    places++;
  }
  if (!places) {   /* grille minuscule : au moins une CPU au centre */
    pose(Math.floor(COLS / 2), Math.floor(LIGNES / 2), 'cpu', { nom: 'CPU 1' });
    places = 1;
  }

  /* Le mur de données ceinture l'ensemble, avec une grille codée par face. */
  const occ = Object.keys(et.cases).map(k => k.split(',').map(Number));
  const xs = occ.map(p => p[0]), ys = occ.map(p => p[1]);
  const x0 = Math.max(0, Math.min(...xs) - 2), x1 = Math.min(COLS - 1, Math.max(...xs) + 2);
  const y0 = Math.max(0, Math.min(...ys) - 2), y1 = Math.min(LIGNES - 1, Math.max(...ys) + 2);
  const bord = [];
  for (let x = x0; x <= x1; x++) { bord.push([x, y0]); bord.push([x, y1]); }
  for (let y = y0 + 1; y < y1; y++) { bord.push([x0, y]); bord.push([x1, y]); }
  bord.forEach(([x, y]) => { if (!pris[x + ',' + y]) pose(x, y, 'mur', { for: c.murFor }); });
  const portes = [[Math.round((x0 + x1) / 2), y0], [Math.round((x0 + x1) / 2), y1],
  [x0, Math.round((y0 + y1) / 2)], [x1, Math.round((y0 + y1) / 2)]];
  portes.slice(0, 1 + Math.floor(secu / 2)).forEach(([x, y], i) => {
    et.cases[x + ',' + y] = { type: 'grille', nom: 'Grille codée ' + (i + 1), for: c.murFor, notes: '' };
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
    } while (et.cases[x + ',' + y] && t < 300);
    if (et.cases[x + ',' + y]) return;
    const estDaemon = /daemon|démon/i.test(p.classe || '');
    et.cases[x + ',' + y] = {
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
    if (!et.cases[fx + ',' + fy]) {
      et.cases[fx + ',' + fy] = { type: 'fichier', nom: 'Fichier maître', um: 2 + secu * 2, notes: '', for: 0 };
      break;
    }
  }
  const b = netBilan(c);
  c.int = b.int; c.cout = b.cout;
  return { nbCpu: places, murFor: c.murFor, programmes: choisis.length };
}

/* ---------- Vue ----------
   outil   : ce que pose le pinceau, ou 'gomme', ou 'main' (déplacer)
   forme   : 'libre' on peint case par case en glissant ; 'cadre' trace le
             pourtour d'un rectangle ; 'plein' le remplit
   sel     : la case dont on montre la fiche */
const NETE = { outil: 'cpu', forme: 'libre', sel: null, joueur: false };

/* ---------- Annuler / rétablir ----------
   On garde des photographies complètes des niveaux. Une forteresse pèse
   quelques dizaines de kilo-octets : à trente photographies, c'est sans
   commune mesure avec le confort que ça donne quand un glissé de travers
   vient d'effacer douze cases. */
const NETH = {
  MAX: 30,
  carte: null, pile: [], pos: -1,

  _photo(c) { return JSON.stringify({ etages: c.etages, etage: c.etage }); },

  /** Repart de zéro quand on change de carte. */
  caler(c) {
    if (this.carte === c.id) return;
    this.carte = c.id; this.pile = [this._photo(c)]; this.pos = 0;
  },
  /** À appeler AVANT de modifier quoi que ce soit. */
  avant(c) {
    this.caler(c);
    const p = this._photo(c);
    if (this.pile[this.pos] === p) return;
    this.pile = this.pile.slice(0, this.pos + 1);
    this.pile.push(p);
    if (this.pile.length > this.MAX) this.pile.shift();
    this.pos = this.pile.length - 1;
  },
  /** À appeler APRÈS, pour que la dernière photographie soit l'état courant. */
  apres(c) {
    this.caler(c);
    const p = this._photo(c);
    if (this.pile[this.pos] === p) return;
    this.pile = this.pile.slice(0, this.pos + 1);
    this.pile.push(p);
    if (this.pile.length > this.MAX) this.pile.shift();
    this.pos = this.pile.length - 1;
  },
  peutAnnuler() { return this.pos > 0; },
  peutRetablir() { return this.pos >= 0 && this.pos < this.pile.length - 1; },
  _poser(c, i) {
    const o = JSON.parse(this.pile[i]);
    c.etages = o.etages; c.etage = o.etage;
    this.pos = i;
    netMigrer(c);
    return c;
  },
  annuler(c) { return this.peutAnnuler() ? this._poser(c, this.pos - 1) : null; },
  retablir(c) { return this.peutRetablir() ? this._poser(c, this.pos + 1) : null; }
};

/** Dessine la grille d'un niveau.
    @param vivante  objet { clic, peindre } ; absent, la grille est inerte
                    (c'est la forme qu'on imprime pour les niveaux non affichés). */
function netGrille(c, et, vivante) {
  const grille = h('div.net-grille' + (vivante ? '.net-vive' : ''));
  const tete = h('div.net-ligne.net-tete', h('div.net-coin'));
  for (let x = 0; x < et.cols; x++) tete.appendChild(h('div.net-col', colLettre(x)));
  grille.appendChild(tete);
  for (let y = 0; y < et.lignes; y++) {
    const ligne = h('div.net-ligne', h('div.net-num', String(y + 1)));
    for (let x = 0; x < et.cols; x++) {
      const cle = x + ',' + y, e = et.cases[cle];
      const t = e ? netType(e.type) : null;
      const classes = '.net-c' + (e ? '.plein' : '') + (t && t.cl ? '.' + t.cl : '')
        + (vivante && NETE.sel === cle ? '.sel' : '');
      const cel = vivante
        ? h('button' + classes, {
          dataset: { cle: cle },
          title: e ? (e.nom || t.t) : colLettre(x) + (y + 1)
        }, e ? h('i.nf', t.g) : null)
        : h('div' + classes, e ? h('i.nf', t.g) : null);
      ligne.appendChild(cel);
    }
    grille.appendChild(ligne);
  }
  if (vivante) netPinceau(grille, c, et, vivante);
  return grille;
}

/** Remet une case à jour dans le DOM sans tout redessiner : pendant qu'on
    glisse, reconstruire la grille ferait perdre le pointeur. */
function netRafraichirCase(grille, et, cle) {
  const cel = grille.querySelector('.net-c[data-cle="' + cle + '"]');
  if (!cel) return;
  const e = et.cases[cle], t = e ? netType(e.type) : null;
  const [x, y] = cle.split(',').map(Number);
  cel.className = 'net-c' + (e ? ' plein' : '') + (t && t.cl ? ' ' + t.cl : '')
    + (NETE.sel === cle ? ' sel' : '');
  clear(cel);
  if (e) cel.appendChild(h('i.nf', t.g));
  cel.title = e ? (e.nom || t.t) : colLettre(x) + (y + 1);
}

/** Les cases du pourtour (ou de l'intérieur) du rectangle a → b. */
function netRectangle(a, b, plein) {
  const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number);
  const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
  const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (plein || x === x0 || x === x1 || y === y0 || y === y1) out.push(x + ',' + y);
  }
  return out;
}

/** Le pinceau : maintenir et glisser pose (ou efface) une suite de cases,
    au lieu de cliquer vingt fois pour ceinturer une forteresse.
    Un clic sans déplacement garde son ancien sens : il ouvre la fiche. */
function netPinceau(grille, c, et, vivante) {
  let actif = null;   // { depart, bouge, mode }

  const caseSous = ev => {
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const cel = el && el.closest ? el.closest('.net-c[data-cle]') : null;
    return cel && grille.contains(cel) ? cel.dataset.cle : null;
  };
  const apercu = cles => {
    grille.querySelectorAll('.net-c.apercu').forEach(x => x.classList.remove('apercu'));
    (cles || []).forEach(k => {
      const el = grille.querySelector('.net-c[data-cle="' + k + '"]');
      if (el) el.classList.add('apercu');
    });
  };

  grille.addEventListener('pointerdown', ev => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const cle = caseSous(ev);
    if (cle === null) return;
    /* Le tactile capture le pointeur sur la case de départ : sans ça, aucune
       autre case ne verrait passer le doigt. */
    if (ev.target.releasePointerCapture && ev.target.hasPointerCapture
      && ev.target.hasPointerCapture(ev.pointerId)) {
      try { ev.target.releasePointerCapture(ev.pointerId); } catch (e) { }
    }
    actif = { depart: cle, bouge: false, mode: NETE.outil };
    if (NETE.outil === 'main') actif.pris = et.cases[cle] ? cle : null;
  });

  grille.addEventListener('pointermove', ev => {
    if (!actif) return;
    const cle = caseSous(ev);
    if (cle === null || cle === actif.depart && !actif.bouge) return;
    if (cle === actif.dernier) return;
    actif.dernier = cle;
    if (!actif.bouge) { actif.bouge = true; ev.preventDefault(); }

    if (NETE.outil === 'main') { apercu(actif.pris ? [cle] : []); return; }
    if (NETE.forme !== 'libre') { apercu(netRectangle(actif.depart, cle, NETE.forme === 'plein')); return; }
    /* Tracé libre : on peint au fil du doigt, DOM seulement, et on
       n'enregistre qu'au relâchement. */
    if (!actif.commence) { actif.commence = 1; NETH.avant(c); vivante.poser(actif.depart); netRafraichirCase(grille, et, actif.depart); }
    vivante.poser(cle);
    netRafraichirCase(grille, et, cle);
  });

  const finir = ev => {
    if (!actif) return;
    const a = actif; actif = null;
    apercu([]);
    if (!a.bouge) { vivante.clic(a.depart); return; }          // simple clic : la fiche
    const cle = (ev && caseSous(ev)) || a.dernier || a.depart;
    if (NETE.outil === 'main') {
      if (a.pris && cle !== a.pris) vivante.deplacer(a.pris, cle);
      else vivante.redessiner();
      return;
    }
    if (NETE.forme !== 'libre') {
      NETH.avant(c);
      netRectangle(a.depart, cle, NETE.forme === 'plein').forEach(k => vivante.poser(k));
    }
    vivante.terminer();
  };
  grille.addEventListener('pointerup', finir);
  grille.addEventListener('pointercancel', () => { actif = null; apercu([]); });
  /* Relâcher hors de la grille ne doit pas laisser le pinceau collé. */
  grille.addEventListener('pointerleave', ev => { if (actif && actif.bouge) finir(ev); });
}

/** Le cadre imprimable d'un niveau : le bandeau de titre, puis la grille.
    La taille des cases à l'impression se calcule ici : avec quarante colonnes,
    les 8,4 mm du livre déborderaient de la feuille. */
function netPlan(c, et, grille, bilan) {
  const plan = h('div.net-plan',
    h('div.net-titre',
      h('b', c.nom || 'Forteresse sans nom'),
      h('span', (c.proprio ? c.proprio + ' · ' : '')
        + ((c.etages.length > 1) ? et.nom : '')),
      h('span.mj', 'Sécurité ' + c.secu + ' · INT ' + bilan.int
        + ' · Mur FOR ' + (c.murFor || '—'))),
    grille);
  const mm = Math.min(8.4, 175 / et.cols, 235 / et.lignes);
  plan.style.setProperty('--net-case', mm.toFixed(2) + 'mm');
  return plan;
}

/** Imprime la carte.
    @param tous    tous les niveaux au lieu du seul niveau affiché
    @param joueur  sans les FOR, les notes ni les chiffres du système : la
                   copie qu'on pose sur la table devant les joueurs. */
function netImprimer(c, bilan, opts) {
  opts = opts || {};
  const et = netEtage(c);
  const autres = opts.tous ? c.etages.filter(x => x.id !== et.id) : [];
  const bac = autres.length ? h('div.net-tout') : null;
  if (bac) {
    autres.forEach(x => {
      bac.appendChild(netPlan(c, x, netGrille(c, x), bilan));
      bac.appendChild(netLegende(c, x));
    });
    document.body.appendChild(bac);
  }
  if (opts.joueur) document.body.classList.add('net-joueur');
  const nettoyer = () => {
    if (bac) bac.remove();
    document.body.classList.remove('net-joueur');
    window.removeEventListener('afterprint', nettoyer);
  };
  window.addEventListener('afterprint', nettoyer);
  setTimeout(() => { window.print(); setTimeout(nettoyer, 2000); }, 60);
}

/** Un élément neuf, avec les seuls champs que son type connaît. */
function netNeuf(type) {
  const e = { type: type, nom: '', notes: '' };
  (netType(type).champs || []).forEach(f => {
    e[f.k] = f.d !== undefined ? f.d : (f.f === 'nombre' ? 0 : '');
  });
  return e;
}

/** Les valeurs enregistrées sur un élément qui ne veulent plus rien dire pour
    son type — une FOR restée sur un terminal après un changement de type.
    On ne les efface pas en douce : on les montre et on propose de les retirer. */
function netOrphelins(e) {
  const connues = netCles(e.type).concat(['type']);
  return Object.keys(e).filter(k => connues.indexOf(k) < 0
    && e[k] !== '' && e[k] !== 0 && e[k] !== null && e[k] !== undefined);
}

/** La liste des programmes du livre, pour en piocher un sur un ICE. */
function netChoisirProgramme(e, apres) {
  const prog = (DB.net_programs || []);
  if (!prog.length) { toast('Les programmes du livre ne sont pas chargés.', 'no'); return; }
  const liste = h('div.rz-comp.net-prog');
  const recherche = h('input', { type: 'search', placeholder: 'Chercher un programme…', style: { width: '100%', marginBottom: '10px' } });
  let m;

  const remplir = () => {
    clear(liste);
    const f = noAcc(recherche.value || '');
    let vus = 0;
    prog.forEach(p => {
      if (f && noAcc((p.nom || '') + ' ' + (p.classe || '') + ' ' + (p.fonction || '')).indexOf(f) < 0) return;
      if (++vus > 120) return;
      liste.appendChild(h('div.rz-l.tb-clic', {
        onclick: () => {
          e.nom = p.nom || e.nom;
          if ('for' in e) e.for = p.force || 0;
          if ('um' in e) e.um = p.um || 0;
          if ('classe' in e) e.classe = p.classe || '';
          const d = (p.fonction || p.desc || '').trim();
          e.notes = d ? d : e.notes;
          if (m) m.close();
          apres();
        }
      },
        h('span.n', p.nom || '—'),
        h('span.chip', p.classe || '—'),
        h('i', 'FOR ' + (p.force || '—') + ' · ' + (p.um || '—') + ' UM')));
    });
    if (!vus) liste.appendChild(h('p.muted', { style: { margin: 0 } }, 'Rien ne correspond.'));
    else if (vus > 120) liste.appendChild(h('p.muted', { style: { margin: '6px 0 0' } },
      'Les 120 premiers seulement — affine la recherche.'));
  };
  recherche.addEventListener('input', remplir);
  remplir();

  m = modal({
    wide: true, title: 'Programmes du livre (' + prog.length + ')',
    body: h('div', recherche, liste),
    actions: [{ label: 'Annuler' }]
  });
  setTimeout(() => recherche.focus(), 50);
}

/** La fiche d'un élément : seulement ce que son type sait porter. */
function netFiche(c, et, maj, redessine) {
  const box = h('div.panel.net-detail');
  const cle = NETE.sel, e = cle ? et.cases[cle] : null;

  if (!e) {
    box.appendChild(h('p.muted', { style: { margin: 0 } },
      NETE.outil === 'gomme'
        ? "Touche une case pour la vider. Maintiens et glisse pour en effacer plusieurs d’un geste."
        : NETE.outil === 'main'
          ? "Attrape un élément posé et glisse-le sur une case libre pour le déplacer avec son nom et ses notes."
          : "Choisis un symbole dans la palette, puis touche une case pour le poser. "
          + "Maintiens et glisse pour en poser plusieurs ; en mode « Cadre », glisse d’un coin à "
          + "l’autre pour tracer un pourtour. Touche un élément déjà posé pour le décrire."));
    return box;
  }

  const t = netType(e.type);
  const [x, y] = cle.split(',').map(Number);
  const ecrire = () => { maj(); NETH.apres(c); };

  box.appendChild(h('div.panel-h', h('h3', t.t + ' — ' + colLettre(x) + (y + 1)),
    h('div.sp'),
    t.livre ? h('button.btn.g.sm', {
      onclick: () => netChoisirProgramme(e, () => { maj(); NETH.apres(c); redessine(); })
    }, 'Choisir dans le livre') : null,
    h('button.btn.d.sm', {
      onclick: () => { NETH.avant(c); delete et.cases[cle]; NETE.sel = null; maj(); NETH.apres(c); redessine(); }
    }, 'Retirer')));
  box.appendChild(h('p.muted', { style: { marginTop: 0 } }, t.aide));

  /* Le nom et le type, communs à tout ; puis les champs du type, et rien d'autre. */
  const grille = h('div.net-form');
  grille.appendChild(h('label.net-ch', h('span', 'Nom'),
    h('input', { type: 'text', value: e.nom || '', oninput: ev => { e.nom = ev.target.value; ecrire(); } })));
  grille.appendChild(h('label.net-ch', h('span', 'Type'),
    h('select', {
      onchange: ev => {
        NETH.avant(c);
        const neuf = netNeuf(ev.target.value);
        /* On garde le nom, les notes, et les valeurs que le nouveau type
           connaît aussi : changer un programme en daemon ne doit pas effacer
           sa FOR. Le reste est signalé plus bas, pas supprimé. */
        neuf.nom = e.nom; neuf.notes = e.notes;
        Object.keys(e).forEach(k => {
          if (k !== 'type' && k in neuf && e[k] !== '' && e[k] !== 0) neuf[k] = e[k];
          else if (k !== 'type' && !(k in neuf)) neuf[k] = e[k];
        });
        et.cases[cle] = neuf;
        maj(); NETH.apres(c); redessine();
      }
    }, ...NET_PAL.map(p => h('option', { value: p.id, selected: p.id === e.type ? 'selected' : null }, p.t)))));

  (t.champs || []).forEach(f => {
    if (f.f === 'niveau') {
      const autres = c.etages.filter(z => z.id !== et.id);
      if (!autres.length) {
        grille.appendChild(h('label.net-ch', h('span', f.t),
          h('p.muted', { style: { margin: '4px 0 0', fontSize: '13px' } },
            'Cette forteresse n’a qu’un niveau. Ajoute-en un pour y mener.')));
        return;
      }
      grille.appendChild(h('label.net-ch', h('span', f.t),
        h('select', { onchange: ev => { e[f.k] = ev.target.value || ''; ecrire(); } },
          h('option', { value: '', selected: !e[f.k] ? 'selected' : null }, '— non précisé —'),
          ...autres.map(z => h('option', { value: z.id, selected: z.id === e[f.k] ? 'selected' : null }, z.nom)))));
      grille.appendChild(h('label.net-ch', h('span', ' '),
        h('button.btn.g', {
          disabled: e[f.k] ? null : '',
          onclick: () => { if (!e[f.k]) return; c.etage = e[f.k]; NETE.sel = null; NETS.save(c); redessine(); }
        }, 'Y aller')));
      return;
    }
    if (f.f === 'choix') {
      grille.appendChild(h('label.net-ch', h('span', f.t),
        h('select', { onchange: ev => { e[f.k] = ev.target.value; ecrire(); } },
          ...f.opt.map(o => h('option', { value: o, selected: (e[f.k] || '') === o ? 'selected' : null },
            o || '— non précisé —')))));
      return;
    }
    if (f.f === 'zone') {
      const z = h('textarea', { rows: 3, oninput: ev => { e[f.k] = ev.target.value; ecrire(); } });
      z.value = e[f.k] || '';
      grille.appendChild(h('label.net-ch.net-large', h('span', f.t), z));
      return;
    }
    grille.appendChild(h('label.net-ch', h('span', f.t),
      h('input', f.f === 'nombre'
        ? { type: 'number', min: 0, value: e[f.k] || 0, oninput: ev => { e[f.k] = +ev.target.value || 0; ecrire(); } }
        : { type: 'text', value: e[f.k] || '', oninput: ev => { e[f.k] = ev.target.value; ecrire(); } })));
  });
  box.appendChild(grille);

  const notes = h('textarea', { rows: 3, oninput: ev => { e.notes = ev.target.value; ecrire(); } });
  notes.value = e.notes || '';
  box.appendChild(h('label.net-ch', { style: { marginTop: '8px' } }, h('span', 'Notes'), notes));

  /* Ce qui traîne d'un ancien type. */
  const orph = netOrphelins(e);
  if (orph.length) {
    box.appendChild(h('div.row.wrap.net-orph', { style: { marginTop: '10px' } },
      h('span.tag', 'Sans emploi ici'),
      ...orph.map(k => h('span.chip', k + ' : ' + e[k])),
      h('div.sp'),
      h('button.btn.g.xs', {
        onclick: () => { NETH.avant(c); orph.forEach(k => delete e[k]); maj(); NETH.apres(c); redessine(); }
      }, 'Retirer ces valeurs')));
  }
  return box;
}

/* ---------- Les contrôles du livre ----------
   Jamais bloquants : on signale, on n'empêche rien. */

/** Les quatre voisines orthogonales d'une case. */
const netAutour = cle => {
  const [x, y] = cle.split(',').map(Number);
  return [(x - 1) + ',' + y, (x + 1) + ',' + y, x + ',' + (y - 1), x + ',' + (y + 1)];
};

function netControles(c, et) {
  const ennuis = [];
  const nom = cle => { const [x, y] = cle.split(',').map(Number); return colLettre(x) + (y + 1); };

  /* « Quatre mémoires adjacentes » par CPU (Livre du Net). */
  const cpuSeules = [], memOrphelines = [];
  Object.entries(et.cases).forEach(([cle, e]) => {
    if (e.type === 'cpu') {
      const n = netAutour(cle).filter(k => et.cases[k] && et.cases[k].type === 'memoire').length;
      if (n < 4) cpuSeules.push(nom(cle) + ' (' + n + '/4)');
    }
    if (e.type === 'memoire') {
      if (!netAutour(cle).some(k => et.cases[k] && et.cases[k].type === 'cpu')) memOrphelines.push(nom(cle));
    }
  });
  if (cpuSeules.length) ennuis.push({
    t: 'CPU sans ses quatre mémoires',
    d: cpuSeules.slice(0, 12).join(', ') + (cpuSeules.length > 12 ? '…' : '')
  });
  if (memOrphelines.length) ennuis.push({
    t: 'Mémoires sans CPU voisine',
    d: memOrphelines.slice(0, 12).join(', ') + (memOrphelines.length > 12 ? '…' : '')
  });

  /* Le mur ferme-t-il ? On entre par les bords et on se promène : tout ce
     qu'on atteint sans traverser un mur ou une grille est à découvert. */
  const dur = k => { const e = et.cases[k]; return e && (e.type === 'mur' || e.type === 'grille'); };
  const dedans = ['cpu', 'memoire', 'fichier', 'programme', 'mortel', 'daemon', 'bdd', 'serveur'];
  const vus = {}, file = [];
  for (let x = 0; x < et.cols; x++) { file.push(x + ',0'); file.push(x + ',' + (et.lignes - 1)); }
  for (let y = 0; y < et.lignes; y++) { file.push('0,' + y); file.push((et.cols - 1) + ',' + y); }
  const expose = [];
  while (file.length) {
    const k = file.pop();
    if (vus[k]) continue;
    const [x, y] = k.split(',').map(Number);
    if (x < 0 || y < 0 || x >= et.cols || y >= et.lignes) continue;
    vus[k] = 1;
    if (dur(k)) continue;
    const e = et.cases[k];
    if (e && dedans.indexOf(e.type) >= 0) expose.push(nom(k));
    netAutour(k).forEach(v => { if (!vus[v]) file.push(v); });
  }
  const murs = Object.values(et.cases).filter(e => e.type === 'mur').length;
  if (murs && expose.length) ennuis.push({
    t: 'Le mur de données ne ferme pas',
    d: 'On atteint depuis l’extérieur, sans percer : '
      + expose.slice(0, 10).join(', ') + (expose.length > 10 ? '…' : '')
  });

  /* L'anti-personnel létal : niveau 4 seulement, en principe. */
  const mortels = Object.keys(et.cases).filter(k => et.cases[k].type === 'mortel');
  if (mortels.length && c.secu < 4) ennuis.push({
    t: 'Programme mortel sous le niveau 4',
    d: 'Le livre réserve l’anti-personnel létal à la sécurité 4. Ici : '
      + mortels.map(nom).slice(0, 10).join(', ')
  });

  return ennuis;
}

function netPanneauControles(c, et) {
  const ennuis = netControles(c, et);
  if (!ennuis.length) return null;
  const box = h('div.panel.no-print.net-ctrl', { style: { marginTop: '12px' } },
    h('div.panel-h', h('h3', 'À vérifier'), h('div.sp'),
      h('span.chip', ennuis.length + (ennuis.length > 1 ? ' remarques' : ' remarque'))));
  box.appendChild(h('p.muted', { style: { marginTop: 0 } },
    'Ce que le livre attend et qui manque ici. Rien n’est bloqué : une forteresse '
    + 'peut très bien être irrégulière si c’est voulu.'));
  const l = h('div.rz-comp');
  ennuis.forEach(x => l.appendChild(h('div.rz-l', h('span.n', x.t), h('i', x.d))));
  box.appendChild(l);
  return box;
}

VIEWS.net = function () {
  const wrap = h('div.view-inner');
  let c = NETS.courante();
  if (!c) { c = NETS.save(NETS.vierge('Forteresse sans nom')); }

  const redessine = () => route();
  const maj = () => { const b = netBilan(c); c.int = b.int; c.cout = b.cout; NETS.save(c); };
  const et = netEtage(c);

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
      h('button.btn.g.sm', {
        title: 'Le niveau affiché' + (NETE.joueur ? ', sans tes notes ni les FOR' : ''),
        onclick: () => netImprimer(c, netBilan(c), { joueur: NETE.joueur })
      }, 'Imprimer'),
      c.etages.length > 1 ? h('button.btn.g.sm', {
        title: 'Une page par niveau, légende comprise',
        onclick: () => netImprimer(c, netBilan(c), { tous: true, joueur: NETE.joueur })
      }, 'Imprimer tout') : null,
      h('button.btn.g.sm' + (NETE.joueur ? '.on' : ''), {
        title: 'Quand c’est allumé, les impressions sortent sans les FOR, '
          + 'tes notes ni les chiffres du système : la copie pour les joueurs.',
        onclick: () => { NETE.joueur = !NETE.joueur; redessine(); }
      }, NETE.joueur ? '👤 Version joueur' : 'Version joueur'),
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
  const chiffres = h('div.rz-grid.mj',
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
    title: 'Vider des cases. Maintiens et glisse pour en effacer plusieurs.',
    onclick: () => { NETE.outil = 'gomme'; NETE.sel = null; redessine(); }
  }, h('i', '✕'), h('span', 'Effacer')));
  pal.appendChild(h('button.net-o' + (NETE.outil === 'main' ? '.on' : '') + '.net-main', {
    title: 'Attraper un élément et le reposer ailleurs, avec son nom et ses notes.',
    onclick: () => { NETE.outil = 'main'; NETE.sel = null; redessine(); }
  }, h('i', '✥'), h('span', 'Déplacer')));

  /* --- Comment on trace, et de quoi revenir en arrière --- */
  const FORMES = [
    { id: 'libre', t: 'Libre', aide: 'Glisse pour peindre case par case.' },
    { id: 'cadre', t: 'Cadre', aide: 'Glisse d’un coin à l’autre : seul le pourtour se pose. De quoi ceinturer une forteresse d’un geste.' },
    { id: 'plein', t: 'Rempli', aide: 'Glisse d’un coin à l’autre : tout le rectangle se remplit.' }
  ];
  const tracer = h('div.row.wrap.net-tracer.no-print',
    h('span.tag', 'Tracé'),
    ...FORMES.map(f => h('button.btn.g.xs' + (NETE.forme === f.id ? '.on' : ''), {
      title: f.aide,
      onclick: () => { NETE.forme = f.id; redessine(); }
    }, f.t)),
    h('div.sp'),
    h('button.btn.g.xs', {
      disabled: NETH.peutAnnuler() ? null : '',
      title: 'Ctrl+Z',
      onclick: () => { if (NETH.annuler(c)) { NETE.sel = null; NETS.save(c); maj(); redessine(); } }
    }, '↶ Annuler'),
    h('button.btn.g.xs', {
      disabled: NETH.peutRetablir() ? null : '',
      title: 'Ctrl+Y',
      onclick: () => { if (NETH.retablir(c)) { NETE.sel = null; NETS.save(c); maj(); redessine(); } }
    }, '↷ Rétablir'));

  /* --- La grille du niveau affiché --- */
  NETH.caler(c);
  const grille = netGrille(c, et, {
    /* Un clic simple : la fiche de l'élément, ou on en pose un. */
    clic: cle => {
      const e = et.cases[cle];
      if (NETE.outil === 'gomme') { if (!e) return; NETH.avant(c); delete et.cases[cle]; NETE.sel = null; }
      else if (NETE.outil === 'main') { NETE.sel = e ? cle : null; }
      else if (e && NETE.sel !== cle) { NETE.sel = cle; }
      else if (e && NETE.sel === cle) { NETE.sel = null; }
      else { NETH.avant(c); et.cases[cle] = netNeuf(NETE.outil); NETE.sel = cle; }
      maj(); NETH.apres(c); redessine();
    },
    /* Pendant un glissé : on écrit dans les données, le DOM suit case par case. */
    poser: cle => {
      if (NETE.outil === 'gomme') delete et.cases[cle];
      else if (!et.cases[cle]) et.cases[cle] = netNeuf(NETE.outil);
      else et.cases[cle].type = NETE.outil;
    },
    deplacer: (de, vers) => {
      NETH.avant(c);
      const e = et.cases[de];
      if (et.cases[vers]) { toast('La case d’arrivée est déjà prise.', 'no'); redessine(); return; }
      delete et.cases[de]; et.cases[vers] = e;
      NETE.sel = vers; maj(); NETH.apres(c); redessine();
    },
    terminer: () => { NETE.sel = null; maj(); NETH.apres(c); redessine(); },
    redessiner: () => redessine()
  });

  /* --- Les onglets des niveaux, rangés comme les feuilles d'un tableur --- */
  const onglets = h('div.net-ets.no-print');
  c.etages.forEach(x => onglets.appendChild(
    h('button.net-et' + (x.id === et.id ? '.on' : ''), {
      title: x.nom + ' — ' + x.cols + ' × ' + x.lignes + ', '
        + Object.keys(x.cases).length + ' élément(s)',
      onclick: () => {
        if (x.id === et.id) return;
        c.etage = x.id; NETE.sel = null; NETS.save(c); redessine();
      }
    }, h('span.t', x.nom), h('span.n', String(Object.keys(x.cases).length)))));
  onglets.appendChild(h('button.net-et.net-plus', {
    title: 'Ajouter un niveau',
    onclick: () => {
      const n = netEtageVierge(c);
      c.etages.push(n); c.etage = n.id; NETE.sel = null;
      maj(); redessine();
    }
  }, '+'));

  /* --- Le niveau affiché : son nom, sa taille, et quoi en faire --- */
  const titreOnglet = onglets.querySelector('.net-et.on .t');
  const dimC = h('input', { type: 'number', min: NET_MIN, max: NET_COLS_MAX, value: et.cols });
  const dimL = h('input', { type: 'number', min: NET_MIN, max: NET_LIGNES_MAX, value: et.lignes });
  const redimensionner = () => {
    const cols = netBorne(dimC.value, NET_COLS_MAX), lignes = netBorne(dimL.value, NET_LIGNES_MAX);
    if (cols === et.cols && lignes === et.lignes) { dimC.value = cols; dimL.value = lignes; return; }
    const poser = () => {
      netHorsCadre(et, cols, lignes).forEach(k => delete et.cases[k]);
      et.cols = cols; et.lignes = lignes; NETE.sel = null; maj(); redessine();
    };
    const perdus = netHorsCadre(et, cols, lignes);
    if (perdus.length) confirmer('Rétrécir le niveau',
      perdus.length + ' élément(s) se trouvent hors du nouveau cadre et seront supprimés. Continuer ?',
      poser);
    else poser();
  };

  const niveaux = h('div.panel.no-print', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Les niveaux'), h('div.sp'),
      h('span.chip', et.nom),
      h('span.chip', et.cols + ' × ' + et.lignes),
      h('span.chip', Object.keys(et.cases).length + ' élément(s)')),
    h('div.net-form',
      champ('Nom du niveau', et.nom, v => {
        et.nom = v; maj();
        if (titreOnglet) titreOnglet.textContent = v || 'Sans nom';
      }),
      h('label.net-ch', h('span', 'Colonnes (' + NET_MIN + ' à ' + NET_COLS_MAX + ')'), dimC),
      h('label.net-ch', h('span', 'Lignes (' + NET_MIN + ' à ' + NET_LIGNES_MAX + ')'), dimL),
      h('label.net-ch', h('span', ' '),
        h('button.btn.p', { onclick: redimensionner }, 'Appliquer la taille'))),
    h('div.row.wrap', { style: { marginTop: '12px' } },
      h('button.btn.g.sm', {
        onclick: () => {
          const copie = {
            id: uid(), nom: et.nom + ' (copie)', cols: et.cols, lignes: et.lignes,
            cases: JSON.parse(JSON.stringify(et.cases))
          };
          c.etages.splice(c.etages.indexOf(et) + 1, 0, copie);
          c.etage = copie.id; NETE.sel = null; maj(); redessine();
        }
      }, 'Dupliquer ce niveau'),
      h('div.sp'),
      c.etages.length > 1 ? h('button.btn.d.sm', {
        onclick: () => confirmer('Supprimer le niveau',
          'Supprimer « ' + et.nom +' » et ses ' + Object.keys(et.cases).length
          + ' élément(s) ? Les autres niveaux ne bougent pas.',
          () => {
            c.etages = c.etages.filter(x => x.id !== et.id);
            c.etage = c.etages[0].id; NETE.sel = null; maj(); redessine();
          })
      }, 'Supprimer ce niveau') : null));

  /* --- La fiche de la case choisie, taillée pour SON type --- */
  const detail = netFiche(c, et, maj, redessine);

  /* --- La légende, montée depuis le niveau affiché --- */
  const leg = netLegende(c, et);

  wrap.appendChild(h('div.no-print', barre));
  wrap.appendChild(h('div.no-print', entete));
  wrap.appendChild(h('div.panel.no-print', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Génération rapide')),
    h('p.muted', { style: { marginTop: 0 } },
      "Le système du livre : 1D6 × sécurité pour les CPU, quatre mémoires chacune, "
      + "mur de données à sécurité + 1D6, programmes choisis selon le niveau de sécurité. "
      + "Ne remplit que le niveau affiché ; les autres ne bougent pas."),
    h('div.row.wrap', ...NET_SECU.map(s => h('button.btn.g.sm', {
      onclick: () => confirmer('Générer', `Remplacer « ${et.nom} » par une forteresse de sécurité ${s.n} ?`, () => {
        NETH.avant(c);
        const r = netGenerer(c, s.n, et);
        NETS.save(c); NETE.sel = null; NETH.apres(c);
            toast(`${r.nbCpu} CPU, mur de FOR ${r.murFor}, ${r.programmes} programme(s).`, 'ok');
        redessine();
      })
    }, 'Sécurité ' + s.n)))));
  wrap.appendChild(h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Le système'), h('div.sp'),
      c.etages.length > 1 ? h('span.chip', c.etages.length + ' niveaux') : null),
    chiffres));
  wrap.appendChild(h('div.no-print', pal));
  wrap.appendChild(tracer);
  const plan = netPlan(c, et, grille, bilan);
  plan.appendChild(onglets);
  wrap.appendChild(plan);
  wrap.appendChild(niveaux);
  wrap.appendChild(h('div.no-print', detail));
  const ctrl = netPanneauControles(c, et);
  if (ctrl) wrap.appendChild(ctrl);
  wrap.appendChild(leg);

  /* Ctrl+Z et Ctrl+Y, tant que la carte est à l'écran. */
  netRaccourcis(c, maj, redessine);
  return wrap;
};

/** Les raccourcis clavier de la carte. Un seul écouteur, posé sur le document
    et remplacé à chaque rendu : sans ça, ils s'empileraient à chaque redessin. */
let NET_TOUCHES = null;
function netRaccourcis(c, maj, redessine) {
  if (NET_TOUCHES) document.removeEventListener('keydown', NET_TOUCHES);
  NET_TOUCHES = ev => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
    const dans = ev.target && ev.target.tagName;
    if (dans === 'INPUT' || dans === 'TEXTAREA' || dans === 'SELECT') return;
    const k = (ev.key || '').toLowerCase();
    if (k === 'z' && !ev.shiftKey) {
      if (!NETH.annuler(c)) return;
    } else if (k === 'y' || (k === 'z' && ev.shiftKey)) {
      if (!NETH.retablir(c)) return;
    } else return;
    ev.preventDefault();
    NETE.sel = null; NETS.save(c); maj(); redessine();
  };
  document.addEventListener('keydown', NET_TOUCHES);
}

/** La légende d'un niveau : un bloc par famille, avec les éléments nommés
    et leurs cases. */
function netLegende(c, et) {
  et = et || netEtage(c);
  const box = h('div.panel.net-leg', { style: { marginTop: '12px' } },
    h('div.panel-h', h('h3', c.etages.length > 1 ? 'Légende — ' + et.nom : 'Légende')));
  const parType = {};
  Object.entries(et.cases).forEach(([cle, e]) => (parType[e.type] || (parType[e.type] = [])).push([cle, e]));
  const ordre = NET_PAL.map(p => p.id).filter(id => parType[id]);
  if (!ordre.length) {
    box.appendChild(h('p.muted', { style: { margin: 0 } }, 'Niveau vide.'));
    return box;
  }
  const nomNiveau = id => (c.etages.find(x => x.id === id) || {}).nom;
  const liste = h('div.net-leg-l');
  ordre.forEach(id => {
    const t = netType(id), els = parType[id];
    const cases = els.map(([cle]) => { const [x, y] = cle.split(',').map(Number); return colLettre(x) + (y + 1); });
    /* Les mémoires et les murs se comptent, ils ne se détaillent pas : quarante-huit
       lignes « 10 UM » identiques n'apprennent rien à personne. */
    const nommes = t.bref ? [] : els.filter(([, e]) => e.nom || e.notes || e.for || e.um || e.vers);
    const resume = t.bref === 1 ? (els.length * 10) + ' UM au total'
      : t.bref === 2 ? 'FOR ' + (els[0][1].for || c.murFor || '—') : null;
    const resumeMj = t.bref === 2;
    liste.appendChild(h('div.net-leg-i',
      h('i.nf' + (t.cl ? '.' + t.cl : ''), t.g),
      h('div',
        h('b', t.t + ' (' + els.length + ')'),
        resume ? h('span.cases' + (resumeMj ? '.mj' : ''), resume) : null,
        t.bref === 2 ? null
          : h('span.cases', cases.slice(0, 24).join(', ') + (cases.length > 24 ? '…' : '')),
        ...nommes.map(([cle, e]) => {
          const [x, y] = cle.split(',').map(Number);
          const vers = e.vers ? nomNiveau(e.vers) : null;
          const bouts = [e.for ? 'FOR ' + e.for : null, e.um ? e.um + ' UM' : null,
          vers ? '→ ' + vers : null].filter(Boolean).join(' · ');
          return h('div.net-leg-n', h('b', colLettre(x) + (y + 1)), ' ',
            e.nom || t.t,
            bouts ? h('span.mj', ' — ' + bouts) : null,
            e.notes ? h('span.mj', ' — ' + e.notes) : null);
        }))));
  });
  box.appendChild(liste);
  if (c.notes) box.appendChild(h('p.mj', { style: { marginBottom: 0 } }, c.notes));
  return box;
}

function netExport(c) {
  const blob = new Blob([JSON.stringify({ app: 'cyberpunk-new-dawn', type: 'carte-net', v: 2, carte: c }, null, 2)],
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
        /* Les fichiers d'avant les niveaux n'ont qu'un « cases » à la racine ;
           netMigrer en fait un premier niveau, et rien n'est perdu. */
        if (!c || typeof c !== 'object' || (!c.cases && !Array.isArray(c.etages)))
          throw new Error('pas une carte');
        netMigrer(c);
        c.id = uid();
        NETS.save(c);
        toast('Carte importée — ' + c.etages.length + ' niveau(x).', 'ok');
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

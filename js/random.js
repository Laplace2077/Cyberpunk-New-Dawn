/* ============================================================
   PERSONNAGE ALÉATOIRE
   Tire un personnage complet et légal : profil, caractéristiques,
   compétences, avantages/défauts, événements de vie, achats,
   et remplissage de la feuille (identité, relations, casier).
   ============================================================ */
'use strict';

/* ---------- Réservoirs de noms et de détails ---------- */
const RND_PRENOMS = [
  'Alex', 'Mika', 'Dario', 'Nadia', 'Yuki', 'Ivan', 'Selma', 'Kwan', 'Rosa', 'Tomas',
  'Lina', 'Ezra', 'Kenji', 'Marisol', 'Otto', 'Zeta', 'Camille', 'Bo', 'Anouk', 'Rafael',
  'Suki', 'Dimitri', 'Neve', 'Malik', 'Iris', 'Gustavo', 'Hana', 'Théo', 'Vera', 'Nils',
  'Jun', 'Alma', 'Rachid', 'Wanda', 'Cyrus', 'Lou', 'Diego', 'Freya', 'Sami', 'Noor',
  'Viktor', 'Elsa', 'Tariq', 'Maya', 'Pablo', 'Ines', 'Bruno', 'Kira', 'Adam', 'Solveig',
  'Nathan', 'Lucia', 'Jonas', 'Rania', 'Émile', 'Sonia', 'Hugo', 'Talia', 'Karim', 'Juno'
];
const RND_NOMS = [
  'Vasquez', 'Okonkwo', 'Lindqvist', 'Moreau', 'Tanaka', 'Delacroix', 'Bianchi', 'Ferreira',
  'Novak', 'Haddad', 'Kowalski', 'Ruiz', 'Zhang', 'Ostrowski', 'Bakker', 'Silva', 'Petrov',
  'Nguyen', 'Almeida', 'Kaminski', 'Rossi', 'Fontaine', 'Weiss', 'Bourgeois', 'Kim',
  'Marchetti', 'Ibarra', 'Sorensen', 'Mbeki', 'Castellanos', 'Vidal', 'Reyes', 'Achebe',
  'Kuroda', 'Lambert', 'Sokolov', 'Duarte', 'Halloran', 'Benali', 'Vollmer', 'Cardoso',
  'Vance', 'Mercier', 'Osei', 'Lazar', 'Pham', 'Sandoval', 'Krieger', 'Dumont', 'Baros'
];
const RND_ALIAS = [
  'Static', 'Cendre', 'Halo', 'Verrou', 'Kilomètre', 'Sixième', 'Nickel', 'Tempo', 'Crash',
  'Vermeil', 'Cobalt', 'Rouille', 'Papier', 'Zéro', 'Sourdine', 'Quinze', 'Balafre', 'Écho',
  'Vitrine', 'Aiguille', 'Fusible', 'Mistral', 'Poussière', 'Grésil', 'Bitume', 'Cierge',
  'Fil-de-Fer', 'Boucle', 'Doublure', 'Trente-Trois', 'Néon', 'Faille', 'Cran', 'Silice',
  'Braise', 'Ruban', 'Onyx', 'Chalumeau', 'Loupe', 'Ancre', 'Verre-Pilé', 'Cadran',
  'Sirène', 'Manivelle', 'Cendrier', 'Vapeur', 'Ergot', 'Croupier', 'Cheville', 'Ourlet'
];
const RND_QUARTIERS = [
  'le Combat Zone', 'Little China', 'Japantown', 'Charter Hill', 'North Oak', 'Heywood',
  'The Glen', 'Rancho Coronado', 'Old Downtown', 'Upper Marina', 'South Night City',
  'Del Coronado Bay', 'Pacifica', 'Watson', 'le quartier corporatiste', 'les docks',
  'la périphérie nord', 'un bloc-tour de Westbrook', 'une arcologie d’Arasaka', 'la zone portuaire'
];
const RND_YEUX = ['bruns', 'noirs', 'gris', 'verts', 'bleus', 'noisette', 'ambre (optiques)', 'argentés (optiques)'];
const RND_CHEVEUX = ['noirs', 'blond platine', 'rasés', 'rouges', 'bleu électrique', 'châtains', 'blancs', 'tressés', 'verts', 'décolorés'];
const RND_SIGNES = [
  'cicatrice à la mâchoire', 'tatouage de gang effacé au laser', 'prothèse visible à l’avant-bras',
  'brûlure chimique dans le cou', 'pupilles qui reflètent la lumière', 'accent d’Europe de l’Est',
  'dents en céramique noire', 'main gauche entièrement chromée', 'boiterie discrète',
  'code-barres corporatiste sur la nuque', 'voix cassée', 'trois anneaux d’interface derrière l’oreille',
  'ongles en acier', 'traces de vieilles perfusions', 'sourire refait de travers'
];
const RND_LANGUES = [
  'anglais, français', 'anglais, espagnol', 'anglais, japonais', 'anglais, mandarin, argot des rues',
  'français, russe', 'anglais, allemand, argot corpo', 'anglais, portugais', 'anglais, arabe',
  'anglais, coréen', 'anglais, italien, langue des signes'
];
const RND_STYLES = [
  'Gang de rue — cuir, chaînes, couleurs affichées', 'Corporatiste — costume sombre impeccable',
  'Néo-militariste — treillis, bottes, rangers', 'Bohème High-Tech — surplus et bricolage',
  'Nomade — poussière, cuir râpé, bijoux de famille', 'Fashion victime — vêtements hors de prix',
  'Générique — tout pour ne pas être remarqué', 'Chic urbain — coupes nettes, couleurs froides',
  'Rétro — vêtements du siècle dernier, entretenus'
];
const RND_REPUT = [
  'inconnu au bataillon', 'un nom qui circule dans deux ou trois bars', 'fiable, cher, discret',
  'quelqu’un qui a survécu à quelque chose', 'mauvaise réputation, bons résultats',
  'passe pour plus dangereux qu’il ne l’est', 'a rendu service à trop de gens',
  'grillé chez les corpos, apprécié dans la rue', 'personne ne sait pour qui il travaille vraiment'
];
const RND_PROFS = [
  'ripperdoc', 'barman', 'coursier', 'flic de la LEDiv', 'dealer', 'mécano', 'fixer',
  'infirmière de nuit', 'videur', 'journaliste', 'receleur', 'chauffeur', 'technicien réseau',
  'avocat commis d’office', 'prêteur sur gages', 'chef de gang', 'cadre corpo', 'tatoueur',
  'garagiste', 'passeur', 'concierge d’immeuble', 'informateur', 'armurier', 'croupier'
];
const RND_LIENS = [
  'a grandi avec', 'lui doit la vie', 'ancien coéquipier', 'famille', 'ex', 'colocataire',
  'l’a sorti de garde à vue', 'partage un secret', 'même unité, autrefois', 'créancier bienveillant'
];
const RND_CONFLITS = [
  'contrat qui a mal tourné', 'dette impayée', 'témoignage', 'territoire', 'trahison',
  'un mort qu’on lui met sur le dos', 'une arme volée', 'jalousie professionnelle', 'histoire de famille'
];
const RND_VEUT = [
  'le récupérer vivant', 'récupérer son argent', 'le faire taire', 'l’humilier en public',
  'reprendre ce qui lui appartient', 'le voir tomber, sans se salir les mains', 'une excuse pour frapper'
];
const RND_MOTIFS = [
  'rembourser ce qu’il doit avant la fin de l’année', 'retrouver quelqu’un qui a disparu',
  'monter assez haut pour ne plus jamais avoir peur', 'faire sortir un proche d’un contrat',
  'effacer un dossier qui existe encore quelque part', 'se payer l’implant qui change tout',
  'prouver qu’il valait mieux que ce qu’on a dit de lui', 'quitter Night City avec assez pour vivre',
  'venger une nuit dont il ne parle jamais', 'tenir en vie les quelques personnes qui restent'
];
const RND_PEURS = [
  'de finir comme son prédécesseur', 'de perdre le peu d’humanité qui lui reste',
  'des espaces fermés depuis une intervention ratée', 'de devoir choisir entre deux fidélités',
  'de retourner en cellule', 'que l’on découvre son vrai nom', 'de ne plus rien ressentir',
  'des hôpitaux corpo', 'de manquer d’argent au mauvais moment'
];

/* Familles de cybernétique privilégiées par profil */
const RND_CYB = {
  solo: ['Neuromatériel', 'Cyberoptique', 'Implants cybernétiques', 'Biomatériel', 'Cybermembres'],
  netrunner: ['Neuromatériel', 'Puces', 'Cyberoptique', 'Implants cybernétiques'],
  techie: ['Cybermembres', 'Cyberoptique', 'Implants cybernétiques', 'Puces'],
  medtech: ['Biomatériel', 'Cyberoptique', 'Senseurs', 'Implants cybernétiques'],
  media: ['Cyberoptique', 'Cyberaudio', 'Senseurs', 'Puces'],
  rockerboy: ['Accessoires de mode', 'Cyberaudio', 'Biomatériel'],
  fixer: ['Cyberaudio', 'Neuromatériel', 'Cyberoptique', 'Accessoires de mode'],
  lediv: ['Cyberoptique', 'Neuromatériel', 'Implants cybernétiques', 'Biomatériel'],
  corpo: ['Neuromatériel', 'Cyberoptique', 'Biomatériel', 'Accessoires de mode'],
  nomade: ['Biomatériel', 'Cyberoptique', 'Implants cybernétiques', 'Cybermembres']
};
/* Familles d'armes privilégiées par profil */
const RND_ARM = {
  solo: ["Fusils d'assaut (Armée)", 'Pistolets mitrailleurs lourds', 'Fusils à pompe', 'Pistolets automatiques lourds'],
  lediv: ['Pistolets automatiques lourds', 'Fusils à pompe', "Fusils d'assaut (Armée)"],
  nomade: ['Fusils de précision', 'Fusils à pompe', 'Pistolets automatiques lourds', 'Armes blanches'],
  techie: ['Pistolets automatiques légers', 'Armes blanches', 'Tasers'],
  netrunner: ['Pistolets automatiques légers', 'Tasers'],
  medtech: ['Pistolets automatiques légers', 'Tasers'],
  media: ['Pistolets automatiques légers', 'Tasers'],
  rockerboy: ['Pistolets automatiques légers', 'Armes blanches'],
  fixer: ['Pistolets automatiques légers', 'Pistolets automatiques lourds'],
  corpo: ['Pistolets automatiques légers', 'Tasers']
};
/* Catégories d'équipement privilégiées par profil */
const RND_EQ = {
  solo: ['Divers', 'Médical', 'Communication', 'Vêtements spéciaux et sacs'],
  netrunner: ['Électronique personnelle', 'Communication', 'Surveillance', 'Outils'],
  techie: ['Outils', 'Électronique personnelle', 'Divers', 'Transport'],
  medtech: ['Médical', 'Outils', 'Communication', 'Divers'],
  media: ['Optique', 'Surveillance', 'Communication', 'Électronique personnelle'],
  rockerboy: ['Divers', 'Vêtements spéciaux et sacs', 'Communication', 'Logement'],
  fixer: ['Communication', 'Logement', 'Surveillance', 'Divers'],
  lediv: ['Communication', 'Surveillance', 'Médical', 'Transport'],
  corpo: ['Logement', 'Communication', 'Électronique personnelle', 'Optique'],
  nomade: ['Transport', 'Outils', 'Divers', 'Médical']
};

/* ---------- Petits outils ---------- */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuf = a => { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
const pickN = (a, n) => shuf(a).slice(0, n);
const chance = p => Math.random() < p;

/** Âge tiré avec un poids réaliste : la plupart des personnages sont jeunes */
function rndAge() {
  const r = Math.random();
  if (r < 0.58) return ri(17, 27);
  if (r < 0.85) return ri(28, 36);
  return ri(37, 52);
}

/** Caractéristiques : le profil de l'archétype, bousculé de ±2 au maximum */
function rndCaracs(base, sacrifice) {
  const c = {}; RULES.STATS.forEach(s => c[s] = base[s]);
  for (let i = 0; i < 14; i++) {
    const a = pick(RULES.STATS), b = pick(RULES.STATS);
    if (a === b) continue;
    if (c[a] - 1 < Math.max(RULES.STAT_MIN, base[a] - 2)) continue;
    if (c[b] + 1 > Math.min(RULES.STAT_MAX, base[b] + 2)) continue;
    c[a]--; c[b]++;
  }
  let n = sacrifice, garde = 300;
  while (n > 0 && garde--) {
    const s = pick(RULES.STATS);
    if (c[s] > RULES.STAT_MIN) { c[s]--; n--; }
  }
  return c;
}

/** Compétences : le cœur de métier de l'archétype, puis quelques compétences de couleur */
function rndSkills(ch, arch, spec) {
  const budget = RULES.skillPoints(ch);
  const cap = RULES.ageRow(ch.age).max;
  const coeur = Math.round(budget * (0.80 + Math.random() * 0.14));
  const alloc = allocSkills(shapeTargets(arch.skills, spec), coeur, cap);
  const list = alloc.skills.map(s => ({ nom: s.nom, niv: s.niv, spec: '' }));
  let reste = budget - (coeur - alloc.reste);

  const dispo = DB.skills.filter(s => noAcc(s.nom) !== 'adrenaline'
    && !list.some(x => noAcc(x.nom) === noAcc(s.nom)));
  const couleur = pickN(dispo, 8);
  couleur.forEach(s => {
    if (reste <= 0) return;
    const co = RULES.skillCoeff(s.nom);
    const niv = Math.min(ri(1, 3), cap, Math.floor(reste / co));
    if (niv < 1) return;
    list.push({ nom: s.nom, niv, spec: '' });
    reste -= niv * co;
  });
  /* les points qui traînent encore montent le cœur de métier */
  let garde = 60;
  while (reste > 0 && garde--) {
    const s = pick(list);
    const co = RULES.skillCoeff(s.nom);
    const lim = noAcc(s.nom) === 'adrenaline' ? 2 : cap;
    if (s.niv < lim && reste >= co) { s.niv++; reste -= co; }
  }
  ch.competences = list.sort((a, b) => b.niv - a.niv || a.nom.localeCompare(b.nom, 'fr'));
}

/** Avantages et défauts, dans les limites du livre (3 défauts, 15 points) */
function rndTraits(ch, arch) {
  const trouve = (src, n) => src.find(x => noAcc(x.nom) === noAcc(n));
  const traits = [];
  const nomPris = n => traits.some(t => noAcc(t.nom) === noAcc(n));

  const cible = ri(1, 3);
  let gagnes = 0;
  shuf(arch.df).concat(shuf(DB.defects.map(x => x.nom))).forEach(nom => {
    if (traits.filter(t => t.type === 'defaut').length >= cible) return;
    const def = trouve(DB.defects, nom);
    if (!def || nomPris(nom)) return;
    const couts = (def.couts || []).filter(c => c < 0);
    if (!couts.length) return;
    const c = pick(couts);
    if (gagnes + Math.abs(c) > RULES.DEF_MAX_POINTS) return;
    gagnes += Math.abs(c);
    traits.push({ nom: def.nom, type: 'defaut', cout: c, table: def.table || null });
  });

  let pa = RULES.PA_START + gagnes;
  shuf(arch.av).concat(shuf(DB.advantages.map(x => x.nom))).forEach(nom => {
    if (pa <= 0 || traits.filter(t => t.type !== 'defaut').length >= 6) return;
    const def = trouve(DB.advantages, nom);
    if (!def || nomPris(nom)) return;
    const couts = (def.couts || []).filter(c => c > 0 && c <= pa);
    if (!couts.length) return;
    const c = pick(couts);
    pa -= c;
    traits.push({ nom: def.nom, type: 'avantage', cout: c, table: def.table || null });
  });
  /* un effet court dans la colonne « Effet » de la feuille */
  traits.forEach(t => {
    const def = trouve(t.type === 'defaut' ? DB.defects : DB.advantages, t.nom);
    if (!def) return;
    const l = String(def.desc || '').replace(/\s+/g, ' ').split(/[.;:]/)[0].trim();
    if (l) t.note = l.length > 52 ? l.slice(0, 50) + '…' : l;
  });
  ch.traits = traits;
}

/* ---------- Achats ---------- */
const prixOk = x => x && x.prix !== null && x.prix !== undefined && x.prix > 0;

function rndAchats(ch, arch, niveauCyber) {
  const argent = RULES.money(ch);
  const sp = arch.split;
  const reste = () => argent - RULES.spent(ch);
  ch.inventaire = []; ch.cyber = [];

  /* -- Armure -- */
  const budArm = argent * sp.armure / 100 * (0.7 + Math.random() * 0.9);
  const lourd = ['solo', 'lediv', 'nomade'].includes(arch.id);
  const armures = DB.armor.armures.filter(a => prixOk(a) && a.prix <= Math.min(budArm, reste())
    && (lourd || a.categorie !== 'Lourde'));
  if (armures.length) {
    const top = armures.sort((a, b) => b.prix - a.prix).slice(0, 4);
    const a = pick(top);
    ch.inventaire.push({
      type: 'armure', nom: a.nom, prix: a.prix, qte: 1, sp: a.sp, zones: a.zones,
      humanite: a.humanite, humanite_moy: null
    });
  }

  /* -- Armes -- */
  const budArmes = argent * sp.armes / 100 * (0.8 + Math.random() * 0.8);
  const cats = RND_ARM[arch.id] || ['Pistolets automatiques légers'];
  const achArme = (categories, plafond) => {
    const l = DB.weapons.filter(w => prixOk(w) && w.prix <= Math.min(plafond, reste())
      && categories.some(c => w.categorie === c));
    if (!l.length) return null;
    const w = pick(l.sort((a, b) => b.prix - a.prix).slice(0, 6));
    ch.inventaire.push({
      type: 'arme', nom: w.nom, prix: w.prix, qte: 1, prec: w.prec, degats: w.degats,
      calibre: w.calibre, chargeur: w.chargeur, cadence: w.cadence, portee: w.portee,
      dissimulation: w.dissimulation, fiabilite: w.fiabilite
    });
    return w;
  };
  const principale = achArme(cats, budArmes * 0.75);
  const secours = achArme(['Pistolets automatiques légers'], budArmes * 0.35);

  /* -- Munitions -- */
  [principale, secours].filter(Boolean).forEach(w => {
    const m = DB.ammo.classement.find(x => norCal(x.calibre) === norCal(w.calibre));
    if (!m || !m.prix_10) return;
    const boites = ri(2, 5);
    const prix = m.prix_10 * boites;
    if (prix > reste()) return;
    ch.inventaire.push({
      type: 'munition', nom: `Munitions ${m.calibre} (${boites * 10 } balles)`,
      prix, qte: 1, effet: 'Standard', calibre: m.calibre, nb: boites * 10
    });
  });

  /* -- Matériel du Net, pour qui sait s'en servir -- */
  const inter = (ch.competences || []).find(x => noAcc(x.nom) === 'interface');
  if (inter && inter.niv >= 3 && DB.net_hardware && DB.net_programs) {
    const gros = inter.niv >= 5;
    const budNet = Math.min(reste() * 0.8, argent * (gros ? 0.42 : 0.22) * (0.8 + Math.random() * 0.5));
    const consoles = DB.net_hardware.consoles.filter(c => c.prix && c.prix <= budNet * 0.8);
    if (consoles.length) {
      const c = pick(consoles.sort((a, b) => b.prix - a.prix).slice(0, 5));
      ch.inventaire.push({ type: 'console', nom: c.nom, prix: c.prix, qte: 1,
        vitesse: c.vitesse, memoire: c.memoire, mur: c.mur, ports: c.ports });
      /* des programmes, dans la limite de la mémoire de la console */
      let um = Number(c.memoire) || 10, g = 40;
      const utiles = ['Intrusion', 'Décryptage', 'Détection', 'Furtivité', 'Protection',
        'Anti-programme', 'Anti-système', 'Utilitaire'];
      while (g-- > 0) {
        const l = DB.net_programs.filter(x => x.prix && x.um && x.um <= um
          && x.prix <= reste() * 0.5 && utiles.includes(x.classe)
          && !ch.inventaire.some(y => y.type === 'programme' && y.nom === x.nom));
        if (!l.length) break;
        const x = pick(l);
        ch.inventaire.push({ type: 'programme', nom: x.nom, prix: x.prix, qte: 1,
          classe: x.classe, force: x.force, um: x.um, fonction: x.fonction });
        um -= x.um;
        if (um <= 0) break;
      }
    }
  }

  /* -- Cybernétique -- */
  const EMP = ch.caracs.EMP;
  const humMax = Math.max(0, (EMP - 2)) * 10 + 9;
  const facteur = [0.3, 0.55, 0.8, 1][clamp(niveauCyber, 0, 3)];
  const humCible = humMax * facteur;
  const budCyber = argent * sp.cyber / 100 * (0.8 + Math.random() * 0.6) * (0.5 + facteur / 2);
  const fams = RND_CYB[arch.id] || ['Cyberoptique'];
  const bases = DB.cyberware.filter(c => c.role !== 'option' && prixOk(c));
  const possede = n => RULES.cyberFlat(ch).some(x => noAcc(x.nom) === noAcc(n));
  let depCyber = 0;
  const maxPieces = ri(1, 2) + niveauCyber * 2;

  let garde = 60;
  while (garde-- > 0) {
    if (ch.cyber.length >= maxPieces) break;
    const hum = RULES.humanityLost(ch);
    if (hum >= humCible) break;
    const plafond = Math.min(budCyber - depCyber, reste());
    if (plafond <= 0) break;
    const dispo = bases.filter(c => !possede(c.nom)
      && c.prix <= plafond
      && hum + (Number(c.humanite_moy) || 0) <= humCible
      && (!c.requiert || possede(c.requiert)));
    const prefere = dispo.filter(c => fams.includes(c.categorie));
    const l = prefere.length && chance(0.85) ? prefere : dispo;
    if (!l.length) break;
    const c = pick(l);
    depCyber += c.prix;
    const rig = {
      type: 'cyber', nom: c.nom, prix: c.prix || 0, qte: 1, humanite: c.humanite,
      humanite_moy: c.humanite_moy, categorie: c.categorie, effets: c.effets,
      slots: c.slots === undefined ? null : c.slots, accepte: c.accepte || [], options: []
    };
    ch.cyber.push(rig);
    /* options sur la pièce, dans la limite d'emplacements du livre */
    const max = RULES.slotsMax(rig);
    if (max && (rig.accepte || []).length) {
      let n = ri(0, Math.min(3, max));
      let g2 = 12;
      while (n > 0 && g2-- > 0) {
        const libre = RULES.slotsLeft(rig);
        const marge = Math.min(budCyber - depCyber, reste());
        if (marge <= 0) break;
        const opts = DB.cyberware.filter(o => o.role === 'option' && prixOk(o)
          && (rig.accepte || []).includes(o.hote)
          && !(rig.options || []).some(x => noAcc(x.nom) === noAcc(o.nom))
          && ((o.cout_slot === null || o.cout_slot === undefined) ? 1 : Number(o.cout_slot)) <= libre
          && o.prix <= marge
          && RULES.humanityLost(ch) + (Number(o.humanite_moy) || 0) <= humCible);
        if (!opts.length) break;
        const o = pick(opts);
        depCyber += o.prix;
        rig.options.push({
          nom: o.nom, prix: o.prix || 0, humanite: o.humanite, humanite_moy: o.humanite_moy,
          cout_slot: (o.cout_slot === null || o.cout_slot === undefined) ? 1 : Number(o.cout_slot),
          hote: o.hote, effets: o.effets
        });
        n--;
      }
    }
  }

  /* -- Équipement -- */
  const catsEq = RND_EQ[arch.id] || ['Divers'];
  let n = ri(4, 9), g3 = 40;
  while (n > 0 && g3-- > 0) {
    const l = DB.equipment.filter(e => prixOk(e) && e.prix <= reste() * 0.6
      && !ch.inventaire.some(x => noAcc(x.nom) === noAcc(e.nom))
      && (chance(0.75) ? catsEq.includes(e.categorie) : true));
    if (!l.length) break;
    const e = pick(l);
    ch.inventaire.push({ type: 'equipement', nom: e.nom, prix: e.prix, qte: 1, notes: e.desc, categorie: e.categorie });
    n--;
  }
  /* le fond de poche restant */
  ch.depensesLibres = 0;
}

/* ---------- Remplissage de la feuille ---------- */
function rndFeuille(ch, arch, o) {
  const f = ensureF(ch);
  const dv = RULES.derived(ch);
  const R = ficheRows();
  const set = (blk, i, vals) => { if (i < (R[blk] || 0)) Object.assign(rowObj(f, blk, i), vals); };

  f.joueur = o.pnj ? 'PNJ' : '';
  f.pseudonyme = o.alias;
  f.occupation = ch.concept;
  f.reputation = pick(RND_REPUT);
  f.cyberpsychose = dv.humPerdue ? `${dv.humPerdue} pts · EMP ${ch.caracs.EMP} ⇒ ${dv.empAct}` : '—';
  f.psy = 0;
  f.initiative = 'REF ' + ch.caracs.REF + ' + 1D10';
  f.eurodollars = `En poche : ${eb(dv.reste)}`;

  f.idnom = o.nomComplet; f.idalias = o.alias;
  f.genre = pick(['F', 'H', 'NB']);
  f.taille = ri(155, 197) + ' cm';
  f.poids = ri(48, 105) + ' kg';
  f.yeux = pick(RND_YEUX) + ' / ' + pick(RND_CHEVEUX);
  f.signe = pick(RND_SIGNES);
  f.ne = pick(RND_QUARTIERS);
  f.langues = pick(RND_LANGUES);
  f.style = pick(RND_STYLES);

  f.histoire = [ch.description,
  `Nature ${ch.nature.toLowerCase()}, attitude ${ch.attitude.toLowerCase()}.`,
  `Cherche à ${pick(RND_MOTIFS)}. A peur ${pick(RND_PEURS)}.`].filter(Boolean).join(' ');

  /* Événements de vie : le résultat, pas les renvois de table */
  const propre = t => String(t || '')
    .replace(/\s*\((?:Table|Lancer)[^)]*\)/gi, '')
    .replace(/Consultez la table[^.]*\.?/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  (ch.evenements || []).slice(0, R.ev || 0).forEach((ev, i) => {
    const bouts = (ev.etapes || []).filter(s => s.jet !== '—')
      .map(s => propre(s.texte)).filter(t => t.length > 2);
    set('ev', i, { age: String(ev.annee), evt: (bouts[0] || 'Rien de notable').slice(0, 60),
      cons: bouts.slice(1).join(' · ').slice(0, 80) });
  });

  /* Relations */
  const perso = () => pick(RND_PRENOMS) + ' ' + pick(RND_NOMS);
  for (let i = 0; i < ri(2, 4); i++)
    set('ami', i, { nom: perso(), prof: pick(RND_PROFS), lien: pick(RND_LIENS), loy: String(ri(3, 9)) });
  for (let i = 0; i < ri(1, 3); i++)
    set('enn', i, { nom: perso(), prof: pick(RND_PROFS), conflit: pick(RND_CONFLITS), veut: pick(RND_VEUT) });
  for (let i = 0; i < ri(2, 4); i++)
    set('cont', i, { nom: perso(), occ: pick(RND_PROFS), inf: String(ri(2, 8)), loy: String(ri(2, 9)) });
  set('rep', 0, { niv: String(ri(1, 6)),
    quoi: pick(['un contrat réussi', 'une bagarre célèbre', 'une trahison', 'sa fiabilité',
      'un sauvetage', 'un braquage raté', 'ses tarifs', 'sa discrétion', 'un mort de trop']),
    aupres: pick(['la rue', 'les corpos', 'la LEDiv', 'les gangs', 'le milieu']) });

  /* Casier judiciaire */
  const tousCrimes = (DB.crimes.priorites || []).reduce((a, p) => a.concat(p.crimes || []), []);
  if (tousCrimes.length && chance(0.55)) {
    pickN(tousCrimes, ri(1, 2)).forEach((c, i) => set('cas', i, {
      crime: c.nom, prio: String(c.priorite || ''), peine: (c.peine || '').slice(0, 40),
      statut: pick(['purgée', 'en sursis', 'classée', 'en fuite'])
    }));
  }
  /* Permis */
  if ((ch.inventaire || []).some(x => x.type === 'arme'))
    set('per', 0, { type: 'Port d’arme dissimulée', num: 'NC-' + ri(10000, 99999),
      val: chance(0.7) ? ri(1, 3) + ' ans' : 'périmé' });
  set('per', 1, { type: 'Permis de conduire', num: 'NC-' + ri(100000, 999999),
    val: chance(0.85) ? 'valide' : 'faux' });

  /* Confrérie & ressources si les avantages ont été pris */
  const aTrait = n => (ch.traits || []).some(t => noAcc(t.nom).includes(noAcc(n)));
  if (aTrait('CONFRERIE')) Object.assign(grpObj(f, 'conf'), {
    type: pick(['Gang de rue', 'Clan nomade', 'Syndicat', 'Ordre religieux', 'Guilde technique']),
    rang: String(ri(1, 6)), taille: String(ri(12, 400)), estime: String(ri(2, 8)),
    ressource: pick(['armes', 'planque', 'informations', 'véhicules', 'main-d’œuvre'])
  });
  if (aTrait('RESSOURCES')) Object.assign(grpObj(f, 'ress'), {
    type: pick(['Corporation locale', 'Filiale média', 'Clinique privée', 'Société de sécurité']),
    rang: String(ri(1, 6)), taille: String(ri(20, 2000)), respect: String(ri(2, 8)),
    statut: pick(['stable', 'sous surveillance', 'confortable', 'en sursis'])
  });

  /* Armes, armures, munitions, cybernétique, avantages : report automatique */
  reporterAchats(ch, f);
  return f;
}

/* ============================================================
   GÉNÉRATEUR
   ============================================================ */
function genRandom(o) {
  o = o || {};
  const arch = ARCHETYPES.find(a => a.id === o.arch) || pick(ARCHETYPES);
  const age = o.age || rndAge();
  const spec = o.spec || pick(['tres', 'normal', 'normal', 'poly']);
  const sacrifice = chance(0.28) ? ri(1, 4) : 0;
  const niveauCyber = (o.cyber === null || o.cyber === undefined || o.cyber === '')
    ? ri(0, 3) : Number(o.cyber);

  const prenom = pick(RND_PRENOMS), nomFam = pick(RND_NOMS), alias = pick(RND_ALIAS);
  const cpt = pick(makeConcepts(arch, 5));

  const ch = RULES.blank({
    age, caracs: rndCaracs(arch.caracs, sacrifice), sacrifice,
    nom: prenom + ' ' + nomFam,
    concept: cpt.court, description: cpt.long,
    nature: pick(NATURES), attitude: pick(ATTITUDES)
  });

  rndSkills(ch, arch, spec);
  rndTraits(ch, arch);

  if (o.lifepath !== false) {
    ch.evenements = [];
    for (let an = 14; an <= age; an++) ch.evenements.push(rollLifeYear(an));
  }
  if (o.achats !== false) rndAchats(ch, arch, niveauCyber);
  if (o.fiche !== false) rndFeuille(ch, arch, { alias, pnj: !!o.pnj, nomComplet: prenom + ' ' + nomFam });

  ch.aleatoire = { archetype: arch.id, nom: arch.nom, spec, cyber: niveauCyber, date: new Date().toISOString() };
  ch.etape = 8;
  ch.termine = true;
  ch.journal = [{ d: today(), t: `Personnage tiré au hasard — profil « ${arch.nom} », concept « ${cpt.court} ».` }];
  return ch;
}

/* ============================================================
   VUE
   ============================================================ */
const RND = { st: { arch: '', age: '', cyber: '', lifepath: true, achats: true, fiche: true, pnj: false, n: 1, apercu: null, lot: [] } };

/** Les réglages de l'écran, prêts pour genRandom */
function rndOpts() {
  const st = RND.st, a = parseInt(st.age);
  return {
    arch: st.arch, age: isNaN(a) ? null : clamp(a, 14, 70), cyber: st.cyber,
    lifepath: st.lifepath, achats: st.achats, fiche: st.fiche, pnj: st.pnj
  };
}

SOUS.aleatoire = function () {
  const st = RND.st;
  const wrap = h('div');
  wrap.appendChild(sectionTitle('Tirage', 'Personnage aléatoire',
    "Un personnage complet en un clic : profil, caractéristiques, compétences, avantages et défauts, événements de vie, achats et feuille remplie. Tout reste modifiable ensuite, et l'impression donne la même copie conforme que pour un personnage créé à la main."));

  /* -- Réglages -- */
  const sel = (val, onch, opts) => h('select', { onchange: e => onch(e.target.value) },
    ...opts.map(([v, t]) => h('option', { value: v, selected: String(val) === String(v) }, t)));
  const bascule = (k, t, d2) => h('div.tr' + (st[k] ? '.on' : ''), { style: { cursor: 'pointer' }, onclick: () => { st[k] = !st[k]; route(); } },
    h('div.h', h('b', t), h('span.chip' + (st[k] ? '.a' : ''), st[k] ? 'Oui' : 'Non')),
    h('div.bd', { style: { display: 'block', fontSize: '13px', color: 'var(--ink-3)' } }, d2));

  const reglages = h('div.panel.rise', { style: { marginBottom: '14px' } },
    h('div.panel-h', h('h3', 'Réglages du tirage')),
    h('div.row.wrap', { style: { marginBottom: '12px', gap: '10px' } },
      h('label.row', { style: { gap: '7px' } }, h('span.tag', 'Profil'),
        sel(st.arch, v => { st.arch = v; }, [['', 'Au hasard']].concat(ARCHETYPES.map(a => [a.id, a.nom])))),
      h('label.row', { style: { gap: '7px' } }, h('span.tag', 'Âge'),
        h('input', {
          type: 'number', min: 14, max: 70, placeholder: 'au hasard', value: st.age,
          style: { maxWidth: '132px' }, oninput: e => { st.age = e.target.value; }
        })),
      h('label.row', { style: { gap: '7px' } }, h('span.tag', 'Cybernétique'),
        sel(st.cyber, v => { st.cyber = v; }, [['', 'Au hasard'], ['0', 'Très légère'], ['1', 'Modérée'], ['2', 'Lourde'], ['3', 'Au bord de la cyberpsychose']])),
      h('label.row', { style: { gap: '7px' } }, h('span.tag', 'Nombre'),
        sel(st.n, v => { st.n = Number(v); }, [['1', '1 personnage'], ['3', '3 d’un coup'], ['5', '5 d’un coup'], ['8', '8 d’un coup']]))),
    h('div.gauto',
      bascule('lifepath', 'Événements de vie', "Un tirage par année depuis 14 ans, sur les tables du livre."),
      bascule('achats', 'Achats', "Armure, armes, munitions, cybernétique et équipement dans le budget de départ."),
      bascule('fiche', 'Feuille remplie', "Identité physique, histoire, amis, ennemis, contacts, casier, permis."),
      bascule('pnj', 'Marquer « PNJ »', "Écrit PNJ dans la case Joueur — pratique pour tes fiches de MJ.")),
    h('div.row.wrap', { style: { marginTop: '14px' } },
      h('button.btn.p', {
        onclick: () => {
          const o = rndOpts();
          if (st.n > 1) {
            st.lot = []; st.apercu = null;
            for (let i = 0; i < st.n; i++) { const c = genRandom(o); STORE.save(c); st.lot.push(c); }
            toast(`${st.n} personnages générés et enregistrés.`, 'ok');
          } else {
            st.lot = [];
            st.apercu = genRandom(o);
          }
          route();
        }
      }, st.n > 1 ? `Générer ${st.n} personnages` : 'Tirer un personnage'),
      st.apercu ? h('button.btn.g', { onclick: () => { st.apercu = genRandom(rndOpts()); route(); } }, '↻ Retirer') : null,
      h('button.btn.g', { onclick: () => go('accueil') }, 'Retour à l’accueil')));
  wrap.appendChild(reglages);

  /* -- Aperçu -- */
  if (st.apercu) wrap.appendChild(apercuPerso(st.apercu, st));

  /* -- Lot -- */
  if (st.lot.length) {
    const grid = h('div.roster');
    st.lot.forEach(c => {
      const dv = RULES.derived(c);
      grid.appendChild(h('div.pc-card', {
        onclick: () => { STORE.setCurrent(c.id); go('fiche'); }
      },
        h('div.nm', c.nom),
        h('div.cc', c.concept + ' · ' + c.age + ' ans · ' + (c.aleatoire ? c.aleatoire.nom : '')),
        h('div.st', ...RULES.STATS.map(s => h('b', s === 'CH' ? 'CHA' : s, ' ', h('i', s === 'EMP' ? dv.empAct : c.caracs[s])))),
        h('div.row.wrap', { style: { marginTop: '10px' } },
          h('span.chip', (c.competences || []).length + ' comp.'),
          h('span.chip.m', dv.humPerdue + ' humanité'),
          h('span.chip.c', eb(dv.reste) + ' en poche'))));
    });
    wrap.appendChild(h('div.panel.rise',
      h('div.panel-h', h('h3', `Derniers tirages (${st.lot.length})`),
        h('div.sp'),
        h('button.btn.g.sm', { onclick: () => { st.lot = []; route(); } }, 'Vider la liste')),
      h('p.muted', { style: { margin: '0 0 12px', fontSize: '13.5px' } },
        "Tous sont enregistrés. Clique sur une carte pour ouvrir sa feuille et l'imprimer."),
      grid));
  }
  return wrap;
};

/** Fiche de présentation d'un personnage tiré, avant de le garder */
function apercuPerso(ch, st) {
  const dv = RULES.derived(ch);
  const f = ch.f || {};
  const arch = ch.aleatoire ? ch.aleatoire.nom : '';
  const box = h('div.panel.rise', { style: { marginBottom: '14px' } },
    h('div.panel-h', h('h3', ch.nom + (f.pseudonyme ? ' « ' + f.pseudonyme + ' »' : '')),
      h('div.sp'), h('span.chip.a', arch), h('span.chip', ch.age + ' ans')));

  box.appendChild(h('p', { style: { margin: '0 0 14px', fontSize: '16px', color: 'var(--ink-2)', lineHeight: 1.55 } },
    ch.description));

  const sb = h('div.sblock');
  RULES.STATS.forEach(s => sb.appendChild(h('div.s', h('span', s === 'CH' ? 'CHA' : s),
    h('b', s === 'EMP' ? dv.empAct : ch.caracs[s]), h('i', RULES.STAT_NAMES[s]))));
  box.appendChild(h('div.tag.a', `Caractéristiques · ${RULES.statSpent(ch)} / ${RULES.pool(ch)} points`
    + (ch.sacrifice ? ` · ${ch.sacrifice} sacrifié(s) pour de l'argent` : '')));
  box.appendChild(h('div', { style: { height: '8px' } }));
  box.appendChild(sb);

  box.appendChild(h('div.dv-grid', { style: { margin: '14px 0' } },
    h('div.dv', h('span', 'MC'), h('b', '+' + dv.mc), h('i', dv.mcLabel)),
    h('div.dv', h('span', 'Fracture'), h('b', dv.seuilFracture)),
    h('div.dv', h('span', 'Amputation'), h('b', dv.seuilAmputation)),
    h('div.dv', h('span', 'Course'), h('b', dv.course + ' m')),
    h('div.dv', h('span', 'Humanité'), h('b', dv.humPerdue), h('i', 'EMP ' + ch.caracs.EMP + ' ⇒ ' + dv.empAct)),
    h('div.dv', h('span', 'En poche'), h('b', eb(dv.reste)), h('i', 'sur ' + eb(dv.argent)))));

  const sk = h('div.sk-sheet');
  (ch.competences || []).slice(0, 24).forEach(s => {
    const def = DB.skills.find(x => noAcc(x.nom) === noAcc(s.nom));
    sk.appendChild(h('div.l', h('span.cx', def && def.carac ? def.carac : '—'),
      h('span.nn', s.nom), h('span.vv', s.niv),
      h('span.tt', def && def.carac && ch.caracs[def.carac] !== undefined ? (ch.caracs[def.carac] + s.niv) : '')));
  });
  box.appendChild(h('div.tag.a', `Compétences · ${RULES.skillSpent(ch)} / ${RULES.skillPoints(ch)} PC`
    + ((ch.competences || []).length > 24 ? ` (24 premières sur ${ch.competences.length})` : '')));
  box.appendChild(h('div', { style: { height: '8px' } }));
  box.appendChild(sk);

  const chips = (titre, list, cls) => {
    if (!list.length) return;
    box.appendChild(h('div', { style: { marginTop: '14px' } },
      h('div.tag.a', titre), h('div.row.wrap', { style: { marginTop: '8px' } },
        ...list.map(x => h('span.chip' + (cls || ''), x)))));
  };
  chips('Avantages', (ch.traits || []).filter(t => t.type !== 'defaut').map(t => `${t.nom} (${t.cout} PA)`), '.a');
  chips('Défauts', (ch.traits || []).filter(t => t.type === 'defaut').map(t => `${t.nom} (${t.cout} PA)`), '.m');
  chips('Cybernétique', RULES.cyberFlat(ch).map(c => c.nom), '.c');
  chips('Armes & armure', (ch.inventaire || []).filter(x => x.type === 'arme' || x.type === 'armure').map(x => x.nom), '');
  chips('Équipement', (ch.inventaire || []).filter(x => x.type === 'equipement' || x.type === 'munition').map(x => x.nom), '');

  /* Contrôles de légalité */
  const pbs = RULES.audit(ch).filter(p => p.bad);
  box.appendChild(h('p.muted', { style: { marginTop: '14px', fontSize: '13.5px' } },
    pbs.length ? '⚠ ' + pbs.map(p => p.m).join(' · ')
      : `✓ Création conforme : ${RULES.statSpent(ch)} / ${RULES.pool(ch)} points de caractéristique, `
      + `${RULES.skillSpent(ch)} / ${RULES.skillPoints(ch)} PC, ${dv.paDepense} / ${dv.paTotal} PA, budget respecté.`));

  box.appendChild(h('div.row.wrap', { style: { marginTop: '14px' } },
    h('button.btn.p', {
      onclick: () => {
        STORE.save(ch); st.apercu = null;
        toast('Personnage enregistré.', 'ok');
        go('fiche');
      }
    }, 'Garder et ouvrir la feuille'),
    h('button.btn.g', { onclick: () => { st.apercu = genRandom(rndOpts()); route(); } }, '↻ Retirer'),
    h('button.btn.g', {
      onclick: () => { ch.termine = false; ch.etape = 0; STORE.save(ch); st.apercu = null; go('creation'); }
    }, 'Retoucher dans la création assistée'),
    h('button.btn.g', { onclick: () => STORE.exportOne(ch) }, 'Exporter en JSON')));
  return box;
}

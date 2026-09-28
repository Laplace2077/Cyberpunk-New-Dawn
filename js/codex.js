/* ============================================================
   CODEX — le livre en version consultable
   ============================================================ */
'use strict';

/* Le sommaire du livre : huit chapitres, dans l'ordre des pages */
const CX = {
  groups: [
    {
      n: 1, g: 'Devenir Cyberpunk',
      sous: "Caractéristiques, sauvegardes, compétences, création pas à pas, avantages et défauts, annexes.",
      items: [
        { id: 'regles-creation', t: 'Caractéristiques & création' },
        { id: 'avantages', t: 'Avantages' },
        { id: 'defauts', t: 'Défauts' },
        { id: 'annexes', t: 'Annexes 1 à 5' },
        { id: 'exemple', t: 'Exemple de création' }
      ]
    },
    {
      n: 2, g: 'Les Légendes de la Rue',
      sous: "Les tables d'événements de la vie, les professions des amis, ennemis et contacts, les crimes et condamnations.",
      items: [
        { id: 'vie', t: 'Événements de la vie' },
        { id: 'crimes', t: 'Crimes & condamnations' }
      ]
    },
    {
      n: 3, g: 'Actions & Compétences',
      sous: "Résolution des tâches, difficultés, critiques, et la liste complète des compétences.",
      items: [
        { id: 'regles-competences', t: 'Résolution des tâches' },
        { id: 'competences', t: 'Liste des compétences' }
      ]
    },
    {
      n: 4, g: 'Système de jeu',
      sous: "Gestion du combat, initiative, localisation des coups, encaissement, sauvegardes, stabilisation et soins.",
      items: [{ id: 'regles-combat', t: 'Gestion du combat' }]
    },
    {
      n: 5, g: 'Friday Night Firefight',
      sous: "Utilisation des armes à distance, modes de tir, critiques, enrayage, armes inhabituelles.",
      items: [{ id: 'regles-armes', t: 'Comment tu utilises tes armes' }]
    },
    {
      n: 6, g: 'Friday Night Martial Arts',
      sous: "Les arts martiaux en 2020 : portées, attaques-clef, et les styles avec leurs manœuvres.",
      items: [{ id: 'arts', t: 'Arts martiaux' }]
    },
    {
      n: 7, g: 'Équipement',
      sous: "Matériel courant, armures, armes, munitions, accessoires et législation.",
      items: [
        { id: 'equipement', t: 'Équipement courant' },
        { id: 'armures', t: 'Armures' },
        { id: 'armes', t: 'Armes' },
        { id: 'munitions', t: 'Munitions' },
        { id: 'accessoires', t: 'Accessoires & montures' },
        { id: 'drogues', t: 'Drogues & fabrication' },
        { id: 'regles-loi', t: 'Législation des armes' }
      ]
    },
    {
      n: 8, g: 'Cybernétique',
      sous: "Règles et tarifs chirurgicaux, cyberpsychose, et le catalogue complet : pièces autonomes et options.",
      items: [
        { id: 'cyber-regles', t: 'Chirurgie & cyberpsychose' },
        { id: 'cyber', t: 'Catalogue cybernétique' }
      ]
    },
    {
      n: 9, g: 'Le Net',
      sous: "Le Livre du Net : le réseau et ses territoires, se connecter, les cyberconsoles, "
        + "les 249 programmes, la programmation, la démonologie, le combat dans la matrice et la géographie du réseau.",
      items: [
        { id: 'net-reseau', t: 'Le réseau & se connecter' },
        { id: 'net-materiel', t: 'Cyberconsoles & matériel' },
        { id: 'net-programmes', t: 'Catalogue des programmes' },
        { id: 'net-programmation', t: 'Programmation & démonologie' },
        { id: 'net-combat', t: 'Plongée, combat & attaques' },
        { id: 'net-geo', t: 'Forteresses & géographie' }
      ]
    }
  ]
};

function ruleSections(ids, src) {
  const box = h('div');
  (src || DB.rules.sections).filter(s => ids.includes(s.chapitre) || ids.includes(s.id)).forEach(s => {
    const ct = h('div.ct');
    ct.appendChild(h('div.prose.cols', { html: md(s.texte) }));
    (s.tables || []).forEach(t => {
      ct.appendChild(h('div.tbl-title', t.titre || 'Table'));
      ct.appendChild(dataTable(t.colonnes || [], t.lignes || []));
    });
    box.appendChild(h('details.entry', h('summary', s.titre, h('span.tag', { style: { marginLeft: 'auto' } }, 'p. ' + (s.pages || '—'))), ct));
  });
  return box;
}

const CX_RENDER = {
  'regles-creation': () => ruleSections(['Devenir Cyberpunk']),
  'regles-competences': () => {
    const box = h('div');
    box.appendChild(ruleSections(['Actions & Compétences']));
    const rs = DB.rules_skills;
    if (rs.resolution) {
      box.appendChild(h('details.entry', { open: true }, h('summary', 'Résolution des tâches'),
        h('div.ct',
          rs.resolution.formule ? h('p.mono', { style: { color: 'var(--acid)' } }, rs.resolution.formule) : null,
          h('div.prose', { html: md(rs.resolution.texte) }),
          rs.resolution.difficultes ? h('div',
            h('div.tbl-title', 'Échelle de difficulté'),
            dataTable(['Difficulté', 'Seuil / modificateur'],
              rs.resolution.difficultes.map(x => [x.nom, x.seuil !== undefined ? x.seuil : x.modificateur]), 1)) : null,
          (rs.resolution.modificateurs || []).length ? h('div',
            h('div.tbl-title', 'Modificateurs de difficulté'),
            dataTable(['Condition', 'Modificateur'], rs.resolution.modificateurs.map(x => [x.nom, x.mod]), 1)) : null)));
    }
    if (rs.critiques) {
      box.appendChild(h('details.entry', h('summary', 'Réussites & échecs critiques'),
        h('div.ct', h('div.prose', { html: md(rs.critiques.texte) }),
          (rs.critiques.table_echecs || []).length ? dataTable(['Domaine', 'D10', 'Résultat'],
            rs.critiques.table_echecs.map(x => [x.domaine, x.d10, x.resultat])) : null)));
    }
    box.appendChild(h('details.entry', h('summary', 'Coût des compétences (progression)'),
      h('div.ct', dataTable(['Valeur', 'Coût +1 niv.', '×2', '×3', '×4', '×5'],
        (rs.cout_progression || []).map(r => [r.valeur, r.cout_plus1, r.x2, r.x3, r.x4, r.x5]), 1),
        h('div.prose', { style: { marginTop: '14px' } },
          ...(rs.moyens_gagner_pc || []).map(m => h('div', h('h3', m.titre), h('p', m.texte)))))));
    return box;
  },
  'regles-combat': () => ruleSections(['Système de jeu']),
  'regles-armes': () => ruleSections(['Friday Night Firefight']),
  'regles-loi': () => ruleSections(['Équipement', 'legislation-armes-2020', 'loi-federale-1999']),
  exemple: () => {
    const e = DB.rules.exemple_creation;
    if (!e) return h('p.muted', 'Exemple absent.');
    const sb = h('div.sblock');
    RULES.STATS.forEach(s => sb.appendChild(h('div.s', h('span', s), h('b', e.caracs[s]))));
    return h('div.panel',
      h('div.panel-h', h('h3', `${e.nom} — ${e.age} ans`)),
      h('p', { style: { color: 'var(--txt-2)', marginTop: 0 } },
        h('b', 'Concept : '), e.concept, ' · ', h('b', 'Nature : '), e.nature, ' · ', h('b', 'Attitude : '), e.attitude),
      sb,
      h('div.tag.a', { style: { margin: '16px 0 6px' } }, `Compétences — ${(e.competences || []).length}`),
      h('div.sk-sheet', ...(e.competences || []).map(c => h('div.l', h('span.nn', c.nom), h('span.vv', c.niv)))),
      h('div.tag.a', { style: { margin: '16px 0 6px' } }, 'Événements de la vie'),
      h('div.prose', h('ul', ...(e.evenements || []).map(x => h('li', x)))),
      h('div.tag.a', { style: { margin: '16px 0 6px' } }, 'Avantages / Défauts'),
      h('div.row.wrap', ...(e.avantages_defauts || []).map(t => h('span.chip' + (t.pa < 0 ? '.m' : '.a'), t.nom + ' (' + t.pa + ')'))),
      h('div.tag.a', { style: { margin: '16px 0 6px' } }, 'Argent de départ'),
      h('p.mono', { style: { color: 'var(--acid)', margin: 0 } }, eb(e.argent)),
      h('p.muted', { style: { fontSize: '12px', marginTop: '14px' } },
        `Note : la somme des niveaux de compétences de cet exemple (${(e.competences || []).reduce((n, c) => n + c.niv, 0)}) est inférieure au budget annoncé de ${RULES.SKILL_BASE + e.caracs.INT + e.caracs.REF + RULES.ageRow(e.age).tpc} points — l'exemple du livre ne dépense pas tout.`)
    );
  },
  competences: () => {
    const box = h('div');
    const st = { q: '', c: '' };
    const host = h('div');
    const draw = () => {
      clear(host);
      const q = noAcc(st.q);
      const items = DB.skills.filter(s => (!st.c || (s.carac || '—') === st.c) &&
        (!q || noAcc(s.nom).includes(q) || noAcc(s.desc || '').includes(q)));
      host.appendChild(h('p.muted', { style: { fontSize: '12px', marginBottom: '10px' } }, items.length + ' compétence(s)'));
      items.forEach(s => host.appendChild(h('details.entry',
        h('summary', s.nom, h('span.chip' + (s.carac ? '.c' : ''), { style: { marginLeft: 'auto' } }, s.carac || 'aucune carac'),
          s.coeff > 1 ? h('span.chip.a', '×' + s.coeff) : null),
        h('div.ct',
          h('p', { style: { margin: '0 0 8px', color: 'var(--txt-2)', fontSize: '13.5px', lineHeight: 1.6 } }, s.desc),
          s.notes ? h('p', { style: { margin: '0 0 8px', color: 'var(--cyan)', fontSize: '12.5px', fontFamily: 'var(--f-mono)' } }, s.notes) : null,
          (s.paliers || []).length ? h('div.prose', h('ul', ...s.paliers.map(p => h('li', h('strong', p.niv + ' '), p.effet)))) : null,
          s.specialisable ? h('span.chip.a', 'À préciser (domaine ou style)') : null))));
    };
    box.appendChild(h('div.row.wrap.cx-search',
      h('input', { type: 'search', placeholder: 'Chercher une compétence…', style: { maxWidth: '260px' }, oninput: e => { st.q = e.target.value; draw(); } }),
      h('select', { style: { maxWidth: '150px' }, onchange: e => { st.c = e.target.value; draw(); } },
        h('option', { value: '' }, 'Toutes caracs'),
        ...['INT', 'REF', 'TECH', 'EMP', 'CON', 'SF', 'BT', '—'].map(c => h('option', { value: c }, c)))));
    box.appendChild(host); draw();
    return box;
  },
  avantages: () => traitList(DB.advantages),
  defauts: () => traitList(DB.defects),
  annexes: () => {
    const a = DB.annexes, box = h('div');
    const tbl = (o, titre) => {
      if (!o) return null;
      const ct = h('div.ct');
      if (o.intro) ct.appendChild(h('div.prose', { html: md(o.intro) }));
      if (o.groupes) o.groupes.forEach(g => {
        ct.appendChild(h('div.tbl-title', g.nom));
        const cols = g.colonnes || Object.keys(g.lignes[0] || {});
        ct.appendChild(dataTable(cols, g.lignes.map(l => cols.map(c => l[c] !== undefined ? l[c] : l[noAcc(c)] || Object.values(l)[cols.indexOf(c)])), 1));
      });
      if (o.lignes) {
        const cols = o.colonnes || Object.keys(o.lignes[0] || {});
        ct.appendChild(dataTable(cols, o.lignes.map(l => Array.isArray(l) ? l : cols.map(c => l[c] !== undefined ? l[c] : Object.values(l)[cols.indexOf(c)])), 1));
      }
      if (o.tables) o.tables.forEach(t => {
        ct.appendChild(h('div.tbl-title', `${t.titre} — ${t.des || ''}`));
        ct.appendChild(dataTable(['Jet', 'Résultat'], (t.lignes || []).map(l => [l.plage || `${l.min}–${l.max}`, l.resultat])));
      });
      if (o.note) ct.appendChild(h('p.muted', { style: { fontSize: '12px' } }, o.note));
      return h('details.entry', h('summary', titre || o.titre || ''), ct);
    };
    box.appendChild(tbl(a.confrerie, 'Annexe 1 — Confrérie'));
    box.appendChild(tbl(a.ressources, 'Annexe 2 — Ressources'));
    box.appendChild(tbl(a.contacts, 'Annexe 3 — Contacts'));
    if (a.blessures) {
      const ct = h('div.ct');
      if (a.blessures_table) {
        ct.appendChild(h('div.tbl-title', 'Table des blessures'));
        const t = a.blessures_table;
        ct.appendChild(dataTable(['Jet', 'Blessure'], (t.lignes || t).map(l => [l.plage || `${l.min}–${l.max}`, l.resultat || l.nom])));
      }
      a.blessures.forEach(b => ct.appendChild(h('div', h('div.tbl-title', b.nom), h('div.prose', { html: md(b.texte) }))));
      box.appendChild(h('details.entry', h('summary', 'Annexe 4 — Blessures spécifiques'), ct));
    }
    box.appendChild(tbl(a.prison, 'Annexe 5 — La vie en prison'));
    return box;
  },
  vie: () => {
    const box = h('div');
    box.appendChild(h('div.panel', { style: { marginBottom: '14px' } },
      h('div.prose', { html: md((DB.lifepath.intro || '') + '\n\n' + (DB.lifepath.regle || '')) }),
      h('div.row.wrap', { style: { marginTop: '12px' } },
        h('button.btn.p.sm', {
          onclick: () => {
            const st = rollTable('1A');
            modal({
              title: 'Tirage — Table 1A',
              body: h('div', ...st.map(s => h('p', { style: { margin: '0 0 10px', fontSize: '13.5px' } },
                h('span.tag.a', `${s.titre} · ${s.des} = ${s.jet}`), h('br'), s.texte))),
              actions: [{ label: 'Fermer', cls: '.p' }]
            });
          }
        }, 'Tirer un événement complet'))));
    Object.keys(DB.lifepath.tables).forEach(id => {
      const t = DB.lifepath.tables[id];
      box.appendChild(h('details.entry',
        h('summary', `${id} — ${t.titre}`, h('span.chip.c', { style: { marginLeft: 'auto' } }, t.des)),
        h('div.ct',
          t.note_livre ? h('p.muted', { style: { fontSize: '12px' } }, t.note_livre) : null,
          t.instruction ? h('div.prose', { html: md(t.instruction) }) : null,
          (t.lignes || []).length ? dataTable(['Jet', 'Résultat', 'Enchaîne sur'],
            t.lignes.map(l => [l.min === l.max ? l.min : `${l.min}–${l.max}`, l.resultat,
              [].concat(l.suite || l.chaine || []).join(' → ') || '—'])) : null,
          !(t.lignes || []).length && t.chaine ? h('p', h('span.tag', 'Enchaîne sur'), ' ', [].concat(t.chaine).join(' → ')) : null,
          h('button.btn.g.xs', {
            style: { marginTop: '10px' },
            onclick: () => {
              const st = rollTable(id);
              modal({
                title: 'Tirage — ' + id, body: h('div', ...st.map(s => h('p', { style: { margin: '0 0 10px', fontSize: '13.5px' } },
                  h('span.tag.a', `${s.titre} · ${s.des} = ${s.jet}`), h('br'), s.texte))),
                actions: [{ label: 'Fermer', cls: '.p' }]
              });
            }
          }, 'Lancer sur cette table'))));
    });
    return box;
  },
  crimes: () => {
    const c = DB.crimes, box = h('div');
    box.appendChild(h('div.panel', { style: { marginBottom: '14px' } }, h('div.prose', { html: md(c.intro || '') }),
      c.note ? h('p.muted', { style: { fontSize: '12px' } }, c.note) : null));
    (c.priorites || []).forEach(p => box.appendChild(h('details.entry',
      h('summary', `${p.nom || ''} — ${p.niveau}`),
      h('div.ct',
        h('div.prose', { html: md(p.sanction || '') }),
        h('div.tbl-title', 'Crimes concernés'),
        h('div.prose', h('ul', ...(p.crimes || []).map(x => h('li', typeof x === 'string' ? x : (x.nom + (x.peine ? ' — ' + x.peine : ''))))))))));
    return box;
  },
  armes: () => catalog(DB.weapons, 'categorie', w => ({
    nom: w.nom, prix: w.prix, prixTexte: w.prix_texte,
    meta: [w.prec && 'Préc ' + w.prec, w.degats && 'Dégâts ' + w.degats, w.calibre, w.chargeur && 'Ch ' + w.chargeur,
      w.cadence && 'Cad ' + w.cadence, w.portee, w.fiabilite, w.dispo && 'Dispo ' + w.dispo, w.dissimulation && 'Dissim ' + w.dissimulation],
    desc: w.notes
  })),
  armures: () => {
    const box = h('div');
    const r = DB.armor.regles || {};
    const ct = h('div.ct');
    Object.keys(r).forEach(k => { if (r[k]) { ct.appendChild(h('div.tbl-title', k.replace(/_/g, ' '))); ct.appendChild(h('div.prose', { html: md(r[k]) })); } });
    box.appendChild(h('details.entry', h('summary', 'Règles d’armure'), ct));
    box.appendChild(catalog(DB.armor.armures, 'categorie', a => ({
      nom: a.nom, prix: a.prix, prixTexte: a.prix_texte,
      meta: [a.sp && 'PA ' + a.sp, a.ev && 'EV ' + a.ev, a.zones, a.humanite && 'Humanité ' + a.humanite],
      desc: a.desc, notes: a.notes
    })));
    return box;
  },
  munitions: () => {
    const box = h('div');
    if ((DB.ammo.classement || []).length) {
      const cols = Object.keys(DB.ammo.classement[0]);
      box.appendChild(h('details.entry', h('summary', 'Classement par type d’arme / calibre'),
        h('div.ct', dataTable(cols, DB.ammo.classement.map(r => cols.map(c => r[c])), 1))));
    }
    box.appendChild(catalog(DB.ammo.munitions, 'type', m => ({
      nom: m.nom, prix: m.prix, prixTexte: m.prix_texte, meta: [m.type, m.source], desc: m.effet
    })));
    return box;
  },
  accessoires: () => {
    const all = DB.weapon_accessories.accessoires.concat(
      (DB.weapon_accessories.montures || []).map(m => Object.assign({ categorie: 'Montures d’armes' }, m)));
    return catalog(all, 'categorie', a => ({ nom: a.nom, prix: a.prix, prixTexte: a.prix_texte, meta: [a.source], desc: a.notes || a.desc }));
  },
  drogues: () => {
    const R = DB.drugs_rules;
    const box = h('div');
    box.appendChild(sectionTitle('Chapitre 9', 'Drogues',
      "Les neuf drogues du livre de base, et les règles pour en fabriquer de nouvelles."));
    box.appendChild(catalog(DB.equipment.filter(e => e.categorie === 'Drogues'), 'categorie',
      e => ({ nom: e.nom, prix: e.prix, prixTexte: e.prix_texte, meta: ['Drogue'], desc: e.desc })));
    if (!R) return box;
    box.appendChild(h('div.panel.rise', { style: { marginTop: '18px' } },
      h('div.panel-h', h('h3', R.titre)),
      h('p', { style: { margin: '0 0 14px', color: 'var(--ink-2)', fontSize: '15px', lineHeight: 1.6 } }, R.texte),
      h('ol', { style: { margin: '0 0 6px', paddingLeft: '20px', lineHeight: 1.6 } },
        ...(R.etapes || []).map(e => h('li', { style: { marginBottom: '5px' } }, e.replace(/^\d+\.\s*/, '')))),
      h('p.muted', { style: { margin: '10px 0 0', fontSize: '13px' } }, R.source)));
    (R.tables || []).forEach(t => {
      box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
        h('div.panel-h', h('h3', t.titre)),
        dataTable(t.colonnes || [], t.lignes || [], 1),
        t.note ? h('p.muted', { style: { margin: '10px 0 0', fontSize: '13px' } }, t.note) : null));
    });
    return box;
  },

  /* ---------- Livre du Net ---------- */
  'net-reseau': () => {
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Le réseau & se connecter',
      "Chapitres 1 à 3 : l'organisation du Réseau, les îles, les régions, le Mur Noir, NetWatch, les interfaces, les icônes, et le fonctionnement d'un cybermodem."));
    box.appendChild(ruleSections(['Le réseau et ses territoires', 'Se connecter', 'Fonctionnement'], DB.net_rules.sections));
    return box;
  },
  'net-programmation': () => {
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Programmation & démonologie',
      "Chapitres 5 et 6 : écrire ses propres programmes — fonctions, options, force, taille, temps et coût — puis les daemons, leur autonomie et l'édition d'icônes."));
    box.appendChild(ruleSections(['Programmation', 'Démonologie'], DB.net_rules.sections));
    return box;
  },
  'net-combat': () => {
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Plongée, combat & attaques',
      "Chapitres 7 à 9 : connexions en direct, courses dans la matrice, initiative, tours, portée, mouvement, furtivité, et les trois formes d'attaque du Net."));
    box.appendChild(ruleSections(['Plongée dans la matrice', 'Combat et déplacement', 'Attaques dans le Net'], DB.net_rules.sections));
    return box;
  },
  'net-geo': () => {
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Forteresses & géographie',
      "Chapitres 10 et 11 : concevoir une forteresse de données, jouer une IA, les tarifs longue distance, le pistage, les grilles de ville et les rencontres aléatoires."));
    box.appendChild(ruleSections(["Outils d'intrusion et de défense", 'Géographie du réseau'], DB.net_rules.sections));
    return box;
  },
  'net-programmes': () => {
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Programmes',
      `Les ${DB.net_programs.length} programmes du livre, classés comme dans le chapitre 4. Force, mémoire occupée (UM), prix et effet.`));
    box.appendChild(catalog(DB.net_programs, 'classe', p => ({
      nom: p.nom, prix: p.prix, prixTexte: p.prix_texte ? p.prix_texte + ' €$' : null,
      meta: [p.classe,
        'Force ' + (p.force_texte || p.force || '—'),
        'UM ' + (p.um_texte || p.um || '—'),
        p.source && 'Source ' + p.source,
        p.page && 'p. ' + p.page],
      effets: p.fonction, desc: p.desc
    })));
    return box;
  },
  'net-materiel': () => {
    const H = DB.net_hardware;
    const box = h('div');
    box.appendChild(sectionTitle('Livre du Net', 'Cyberconsoles & matériel',
      "Chapitre 3 : les cyberconsoles, les ordinateurs, et toutes les options qui se branchent sur les ports de connexion."));
    const st = { on: 'consoles' };
    const host = h('div');
    const draw = () => {
      clear(host);
      if (st.on === 'consoles') {
        host.appendChild(catalog(H.consoles, null, c => ({
          nom: c.nom, prix: c.prix, prixTexte: c.prix_texte ? c.prix_texte + ' €$' : null,
          meta: ['Vitesse ' + (c.vitesse === null || c.vitesse === undefined ? '—' : c.vitesse),
            'Mémoire ' + (c.memoire_texte || c.memoire || '—'),
            'Mur de données ' + (c.mur === null || c.mur === undefined ? '—' : c.mur),
            'Ports ' + (c.ports || '—'), c.page && 'p. ' + c.page],
          desc: c.detail
        })));
      } else if (st.on === 'ordinateurs') {
        host.appendChild(catalog(H.ordinateurs, null, o => ({
          nom: o.nom, prix: o.prix, prixTexte: o.prix_texte ? o.prix_texte + ' €$' : null,
          meta: Object.entries(o.caracs || {}).map(([k, v]) => k + ' ' + v).concat(o.page ? ['p. ' + o.page] : []),
          desc: o.detail
        })));
      } else {
        host.appendChild(catalog(H.options, 'type', o => ({
          nom: o.nom, prix: o.prix, prixTexte: o.prix_texte,
          meta: [o.type, 'Port ' + (o.port_texte || o.port || '—'), o.page && 'p. ' + o.page],
          desc: o.detail
        })));
      }
    };
    box.appendChild(h('div.row.wrap', { style: { marginBottom: '12px' } },
      ...[['consoles', `Cyberconsoles (${H.consoles.length})`],
        ['ordinateurs', `Ordinateurs (${H.ordinateurs.length})`],
        ['options', `Options de ports (${H.options.length})`]].map(([k, t]) =>
          h('span.chip' + (st.on === k ? '.a' : '') + '.btnlike', { onclick: () => { st.on = k; draw(); } }, t))));
    box.appendChild(host); draw();
    if (H.construire) box.appendChild(h('div.panel.rise', { style: { marginTop: '16px' } },
      h('div.panel-h', h('h3', H.construire.titre || 'Construire ou améliorer son cybermodem')),
      h('div.prose', { html: md(H.construire.texte) }),
      h('p.muted', { style: { margin: '10px 0 0', fontSize: '13px' } }, 'Livre du Net, p. ' + (H.construire.pages || '19'))));
    return box;
  },
  equipement: () => catalog(DB.equipment, 'categorie', e => ({ nom: e.nom, prix: e.prix, prixTexte: e.prix_texte, meta: [e.categorie], desc: e.desc, notes: e.notes })),
  cyber: () => {
    const fam = (DB.cyber_rules.options && DB.cyber_rules.options.familles) || [];
    const nf = id => (fam.find(f => f.id === id) || {}).nom || id;
    const map = c => ({
      nom: c.nom, prix: c.prix, prixTexte: c.prix_texte,
      meta: [
        c.role === 'option' ? 'Option — ' + nf(c.hote) : 'Pièce autonome',
        c.role === 'option'
          ? ((c.cout_slot === 0 ? 'aucun emplacement' : c.cout_slot === 0.5 ? '½ emplacement' : (c.cout_slot || 1) + ' emplacement' + ((c.cout_slot || 1) > 1 ? 's' : '')))
          : ((c.slots !== null && c.slots !== undefined) ? `${c.slots} emplacement${c.slots > 1 ? 's' : ''} d'options` : null),
        c.sous_categorie, c.humanite && 'Humanité ' + c.humanite,
        c.taille_chir && 'Chir. ' + c.taille_chir, c.requiert && 'Requiert ' + c.requiert
      ],
      effets: c.effets, desc: c.desc
    });
    const box = h('div');
    const st = { role: '' };
    const host = h('div');
    const draw = () => {
      clear(host);
      const src = st.role ? DB.cyberware.filter(c => (c.role || 'base') === st.role) : DB.cyberware;
      host.appendChild(catalog(src, 'categorie', map));
    };
    box.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
      h('span.tag', 'Filtrer'),
      ...[['', `Tout (${DB.cyberware.length})`],
        ['base', `Pièces autonomes (${DB.cyberware.filter(c => c.role !== 'option').length})`],
        ['option', `Options (${DB.cyberware.filter(c => c.role === 'option').length})`]].map(([v, lb]) =>
          h('span.chip.btnlike', {
            onclick: e => {
              st.role = v; draw();
              e.target.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('a'));
              e.target.classList.add('a');
            }
          }, lb))));
    box.appendChild(host); draw();
    return box;
  },
  'cyber-regles': () => {
    const cr = DB.cyber_rules, box = h('div');
    const t = cr.tarifs_chirurgicaux;
    if (t) box.appendChild(h('details.entry', { open: true }, h('summary', 'Tarifs des interventions'),
      h('div.ct', t.texte ? h('div.prose', { html: md(t.texte) }) : null,
        (t.lignes || []).length ? dataTable(t.colonnes || Object.keys(t.lignes[0]),
          t.lignes.map(l => Array.isArray(l) ? l : (t.colonnes || Object.keys(l)).map(c => l[c])), 1) : null)));
    if (cr.qualite) box.appendChild(h('details.entry', h('summary', 'Qualité de la cybernétique'),
      h('div.ct', h('div.prose', { html: md(cr.qualite.texte) }),
        (cr.qualite.lignes || []).length ? dataTable(cr.qualite.colonnes || Object.keys(cr.qualite.lignes[0]),
          cr.qualite.lignes.map(l => Array.isArray(l) ? l : Object.values(l)), 1) : null)));
    const cp = cr.cyberpsychose;
    if (cp) {
      const ct = h('div.ct');
      ['definition', 'attraper', 'perdre_humanite', 'determination', 'resistance'].forEach(k => {
        if (cp[k]) ct.appendChild(h('div.prose', { html: md(cp[k]) }));
      });
      if ((cp.declencheurs || []).length) {
        ct.appendChild(h('div.tbl-title', 'Déclencheurs'));
        ct.appendChild(h('div.prose', h('ul', ...cp.declencheurs.map(x => h('li', typeof x === 'string' ? x : JSON.stringify(x))))));
      }
      if ((cp.paliers || []).length) {
        ct.appendChild(h('div.tbl-title', 'Paliers de psychose'));
        ct.appendChild(dataTable(['Palier', 'Effet'], cp.paliers.map(p => typeof p === 'string' ? ['—', p] : [p.palier || p.emp || '—', p.effet || p.texte || ''])));
      }
      Object.keys(cp.effets || {}).forEach(k => {
        const arr = cp.effets[k];
        if (!arr || !arr.length) return;
        ct.appendChild(h('div.tbl-title', 'Perte d’humanité — ' + k));
        ct.appendChild(dataTable(['EMP', 'Effet'], arr.map(x => [x.emp, x.effet])));
      });
      box.appendChild(h('details.entry', h('summary', 'Cyberpsychose'), ct));
    }
    if (cr.options) {
      const ct = h('div.ct');
      ct.appendChild(h('div.prose', { html: md(cr.options.texte) }));
      if ((cr.options.limites || []).length) {
        ct.appendChild(h('div.tbl-title', "Limites d'options par pièce"));
        ct.appendChild(dataTable(['Pièce', 'Max', 'Source'],
          cr.options.limites.map(l => [l.libelle, l.max === null ? 'non précisé' : l.max, l.note || '']), 1));
      }
      if ((cr.options.familles || []).length) {
        ct.appendChild(h('div.tbl-title', "Familles d'options"));
        ct.appendChild(dataTable(['Famille', 'Description'], cr.options.familles.map(f => [f.nom, f.desc])));
      }
      box.appendChild(h('details.entry', { open: true }, h('summary', "Options : ce qui se pose dans quoi"), ct));
    }
    if (cr.regles_mise_en_garde) box.appendChild(h('details.entry', h('summary', 'Règles de mise en garde'),
      h('div.ct', h('div.prose', { html: md(cr.regles_mise_en_garde) }))));
    return box;
  },
  arts: () => {
    const ma = DB.martial_arts, box = h('div');
    const ct = h('div.ct');
    ct.appendChild(h('div.prose', { html: md(ma.intro) }));
    Object.keys(ma.regles || {}).forEach(k => {
      if (!ma.regles[k]) return;
      ct.appendChild(h('div.tbl-title', k.replace(/_/g, ' ')));
      ct.appendChild(h('div.prose', { html: md(ma.regles[k]) }));
    });
    box.appendChild(h('details.entry', h('summary', 'Les arts martiaux en 2020'), ct));

    const st = { q: '', f: '' };
    const host = h('div');
    const fams = Array.from(new Set(ma.styles.map(s => s.famille)));
    const draw = () => {
      clear(host);
      const q = noAcc(st.q);
      const items = ma.styles.filter(s => (!st.f || s.famille === st.f) && (!q || noAcc(s.nom).includes(q) || noAcc(s.desc || '').includes(q)));
      host.appendChild(h('p.muted', { style: { fontSize: '12px', marginBottom: '10px' } }, items.length + ' style(s)'));
      items.forEach(s => {
        const mv = Object.entries(s.manoeuvres || {}).filter(([, v]) => v);
        host.appendChild(h('details.entry',
          h('summary', s.nom, h('span.chip.c', { style: { marginLeft: 'auto' } }, s.famille), h('span.chip.a', 'PC ' + (s.multiplicateur_pc || '×1'))),
          h('div.ct',
            mv.length ? dataTable(['Manœuvre', 'Bonus'], mv.map(([k, v]) => [k.replace(/_/g, ' '), v]), 1) : null,
            s.desc ? h('p', { style: { margin: '12px 0 0', fontSize: '13.5px', color: 'var(--txt-2)', lineHeight: 1.65 } }, s.desc) : null,
            s.notes ? h('p.muted', { style: { fontSize: '12px', marginTop: '8px' } }, s.notes) : null)));
      });
    };
    box.appendChild(h('div.row.wrap.cx-search',
      h('input', { type: 'search', placeholder: 'Chercher un style…', style: { maxWidth: '240px' }, oninput: e => { st.q = e.target.value; draw(); } }),
      h('select', { style: { maxWidth: '200px' }, onchange: e => { st.f = e.target.value; draw(); } },
        h('option', { value: '' }, 'Toutes les familles'), ...fams.map(f => h('option', { value: f }, f)))));
    box.appendChild(host); draw();
    return box;
  }
};

/* ---------- Fabriques ---------- */
function traitList(src) {
  const st = { q: '' };
  const box = h('div'), host = h('div');
  const draw = () => {
    clear(host);
    const q = noAcc(st.q);
    const items = src.filter(t => !q || noAcc(t.nom).includes(q) || noAcc(t.desc || '').includes(q));
    host.appendChild(h('p.muted', { style: { fontSize: '12px', marginBottom: '10px' } }, items.length + ' entrée(s)'));
    items.forEach(t => host.appendChild(h('details.entry',
      h('summary', t.nom, h('span.chip' + (t.type === 'defaut' ? '.m' : '.a'), { style: { marginLeft: 'auto' } }, t.cout_texte || '')),
      h('div.ct', h('div.prose', { html: md(t.desc) }),
        (t.paliers || []).length ? h('div', h('div.tbl-title', 'Paliers'),
          dataTable(['PA', 'Effet'], t.paliers.map(p => [(p.cout > 0 ? '+' : '') + p.cout, p.effet]))) : null,
        t.table ? h('button.btn.g.xs', { style: { marginTop: '10px' }, onclick: () => cxGo('annexes') }, 'Voir l’annexe liée') : null))));
  };
  box.appendChild(h('div.cx-search', h('input', { type: 'search', placeholder: 'Chercher…', style: { maxWidth: '260px' }, oninput: e => { st.q = e.target.value; draw(); } })));
  box.appendChild(host); draw();
  return box;
}

/** Catalogue générique avec filtre de catégorie, recherche et pagination */
function catalog(src, catField, mapFn) {
  const st = { q: '', cat: '', limit: 80 };
  const box = h('div'), host = h('div');
  const cats = Array.from(new Set(src.map(x => x[catField]).filter(Boolean)));
  const draw = () => {
    clear(host);
    const q = noAcc(st.q);
    const items = src.filter(x => {
      if (st.cat && x[catField] !== st.cat) return false;
      if (!q) return true;
      return noAcc(x.nom || '').includes(q) || noAcc(x.desc || '').includes(q) || noAcc(x.effets || '').includes(q) || noAcc(x.notes || '').includes(q);
    });
    host.appendChild(h('p.muted', { style: { fontSize: '12px', marginBottom: '10px' } },
      `${items.length} entrée(s)` + (items.length > st.limit ? ` — ${st.limit} affichées` : '')));
    items.slice(0, st.limit).forEach(x => {
      const o = mapFn(x);
      host.appendChild(h('details.entry',
        h('summary', o.nom, h('span.pricetag', { style: { marginLeft: 'auto' } }, o.prixTexte || (o.prix !== null && o.prix !== undefined ? eb(o.prix) : '—'))),
        h('div.ct',
          (o.meta || []).filter(Boolean).length ? h('div.mt', ...o.meta.filter(Boolean).map(m => h('span.chip', m))) : null,
          o.effets ? h('p', { style: { margin: '0 0 8px', color: 'var(--cyan)', fontFamily: 'var(--f-mono)', fontSize: '12.5px' } }, o.effets) : null,
          o.desc ? h('p', { style: { margin: 0, fontSize: '13.5px', color: 'var(--txt-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' } }, o.desc) : null,
          o.notes ? h('p.muted', { style: { fontSize: '12px', marginTop: '8px' } }, o.notes) : null)));
    });
    if (items.length > st.limit) host.appendChild(h('button.btn.g.wide', { style: { marginTop: '10px' }, onclick: () => { st.limit += 150; draw(); } }, 'Afficher plus'));
  };
  box.appendChild(h('div.row.wrap.cx-search',
    h('input', { type: 'search', placeholder: 'Chercher…', style: { maxWidth: '240px' }, oninput: e => { st.q = e.target.value; st.limit = 80; draw(); } }),
    cats.length ? h('select', { style: { maxWidth: '260px' }, onchange: e => { st.cat = e.target.value; st.limit = 80; draw(); } },
      h('option', { value: '' }, 'Toutes les catégories'), ...cats.map(c => h('option', { value: c }, c))) : null));
  box.appendChild(host); draw();
  return box;
}

function cxGo(id) { location.hash = '#/codex/' + id; }

/* ---------- Vue ---------- */
VIEWS.codex = function (args) {
  const id = (args && args[0]) || 'regles-creation';
  const wrap = h('div.view-inner');
  const nav = h('div.cx-nav');
  CX.groups.forEach(g => {
    nav.appendChild(h('div.grp', h('em', 'Ch. ' + g.n + ' — '), g.g));
    g.items.forEach(it => nav.appendChild(h('button' + (it.id === id ? '.on' : ''), { onclick: () => cxGo(it.id) }, it.t)));
  });
  const body = h('div.cx-body');
  const grp = CX.groups.find(g => g.items.some(i => i.id === id)) || CX.groups[0];
  const cur = grp.items.find(i => i.id === id) || { t: 'Codex' };
  body.appendChild(chapDiv(grp.n, grp.g, grp.sous));
  body.appendChild(sectionTitle('Section', cur.t, null));
  try { body.appendChild((CX_RENDER[id] || CX_RENDER['regles-creation'])()); }
  catch (e) { body.appendChild(h('p.red', 'Erreur d’affichage de cette section : ' + e.message)); }
  wrap.appendChild(h('div.cx', nav, body));
  const fl = $('#footLabel');
  if (fl) fl.textContent = `Chapitre ${grp.n} — ${grp.g}`;
  return wrap;
};

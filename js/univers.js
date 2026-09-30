/* ============================================================
   UNIVERS
   L'histoire et l'état du monde de Cyberpunk 2020, arrêtés au présent du jeu :
   la chronologie de 1990 à 2020, le fonctionnement du monde en 2020, les villes,
   les puissances qui les tiennent, et les gens dont on parle dans la rue.
   Les données vivent dans data/univers.json.
   ============================================================ */
'use strict';

const UV = {
  groups: [
    {
      n: 1, g: 'La chronologie',
      sous: "Trente ans d'effondrement, de guerres corporatistes et de reconstruction, de 1990 au présent du jeu.",
      items: [{ id: 'chronologie', t: 'De 1990 à 2020' }]
    },
    {
      n: 2, g: 'Le monde en 2020',
      sous: "Comment le monde fonctionne au moment où commence la partie : qui gouverne, qui paie, qui soigne, qui tue.",
      items: [
        { id: 'm-etats-unis', t: 'Les États-Unis' },
        { id: 'm-europe', t: 'L’Europe' },
        { id: 'm-asie-pacifique', t: 'Asie et Pacifique' },
        { id: 'm-reste-du-monde', t: 'Le reste du monde' },
        { id: 'm-economie', t: 'L’économie' },
        { id: 'm-loi-securite', t: 'La loi et la sécurité' },
        { id: 'm-societe', t: 'La société' },
        { id: 'm-rue', t: 'La rue' },
        { id: 'm-technologie', t: 'La technologie' },
        { id: 'm-medias', t: 'Les médias' },
        { id: 'm-espace', t: 'L’espace' }
      ]
    },
    {
      n: 3, g: 'Les villes',
      sous: "Night City quartier par quartier, puis les autres villes où une partie peut se dérouler.",
      items: [
        { id: 'night-city', t: 'Night City' },
        { id: 'villes', t: 'Les autres villes' }
      ]
    },
    {
      n: 4, g: 'Les puissances',
      sous: "Les mégacorporations, les gangs, les familles nomades et ceux qui sont censés faire régner l'ordre.",
      items: [
        { id: 'corpos', t: 'Les mégacorporations' },
        { id: 'gangs', t: 'Les gangs' },
        { id: 'nomades', t: 'Les Nomades' },
        { id: 'ordre', t: 'Forces de l’ordre' }
      ]
    },
    {
      n: 5, g: 'Qui est qui',
      sous: "Les noms qu'on cite à Night City, en 2020 : ce qu'ils ont fait et où ils en sont.",
      items: [{ id: 'figures', t: 'Les figures' }]
    }
  ]
};

/** Un thème de la chronologie → son libellé */
const uvTheme = id => ((DB.univers.themes || []).find(t => t.id === id) || { t: id }).t;

function uvGo(id) { go('univers/' + id); }

/* ---------- La frise ---------- */

/** État de la frise, conservé le temps de la visite pour ne pas reperdre les filtres */
const FRISE = { q: '', th: '', d: '' };

function vueChronologie() {
  const box = h('div');
  const tout = DB.univers.chronologie;
  const decs = [];
  for (let d = 1990; d <= 2020; d += 10) decs.push(d);

  const host = h('div.frise');
  const compte = h('span.muted', { style: { marginLeft: 'auto', fontSize: '13px' } });

  const dessine = () => {
    clear(host);
    const q = noAcc(FRISE.q);
    const liste = tout.filter(e =>
      (!FRISE.th || e.th === FRISE.th) &&
      (!FRISE.d || (e.an >= +FRISE.d && e.an < +FRISE.d + 10)) &&
      (!q || noAcc(e.t + ' ' + e.d + ' ' + (e.lieu || '')).indexOf(q) >= 0));
    compte.textContent = liste.length + ' événement' + (liste.length > 1 ? 's' : '') +
      ' sur ' + tout.length;
    if (!liste.length) {
      host.appendChild(h('p.muted', 'Aucun événement ne correspond.'));
      return;
    }
    let an = null, bloc = null;
    liste.forEach(e => {
      if (e.an !== an) {
        an = e.an;
        const n = h('div.n', String(an));
        if (an === 2020) n.appendChild(h('i', 'présent'));
        bloc = h('div.an', n, h('div'));
        host.appendChild(bloc);
      }
      bloc.lastChild.appendChild(h('div.ev', { dataset: { th: e.th } },
        h('h4', e.t),
        h('p', e.d),
        h('div.meta',
          h('span.chip', uvTheme(e.th)),
          e.lieu ? h('span.chip', e.lieu) : null,
          e.mois ? h('span.muted', { style: { fontSize: '12px' } }, e.mois) : null,
          h('span.muted', { style: { fontSize: '12px' } }, e.src))));
    });
  };

  const boutonsTheme = h('div.uv-filtres',
    h('button.btn.g.xs' + (FRISE.th ? '' : '.on'), { onclick: e => { FRISE.th = ''; majFiltres(); } }, 'Tout'),
    ...(DB.univers.themes || []).map(t =>
      h('button.btn.g.xs' + (FRISE.th === t.id ? '.on' : ''), { onclick: () => { FRISE.th = t.id; majFiltres(); } }, t.t)));

  const boutonsDec = h('div.uv-filtres',
    h('button.btn.g.xs' + (FRISE.d ? '' : '.on'), { onclick: () => { FRISE.d = ''; majFiltres(); } }, 'Tout'),
    ...decs.map(d => h('button.btn.g.xs' + (FRISE.d === String(d) ? '.on' : ''),
      { onclick: () => { FRISE.d = String(d); majFiltres(); } }, d + 's')));

  function majFiltres() {
    [[boutonsTheme, FRISE.th, ['', ...(DB.univers.themes || []).map(t => t.id)]],
    [boutonsDec, FRISE.d, ['', ...decs.map(String)]]].forEach(([bar, val, ids]) => {
      [...bar.children].forEach((b, i) => b.classList.toggle('on', ids[i] === val));
    });
    dessine();
  }

  box.appendChild(h('p.muted', { style: { marginTop: 0 } },
    "Trente ans qui mènent au présent du jeu. Chaque entrée porte son thème, son lieu quand il compte, "
    + "et la source d'où elle vient. Rien de ce qui se passe après 2020 n'y figure : c'est à toi de l'écrire."));
  box.appendChild(h('div.row.wrap', { style: { marginBottom: '8px' } },
    h('input', {
      type: 'search', placeholder: 'Chercher dans la chronologie…', value: FRISE.q,
      style: { maxWidth: '280px' },
      oninput: e => { FRISE.q = e.target.value; dessine(); }
    }), compte));
  box.appendChild(boutonsTheme);
  box.appendChild(boutonsDec);
  box.appendChild(host);
  dessine();
  return box;
}

/* ---------- Le monde en 2020 ---------- */

function vueMonde(idSection) {
  const s = DB.univers.monde.find(x => x.id === idSection);
  const box = h('div');
  if (!s) { box.appendChild(h('p.muted', 'Section introuvable.')); return box; }
  const pr = h('div.prose', { style: { maxWidth: 'none' } });
  if (s.chapo) pr.appendChild(h('p.lead', { style: { fontSize: '17px', color: 'var(--ink-2)' } }, s.chapo));
  s.blocs.forEach(b => {
    pr.appendChild(h('h3', b.h));
    (b.p || []).forEach(t => pr.appendChild(h('p', t)));
    if (b.liste && b.liste.length) pr.appendChild(h('ul', ...b.liste.map(x => h('li', x))));
  });
  if (s.src) pr.appendChild(h('p.muted', { style: { fontSize: '13px', marginBottom: 0 } }, 'Source : ' + s.src));
  box.appendChild(pr);
  return box;
}

/* ---------- Les villes ---------- */

function ficheVille(v, complet) {
  const ct = h('div.ct');
  const ident = h('div.ident');
  [['Pays', v.pays], ['Région', v.region], ['Population', v.pop]].forEach(([k, val]) => {
    if (val) ident.appendChild(h('span', h('b', k + ' : '), val));
  });
  if (ident.children.length) ct.appendChild(ident);
  if (v.res) ct.appendChild(h('p.res', v.res));
  const pr = h('div.prose', { style: { maxWidth: 'none' } });
  (v.d || []).forEach(t => pr.appendChild(h('p', t)));
  ct.appendChild(pr);

  if (complet && v.quartiers && v.quartiers.length) {
    ct.appendChild(h('div.tbl-title', 'Les quartiers'));
    const g = h('div.uv-grille');
    v.quartiers.forEach(q => g.appendChild(h('div.uv-carte', h('h4', q.nom), h('p', q.d))));
    ct.appendChild(g);
  }
  if (complet && v.lieux && v.lieux.length) {
    ct.appendChild(h('div.tbl-title', 'Les lieux qu’on cite'));
    const g = h('div.uv-grille');
    v.lieux.forEach(l => g.appendChild(h('div.uv-carte',
      h('h4', l.nom), l.type ? h('div.tag', l.type) : null, h('p', l.d))));
    ct.appendChild(g);
  }
  if (v.danger) {
    ct.appendChild(h('div.tbl-title', 'Ce qu’on y risque'));
    ct.appendChild(h('p', { style: { margin: 0 } }, v.danger));
  }
  if (v.src) ct.appendChild(h('p.muted', { style: { fontSize: '13px', margin: '10px 0 0' } }, 'Source : ' + v.src));
  return h('div.uv-fiche', h('h3', v.nom), ct);
}

function vueNightCity() {
  const v = DB.univers.villes.find(x => x.phare) || DB.univers.villes[0];
  return h('div', ficheVille(v, true));
}

function vueVilles() {
  const box = h('div');
  const autres = DB.univers.villes.filter(x => !x.phare);
  box.appendChild(h('p.muted', { style: { marginTop: 0 } },
    "Onze villes où une partie peut commencer, et ce qui les distingue en 2020. "
    + "Night City a sa propre section."));
  autres.forEach(v => box.appendChild(ficheVille(v, true)));
  return box;
}

/* ---------- Les puissances ---------- */

function vueCorpos() {
  const box = h('div');
  const st = { q: '' };
  const host = h('div');
  const dessine = () => {
    clear(host);
    const q = noAcc(st.q);
    const liste = DB.univers.corpos.filter(c => !q ||
      noAcc(c.nom + ' ' + (c.secteur || '') + ' ' + (c.res || '') + ' ' + (c.patron || '')).indexOf(q) >= 0);
    if (!liste.length) { host.appendChild(h('p.muted', 'Aucune corporation ne correspond.')); return; }
    liste.forEach(c => {
      const ct = h('div.ct');
      const ident = h('div.ident');
      [['Siège', c.siege], ['Secteur', c.secteur], ['Direction', c.patron],
      ['Effectifs', c.effectif], ['Poids', c.ca], ['Fondée', c.fonde]].forEach(([k, v]) => {
        if (v) ident.appendChild(h('span', h('b', k + ' : '), v));
      });
      if (ident.children.length) ct.appendChild(ident);
      if (c.res) ct.appendChild(h('p.res', c.res));
      const pr = h('div.prose', { style: { maxWidth: 'none' } });
      (c.d || []).forEach(t => pr.appendChild(h('p', t)));
      ct.appendChild(pr);
      if (c.faits && c.faits.length) {
        ct.appendChild(h('div.tbl-title', 'À jeter à ta table'));
        ct.appendChild(h('ul', { style: { margin: 0 } }, ...c.faits.map(f => h('li', f))));
      }
      if (c.rivaux && c.rivaux.length) {
        ct.appendChild(h('div.row.wrap', { style: { marginTop: '10px' } },
          h('span.muted', { style: { fontSize: '13px' } }, 'En guerre avec :'),
          ...c.rivaux.map(r => h('span.chip.r', r))));
      }
      if (c.src) ct.appendChild(h('p.muted', { style: { fontSize: '13px', margin: '10px 0 0' } }, 'Source : ' + c.src));
      host.appendChild(h('div.uv-fiche', h('h3', c.nom), ct));
    });
  };
  box.appendChild(h('p.muted', { style: { marginTop: 0 } },
    DB.univers.corpos.length + " corporations classées par puissance. Ce sont elles qui font la loi là où "
    + "l'État ne la fait plus : elles lèvent des armées, battent monnaie et jugent leurs employés."));
  box.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
    h('input', {
      type: 'search', placeholder: 'Chercher une corporation…', style: { maxWidth: '280px' },
      oninput: e => { st.q = e.target.value; dessine(); }
    })));
  box.appendChild(host);
  dessine();
  return box;
}

function grilleSimple(liste, champs, chapo) {
  const box = h('div');
  if (chapo) box.appendChild(h('p.muted', { style: { marginTop: 0 } }, chapo));
  const g = h('div.uv-grille');
  liste.forEach(x => {
    const c = h('div.uv-carte', h('h4', x.nom));
    const etiq = champs.map(f => x[f]).filter(Boolean);
    if (etiq.length) c.appendChild(h('div.row.wrap', { style: { marginBottom: '6px' } },
      ...etiq.map(e => h('span.chip', e))));
    c.appendChild(h('p', x.d));
    if (x.src) c.appendChild(h('p.muted', { style: { fontSize: '12px', margin: '7px 0 0' } }, x.src));
    g.appendChild(c);
  });
  box.appendChild(g);
  return box;
}

const vueGangs = () => grilleSimple(DB.univers.gangs, ['ville', 'type', 'territoire', 'effectif'],
  DB.univers.gangs.length + " gangs, des boostergangs de Night City aux familles mafieuses. "
  + "Ils tiennent la rue là où la police ne descend plus.");

const vueNomades = () => grilleSimple(DB.univers.nomades, ['zone'],
  "Les familles de la route : chassées des terres et des villes dans les années 1990, "
  + "elles vivent en convois, louent leurs bras et ne doivent rien à personne.");

const vueOrdre = () => grilleSimple(DB.univers.ordre, ['genre'],
  "Qui est censé faire régner l'ordre — et pour le compte de qui.");

const vueFigures = () => grilleSimple(DB.univers.figures, ['role', 'actif'],
  DB.univers.figures.length + " noms qu'on cite en 2020. Tout s'arrête au présent du jeu : "
  + "ce qu'ils deviennent ensuite, c'est ta table qui le décidera.");

/* ---------- Aiguillage ---------- */

const UV_RENDER = {
  chronologie: vueChronologie,
  'night-city': vueNightCity,
  villes: vueVilles,
  corpos: vueCorpos,
  gangs: vueGangs,
  nomades: vueNomades,
  ordre: vueOrdre,
  figures: vueFigures
};
/* Les onze sections thématiques partagent le même rendu */
['etats-unis', 'europe', 'asie-pacifique', 'reste-du-monde', 'economie', 'loi-securite',
  'societe', 'rue', 'technologie', 'medias', 'espace'].forEach(id => {
    UV_RENDER['m-' + id] = () => vueMonde(id);
  });

VIEWS.univers = function (args) {
  const id = (args && args[0]) || 'chronologie';
  const wrap = h('div.view-inner');
  const nav = h('div.cx-nav');
  UV.groups.forEach(g => {
    nav.appendChild(h('div.grp', h('em', 'Ch. ' + g.n + ' — '), g.g));
    g.items.forEach(it => nav.appendChild(
      h('button' + (it.id === id ? '.on' : ''), { onclick: () => uvGo(it.id) }, it.t)));
  });
  const body = h('div.cx-body');
  const grp = UV.groups.find(g => g.items.some(i => i.id === id)) || UV.groups[0];
  const cur = grp.items.find(i => i.id === id) || { t: 'Univers' };
  body.appendChild(chapDiv(grp.n, grp.g, grp.sous));
  body.appendChild(sectionTitle('Section', cur.t, null));
  try { body.appendChild((UV_RENDER[id] || UV_RENDER.chronologie)()); }
  catch (e) { body.appendChild(h('p.red', 'Erreur d’affichage de cette section : ' + e.message)); }
  wrap.appendChild(h('div.cx', nav, body));
  const fl = $('#footLabel');
  if (fl) fl.textContent = `Univers — ${grp.g}`;
  return wrap;
};

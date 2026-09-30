/* ============================================================
   CRÉATION ASSISTÉE — les 9 étapes du livre
   ============================================================ */
'use strict';

/* ---------- Suggestions maison (pas dans le livre) ---------- */
const NATURES = ['Survivante', 'Loyal', 'Solitaire', 'Protecteur', 'Opportuniste', 'Rancunier', 'Idéaliste', 'Cynique',
  'Impassible', 'Bouillant', 'Méthodique', 'Instinctif', 'Fataliste', 'Ambitieux', 'Généreux', 'Calculateur',
  'Vengeur', 'Fidèle', 'Fuyant', 'Curieux', 'Brutal', 'Discipliné'];
const ATTITUDES = ['Battante', 'Charmeur', 'Glacial', 'Bravache', 'Effacé', 'Sarcastique', 'Paternel', 'Provocante',
  'Professionnel', 'Chaleureux', 'Menaçant', 'Détaché', 'Théâtral', 'Sec', 'Séducteur', 'Poli à l’excès',
  'Silencieux', 'Volubile', 'Nonchalant', 'Intense'];

/* ---------- Barre de budget ---------- */
function budgetBar(ch, keys) {
  const dv = RULES.derived(ch), box = h('div.budget');
  const add = (lbl, val, cls) => box.appendChild(h('div.b', h('span', lbl), h('b' + (cls ? '.' + cls : ''), val)));
  if (keys.includes('caracs')) {
    const spent = RULES.statSpent(ch), pool = RULES.pool(ch);
    add('Caracs', `${spent}/${pool}`, spent === pool ? 'ok' : spent > pool ? 'no' : 'hi');
  }
  if (keys.includes('pc')) add('Points comp.', `${dv.pcReste}`, dv.pcReste === 0 ? 'ok' : dv.pcReste < 0 ? 'no' : 'hi');
  if (keys.includes('pc')) add('Plafond', RULES.ageRow(ch.age).max);
  if (keys.includes('pa')) add('PA', `${dv.paReste}`, dv.paReste === 0 ? 'ok' : dv.paReste < 0 ? 'no' : 'hi');
  if (keys.includes('pa')) add('Défauts', `${RULES.defectCount(ch)}/3 · ${RULES.defectPoints(ch)}/15`,
    RULES.defectCount(ch) > 3 || RULES.defectPoints(ch) > 15 ? 'no' : '');
  if (keys.includes('argent')) add('Reste', eb(dv.reste), dv.reste < 0 ? 'no' : 'hi');
  if (keys.includes('hum')) add('Humanité', `${dv.humRestante}/${dv.humMax}`, dv.empPerte ? 'no' : 'ok');
  if (keys.includes('hum')) add('EMP', `${dv.empAct}`, dv.empPerte ? 'no' : 'ok');
  if (keys.includes('ev')) add('Années', `${(ch.evenements || []).length}/${dv.nbEvenements}`,
    (ch.evenements || []).length >= dv.nbEvenements ? 'ok' : 'hi');
  return box;
}

/* ============================================================
   ÉTAPE 1 — CONCEPT
   ============================================================ */
function stepConcept(ch, rr) {
  const box = h('div');
  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 1 — Concept')),
    h('p', { style: { margin: '0 0 16px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      "« Faites-vous une idée générale de votre personnage en choisissant un concept le caractérisant. » Une phrase suffit : elle guidera tout le reste. Dans l'exemple du livre, Gally est « Joueuse Pro de Motor Ball »."),
    h('div.g2',
      h('label.fl', h('span.lb', 'Nom du personnage'),
        h('input', { type: 'text', value: ch.nom || '', placeholder: 'Gally, Rache, V…', oninput: e => { ch.nom = e.target.value; STORE.save(ch); majEntete(); } })),
      h('label.fl', h('span.lb', 'Joueur / joueuse'),
        h('input', { type: 'text', value: ch.joueur || '', placeholder: 'Toi', oninput: e => { ch.joueur = e.target.value; STORE.save(ch); } }))),
    h('label.fl', h('span.lb', 'Concept — en une ligne'),
      h('input', { type: 'text', value: ch.concept || '', placeholder: 'Ex. : ancienne garde du corps corpo qui a fui avec un dossier', oninput: e => { ch.concept = e.target.value; STORE.save(ch); majEntete(); } })),
    h('label.fl', { style: { marginBottom: 0 } }, h('span.lb', 'Description physique et vestimentaire (facultatif, étape 9)'),
      h('textarea', { placeholder: "Ce que les autres joueurs voient en entrant dans la scène.", oninput: e => { ch.description = e.target.value; STORE.save(ch); } }, ch.description || ''))
  ));
  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.tag.a', 'Coup de main'),
    h('p', { style: { margin: '8px 0 12px', color: 'var(--txt-3)', fontSize: '13px' } }, "Pas d'idée ? Voici quelques amorces à détourner."),
    h('div.row.wrap', ...[
      "Ex-flic radié qui vend ses anciens dossiers",
      "Ripperdoc de sous-sol au matériel volé",
      "Coursier nomade qui connaît toutes les sorties",
      "Chanteuse dont le groupe a été racheté",
      "Netrunner qui fuit ce qu'il a trouvé",
      "Cadre corpo déclassé, encore un peu d'accès",
      "Mécano de gang devenu indispensable",
      "Enfant soldat des guerres corporatistes",
      "Journaliste pigiste sur un dossier trop gros",
      "Videur d'un club qui appartient à la mauvaise personne"
    ].map(s => h('span.chip.btnlike', { onclick: () => { ch.concept = s; STORE.save(ch); rr(); } }, s)))
  ));
  return box;
}

/* ============================================================
   ÉTAPE 2 — NATURE & ATTITUDE
   ============================================================ */
function stepNature(ch, rr) {
  const box = h('div');
  const chips = (list, cur, set) => h('div.row.wrap', ...list.map(s =>
    h('span.chip' + (cur === s ? '.a' : '') + '.btnlike', { onclick: () => { set(s); STORE.save(ch); rr(); } }, s)));
  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 2 — Nature & Attitude')),
    h('div.g2',
      h('div',
        h('label.fl', h('span.lb', 'Nature — le comportement réel'),
          h('input', { type: 'text', value: ch.nature || '', placeholder: 'Survivante', oninput: e => { ch.nature = e.target.value; STORE.save(ch); } })),
        h('p', { style: { margin: '-8px 0 12px', fontSize: '12.5px', color: 'var(--txt-3)' } },
          "« La Nature représente le comportement (original) du personnage et sera utilisée lors de panique, frayeurs, perte de moyens. » C'est ce qui ressort quand le masque tombe."),
        chips(NATURES, ch.nature, v => ch.nature = v)),
      h('div',
        h('label.fl', h('span.lb', 'Attitude — la face de jeu'),
          h('input', { type: 'text', value: ch.attitude || '', placeholder: 'Battante', oninput: e => { ch.attitude = e.target.value; STORE.save(ch); } })),
        h('p', { style: { margin: '-8px 0 12px', fontSize: '12.5px', color: 'var(--txt-3)' } },
          "« L'attitude est la face roleplay du personnage, c'est cette attitude que les personnages joueurs et PNJ connaîtront. » Ce que tu montres."),
        chips(ATTITUDES, ch.attitude, v => ch.attitude = v)))
  ));
  box.appendChild(h('p.muted', { style: { fontSize: '12px', marginTop: '12px' } },
    "Les listes ci-dessus sont des suggestions de cette application : le livre demande une Nature et une Attitude sans en fournir de table."));
  return box;
}

/* ============================================================
   ÉTAPE 3 — CARACTÉRISTIQUES
   ============================================================ */
function stepCaracs(ch, rr) {
  const box = h('div');
  box.appendChild(budgetBar(ch, ['caracs', 'argent']));
  const spent = RULES.statSpent(ch), pool = RULES.pool(ch), left = pool - spent;

  const grid = h('div.stat-grid');
  RULES.STATS.forEach(s => {
    const v = ch.caracs[s];
    const set = nv => { ch.caracs[s] = clamp(nv, RULES.STAT_MIN, RULES.STAT_MAX); STORE.save(ch); rr(); };
    const dv = [];
    if (s === 'EMP') dv.push(`Humanité ${v * 10}`);
    if (s === 'CON') dv.push(`MC +${RULES.mc(v)} · ${RULES.mcLabel(v)}`, `Sauvegarde ${v}`, `Porte ${v * 5} kg`);
    if (s === 'MV') dv.push(`Course ${v * 5} m`, `Saut ${Math.ceil(v * 5 / 3)} m`);
    if (s === 'CH') dv.push(`${v} points de chance / partie`);
    if (s === 'INT' || s === 'BT') dv.push(`Argent : +${eb(v * 1000)}`);
    grid.appendChild(h('div.stat',
      h('div.h', h('b', s), h('i', RULES.STAT_NAMES[s])),
      h('div.ctl',
        h('button', { onclick: () => set(v - 1), disabled: v <= RULES.STAT_MIN }, '−'),
        h('span.v', v),
        h('button', { onclick: () => set(v + 1), disabled: v >= RULES.STAT_MAX || left <= 0 }, '+')),
      h('div.dv', RULES.STAT_HINT[s]),
      dv.length ? h('div.dv', { style: { color: 'var(--cyan)' } }, dv.join(' · ')) : null
    ));
  });

  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 3 — Caractéristiques'),
      h('span.chip' + (left === 0 ? '.g' : left < 0 ? '.r' : '.a'), left === 0 ? 'Complet' : left > 0 ? `${left} à placer` : `${-left} en trop`)),
    h('p', { style: { margin: '0 0 14px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      `${RULES.POOL} points à répartir dans les 9 caractéristiques. Aucune en dessous de ${RULES.STAT_MIN}, aucune au-dessus de ${RULES.STAT_MAX}. La moyenne humaine est de 5 à 6.`),
    grid,
    h('div.row.wrap', { style: { marginTop: '14px' } },
      h('button.btn.g.sm', { onclick: () => { RULES.STATS.forEach(s => ch.caracs[s] = 5); ch.sacrifice = 0; STORE.save(ch); rr(); } }, 'Tout à 5'),
      h('button.btn.g.sm', {
        onclick: () => {
          RULES.STATS.forEach(s => ch.caracs[s] = 2);
          let left2 = RULES.pool(ch) - 18;
          while (left2 > 0) { const s = pick(RULES.STATS); if (ch.caracs[s] < 10) { ch.caracs[s]++; left2--; } }
          STORE.save(ch); rr();
        }
      }, 'Répartition aléatoire'),
      h('button.btn.g.sm', { onclick: () => { RULES.STATS.forEach(s => ch.caracs[s] = 2); STORE.save(ch); rr(); } }, 'Tout au minimum'))
  ));

  /* Sacrifice de points pour de l'argent */
  const sac = ch.sacrifice || 0;
  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.panel-h', h('h3', 'Option — sacrifier des points pour de l’argent')),
    h('p', { style: { margin: '0 0 12px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      "« Les joueurs sont autorisés à sacrifier des points de caractéristiques pour mieux s'équiper. Chaque point sacrifié donne 1 000 €$ supplémentaires. Il est conseillé de ne pas dépasser 5 points. » Chaque point sacrifié retire 1 point du panel de 60 : à toi de réduire une caractéristique en conséquence."),
    h('div.row.wrap',
      h('button.btn.sm', { onclick: () => { ch.sacrifice = Math.max(0, sac - 1); STORE.save(ch); rr(); }, disabled: sac <= 0 }, '−'),
      h('span.tnum', { style: { fontSize: '22px', minWidth: '34px', textAlign: 'center' } }, sac),
      h('button.btn.sm', { onclick: () => { ch.sacrifice = sac + 1; STORE.save(ch); rr(); }, disabled: sac >= 20 }, '+'),
      h('span.chip' + (sac > RULES.SACRIFICE_ADVISED ? '.r' : '.a'), `+ ${eb(sac * 1000)}`),
      sac > RULES.SACRIFICE_ADVISED ? h('span.chip.r', 'Au-delà du seuil conseillé (5)') : null,
      h('div.sp'),
      h('span.chip', `Panel disponible : ${RULES.pool(ch)} points`))
  ));
  return box;
}

/* ============================================================
   ÉTAPE 4 — ÂGE & COMPÉTENCES
   ============================================================ */
function stepSkills(ch, rr) {
  const box = h('div');
  box.appendChild(budgetBar(ch, ['pc', 'caracs']));
  const dv = RULES.derived(ch), row = RULES.ageRow(ch.age);

  /* -- Âge -- */
  const ages = h('div.row.wrap');
  [14, 16, 18, 20, 22, 25, 28, 32, 40].forEach(a => ages.appendChild(
    h('span.chip' + (ch.age === a ? '.a' : '') + '.btnlike', { onclick: () => { ch.age = a; STORE.save(ch); rr(); } }, a + ' ans')));
  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Âge du personnage')),
    h('div.g2',
      h('div',
        h('label.fl', h('span.lb', 'Âge'),
          h('input', { type: 'number', min: 14, max: 90, value: ch.age, oninput: e => { ch.age = clamp(parseInt(e.target.value) || 18, 14, 90); STORE.save(ch); } , onchange: () => rr() })),
        ages),
      h('div.dv-grid',
        h('div.dv', h('span', 'Base'), h('b', RULES.SKILL_BASE), h('i', 'points fixes')),
        h('div.dv', h('span', 'INT + REF'), h('b', (ch.caracs.INT || 0) + (ch.caracs.REF || 0)), h('i', `${ch.caracs.INT} + ${ch.caracs.REF}`)),
        h('div.dv', h('span', 'TPc de l’âge'), h('b', row.tpc), h('i', row.extrapole ? 'extrapolé au-delà de 28' : `${row.an} PC / an`)),
        h('div.dv', h('span', 'Total'), h('b', dv.pcTotal), h('i', 'points de compétence')),
        h('div.dv', h('span', 'Plafond'), h('b', row.max), h('i', 'niveau max à la création')))),
    row.extrapole ? h('p', { style: { margin: '12px 0 0', fontSize: '12.5px', color: 'var(--orange)' } },
      "La table du livre s'arrête à 28 ans. Au-delà, l'application prolonge à +1 PC par an et laisse le plafond à 8 — à valider avec ton MJ. Pense aussi aux jets de déclin de l'étape « Progression » : à partir de 30 ans, tous les 2 ans, REF, MV ou CON peut perdre 1 point.") : null
  ));

  /* -- Règle de plafond -- */
  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.row.wrap',
      h('div.grow',
        h('div.tag.a', 'Contradiction du livre — à trancher avec ton MJ'),
        h('p', { style: { margin: '6px 0 0', fontSize: '13px', color: 'var(--txt-2)', lineHeight: 1.6 } },
          "Le livre donne deux plafonds différents. La table de l'âge fixe un « Niv. Comp. Max » (ici ", h('b', { class: 'acid' }, row.max),
          ") et l'exemple de création le respecte. Mais le chapitre Compétences écrit aussi : « vous avez droit à une compétence à 5 qui représentera votre spécialité et toutes vos autres compétences ne pourront dépasser 3 ». Choisis la lecture que ta table applique.")),
      h('button.btn' + (ch.regleStricte ? '.p' : '.g') + '.sm', {
        onclick: () => { ch.regleStricte = !ch.regleStricte; STORE.save(ch); rr(); }
      }, ch.regleStricte ? 'Règle stricte : ACTIVE' : 'Règle stricte : inactive')),
    ch.regleStricte ? h('div.row.wrap', { style: { marginTop: '12px' } },
      h('span.tag', 'Spécialité (seule autorisée à 5)'),
      h('select', {
        style: { maxWidth: '280px' },
        onchange: e => { ch.specialite = e.target.value || null; STORE.save(ch); rr(); }
      }, h('option', { value: '' }, '— aucune —'),
        ...(ch.competences || []).map(s => h('option', { value: s.nom, selected: ch.specialite === s.nom }, s.nom)))) : null
  ));

  /* -- Liste des compétences -- */
  const state = stepSkills.f || (stepSkills.f = { q: '', carac: '', only: false });
  const listHost = h('div.sk-list');

  function renderList() {
    clear(listHost);
    const q = noAcc(state.q);
    let items = DB.skills.filter(s => {
      if (state.carac && (s.carac || '—') !== state.carac) return false;
      if (q && !noAcc(s.nom).includes(q) && !noAcc(s.desc || '').includes(q)) return false;
      if (state.only && !(ch.competences || []).some(c => c.nom === s.nom)) return false;
      return true;
    });
    if (!items.length) { listHost.appendChild(h('p.muted', { style: { padding: '14px' } }, 'Aucune compétence ne correspond.')); return; }
    items.forEach(def => {
      const cur = (ch.competences || []).find(c => c.nom === def.nom);
      const niv = cur ? cur.niv : 0;
      const cap = RULES.skillCap(ch, def.nom);
      const co = def.coeff || 1;
      const reste = RULES.derived(ch).pcReste;
      const set = nv => {
        nv = clamp(nv, 0, cap);
        let list = ch.competences || (ch.competences = []);
        const i = list.findIndex(c => c.nom === def.nom);
        if (nv === 0) { if (i >= 0) list.splice(i, 1); }
        else if (i >= 0) list[i].niv = nv;
        else list.push({ nom: def.nom, niv: nv, spec: '' });
        list.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        if (ch.specialite && !list.some(c => c.nom === ch.specialite)) ch.specialite = null;
        STORE.save(ch); renderList(); refreshBudget();
      };
      const el = h('div.sk' + (niv > 0 ? '.has' : ''),
        h('div.nm', h('b', def.nom),
          h('div.mt',
            h('span', def.carac || 'aucune carac'),
            co > 1 ? h('em', 'coeff ×' + co) : null,
            def.specialisable ? h('em', 'à préciser') : null,
            h('span', { style: { color: 'var(--txt-4)' } }, (def.desc || '').slice(0, 78) + ((def.desc || '').length > 78 ? '…' : '')))),
        h('div.ctl',
          h('button', { onclick: () => set(niv - 1), disabled: niv <= 0 }, '−'),
          h('span.v', { style: niv ? { color: 'var(--acid)' } : null }, niv),
          h('button', { onclick: () => set(niv + 1), disabled: niv >= cap || reste < co }, '+'),
          h('span.tot', niv ? RULES.skillCost(def.nom, niv) + ' pt' : ''))
      );
      if (niv > 0 && def.specialisable) {
        el.appendChild(h('div.spec', h('input', {
          type: 'text', value: (cur && cur.spec) || '', placeholder: def.nom === 'ARTS MARTIAUX' ? 'Style : Kung Fu, Judo, Karaté…' : 'Précise le domaine (ex. : Roller, Russe, Guitare…)',
          oninput: e => { const c = ch.competences.find(x => x.nom === def.nom); if (c) { c.spec = e.target.value; STORE.save(ch); } }
        })));
      }
      listHost.appendChild(el);
    });
  }
  const bHost = h('div');
  function refreshBudget() { clear(bHost); bHost.appendChild(budgetBar(ch, ['pc', 'caracs'])); }

  const caracSel = h('select', { style: { maxWidth: '150px' }, onchange: e => { state.carac = e.target.value; renderList(); } },
    h('option', { value: '' }, 'Toutes caracs'),
    ...['INT', 'REF', 'TECH', 'EMP', 'CON', 'SF', 'BT', '—'].map(c => h('option', { value: c, selected: state.carac === c }, c)));

  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.panel-h', h('h3', 'Étape 4 — Compétences'),
      h('span.chip.a', `${dv.pcDepense} / ${dv.pcTotal} points`)),
    h('p', { style: { margin: '0 0 12px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      "Un point de compétence = un niveau (× le coefficient de la compétence : Adrénaline coûte double et plafonne à 2 à la création). Il n'y a plus de compétences de carrière : place-les où tu veux. Rappel : pas de jet possible dans une compétence d'INT où tu n'as investi aucun point."),
    h('div.sk-filter',
      h('input', { type: 'search', placeholder: 'Chercher une compétence…', style: { maxWidth: '260px' }, oninput: e => { state.q = e.target.value; renderList(); } }),
      caracSel,
      h('span.chip' + (state.only ? '.a' : '') + '.btnlike', { onclick: e => { state.only = !state.only; e.target.classList.toggle('a'); renderList(); } }, 'Mes compétences seulement'),
      h('div.sp'),
      h('button.btn.g.xs', { onclick: () => { ch.competences = []; ch.specialite = null; STORE.save(ch); rr(); } }, 'Tout effacer')),
    listHost
  ));
  renderList();
  return box;
}

/* ============================================================
   ÉTAPE 5 — ÉVÉNEMENTS DE LA VIE
   ============================================================ */
function stepLifepath(ch, rr) {
  const box = h('div');
  box.appendChild(budgetBar(ch, ['ev']));
  const dv = RULES.derived(ch);
  const done = (ch.evenements || []).length;

  const host = h('div');
  function renderEv() {
    clear(host);
    if (!(ch.evenements || []).length) {
      host.appendChild(h('p.muted', { style: { padding: '10px 0' } }, "Aucun événement tiré. Lance les dés : une année, un jet sur la table 1A, puis les tables enchaînées automatiquement."));
      return;
    }
    ch.evenements.forEach((ev, i) => {
      const bd = h('div.bd');
      ev.etapes.forEach((s, j) => {
        if (j === 0) bd.appendChild(h('span', s.texte));
        else bd.appendChild(h('span.st', h('b', `${s.titre} — ${s.des} : ${s.jet}`), s.texte));
      });
      host.appendChild(h('div.ev',
        h('div.row',
          h('span.yr', `${ev.annee} ans`),
          h('span.tag', `1A : ${ev.etapes[0].jet}`),
          h('div.sp'),
          h('button.btn.g.xs', { onclick: () => { ch.evenements[i] = rollLifeYear(ev.annee); STORE.save(ch); renderEv(); } }, 'Relancer'),
          h('button.btn.d.xs', { onclick: () => { ch.evenements.splice(i, 1); STORE.save(ch); renderEv(); } }, '✕')),
        bd));
    });
  }

  const rollAll = () => {
    ch.evenements = [];
    for (let a = 14; a <= ch.age; a++) ch.evenements.push(rollLifeYear(a));
    STORE.save(ch); renderEv(); toast(`${ch.evenements.length} années tirées.`, 'ok');
  };
  const rollNext = () => {
    const a = 14 + (ch.evenements || []).length;
    if (a > ch.age) return toast("Toutes les années sont déjà tirées.", 'no');
    (ch.evenements || (ch.evenements = [])).push(rollLifeYear(a));
    STORE.save(ch); renderEv();
  };

  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 5 — Événements de la vie'),
      h('span.chip' + (done >= dv.nbEvenements ? '.g' : '.a'), `${done} / ${dv.nbEvenements} années`)),
    h('p', { style: { margin: '0 0 14px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      DB.lifepath.regle || "Pour chaque année au-delà de la quatorzième, effectuez un jet sur les tables des événements de la vie. Un personnage de quatorze ans fait aussi un jet."),
    h('div.row.wrap',
      h('button.btn.p', { onclick: rollAll }, `Tirer les ${dv.nbEvenements} années`),
      h('button.btn.g', { onclick: rollNext }, 'Tirer l’année suivante'),
      h('button.btn.g', { onclick: () => manualEvent(ch, renderEv) }, 'Ajouter à la main'),
      (ch.evenements || []).length ? h('button.btn.d.sm', { onclick: () => confirmer('Effacer', "Supprimer tous les événements tirés ?", () => { ch.evenements = []; STORE.save(ch); renderEv(); }) }, 'Effacer') : null),
    h('div', { style: { marginTop: '18px' } }, host)
  ));
  renderEv();

  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.tag.a', 'À faire de ces résultats'),
    h('p', { style: { margin: '8px 0 0', fontSize: '13px', color: 'var(--txt-2)', lineHeight: 1.65 } },
      "Ces tirages ne modifient aucune valeur chiffrée : ce sont des accroches de background. Amis, ennemis et contacts obtenus ici sont à distinguer des avantages ", h('em', { class: 'cy' }, 'Ami'), ", ", h('em', { class: 'cy' }, 'Contact'), " et ", h('em', { class: 'cy' }, 'Ennemi'),
      " achetés en PA à l'étape 6 — ceux-là ont un effet mécanique. Si un résultat te donne un casier judiciaire ou une vieille blessure, le défaut correspondant existe à l'étape 6 et le Codex détaille les annexes 4 et 5.")));
  return box;
}

function manualEvent(ch, cb) {
  let annee = 14 + (ch.evenements || []).length, txt = '';
  modal({
    title: 'Événement manuel',
    body: h('div',
      h('label.fl', h('span.lb', 'Année (âge)'), h('input', { type: 'number', value: annee, min: 14, oninput: e => annee = parseInt(e.target.value) || 14 })),
      h('label.fl', { style: { marginBottom: 0 } }, h('span.lb', 'Événement'), h('textarea', { placeholder: "Ce qui s'est passé cette année-là.", oninput: e => txt = e.target.value }))),
    actions: [{ label: 'Annuler' }, {
      label: 'Ajouter', cls: '.p', fn: () => {
        if (!txt.trim()) return false;
        (ch.evenements || (ch.evenements = [])).push({ annee, etapes: [{ table: 'manuel', titre: 'Saisi à la main', des: '—', jet: '—', texte: txt.trim() }] });
        ch.evenements.sort((a, b) => a.annee - b.annee);
        STORE.save(ch); cb();
      }
    }]
  });
}

/* ============================================================
   ÉTAPE 6 — AVANTAGES & DÉFAUTS
   ============================================================ */
function stepTraits(ch, rr) {
  const box = h('div');
  const bHost = h('div');
  function refresh() { clear(bHost); bHost.appendChild(budgetBar(ch, ['pa'])); }
  box.appendChild(bHost); refresh();

  const state = stepTraits.f || (stepTraits.f = { q: '', tab: 'avantage' });
  const host = h('div');

  function has(nom) { return (ch.traits || []).find(t => t.nom === nom); }
  function setTrait(def, cout) {
    let list = ch.traits || (ch.traits = []);
    const i = list.findIndex(t => t.nom === def.nom);
    if (cout === null) { if (i >= 0) list.splice(i, 1); }
    else {
      const rec = { nom: def.nom, type: def.type, cout, table: def.table || null };
      if (i >= 0) list[i] = rec; else list.push(rec);
    }
    STORE.save(ch); renderList(); refresh();
  }

  function renderList() {
    clear(host);
    const src = state.tab === 'avantage' ? DB.advantages : DB.defects;
    const q = noAcc(state.q);
    const items = src.filter(t => !q || noAcc(t.nom).includes(q) || noAcc(t.desc || '').includes(q));
    const grid = h('div.gauto');
    items.forEach(def => {
      const cur = has(def.nom);
      const el = h('div.tr' + (cur ? '.on' : '') + (def.type === 'defaut' ? '.def' : ''));
      const open = h('div.bd', { html: md(def.desc) });
      open.style.display = 'none';
      el.appendChild(h('div.h', {
        onclick: () => { open.style.display = open.style.display === 'none' ? 'block' : 'none'; }
      }, h('b', def.nom), h('span.chip' + (def.type === 'defaut' ? '.m' : '.a'), def.cout_texte || (def.couts || []).join(', ')),
        def.table ? h('span.chip.c', 'annexe') : null));
      const lv = h('div.lv');
      (def.couts || []).forEach(c => {
        lv.appendChild(h('span.chip' + (cur && cur.cout === c ? (def.type === 'defaut' ? '.m' : '.a') : '') + '.btnlike', {
          onclick: () => setTrait(def, cur && cur.cout === c ? null : c)
        }, (c > 0 ? '+' : '') + c + ' PA'));
      });
      if (cur) lv.appendChild(h('span.chip.r.btnlike', { onclick: () => setTrait(def, null) }, 'Retirer'));
      el.appendChild(lv);
      el.appendChild(open);
      if ((def.paliers || []).length) {
        const p = h('div', { style: { marginTop: '8px' } });
        def.paliers.forEach(pl => p.appendChild(h('p', { style: { margin: '0 0 5px', fontSize: '12.5px', color: 'var(--txt-3)' } },
          h('b', { class: 'acid' }, (pl.cout > 0 ? '+' : '') + pl.cout + ' PA — '), pl.effet)));
        open.appendChild(p);
      }
      if (def.table) open.appendChild(h('button.btn.g.xs', { style: { marginTop: '8px' }, onclick: () => go('codex/annexes') }, 'Voir la table de coût dans le Codex'));
      grid.appendChild(el);
    });
    host.appendChild(grid);
  }

  /* Panier */
  const cart = h('div');
  function renderCart() {
    clear(cart);
    const list = ch.traits || [];
    if (!list.length) { cart.appendChild(h('p.muted', { style: { fontSize: '13px', margin: 0 } }, 'Aucun avantage ni défaut.')); return; }
    list.forEach((t, i) => cart.appendChild(h('div.cart-line',
      h('span.chip' + (t.type === 'defaut' ? '.m' : '.a'), t.type === 'defaut' ? 'D' : 'A'),
      h('span.grow', t.nom),
      h('span.pr', (t.cout > 0 ? '+' : '') + t.cout + ' PA'),
      h('button.btn.d.xs', { onclick: () => { ch.traits.splice(i, 1); STORE.save(ch); renderCart(); renderList(); refresh(); } }, '✕'))));
  }

  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 6 — Avantages & Défauts')),
    h('p', { style: { margin: '0 0 14px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      `Tu disposes de ${RULES.PA_START} points d'atouts (PA) au départ. Un avantage coûte des PA, un défaut en rapporte. Maximum ${RULES.DEF_MAX_COUNT} défauts, pour ${RULES.DEF_MAX_POINTS} points de défauts au total. Clique sur un nom pour lire l'entrée complète, sur une valeur en PA pour la prendre.`),
    h('div.row.wrap', { style: { marginBottom: '12px' } },
      h('span.chip' + (state.tab === 'avantage' ? '.a' : '') + '.btnlike', { onclick: () => { state.tab = 'avantage'; rr(); } }, `Avantages (${DB.advantages.length})`),
      h('span.chip' + (state.tab === 'defaut' ? '.m' : '') + '.btnlike', { onclick: () => { state.tab = 'defaut'; rr(); } }, `Défauts (${DB.defects.length})`),
      h('input', { type: 'search', placeholder: 'Chercher…', style: { maxWidth: '220px' }, value: state.q, oninput: e => { state.q = e.target.value; renderList(); } })),
    host
  ));
  renderList();

  const cartPanel = h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.panel-h', h('h3', 'Sélection')), cart);
  renderCart();
  box.appendChild(cartPanel);
  return box;
}

/* ============================================================
   ÉTAPE 7 — ARGENT DE DÉPART
   ============================================================ */
function stepMoney(ch, rr) {
  const box = h('div');
  box.appendChild(budgetBar(ch, ['argent', 'caracs']));
  const dv = RULES.derived(ch);
  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 7 — Argent de départ')),
    h('p', { style: { margin: '0 0 16px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      "« Faites la somme (INT + BT) et multipliez par 1000. Ce sont les €urodollars que le personnage a mis de côté pour se payer des armes, des implants, etc. »"),
    h('div.dv-grid',
      h('div.dv', h('span', 'INT'), h('b', ch.caracs.INT), h('i', 'Intelligence')),
      h('div.dv', h('span', 'BT'), h('b', ch.caracs.BT), h('i', 'Beauté')),
      h('div.dv', h('span', 'Sacrifice'), h('b', ch.sacrifice || 0), h('i', '× 1 000 €$')),
      h('div.dv', h('span', 'Total'), h('b', { style: { color: 'var(--acid)' } }, eb(dv.argent)), h('i', `(${ch.caracs.INT} + ${ch.caracs.BT}) × 1000${ch.sacrifice ? ' + ' + (ch.sacrifice * 1000) : ''}`)),
      h('div.dv', h('span', 'Déjà dépensé'), h('b', eb(dv.depense)), h('i', 'achats étape 8')),
      h('div.dv', h('span', 'Disponible'), h('b', { style: { color: dv.reste < 0 ? 'var(--red)' : 'var(--green)' } }, eb(dv.reste)), h('i', 'reste à dépenser'))),
    h('div.row.wrap', { style: { marginTop: '16px' } },
      h('button.btn.g.sm', { onclick: () => { ch.etape = 2; STORE.save(ch); rr(true); } }, 'Retourner ajuster INT / BT / sacrifice'),
      h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', margin: 0 } },
        h('span.tag', 'Dépense libre (loyer, permis, divers)'),
        h('input', { type: 'number', style: { maxWidth: '130px' }, value: ch.depensesLibres || 0, oninput: e => { ch.depensesLibres = Math.max(0, parseInt(e.target.value) || 0); STORE.save(ch); }, onchange: () => rr() })))
  ));
  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.tag.a', 'Rappel de l’étape 8 du livre'),
    h('p', { style: { margin: '8px 0 0', fontSize: '13.5px', color: 'var(--txt-2)', lineHeight: 1.65 } },
      "« Pensez maintenant à investir dans 3 choses : une armure, une arme, un peu de cyber. Pour les armes, ne pas oublier d'acheter les permis ; pour le cyber, bien penser à réduire votre Empathie (EMP) pour chaque tranche de 10 points d'humanité perdus. Bien noter les valeurs de défense des armures et pensez à prendre des munitions. » L'application suit l'humanité automatiquement à l'étape suivante.")));
  return box;
}

/* ============================================================
   ÉTAPE 8 — ACHATS
   ============================================================ */
const SHOP_TABS = [
  { id: 'armor', t: 'Armures' },
  { id: 'weapons', t: 'Armes' },
  { id: 'ammo', t: 'Munitions' },
  { id: 'acc', t: 'Accessoires' },
  { id: 'equip', t: 'Équipement' },
  { id: 'cyber', t: 'Cybernétique' },
  { id: 'net', t: 'Net' },
  { id: 'arts', t: 'Arts martiaux' }
];

function stepShop(ch, rr) {
  const box = h('div');
  const bHost = h('div');
  function refresh() { clear(bHost); bHost.appendChild(budgetBar(ch, ['argent', 'hum'])); }
  box.appendChild(bHost); refresh();

  const state = stepShop.f || (stepShop.f = { tab: 'armor', q: '', cat: '', limit: 60 });
  const host = h('div');
  const cartHost = h('div');

  const addItem = (kind, o) => {
    if (kind === 'cyber') {
      // chaque pièce reste une ligne distincte : ses options lui appartiennent
      (ch.cyber || (ch.cyber = [])).push(Object.assign({ qte: 1 }, o));
    } else {
      const list = ch.inventaire || (ch.inventaire = []);
      const ex = list.find(x => x.nom === o.nom && x.type === o.type);
      if (ex) ex.qte = (ex.qte || 1) + 1; else list.push(Object.assign({ qte: 1 }, o));
    }
    STORE.save(ch); renderCart(); refresh();
    toast(o.nom + ' ajouté.', 'ok');
  };

  function itemRow(o) {
    return h('div.item',
      h('div.ib', h('b', o.nom),
        o.meta && o.meta.length ? h('div.mt', ...o.meta.filter(Boolean).map(m => h('span', m))) : null,
        o.desc ? h('div.ds', o.desc.length > 220 ? o.desc.slice(0, 220) + '…' : o.desc) : null),
      h('div.ia',
        h('span.pr', o.prixTexte || eb(o.prix)),
        o.hum ? h('span.hu', 'Humanité ' + o.hum) : null,
        h('button.btn.p.xs', { onclick: o.add, disabled: o.prix === null || o.prix === undefined }, 'Acheter'))
    );
  }

  function renderShop() {
    clear(host);
    const q = noAcc(state.q);
    const filt = (arr, fields, catField) => arr.filter(x => {
      if (state.cat && catField && x[catField] !== state.cat) return false;
      if (!q) return true;
      return fields.some(f => noAcc(String(x[f] || '')).includes(q));
    });
    let rows = [], cats = [], note = null;

    if (state.tab === 'armor') {
      cats = Array.from(new Set(DB.armor.armures.map(a => a.categorie)));
      rows = filt(DB.armor.armures, ['nom', 'desc'], 'categorie').map(a => itemRow({
        nom: a.nom, prix: a.prix, prixTexte: a.prix !== null ? eb(a.prix) : (a.prix_texte || '—'),
        hum: a.humanite, desc: a.desc,
        meta: [a.categorie, a.sp ? 'PA ' + a.sp : null, a.ev ? 'EV ' + a.ev : null, a.zones],
        add: () => addItem('inv', { type: 'armure', nom: a.nom, prix: a.prix || 0, sp: a.sp, zones: a.zones, humanite: a.humanite, humanite_moy: null })
      }));
      note = DB.armor.regles.superposition;
    } else if (state.tab === 'weapons') {
      cats = Array.from(new Set(DB.weapons.map(a => a.categorie)));
      rows = filt(DB.weapons, ['nom', 'categorie', 'calibre'], 'categorie').map(w => itemRow({
        nom: w.nom, prix: w.prix, prixTexte: w.prix !== null ? eb(w.prix) : (w.prix_texte || '—'),
        meta: [w.categorie, w.prec ? 'Préc ' + w.prec : null, w.degats ? 'Dég ' + w.degats : null, w.calibre,
          w.chargeur ? 'Ch ' + w.chargeur : null, w.cadence ? 'Cad ' + w.cadence : null, w.portee, w.dispo ? 'Dispo ' + w.dispo : null,
          w.dissimulation ? 'Dissim ' + w.dissimulation : null, w.fiabilite],
        desc: w.notes,
        add: () => addItem('inv', { type: 'arme', nom: w.nom, prix: w.prix || 0, prec: w.prec, degats: w.degats, calibre: w.calibre, chargeur: w.chargeur, cadence: w.cadence, portee: w.portee })
      }));
    } else if (state.tab === 'ammo') {
      rows = filt(DB.ammo.munitions, ['nom', 'type', 'effet'], null).map(m => itemRow({
        nom: m.nom, prix: m.prix, prixTexte: m.prix !== null ? eb(m.prix) : (m.prix_texte || '—'),
        meta: [m.type], desc: m.effet,
        add: () => addItem('inv', { type: 'munition', nom: m.nom, prix: m.prix || 0, effet: m.effet })
      }));
    } else if (state.tab === 'acc') {
      const all = DB.weapon_accessories.accessoires.concat(DB.weapon_accessories.montures.map(m => Object.assign({ categorie: 'Montures d’armes' }, m)));
      cats = Array.from(new Set(all.map(a => a.categorie)));
      rows = filt(all, ['nom', 'notes', 'desc'], 'categorie').map(a => itemRow({
        nom: a.nom, prix: a.prix, prixTexte: a.prix !== null ? eb(a.prix) : (a.prix_texte || '—'),
        meta: [a.categorie], desc: a.notes || a.desc,
        add: () => addItem('inv', { type: 'accessoire', nom: a.nom, prix: a.prix || 0, notes: a.notes || a.desc })
      }));
    } else if (state.tab === 'equip') {
      cats = Array.from(new Set(DB.equipment.map(a => a.categorie)));
      rows = filt(DB.equipment, ['nom', 'desc'], 'categorie').map(e => itemRow({
        nom: e.nom, prix: e.prix, prixTexte: e.prix_texte || eb(e.prix),
        meta: [e.categorie], desc: e.desc,
        add: () => addItem('inv', { type: 'equipement', nom: e.nom, prix: e.prix || 0, notes: e.desc })
      }));
    } else if (state.tab === 'cyber') {
      const bases = DB.cyberware.filter(c => c.role !== 'option');
      cats = Array.from(new Set(bases.map(a => a.categorie)));
      rows = filt(bases, ['nom', 'desc', 'effets', 'sous_categorie'], 'categorie').map(c => itemRow({
        nom: c.nom, prix: c.prix, prixTexte: c.prix !== null ? eb(c.prix) : (c.prix_texte || '—'),
        hum: c.humanite, desc: (c.effets ? '⚙ ' + c.effets + '\n' : '') + (c.desc || ''),
        meta: [c.categorie, c.sous_categorie, c.taille_chir ? 'Chir. ' + c.taille_chir : null,
          c.requiert ? 'Requiert : ' + c.requiert : null,
          (c.slots !== null && c.slots !== undefined) ? `${c.slots} emplacement${c.slots > 1 ? 's' : ''} d'options` : null],
        add: () => addItem('cyber', {
          type: 'cyber', nom: c.nom, prix: c.prix || 0, humanite: c.humanite, humanite_moy: c.humanite_moy,
          categorie: c.categorie, effets: c.effets, slots: c.slots === undefined ? null : c.slots,
          accepte: c.accepte || [], options: []
        })
      }));
      note = "Cet onglet ne liste que les pièces qui s'installent seules. Les options — vérins, myomère, revêtements, optiques, puces… — ne s'achètent pas ici : elles se posent depuis la pièce qui les accueille, dans le panier ci-dessous, dans la limite d'emplacements du livre. La perte d'humanité affichée est celle du livre ; l'application compte la moyenne des dés pour le suivi (2D6 → 7).";
    } else if (state.tab === 'net') {
      /* Programmes, cyberconsoles, ordinateurs et options de ports du Livre du Net */
      const H = DB.net_hardware;
      const all = DB.net_programs.map(p => ({
        nom: p.nom, cat: 'Programme — ' + p.classe, prix: p.prix,
        prixTexte: p.prix_texte ? p.prix_texte + ' €$' : (p.prix !== null ? eb(p.prix) : '—'),
        desc: (p.fonction ? '⚙ ' + p.fonction + '\n' : '') + (p.desc || ''),
        meta: ['Programme', p.classe, 'Force ' + (p.force_texte || p.force || '—'),
          'UM ' + (p.um_texte || p.um || '—'), p.source && 'Source ' + p.source],
        item: { type: 'programme', classe: p.classe, force: p.force, um: p.um, fonction: p.fonction }
      })).concat(H.consoles.map(c => ({
        nom: c.nom, cat: 'Cyberconsole', prix: c.prix,
        prixTexte: c.prix_texte ? c.prix_texte + ' €$' : (c.prix !== null ? eb(c.prix) : '—'),
        desc: c.detail,
        meta: ['Cyberconsole', 'Vitesse ' + (c.vitesse === null || c.vitesse === undefined ? '—' : c.vitesse),
          'Mémoire ' + (c.memoire_texte || c.memoire || '—'),
          'Mur ' + (c.mur === null || c.mur === undefined ? '—' : c.mur), 'Ports ' + (c.ports || '—')],
        item: { type: 'console', vitesse: c.vitesse, memoire: c.memoire, mur: c.mur, ports: c.ports }
      }))).concat(H.ordinateurs.map(o => ({
        nom: o.nom, cat: 'Ordinateur', prix: o.prix,
        prixTexte: o.prix_texte ? o.prix_texte + ' €$' : (o.prix !== null ? eb(o.prix) : '—'),
        desc: o.detail, meta: ['Ordinateur'].concat(Object.entries(o.caracs || {}).map(([k, v]) => k + ' ' + v)),
        item: { type: 'ordinateur' }
      }))).concat(H.options.map(o => ({
        nom: o.nom, cat: 'Option de port — ' + (o.type || 'Autre'), prix: o.prix,
        prixTexte: o.prix_texte || (o.prix !== null ? eb(o.prix) : '—'),
        desc: o.detail, meta: ['Option de port', o.type, 'Port ' + (o.port_texte || o.port || '—')],
        item: { type: 'option-net', portOpt: o.port }
      })));
      cats = Array.from(new Set(all.map(a => a.cat)));
      rows = filt(all, ['nom', 'desc'], 'cat').map(a => itemRow({
        nom: a.nom, prix: a.prix, prixTexte: a.prixTexte, meta: a.meta, desc: a.desc,
        add: () => addItem('inv', Object.assign({ nom: a.nom, prix: a.prix || 0 }, a.item))
      }));
      note = "Livre du Net. Les programmes occupent de la mémoire (UM) sur la console : à toi de vérifier "
        + "que la somme des UM tient dans la mémoire de ton cybermodem. Les entrées sans prix chiffré "
        + "(« Variable », « NA », prix au niveau ou au mètre) ne sont pas achetables ici : note-les à la main.";
    } else if (state.tab === 'arts') {
      cats = Array.from(new Set(DB.martial_arts.styles.map(a => a.famille)));
      rows = filt(DB.martial_arts.styles, ['nom', 'desc'], 'famille').map(s => {
        const mv = Object.entries(s.manoeuvres || {}).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`);
        return h('div.item',
          h('div.ib', h('b', s.nom),
            h('div.mt', h('span', s.famille), h('em', 'PC ' + (s.multiplicateur_pc || '×1')), ...mv.map(m => h('span', m))),
            s.desc ? h('div.ds', s.desc.length > 240 ? s.desc.slice(0, 240) + '…' : s.desc) : null),
          h('div.ia', h('button.btn' + ((ch.arts || []).some(a => a.nom === s.nom) ? '.d' : '.p') + '.xs', {
            onclick: () => {
              ch.arts = ch.arts || [];
              const i = ch.arts.findIndex(a => a.nom === s.nom);
              if (i >= 0) ch.arts.splice(i, 1); else ch.arts.push({ nom: s.nom, famille: s.famille, mult: s.multiplicateur_pc, manoeuvres: s.manoeuvres });
              STORE.save(ch); renderShop(); renderCart();
            }
          }, (ch.arts || []).some(a => a.nom === s.nom) ? 'Retirer' : 'Apprendre')));
      });
      note = "Les styles se prennent via la compétence ARTS MARTIAUX (étape 4) : le style choisi ici précise laquelle. " + (DB.martial_arts.regles.attaques_clef || '').slice(0, 220);
    }

    /* Filtres */
    const catSel = cats.length ? h('select', { style: { maxWidth: '230px' }, onchange: e => { state.cat = e.target.value; state.limit = 60; renderShop(); } },
      h('option', { value: '' }, 'Toutes les catégories'),
      ...cats.map(c => h('option', { value: c, selected: state.cat === c }, c))) : null;

    host.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
      h('input', { type: 'search', placeholder: 'Chercher…', value: state.q, style: { maxWidth: '240px' }, oninput: e => { state.q = e.target.value; state.limit = 60; renderShop(); } }),
      catSel, h('div.sp'), h('span.chip', rows.length + ' résultat' + (rows.length > 1 ? 's' : ''))));
    if (note) host.appendChild(h('p', { style: { margin: '0 0 12px', fontSize: '12.5px', color: 'var(--txt-3)', lineHeight: 1.6 } }, note));

    const shown = rows.slice(0, state.limit);
    shown.forEach(r => host.appendChild(r));
    if (rows.length > state.limit) host.appendChild(h('button.btn.g.wide', { style: { marginTop: '10px' }, onclick: () => { state.limit += 120; renderShop(); } },
      `Afficher les ${rows.length - state.limit} suivants`));
    if (!rows.length) host.appendChild(h('p.muted', { style: { padding: '14px 0' } }, 'Aucun résultat.'));
  }

  function renderCart() {
    clear(cartHost);
    const dv = RULES.derived(ch);

    /* --- Cybernétique : chaque pièce avec ses options --- */
    if ((ch.cyber || []).length) {
      cartHost.appendChild(h('div.tag.a', { style: { margin: '12px 0 6px', display: 'inline-block' } }, 'Cybernétique installée'));
      ch.cyber.forEach((rig, i) => {
        const max = RULES.slotsMax(rig), used = RULES.slotsUsed(rig);
        const libre = max === null ? null : max - used;
        const box = h('div.rig',
          h('div.rh',
            h('b', rig.nom),
            rig.humanite ? h('span.chip.m', 'H ' + rig.humanite) : null,
            h('span.slots' + (max !== null && libre <= 0 ? (libre < 0 ? '.over' : '.full') : ''),
              max === null ? 'options non limitées' : `${used} / ${max} emplacement${max > 1 ? 's' : ''}`),
            h('span.pr', { style: { marginLeft: 'auto', fontFamily: 'var(--f-tab)', fontWeight: 700 } }, eb(rig.prix || 0)),
            (rig.accepte || []).length ? h('button.btn.xs', {
              disabled: max !== null && libre <= 0,
              onclick: () => optionPicker(ch, rig, () => { renderCart(); refresh(); })
            }, '+ Option') : null,
            h('button.btn.d.xs', { onclick: () => { ch.cyber.splice(i, 1); STORE.save(ch); renderCart(); refresh(); } }, 'Retirer')));
        if ((rig.options || []).length) {
          const ol = h('div.opts');
          rig.options.forEach((o, j) => ol.appendChild(h('div.opt',
            h('span.grow', o.nom),
            h('span.sl', (o.cout_slot === 0 ? 'gratuit' : (o.cout_slot === 0.5 ? '½ empl.' : (o.cout_slot || 1) + ' empl.'))),
            o.humanite ? h('span.chip.m', 'H ' + o.humanite) : null,
            h('span.pr', eb(o.prix || 0)),
            h('button.btn.d.xs', { onclick: () => { rig.options.splice(j, 1); STORE.save(ch); renderCart(); refresh(); } }, '✕'))));
          box.appendChild(ol);
        } else if ((rig.accepte || []).length) {
          box.appendChild(h('div.none', `Aucune option installée. Cette pièce en accepte ${max === null ? 'un nombre non limité par le livre' : max}.`));
        }
        cartHost.appendChild(box);
      });
    }

    /* --- Équipement --- */
    if ((ch.inventaire || []).length) {
      cartHost.appendChild(h('div.tag.a', { style: { margin: '14px 0 6px', display: 'inline-block' } }, 'Équipement'));
      ch.inventaire.forEach((it, i) => cartHost.appendChild(h('div.cart-line',
        h('span.chip', it.type),
        h('span.grow', it.nom, it.qte > 1 ? h('b', ' ×' + it.qte) : null),
        h('span.pr', eb((it.prix || 0) * (it.qte || 1))),
        h('button.btn.g.xs', { onclick: () => { it.qte = (it.qte || 1) + 1; STORE.save(ch); renderCart(); refresh(); } }, '+'),
        h('button.btn.d.xs', {
          onclick: () => {
            if ((it.qte || 1) > 1) it.qte--; else ch.inventaire.splice(i, 1);
            STORE.save(ch); renderCart(); refresh();
          }
        }, '−'))));
    }
    if (ch.arts && ch.arts.length) {
      cartHost.appendChild(h('div.tag.a', { style: { margin: '12px 0 6px' } }, 'Arts martiaux'));
      ch.arts.forEach((a, i) => cartHost.appendChild(h('div.cart-line', h('span.grow', a.nom),
        h('span.chip.c', 'PC ' + (a.mult || '×1')),
        h('button.btn.d.xs', { onclick: () => { ch.arts.splice(i, 1); STORE.save(ch); renderCart(); } }, '✕'))));
    }
    if (!(ch.cyber || []).length && !(ch.inventaire || []).length && !(ch.arts || []).length)
      cartHost.appendChild(h('p.muted', { style: { fontSize: '13px', margin: 0 } }, 'Rien acheté pour le moment.'));

    cartHost.appendChild(h('div.dv-grid', { style: { marginTop: '14px' } },
      h('div.dv', h('span', 'Total dépensé'), h('b', eb(dv.depense))),
      h('div.dv', h('span', 'Disponible'), h('b', { style: { color: dv.reste < 0 ? 'var(--red)' : 'var(--green)' } }, eb(dv.reste))),
      h('div.dv', h('span', 'Humanité perdue'), h('b', { style: { color: dv.humPerdue ? 'var(--mag)' : null } }, dv.humPerdue), h('i', `sur ${dv.humMax}`)),
      h('div.dv', h('span', 'EMP effective'), h('b', { style: { color: dv.empPerte ? 'var(--red)' : null } }, dv.empAct), h('i', dv.empPerte ? `−${dv.empPerte} par la cyber` : 'intacte'))));
    if (dv.empPerte > 0) cartHost.appendChild(h('p', { style: { margin: '10px 0 0', fontSize: '12.5px', color: 'var(--orange)', lineHeight: 1.6 } },
      `Chaque tranche de 10 points d'humanité perdue retire 1 point d'EMP. Ton EMP de base ${ch.caracs.EMP} tombe à ${dv.empAct} : les compétences liées à l'EMP (Baratin & Persuasion, Séduction, Commandement, Perception Humaine, Interview, Étiquette, Performance) en souffrent.`));
    cartHost.appendChild(h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' } },
      h('span.tag', 'Correction manuelle d’humanité'),
      h('input', { type: 'number', style: { maxWidth: '110px' }, value: ch.humaniteManuelle || 0, oninput: e => { ch.humaniteManuelle = parseInt(e.target.value) || 0; STORE.save(ch); renderCart(); refresh(); } })));
  }

  box.appendChild(h('div.panel.rise',
    h('div.panel-h', h('h3', 'Étape 8 — Achats')),
    h('div.shop-cat', ...SHOP_TABS.map(t =>
      h('span.chip' + (state.tab === t.id ? '.a' : '') + '.btnlike', { onclick: () => { state.tab = t.id; state.cat = ''; state.q = ''; state.limit = 60; renderShop(); } }, t.t))),
    host));
  renderShop();

  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } }, h('div.panel-h', h('h3', 'Panier')), cartHost));
  renderCart();
  return box;
}

/* ---------- Choix d'une option pour une pièce installée ---------- */
function optionPicker(ch, rig, done) {
  const familles = (DB.cyber_rules.options && DB.cyber_rules.options.familles) || [];
  const nomFamille = id => (familles.find(f => f.id === id) || {}).nom || id;
  const st = { q: '', fam: '' };
  const host = h('div');

  const draw = () => {
    clear(host);
    const max = RULES.slotsMax(rig), used = RULES.slotsUsed(rig);
    const libre = max === null ? Infinity : max - used;
    host.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
      h('span.chip' + (libre <= 0 && max !== null ? '.r' : '.a'),
        max === null ? 'Emplacements non limités par le livre' : `${used} / ${max} emplacements utilisés`),
      h('span.chip', rig.nom)));

    const q = noAcc(st.q);
    const items = DB.cyberware.filter(c =>
      c.role === 'option' && (rig.accepte || []).includes(c.hote)
      && (!st.fam || c.hote === st.fam)
      && (!q || noAcc(c.nom).includes(q) || noAcc(c.desc || '').includes(q) || noAcc(c.effets || '').includes(q)));

    host.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
      h('input', { type: 'search', placeholder: 'Chercher une option…', value: st.q, style: { maxWidth: '220px' }, oninput: e => { st.q = e.target.value; draw(); } }),
      (rig.accepte || []).length > 1 ? h('select', { style: { maxWidth: '240px' }, onchange: e => { st.fam = e.target.value; draw(); } },
        h('option', { value: '' }, 'Toutes les familles'),
        ...rig.accepte.map(f => h('option', { value: f, selected: st.fam === f }, nomFamille(f)))) : null,
      h('div.sp'), h('span.chip', items.length + ' option' + (items.length > 1 ? 's' : ''))));

    if (!items.length) { host.appendChild(h('p.muted', 'Aucune option ne correspond.')); return; }
    const list = h('div.shop-list');
    items.slice(0, 120).forEach(c => {
      const cout = (c.cout_slot === null || c.cout_slot === undefined) ? 1 : Number(c.cout_slot);
      const deja = (rig.options || []).some(o => o.nom === c.nom);
      const trop = !deja && max !== null && cout > libre;
      list.appendChild(h('div.item',
        h('div.ib', h('b', c.nom),
          h('div.mt',
            h('em', cout === 0 ? 'aucun emplacement' : cout === 0.5 ? '½ emplacement' : cout + ' emplacement' + (cout > 1 ? 's' : '')),
            h('span', nomFamille(c.hote)),
            c.taille_chir ? h('span', 'Chir. ' + c.taille_chir) : null),
          (c.effets || c.desc) ? h('div.ds', (c.effets ? '⚙ ' + c.effets + '\n' : '') + (c.desc || '').slice(0, 260)) : null),
        h('div.ia',
          h('span.pr', c.prix !== null ? eb(c.prix) : (c.prix_texte || '—')),
          c.humanite ? h('span.hu', 'Humanité ' + c.humanite) : null,
          h('button.btn' + (deja ? '.g' : '.p') + '.xs', {
            disabled: trop || deja,
            title: deja ? 'Déjà installée sur cette pièce'
              : trop ? `Il ne reste que ${libre} emplacement(s) sur ${rig.nom}` : '',
            onclick: () => {
              (rig.options || (rig.options = [])).push({
                nom: c.nom, prix: c.prix || 0, humanite: c.humanite, humanite_moy: c.humanite_moy,
                cout_slot: cout, hote: c.hote, effets: c.effets
              });
              STORE.save(ch); done(); draw();
              toast(`${c.nom} installée sur ${rig.nom}.`, 'ok');
            }
          }, deja ? '✓ Installée' : trop ? 'Plus de place' : 'Installer'))));
    });
    host.appendChild(list);
  };
  draw();

  modal({
    title: 'Options — ' + rig.nom,
    wide: true,
    body: h('div',
      h('p', { style: { margin: '0 0 12px', fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.5 } },
        (DB.cyber_rules.options && DB.cyber_rules.options.texte) ||
        "Un cybermembre peut recevoir au maximum quatre options."),
      host),
    actions: [{ label: 'Terminé', cls: '.p' }]
  });
}

/* ============================================================
   ÉTAPE 9 — DERNIÈRE TOUCHE
   ============================================================ */
function stepFinish(ch, rr) {
  const box = h('div');
  const issues = RULES.audit(ch);
  const errs = issues.filter(i => i.bad), warns = issues.filter(i => !i.bad);
  const dv = RULES.derived(ch);

  box.appendChild(h('div.panel' + (errs.length ? '' : '.acc') + '.rise',
    h('div.panel-h', h('h3', 'Contrôle de création'),
      h('span.chip' + (errs.length ? '.r' : '.g'), errs.length ? `${errs.length} blocage(s)` : 'Conforme')),
    errs.length || warns.length ? h('div',
      ...errs.map(i => h('p', { style: { margin: '0 0 7px', fontSize: '13.5px', color: '#ff9c93' } }, '■ ', i.m)),
      ...warns.map(i => h('p', { style: { margin: '0 0 7px', fontSize: '13.5px', color: 'var(--txt-3)' } }, '□ ', i.m))
    ) : h('p', { style: { margin: 0, color: 'var(--green)', fontSize: '13.5px' } },
      "Tout est conforme aux règles de New Dawn : points de caractéristiques, budget de compétences, plafonds, PA et budget d'achats.")
  ));

  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.panel-h', h('h3', 'Étape 9 — Dernière touche')),
    h('p', { style: { margin: '0 0 14px', color: 'var(--txt-2)', fontSize: '13.5px' } },
      "« Établissez une description de votre personnage à l'avance pour les autres joueurs. Et lance-toi, chomba ! »"),
    h('label.fl', h('span.lb', 'Description à lire à la table'),
      h('textarea', { placeholder: "Silhouette, voix, tics, ce qui frappe en premier.", oninput: e => { ch.description = e.target.value; STORE.save(ch); } }, ch.description || '')),
    h('label.fl', { style: { marginBottom: 0 } }, h('span.lb', 'Notes libres (secrets, objectifs, dettes)'),
      h('textarea', { placeholder: "Pour toi et ton MJ.", oninput: e => { ch.notes = e.target.value; STORE.save(ch); } }, ch.notes || ''))
  ));

  box.appendChild(h('div.panel.rise', { style: { marginTop: '14px' } },
    h('div.panel-h', h('h3', 'Récapitulatif')),
    h('div.dv-grid',
      h('div.dv', h('span', 'Caracs'), h('b', `${RULES.statSpent(ch)}/${RULES.pool(ch)}`)),
      h('div.dv', h('span', 'Compétences'), h('b', (ch.competences || []).length), h('i', `${dv.pcDepense}/${dv.pcTotal} pts`)),
      h('div.dv', h('span', 'Avantages'), h('b', (ch.traits || []).filter(t => t.type === 'avantage').length), h('i', `${dv.paDepense} PA`)),
      h('div.dv', h('span', 'Défauts'), h('b', RULES.defectCount(ch)), h('i', `+${dv.paTotal - RULES.PA_START} PA`)),
      h('div.dv', h('span', 'Événements'), h('b', (ch.evenements || []).length), h('i', `/ ${dv.nbEvenements} années`)),
      h('div.dv', h('span', 'Cyber'), h('b', RULES.cyberFlat(ch).length), h('i', `${dv.humPerdue} pts d'humanité`)),
      h('div.dv', h('span', 'Équipement'), h('b', (ch.inventaire || []).length), h('i', eb(dv.depense))),
      h('div.dv', h('span', 'Argent restant'), h('b', { style: { color: dv.reste < 0 ? 'var(--red)' : 'var(--green)' } }, eb(dv.reste)))),
    h('div.row.wrap', { style: { marginTop: '16px' } },
      h('button.btn.p', {
        onclick: () => {
          if (!ch.nom) return toast("Donne au moins un nom à ton personnage (étape 1).", 'no');
          ch.termine = true;
          ch.journal = ch.journal || [];
          ch.journal.push({ d: today(), t: `Création terminée — ${ch.age} ans, ${dv.pcDepense} PC dépensés, ${eb(dv.depense)} d'achats.` });
          STORE.save(ch); toast('Personnage terminé. Bonne chance, chomba.', 'ok'); go('fiche');
        }
      }, 'Terminer la création'),
      h('button.btn.g', { onclick: () => go('fiche') }, 'Voir la fiche'),
      h('button.btn.g', { onclick: () => STORE.exportOne(ch) }, 'Exporter en JSON'),
      h('button.btn.g', { onclick: () => window.print() }, 'Imprimer'))
  ));
  return box;
}

/* ============================================================
   ASSISTANT
   ============================================================ */
const STEPS = [
  { t: 'Concept', f: stepConcept },
  { t: 'Nature', f: stepNature },
  { t: 'Caracs', f: stepCaracs },
  { t: 'Compétences', f: stepSkills },
  { t: 'Vie', f: stepLifepath },
  { t: 'Atouts', f: stepTraits },
  { t: 'Argent', f: stepMoney },
  { t: 'Achats', f: stepShop },
  { t: 'Final', f: stepFinish }
];

function stepDone(ch, i) {
  const dv = RULES.derived(ch);
  switch (i) {
    case 0: return !!(ch.nom && ch.concept);
    case 1: return !!(ch.nature && ch.attitude);
    case 2: return RULES.statSpent(ch) === RULES.pool(ch);
    case 3: return (ch.competences || []).length > 0 && dv.pcReste >= 0;
    case 4: return (ch.evenements || []).length >= dv.nbEvenements;
    case 5: return (ch.traits || []).length > 0;
    case 6: return true;
    case 7: return (ch.inventaire || []).length > 0 || (ch.cyber || []).length > 0;
    case 8: return !!ch.termine;
  }
  return false;
}

SOUS.creation = function () {
  let ch = STORE.current();
  if (!ch) { ch = RULES.blank(); STORE.save(ch); }
  ch.etape = clamp(ch.etape || 0, 0, STEPS.length - 1);

  const wrap = h('div');
  wrap.appendChild(sectionTitle(`Étape ${ch.etape + 1} sur 9`, STEPS[ch.etape].t === 'Final' ? 'Dernière touche' : 'Création assistée',
    "Le livre décompose la création en 9 étapes. L'application les suit dans l'ordre, contrôle les budgets en direct et te laisse revenir en arrière à tout moment."));

  const nav = h('div.wiz-steps');
  const bodyHost = h('div.wiz-body');

  function renderNav() {
    clear(nav);
    STEPS.forEach((s, i) => nav.appendChild(h('button' + (ch.etape === i ? '.on' : '') + (stepDone(ch, i) ? '.ok' : ''), {
      onclick: () => { ch.etape = i; STORE.save(ch); render(); }
    }, h('span.n', i + 1), h('span', s.t))));
    // sur écran étroit, la barre d'étapes défile : on amène l'étape active dans le champ de vision
    const on = nav.querySelector('button.on');
    if (on && nav.scrollWidth > nav.clientWidth + 4) {
      nav.scrollTo({ left: Math.max(0, on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2), behavior: 'smooth' });
    }
  }
  function render(goTo) {
    if (goTo === true) { /* redirection depuis un pas */ }
    clear(bodyHost);
    bodyHost.appendChild(STEPS[ch.etape].f(ch, render));
    bodyHost.appendChild(h('div.wiz-nav',
      h('button.btn.g', { onclick: () => { ch.etape = Math.max(0, ch.etape - 1); STORE.save(ch); render(); }, disabled: ch.etape === 0 }, '← ' + (STEPS[ch.etape - 1] ? STEPS[ch.etape - 1].t : '')),
      h('div.sp'),
      ch.etape < STEPS.length - 1
        ? h('button.btn.p', { onclick: () => { ch.etape++; STORE.save(ch); render(); } }, STEPS[ch.etape + 1].t + ' →')
        : h('button.btn.p', { onclick: () => go('fiche') }, 'Voir la fiche →')));
    renderNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  wrap.appendChild(h('div.wiz', nav, bodyHost));
  render();
  return wrap;
};

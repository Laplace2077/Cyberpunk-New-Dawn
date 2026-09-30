/* ============================================================
   PAGE D'ACCUEIL
   ============================================================ */
'use strict';

VIEWS.accueil = function () {
  const wrap = h('div');
  const chars = STORE.all();
  const cur = STORE.current();

  /* ---------- Seuil ----------
     Une image, le titre, et l'action qu'on vient faire neuf fois sur dix :
     reprendre le personnage en cours. Le reste attend plus bas. */
  const tirerPerso = () => { const c = genRandom({}); STORE.save(c); toast('Personnage tiré au hasard.', 'ok'); go('fiche'); };
  const nouveauPerso = () => { STORE.save(RULES.blank()); go('creation'); };

  const actes = h('div.acts');
  if (cur) {
    actes.appendChild(h('button.btn.p', { onclick: () => go(cur.termine ? 'fiche' : 'creation') },
      (cur.termine ? 'Ouvrir' : 'Continuer') + ' « ' + (cur.nom || 'Sans nom') + ' »'));
    actes.appendChild(h('button.btn', { onclick: nouveauPerso }, 'Nouveau personnage'));
  } else {
    actes.appendChild(h('button.btn.p', { onclick: nouveauPerso }, 'Créer un personnage'));
    actes.appendChild(h('button.btn', { onclick: () => go('quiz') }, 'Je ne sais pas encore qui jouer'));
  }
  actes.appendChild(h('button.btn', { onclick: tirerPerso }, 'Tirer au hasard'));

  wrap.appendChild(h('div.hero.rise',
    h('div.art', { 'aria-hidden': 'true' }),
    h('div.inner',
      h('h1.big', h('span.l1', 'Cyberpunk'), h('span.l2', 'New Dawn')),
      h('p.desc', chars.length
        ? "Tes personnages, la création guidée, la feuille imprimable et toutes les tables des livres — le tout dans le navigateur, hors ligne si besoin."
        : "Le livre en version jouable : la création guidée en neuf étapes, la feuille imprimable, le tirage de PNJ et toutes les tables consultables. Rien à installer."),
      actes)));

  /* ---------- Roster ---------- */
  const rp = h('div.panel.rise', { style: { marginTop: '16px' } },
    h('div.panel-h', h('h3', `Personnages (${chars.length})`),
      h('div.sp'),
      h('button.btn.p.sm', { onclick: () => { const c = RULES.blank(); STORE.save(c); go('creation'); } }, 'Nouveau'),
      h('button.btn.g.sm', { onclick: () => { const c = genRandom({}); STORE.save(c); toast('Personnage tiré au hasard.', 'ok'); go('fiche'); } }, 'Au hasard'),
      h('button.btn.g.sm', { onclick: () => STORE.importFile() }, 'Importer'),
      chars.length ? h('button.btn.g.sm', { onclick: () => STORE.exportAll() }, 'Tout exporter') : null));
  if (!chars.length) {
    rp.appendChild(h('p.muted', { style: { margin: 0 } },
      "Aucun personnage. Commence par le questionnaire si tu hésites sur qui jouer, ou passe directement à la création."));
  } else {
    const grid = h('div.roster');
    const cur = STORE.current();
    /* Une fiche abîmée ne doit pas emporter le roster avec elle : on la remplace par
       une carte de secours qui permet de l'exporter ou de la supprimer. */
    const carteAbimee = (c, err) => h('div.pc-card', { style: { borderColor: 'var(--rouge, #b3352e)' } },
      h('button.btn.d.xs.del', {
        onclick: e => {
          e.stopPropagation();
          confirmer('Supprimer', `Supprimer « ${(c && c.nom) || 'Sans nom'} » définitivement ?`,
            () => { STORE.remove(c && c.id); route(); });
        }
      }, '✕'),
      h('div.nm', (c && c.nom) || 'Sans nom'),
      h('div.cc', 'fiche illisible'),
      h('p.muted', { style: { fontSize: '12px', margin: '8px 0 0' } },
        "Ce personnage contient une donnée que le code n’attend pas : ",
        h('b', String((err && err.message) || err))),
      h('div.row.wrap', { style: { marginTop: '10px' } },
        h('button.btn.g.xs', { onclick: e => { e.stopPropagation(); STORE.exportOne(c); } }, 'Exporter en JSON')));

    chars.forEach(c => {
      let el;
      try {
        const dv = RULES.derived(c);
        el = h('div.pc-card' + (cur && cur.id === c.id ? '' : ''), {
          onclick: e => { if (e.target.closest('.del')) return; STORE.setCurrent(c.id); go(c.termine ? 'fiche' : 'creation'); },
          style: cur && cur.id === c.id ? { borderColor: 'var(--acid)' } : null
        },
          h('button.btn.d.xs.del', {
            onclick: e => { e.stopPropagation(); confirmer('Supprimer', `Supprimer « ${c.nom || 'Sans nom'} » définitivement ?`, () => { STORE.remove(c.id); route(); }); }
          }, '✕'),
          h('div.nm', c.nom || 'Sans nom'),
          h('div.cc', (c.concept || 'sans concept') + ' · ' + c.age + ' ans'),
          h('div.st',
            ...RULES.STATS.map(s => h('b', s, ' ', h('i', s === 'EMP' ? dv.empAct : c.caracs[s]))),
          ),
          h('div.row.wrap', { style: { marginTop: '10px' } },
            h('span.chip' + (c.termine ? '.g' : '.a'), c.termine ? 'Terminé' : `Étape ${(c.etape || 0) + 1}/9`),
            h('span.chip', (c.competences || []).length + ' comp.'),
            (c.cyber || []).length ? h('span.chip.m', dv.humPerdue + ' humanité') : null,
            cur && cur.id === c.id ? h('span.chip.c', 'actif') : null));
      } catch (err) { console.error(err); el = carteAbimee(c, err); }
      grid.appendChild(el);
    });
    rp.appendChild(grid);
  }
  wrap.appendChild(rp);

  /* ---------- Les quatre entrées ---------- */
  const launch = h('div.launch.rise', { style: { marginTop: '16px' } });
  const card = (num, t, p, go2, cta) => launch.appendChild(h('a', { href: 'javascript:void 0', onclick: go2 },
    h('div.num', num), h('h3', t), h('p', p), h('div.go', cta + ' →')));
  card('01', 'Personnage',
    "Le questionnaire pour trouver qui jouer, la création guidée en neuf étapes, et le tirage complet au hasard pour les PNJ.",
    () => { if (!STORE.current()) STORE.save(RULES.blank()); go('personnage'); }, chars.length ? 'Continuer' : 'Commencer');
  card('02', 'Fiche',
    "La feuille de personnage remplissable et imprimable, et la progression : points gagnés, vieillissement, argent, journal de partie.",
    () => go('fiche'), 'Ouvrir');
  card('03', 'Univers',
    `L'histoire du monde en ${DB.univers.chronologie.length} dates, Night City quartier par quartier, ${DB.univers.corpos.length} mégacorporations, les gangs et les figures de 2020.`,
    () => go('univers'), 'Explorer');
  card('04', 'Codex',
    `Toutes les tables des livres : ${DB.skills.length} compétences, ${DB.weapons.length} armes, ${DB.cyberware.length} pièces de cybernétique, et le Livre du Net au complet.`,
    () => go('codex'), 'Consulter');
  wrap.appendChild(launch);

  /* ---------- À propos ---------- */
  wrap.appendChild(h('details.entry.apropos.rise', { style: { marginTop: '16px' } },
    h('summary', 'À propos, et les pièges du livre'),
    h('div.ct.g2',
      h('div.prose', { style: { maxWidth: 'none' } },
        h('h3', 'Source'),
        h('p', "Toutes les données proviennent du PDF ", h('em', 'Cyberpunk : New Dawn'), " (version du 26.08.2016, mise à jour le 09.07.2025), une synthèse francophone de Cyberpunk 2020. Les textes de règles sont reproduits fidèlement, les coquilles de mise en page corrigées."),
        h('p', "S'y ajoutent le ", h('em', 'Livre du Net'), " (version du 25.06.2026) — chapitre 9 du codex et onglet « Net » de la boutique — et, pour ce qui manquait à New Dawn, les armures et les drogues de ", h('em', 'Cyberpunk 2020 : Les Années Noires'), ". Chaque entrée venue d'un autre livre porte sa source."),
        h('h3', 'Ce que New Dawn change'),
        h('ul',
          h('li', "Plus de rôles ni de classes : les 40 points de compétence de base se dépensent librement."),
          h('li', "Plus de capacités spéciales sauf ", h('strong', 'Adrénaline'), " ; ", h('strong', 'Interface'), " et ", h('strong', 'Medtech'), " sont devenues des compétences d'INT accessibles à tous."),
          h('li', "9 caractéristiques dont ", h('strong', 'Chance'), ", qui donne des points de relance par partie."),
          h('li', "L'argent de départ dépend de (INT + BT) × 1000, avec possibilité de sacrifier des points de caractéristique."))),
      h('div.prose', { style: { maxWidth: 'none' } },
        h('h3', 'Contradictions signalées'),
        h('ul',
          h('li', h('strong', 'Plafond de compétence : '), "la table de l'âge donne un « Niv. Comp. Max » (4 à 8) et l'exemple de création le respecte, mais le chapitre Compétences annonce « une compétence à 5, les autres à 3 maximum ». L'application applique la table de l'âge par défaut, avec un interrupteur pour la règle stricte."),
          h('li', h('strong', 'Modificateur de constitution : '), "les pages 11 et 12 se chevauchent à CON 7. L'application retient les bandes de la page 11 (5-6 moyenne, 7-9 forte)."),
          h('li', h('strong', 'Exemple de création : '), "Gally n'utilise que 57 de ses 73 points de compétence, et le texte de l'argent mentionne « 4 en Chance » là où la formule dit BT."),
          h('li', h('strong', 'Au-delà de 28 ans : '), "la table s'arrête là. L'application prolonge à +1 PC par an, plafond 8 — à valider avec ton MJ.")),
        h('h3', 'Données'),
        h('p', "Tes personnages sont enregistrés dans ce navigateur uniquement. Exporte-les en JSON pour les sauvegarder ou les passer d'un appareil à l'autre. Rien n'est envoyé sur un serveur."))),
    h('div.ct.row.wrap', { style: { paddingTop: 0 } },
      h('button.btn.g.sm', { onclick: () => go('codex/exemple') }, "Voir l'exemple du livre"),
      h('button.btn.g.sm', { onclick: () => go('codex/regles-creation') }, 'Lire les règles de création'),
      h('button.btn.g.sm', { onclick: () => STORE.importFile() }, 'Importer un fichier JSON'))
  ));
  return wrap;
};

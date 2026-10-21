/* ============================================================
   RÉSUMÉ DE JEU
   La feuille en fac-similé est faite pour le papier : au téléphone, ses
   924 cases deviennent illisibles. Cet onglet présente les mêmes données,
   lues dans le personnage lui-même, dans l'ordre où on en a besoin à la
   table : ce qu'on annonce, ce qu'on lance, ce qu'on encaisse.
   ============================================================ */
'use strict';

/** Une tuile chiffre + libellé */
const tuile = (lib, val, note) => h('div.rz-t', h('b', String(val)), h('span', lib),
  note ? h('i', note) : null);

/** Un bloc titré */
const rzBloc = (titre, ...kids) => h('div.panel.rz-b',
  h('div.panel-h', h('h3', titre)), ...kids.filter(Boolean));

SOUS.resume = function () {
  const ch = STORE.current();
  if (!ch) return needChar("Choisis un personnage dans le roster pour voir son résumé.");
  const dv = RULES.derived(ch);
  const f = (ch.f || {});
  const wrap = h('div');

  /* ---------- Identité ---------- */
  wrap.appendChild(h('div.rz-ident',
    h('h2', ch.nom || 'Sans nom'),
    h('p', (ch.concept || 'sans concept') + ' · ' + ch.age + ' ans'
      + (f.pseudonyme ? ' · « ' + f.pseudonyme + ' »' : ''))));

  /* ---------- Caractéristiques ---------- */
  const car = h('div.rz-grid');
  RULES.STATS.forEach(s => {
    const v = s === 'EMP' ? dv.empAct : ch.caracs[s];
    car.appendChild(tuile(s, v, s === 'EMP' && dv.empPerte ? 'base ' + ch.caracs.EMP : null));
  });
  wrap.appendChild(rzBloc('Caractéristiques', car));

  /* ---------- Ce qu'on lance et ce qu'on encaisse ---------- */
  const vit = h('div.rz-grid',
    tuile('Initiative', ch.caracs.REF + ' + 1D10', 'REF'),
    tuile('Sauvegarde', dv.sauvegarde, 'd10 ≤'),
    tuile('Mod. const.', (dv.mc >= 0 ? '+' : '') + dv.mc, dv.mcLabel),
    tuile('Fracture', dv.seuilFracture, 'dégâts en une fois'),
    tuile('Amputation', dv.seuilAmputation, 'dégâts en une fois'),
    tuile('Course', dv.course + ' m', 'saut ' + dv.saut + ' m'),
    tuile('Humanité', dv.humRestante + ' / ' + dv.humMax, dv.humPerdue ? '−' + dv.humPerdue : null),
    tuile('Chance', dv.chance, 'relances'));
  wrap.appendChild(rzBloc('En jeu', vit));

  /* ---------- Armure par localisation ---------- */
  const zones = [['tete', 'Tête'], ['torse', 'Torse'], ['brasD', 'Bras D.'], ['brasG', 'Bras G.'],
  ['jambeD', 'Jambe D.'], ['jambeG', 'Jambe G.']];
  const pa = (f.pa || {});
  if (zones.some(([k]) => pa[k])) {
    const g = h('div.rz-grid');
    zones.forEach(([k, lib]) => g.appendChild(tuile(lib, pa[k] || '—', 'PA')));
    wrap.appendChild(rzBloc('Armure', g));
  }

  /* ---------- Compétences, les plus fortes d'abord ---------- */
  const comp = (ch.competences || []).slice().sort((a, b) => b.niv - a.niv || a.nom.localeCompare(b.nom));
  if (comp.length) {
    const host = h('div.rz-comp');
    const carac = n => {
      const s = (DB.skills || []).find(x => noAcc(x.nom) === noAcc(n));
      return s && s.carac ? s.carac : '';
    };
    comp.forEach(s => {
      const c = carac(s.nom);
      const base = c && ch.caracs[c] !== undefined ? ch.caracs[c] : null;
      host.appendChild(h('div.rz-l',
        h('span.n', s.nom),
        c ? h('span.c', c) : null,
        h('b', s.niv),
        base !== null ? h('i', '→ ' + (base + s.niv) + ' + 1D10') : null));
    });
    wrap.appendChild(rzBloc('Compétences (' + comp.length + ')', host));
  }

  /* ---------- Ce qu'il porte ---------- */
  const sacs = [['armes', 'Armes'], ['armures', 'Armures'], ['cyber', 'Cybernétique'],
  ['equipement', 'Équipement'], ['net', 'Matériel du Net']];
  sacs.forEach(([cle, titre]) => {
    const l = ch[cle] || [];
    if (!l.length) return;
    const host = h('div.rz-comp');
    l.forEach(it => {
      const nom = it.nom || it;
      const det = [it.deg, it.sp, it.cadence, it.mun, it.hum ? it.hum + ' hum.' : null]
        .filter(Boolean).join(' · ');
      host.appendChild(h('div.rz-l', h('span.n', nom), det ? h('i', det) : null));
      (it.options || []).forEach(o => host.appendChild(
        h('div.rz-l.opt', h('span.n', '↳ ' + (o.nom || o)))));
    });
    wrap.appendChild(rzBloc(titre + ' (' + l.length + ')', host));
  });

  /* ---------- Argent ---------- */
  wrap.appendChild(rzBloc('Argent', h('div.rz-grid',
    tuile('Départ', eb(dv.argent)), tuile('Dépensé', eb(dv.depense)),
    tuile('Reste', eb(dv.reste)))));

  wrap.appendChild(h('div.row.wrap', { style: { marginTop: '14px' } },
    h('button.btn.p', { onclick: () => go('fiche/feuille') }, 'Ouvrir la feuille'),
    h('button.btn.g', { onclick: () => go('fiche/progression') }, 'Progression'),
    h('button.btn.g', { onclick: () => STORE.exportOne(ch) }, 'Exporter')));
  return wrap;
};

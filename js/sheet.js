/* ============================================================
   FICHE DE PERSONNAGE & PROGRESSION
   ============================================================ */
'use strict';

/* La vue « fiche » est désormais la feuille interactive : voir feuille.js */

/* ============================================================
   PROGRESSION
   ============================================================ */
VIEWS.progression = function () {
  const ch = STORE.current();
  if (!ch) return needChar("La progression s'applique à un personnage existant.");
  const wrap = h('div');
  const rr = () => { STORE.save(ch); route(); };

  wrap.appendChild(sectionTitle('Après la création', 'Progression',
    "Points de compétence gagnés en jeu, vieillissement, achats et gains d'argent, journal de campagne."));

  const dv = RULES.derived(ch);

  /* -- Points de compétence -- */
  const pcHost = h('div');
  function renderPC() {
    clear(pcHost);
    const d2 = RULES.derived(ch);
    pcHost.appendChild(h('div.dv-grid', { style: { marginBottom: '14px' } },
      h('div.dv', h('span', 'PC de base'), h('b', RULES.SKILL_BASE + ch.caracs.INT + ch.caracs.REF + RULES.ageRow(ch.age).tpc), h('i', 'création')),
      h('div.dv', h('span', 'PC gagnés en jeu'), h('b', ch.pcBonus || 0), h('i', 'ajoutés ici')),
      h('div.dv', h('span', 'Total'), h('b', d2.pcTotal)),
      h('div.dv', h('span', 'Dépensés'), h('b', d2.pcDepense)),
      h('div.dv', h('span', 'Disponibles'), h('b', { style: { color: d2.pcReste > 0 ? 'var(--green)' : null } }, d2.pcReste))));

    pcHost.appendChild(h('div.row.wrap', { style: { marginBottom: '14px' } },
      h('span.tag', 'Ajouter des PC gagnés en séance'),
      ...[1, 2, 3, 5, 10].map(n => h('button.btn.g.sm', {
        onclick: () => {
          ch.pcBonus = (ch.pcBonus || 0) + n;
          (ch.journal || (ch.journal = [])).push({ d: today(), t: `+${n} PC gagnés en jeu.` });
          STORE.save(ch); renderPC(); renderJ();
        }
      }, '+' + n)),
      h('button.btn.g.sm', {
        onclick: () => {
          ch.pcBonus = Math.max(0, (ch.pcBonus || 0) - 1); STORE.save(ch); renderPC();
        }
      }, '−1')));

    /* Montée de compétences au tarif du livre */
    const up = h('div.sk-list');
    const owned = (ch.competences || []).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    if (!owned.length) up.appendChild(h('p.muted', { style: { padding: '10px' } }, "Aucune compétence à faire progresser."));
    owned.forEach(s => {
      const cost = RULES.upCost(s.nom, s.niv);
      const coeff = RULES.skillCoeff(s.nom);
      up.appendChild(h('div.sk.has',
        h('div.nm', h('b', s.nom), h('div.mt',
          h('span', 'niveau ' + s.niv),
          coeff > 1 ? h('em', 'coeff ×' + coeff) : null,
          h('span', `montée : ${cost} PC`))),
        h('div.ctl',
          h('button', {
            disabled: s.niv >= 10 || d2.pcReste < 1,
            title: `Coûte ${cost} PC selon la table du livre`,
            onclick: () => {
              if (d2.pcReste < 1) return toast("Plus de PC disponibles.", 'no');
              s.niv = Math.min(10, s.niv + 1);
              (ch.journal || (ch.journal = [])).push({ d: today(), t: `${s.nom} passe à ${s.niv} (tarif livre : ${cost} PC).` });
              STORE.save(ch); renderPC(); renderJ();
            }
          }, '+'),
          h('span.v', s.niv))));
    });
    pcHost.appendChild(h('div.tag.a', { style: { marginBottom: '8px' } }, 'Faire monter une compétence'));
    pcHost.appendChild(up);
    pcHost.appendChild(h('p.muted', { style: { fontSize: '12px', marginTop: '10px' } },
      "Le compteur de PC de cette application est celui de la création (1 point = 1 niveau). La colonne « montée » indique le tarif de la table de progression du livre (niveau actuel × 10 × coefficient) : à ton MJ de dire lequel des deux barèmes s'applique en cours de campagne."));
  }

  /* -- Vieillissement -- */
  const ageHost = h('div');
  function renderAge() {
    clear(ageHost);
    const row = RULES.ageRow(ch.age);
    ageHost.appendChild(h('p', { style: { margin: '0 0 12px', fontSize: '13.5px', color: 'var(--txt-2)', lineHeight: 1.65 } },
      "« À partir de 30 ans, le joueur choisit REF, MV ou CON et tire 1D10. Si le résultat est inférieur ou égal à la caractéristique choisie, le personnage y perd 1 point. Cela se reproduira tous les 2 ans jusqu'à 40 ans. Au-delà, tirez une fois par an jusqu'à 55 ans. Après 55 ans, tirez deux fois par an. Le joueur ne peut pas choisir la même caractéristique deux fois de suite. »"));
    ageHost.appendChild(h('div.dv-grid', { style: { marginBottom: '12px' } },
      h('div.dv', h('span', 'Âge'), h('b', ch.age)),
      h('div.dv', h('span', 'TPc'), h('b', row.tpc), h('i', row.extrapole ? 'extrapolé' : 'table du livre')),
      h('div.dv', h('span', 'Plafond'), h('b', row.max)),
      h('div.dv', h('span', 'Dernier déclin'), h('b', ch.dernierDeclin || '—'))));
    ageHost.appendChild(h('div.row.wrap',
      h('button.btn.g.sm', {
        onclick: () => {
          ch.age++;
          (ch.journal || (ch.journal = [])).push({ d: today(), t: `Anniversaire : ${ch.age} ans.` });
          STORE.save(ch); renderAge(); renderPC(); renderJ();
        }
      }, '+1 an'),
      h('span.tag', 'Jet de déclin sur'),
      ...['REF', 'MV', 'CON'].map(s => h('button.btn' + (ch.dernierDeclin === s ? '.g' : '') + '.sm', {
        disabled: ch.dernierDeclin === s,
        title: ch.dernierDeclin === s ? 'Pas deux fois la même caractéristique de suite' : '',
        onclick: () => {
          const jet = d10(), v = ch.caracs[s], perte = jet <= v;
          if (perte) ch.caracs[s] = Math.max(0, v - 1);
          ch.dernierDeclin = s;
          const txt = `Déclin (${ch.age} ans) — ${s} : 1D10 = ${jet} contre ${v} → ${perte ? 'perte de 1 point (' + s + ' ' + ch.caracs[s] + ')' : 'aucune perte'}.`;
          (ch.journal || (ch.journal = [])).push({ d: today(), t: txt });
          STORE.save(ch); renderAge(); renderJ();
          modal({
            title: 'Jet de déclin', body: h('div',
              h('p', { class: 'roll', style: { fontSize: '15px' } }, `1D10 = `, h('b', jet), ` contre ${s} ${v}`),
              h('p', { style: { color: perte ? 'var(--red)' : 'var(--green)', margin: 0 } },
                perte ? `${s} tombe à ${ch.caracs[s]}.` : `Aucune perte cette fois.`),
              ch.caracs[s] <= 1 ? h('p', { style: { color: 'var(--red)' } }, "À 1, le personnage est handicapé. À 0, il meurt.") : null),
            actions: [{ label: 'Fermer', cls: '.p' }]
          });
        }
      }, s)),
      h('button.btn.g.xs', { onclick: () => { ch.dernierDeclin = null; STORE.save(ch); renderAge(); } }, 'Réinitialiser le verrou')));
  }

  /* -- Argent -- */
  const moneyHost = h('div');
  function renderMoney() {
    clear(moneyHost);
    const d2 = RULES.derived(ch);
    moneyHost.appendChild(h('div.dv-grid', { style: { marginBottom: '12px' } },
      h('div.dv', h('span', 'Budget de création'), h('b', eb(d2.argent))),
      h('div.dv', h('span', 'Gains en jeu'), h('b', eb(ch.gains || 0))),
      h('div.dv', h('span', 'Dépensé'), h('b', eb(d2.depense))),
      h('div.dv', h('span', 'Solde'), h('b', { style: { color: (d2.reste + (ch.gains || 0)) < 0 ? 'var(--red)' : 'var(--green)' } }, eb(d2.reste + (ch.gains || 0))))));
    let val = 0;
    moneyHost.appendChild(h('div.row.wrap',
      h('input', { type: 'number', placeholder: 'Montant en €$', style: { maxWidth: '160px' }, oninput: e => val = parseInt(e.target.value) || 0 }),
      h('button.btn.p.sm', {
        onclick: () => {
          if (!val) return;
          ch.gains = (ch.gains || 0) + val;
          (ch.journal || (ch.journal = [])).push({ d: today(), t: `${val > 0 ? 'Gain' : 'Perte'} de ${eb(Math.abs(val))}.` });
          STORE.save(ch); renderMoney(); renderJ();
        }
      }, 'Enregistrer'),
      h('button.btn.g.sm', { onclick: () => { ch.etape = 7; STORE.save(ch); go('creation'); } }, 'Ouvrir la boutique')));
    moneyHost.appendChild(h('p.muted', { style: { fontSize: '12px', marginTop: '10px' } },
      "Les achats passent par la boutique de l'étape 8 : ils décrémentent le même solde et mettent à jour l'humanité."));
  }

  /* -- Journal -- */
  const jHost = h('div');
  function renderJ() {
    clear(jHost);
    const list = (ch.journal || []).slice().reverse();
    if (!list.length) jHost.appendChild(h('p.muted', { style: { margin: 0, fontSize: '13px' } }, 'Journal vide.'));
    list.forEach((j, i) => jHost.appendChild(h('div.jr', h('span.dd', j.d), h('span.tt.grow', j.t),
      h('button.btn.d.xs', { onclick: () => { ch.journal.splice(ch.journal.length - 1 - i, 1); STORE.save(ch); renderJ(); } }, '✕'))));
    let txt = '';
    jHost.appendChild(h('div.row', { style: { marginTop: '12px' } },
      h('input', { type: 'text', placeholder: 'Ajouter une ligne au journal…', oninput: e => txt = e.target.value }),
      h('button.btn.g.sm', {
        onclick: () => { if (!txt.trim()) return; (ch.journal || (ch.journal = [])).push({ d: today(), t: txt.trim() }); STORE.save(ch); renderJ(); }
      }, 'Ajouter')));
  }

  wrap.appendChild(h('div.panel.rise', { style: { marginBottom: '14px' } }, h('div.panel-h', h('h3', 'Points de compétence')), pcHost));
  wrap.appendChild(h('div.g2.rise', { style: { marginBottom: '14px', alignItems: 'start' } },
    h('div.panel', h('div.panel-h', h('h3', 'Vieillissement — « ce ne sont pas les années, mais le kilométrage »')), ageHost),
    h('div.panel', h('div.panel-h', h('h3', 'Argent')), moneyHost)));
  wrap.appendChild(h('div.panel.rise', h('div.panel-h', h('h3', 'Journal de campagne')), jHost));
  renderPC(); renderAge(); renderMoney(); renderJ();
  return wrap;
};

/* ============================================================
   AMORÇAGE
   Construit l'ossature commune à toutes les pages (rail de navigation,
   barre de titre, pied de page), charge les tables du livre, puis
   affiche la section demandée par <body data-page="…">.
   ============================================================ */
'use strict';

/* Les fichiers de data/ à charger avant le premier rendu */
const DATA_FILES = [
  'skills', 'rules_skills', 'advantages', 'defects', 'annexes', 'lifepath', 'crimes',
  'weapons', 'armor', 'ammo', 'weapon_accessories', 'equipment', 'cyberware',
  'cyber_rules', 'martial_arts', 'rules', 'fiche_layout', 'drugs_rules',
  'net_programs', 'net_hardware', 'net_rules'
];

/** Les pastilles et le logotype sont découpés dans le PDF du livre et posés en variables CSS */
const orn = rev => h('span.orn' + (rev ? '.rev' : ''), { 'aria-hidden': 'true' });

/** L'image de couverture, lue dans la variable CSS --cover */
const coverSrc = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--cover').trim();
  const m = v.match(/url\(["']?([^"')]+)["']?\)/);
  if (!m) return '';
  const u = m[1];
  // le chemin est relatif à css/style.css : on le ramène à la racine du site
  return u.startsWith('data:') ? u : u.replace(/^\.\.\//, '');
};

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const b = $('#themeBtn'); if (b) b.textContent = t === 'nuit' ? 'Nuit' : 'Papier';
  STORE.setPref('theme', t);
}

/** Le rail, la barre de titre et le pied de page, identiques sur toutes les pages */
function construireInterface() {
  const rail = h('div#rail',
    h('div.brand',
      h('a.logo', { href: 'index.html', role: 'img', 'aria-label': 'Cyberpunk : New Dawn' }),
      h('button#themeBtn.themer', {
        title: 'Basculer entre le rendu papier du livre et un fond sombre pour jouer le soir',
        onclick: () => setTheme(document.documentElement.getAttribute('data-theme') === 'nuit' ? 'papier' : 'nuit')
      }, 'Papier')),
    h('nav', ...NAV.map(n => h('a' + (n.r === PAGE ? '.on' : ''), {
      href: lien(n.r), dataset: { r: n.r }, title: n.t
    }, h('span.ic', n.ic), h('span.lg', n.t), h('span.sm', n.s))))
  );
  const main = h('div#main',
    h('div.topbar', h('h1#topTitle', 'Accueil'), h('div.sp'), h('div#topWho.who')),
    h('div#view.view')
  );
  const foot = h('div#pagefoot', orn(), h('span#footLabel.pn', 'Cyberpunk : New Dawn'), orn(true));
  document.body.appendChild(h('div#app', rail, main, foot));
  document.body.appendChild(h('div#toasts'));
}

/** Charge les tables du livre dans DB */
async function chargerDonnees() {
  // version hors ligne : les tables sont déjà dans la page
  const inclus = document.querySelectorAll('script[type="application/json"][data-db]');
  if (inclus.length) {
    inclus.forEach(s => { DB[s.dataset.db] = JSON.parse(s.textContent); });
    return;
  }
  const reponses = await Promise.all(DATA_FILES.map(n =>
    fetch('data/' + n + '.json').then(r => {
      if (!r.ok) throw new Error(n + '.json — ' + r.status);
      return r.json();
    })));
  DATA_FILES.forEach((n, i) => { DB[n] = reponses[i]; });
}

/** Message affiché si les données n'ont pas pu être chargées */
function erreurChargement(e) {
  const host = $('#view');
  if (!host) return;
  clear(host);
  host.appendChild(h('div.panel',
    h('div.panel-h', h('h3', 'Les tables du livre n’ont pas pu être chargées')),
    h('p', "Le site lit ses données dans le dossier ", h('code', 'data/'), ". Elles n'ont pas pu être récupérées : ",
      h('b', String(e && e.message || e))),
    h('p.muted', { style: { marginBottom: 0 } },
      "Si tu as ouvert le fichier par un double-clic depuis ton disque, c'est normal : les navigateurs "
      + "interdisent la lecture de fichiers voisins en accès direct. Passe par un petit serveur local "
      + "(python -m http.server), par GitHub Pages, ou utilise la version hors ligne en un seul fichier "
      + "fournie dans le dossier hors-ligne/.")));
}

(async function demarrer() {
  construireInterface();
  setTheme(STORE.prefs().theme || 'papier');
  if (MONO && !location.hash) location.hash = '/accueil';
  try { await chargerDonnees(); }
  catch (e) { erreurChargement(e); return; }
  route();
})();

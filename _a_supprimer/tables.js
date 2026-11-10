/* ============================================================
   LES TABLES DU LIVRE
   Où le site va chercher ses données, et comment on les corrige
   depuis le site au lieu de republier le dossier.

   Le principe, en une phrase : le dossier data/ reste la référence,
   et la base en ligne ne contient que ce qui a été corrigé.

   Pourquoi pas « tout dans la base » : le dossier est servi par
   GitHub, mis en cache par le navigateur, gratuit, et il marche sans
   réseau. Les tables pèsent 1,7 Mo ; les retélécharger depuis la base
   à chaque page rendrait le site lent et viderait le quota du compte
   gratuit en quelques soirées. On ne télécharge donc en ligne que les
   tables réellement modifiées — en général aucune, souvent une seule.

   Et si la base ne répond pas, ne répond plus, ou n'existe pas (le
   fichier hors ligne), le site lit le dossier et marche exactement
   comme avant : une table en ligne est un bonus, jamais une condition.
   ============================================================ */
'use strict';

/** Les tables du livre, dans l'ordre de chargement, avec leur nom lisible. */
const TABLES = [
  { id: 'skills', t: 'Compétences' },
  { id: 'rules_skills', t: 'Règles des compétences' },
  { id: 'advantages', t: 'Avantages' },
  { id: 'defects', t: 'Défauts' },
  { id: 'annexes', t: 'Annexes' },
  { id: 'lifepath', t: 'Parcours de vie' },
  { id: 'crimes', t: 'Crimes et prison' },
  { id: 'weapons', t: 'Armes' },
  { id: 'armor', t: 'Armures' },
  { id: 'ammo', t: 'Munitions' },
  { id: 'weapon_accessories', t: 'Accessoires d’armes' },
  { id: 'equipment', t: 'Équipement' },
  { id: 'cyberware', t: 'Cyberware' },
  { id: 'cyber_rules', t: 'Règles du cyberware' },
  { id: 'martial_arts', t: 'Arts martiaux' },
  { id: 'rules', t: 'Règles du jeu' },
  { id: 'fiche_layout', t: 'Mise en page de la feuille' },
  { id: 'drugs_rules', t: 'Drogues' },
  { id: 'net_programs', t: 'Programmes du Net' },
  { id: 'net_hardware', t: 'Matériel du Net' },
  { id: 'net_rules', t: 'Règles du Net' },
  { id: 'univers', t: 'Univers' }
];
const TABLE_IDS = TABLES.map(x => x.id);
const TABLE_NOM = id => (TABLES.find(x => x.id === id) || {}).t || id;


const LIVRE = {
  CACHE: 'cpnd.tables.v1',
  /** Au-delà, on n'attend plus la base et on démarre avec le dossier.
      Un projet Supabase gratuit qui dort met parfois une minute à
      se réveiller : hors de question de bloquer le site pour ça. */
  ATTENTE: 3500,

  /** Pour chaque table : d'où vient ce qui est affiché. */
  etat: {},
  /** { nom: date de dernière modification } côté base, ou null si pas de réponse. */
  manifeste: null,
  /** Dernier ennui avec la base, pour l'expliquer sans inventer. */
  panne: null,
  /** Vrai dans le fichier hors ligne : les tables sont déjà dans la page. */
  incluses: false,
  /** Vrai une fois DB rempli pour de bon, base comprise. */
  fini: false,

  /* ---------- Le cache du navigateur ----------
     Il évite de retélécharger une table corrigée à chaque page. Il est
     facultatif : s'il déborde ou s'il est refusé, on retélécharge, c'est
     tout. Rien d'important ne vit ici. */

  _cacheLire() {
    try { return JSON.parse(localStorage.getItem(this.CACHE) || '{}') || {}; }
    catch (e) { return {}; }
  },
  _cacheEcrire(o) {
    try { localStorage.setItem(this.CACHE, JSON.stringify(o)); return true; }
    catch (e) {
      /* Plus de place : on vide et on renonce au cache plutôt que de
         faire échouer l'enregistrement. */
      try { localStorage.removeItem(this.CACHE); } catch (e2) { }
      return false;
    }
  },
  viderCache() { try { localStorage.removeItem(this.CACHE); } catch (e) { } },

  /* ---------- Chargement ---------- */

  enLigne() { return typeof NUAGE !== 'undefined' && NUAGE.dispo(); },

  /** Remplit DB. Ne rejette que si le dossier lui-même est illisible :
      un ennui avec la base n'empêche jamais le site de s'ouvrir. */
  async charger() {
    try { return await this._charger(); }
    finally { this.fini = true; }
  },

  async _charger() {
    // Version hors ligne : les tables sont posées dans la page par build.py.
    const inclus = document.querySelectorAll('script[type="application/json"][data-db]');
    if (inclus.length) {
      this.incluses = true;
      inclus.forEach(s => {
        DB[s.dataset.db] = JSON.parse(s.textContent);
        this.etat[s.dataset.db] = { source: 'page', octets: s.textContent.length };
      });
      return;
    }

    // 1. Le dossier. C'est la référence, et c'est ce qui fait démarrer le site.
    const brut = await Promise.all(TABLE_IDS.map(n =>
      fetch('data/' + n + '.json').then(r => {
        if (!r.ok) throw new Error(n + '.json — ' + r.status);
        return r.text();
      })));
    TABLE_IDS.forEach((n, i) => {
      DB[n] = JSON.parse(brut[i]);
      this.etat[n] = { source: 'dossier', maj: null, octets: brut[i].length };
    });

    // 2. La base, par-dessus, pour les seules tables corrigées.
    if (!this.enLigne()) return;
    try {
      await this.appliquer(await this.manifester());
    } catch (e) {
      this.panne = e.message;
    }
  },

  /** La liste de ce que la base contient — quelques centaines d'octets. */
  async manifester() {
    const appel = NUAGE.lire('tables', 'select=nom,maj');
    const minuteur = new Promise((_, rej) => setTimeout(
      () => rej(new Error('La base n’a pas répondu en ' + Math.round(this.ATTENTE / 1000)
        + ' secondes. Le site s’est ouvert avec les tables du dossier.')), this.ATTENTE));
    const lignes = await Promise.race([appel, minuteur]);
    const m = {};
    (lignes || []).forEach(x => { if (TABLE_IDS.indexOf(x.nom) >= 0) m[x.nom] = x.maj; });
    this.manifeste = m;
    this.panne = null;
    return m;
  },

  /** Télécharge ce qui manque au cache, puis pose les tables de la base dans DB.
      @return le nombre de tables qui viennent de la base. */
  async appliquer(man) {
    const noms = Object.keys(man || {});
    if (!noms.length) return 0;
    const cache = this._cacheLire();
    const manquantes = noms.filter(n => !(cache[n] && cache[n].maj === man[n]));
    if (manquantes.length) {
      const lignes = await NUAGE.lire('tables',
        'select=nom,donnees,maj&nom=in.(' + manquantes.join(',') + ')');
      (lignes || []).forEach(x => { cache[x.nom] = { maj: x.maj, donnees: x.donnees }; });
      this._cacheEcrire(cache);
    }
    let n = 0;
    noms.forEach(nom => {
      const c = cache[nom];
      if (!c || c.maj !== man[nom] || c.donnees === undefined) return;
      DB[nom] = c.donnees;
      this.etat[nom] = { source: 'base', maj: c.maj, octets: JSON.stringify(c.donnees).length };
      n++;
    });
    return n;
  },

  /* ---------- Écriture (administrateur seulement) ---------- */

  /** Relit une table dans le dossier, sans toucher à DB. */
  async duDossier(nom) {
    const r = await fetch('data/' + nom + '.json', { cache: 'reload' });
    if (!r.ok) throw new Error('data/' + nom + '.json — ' + r.status);
    return r.json();
  },

  /** Envoie une table dans la base. C'est elle qui fera foi ensuite. */
  async envoyer(nom, donnees) {
    if (TABLE_IDS.indexOf(nom) < 0) throw new Error('Table inconnue : ' + nom);
    if (donnees === undefined || donnees === null) throw new Error('Table vide : rien à envoyer.');
    const moi = NUAGE.moi();
    const maj = new Date().toISOString();
    await NUAGE.poser('tables', { nom, donnees, maj, par: moi ? moi.id : null });
    DB[nom] = donnees;
    const cache = this._cacheLire();
    cache[nom] = { maj, donnees };
    this._cacheEcrire(cache);
    if (this.manifeste) this.manifeste[nom] = maj;
    this.etat[nom] = { source: 'base', maj, octets: JSON.stringify(donnees).length };
    return maj;
  },

  /** Retire une table de la base : le site la relira dans le dossier. */
  async retirer(nom) {
    await NUAGE.oter('tables', 'nom=eq.' + encodeURIComponent(nom));
    const cache = this._cacheLire();
    delete cache[nom];
    this._cacheEcrire(cache);
    if (this.manifeste) delete this.manifeste[nom];
    const o = await this.duDossier(nom);
    DB[nom] = o;
    this.etat[nom] = { source: 'dossier', maj: null, octets: JSON.stringify(o).length };
  },

  /* ---------- Petits renseignements pour la page ---------- */

  source(nom) { return (this.etat[nom] || {}).source || 'dossier'; },
  enBase() { return TABLE_IDS.filter(n => this.source(n) === 'base'); },
  poids(nom) { return Math.round(((this.etat[nom] || {}).octets || 0) / 1024); }
};


/* ============================================================
   L'ÉDITEUR
   Ouvert depuis le tableau de bord, par l'administrateur seul.
   ============================================================ */

/** De quoi est faite une table : une liste de fiches, ou autre chose. */
function tabEstListe(v) {
  return Array.isArray(v) && v.length > 0 && v.every(x => x && typeof x === 'object' && !Array.isArray(x));
}

/** Le nom d'une entrée, tel qu'on le lit dans la liste. */
function tabTitre(e, i) {
  return String((e && (e.nom || e.titre || e.t || e.name)) || ('Entrée ' + (i + 1)));
}

/** Une zone de texte. Attention : un <textarea> ignore l'attribut « value » —
    son contenu se pose par la propriété, sinon la case s'affiche vide. */
function tabAire(attrs, texte) {
  const a = h('textarea', attrs);
  a.value = texte === null || texte === undefined ? '' : String(texte);
  return a;
}

/** Un champ de formulaire adapté à ce que contient la valeur.
    poser(nouvelleValeur) est appelé à chaque frappe ; il peut lever
    une erreur si le texte saisi n'est pas lisible (JSON de travers). */
function tabChamp(cle, val, poser) {
  /** large : le champ prend toute la largeur du formulaire au lieu d'une colonne. */
  const bloc = (titre, entree, large, note) =>
    h('label.net-ch' + (large ? '.tb-large' : ''), h('span', titre), entree, note || null);

  if (typeof val === 'boolean') {
    return h('label.net-ch.tb-oui', h('span', cle),
      h('input', { type: 'checkbox', checked: val, onchange: e => poser(e.target.checked) }));
  }
  if (typeof val === 'number') {
    return bloc(cle, h('input', {
      type: 'number', step: 'any', value: String(val),
      oninput: e => poser(e.target.value === '' ? null : Number(e.target.value))
    }));
  }
  if (Array.isArray(val) && val.every(x => typeof x === 'string' || typeof x === 'number')) {
    /* Une liste de mots : une ligne par élément, c'est tout ce qu'il faut savoir. */
    return bloc(cle + ' — une ligne par élément', tabAire({
      rows: Math.min(10, Math.max(2, val.length)),
      oninput: e => poser(e.target.value.split('\n').map(s => s.trim()).filter(s => s !== ''))
    }, val.join('\n')), true);
  }
  if (val !== null && typeof val === 'object') {
    /* Trop emboîté pour un formulaire : on montre le JSON, et on dit tout de
       suite s'il n'est plus lisible, au lieu d'attendre l'enregistrement. */
    const note = h('i.tb-ennui', '');
    const zone = tabAire({
      class: 'tb-json', rows: 8, spellcheck: 'false',
      oninput: e => {
        try {
          poser(JSON.parse(e.target.value));
          note.textContent = ''; e.target.classList.remove('faux');
        } catch (err) {
          note.textContent = 'JSON illisible — ce champ ne sera pas enregistré : ' + err.message;
          e.target.classList.add('faux');
        }
      }
    }, JSON.stringify(val, null, 1));
    return bloc(cle + ' — JSON', zone, true, note);
  }
  const txt = val === null || val === undefined ? '' : String(val);
  if (txt.length > 90 || txt.indexOf('\n') >= 0) {
    return bloc(cle, tabAire({
      rows: Math.min(14, Math.max(3, Math.ceil(txt.length / 80))),
      oninput: e => poser(e.target.value)
    }, txt), true);
  }
  return bloc(cle, h('input', { type: 'text', value: txt, oninput: e => poser(e.target.value) }));
}


/** La fenêtre d'édition d'une table. `apres` est rappelé après un enregistrement. */
function tabEditeur(nom, apres) {
  /* On travaille sur une copie : tant qu'on n'a pas enregistré, le site
     continue d'afficher ce qu'il affichait. */
  let copie;
  try { copie = JSON.parse(JSON.stringify(DB[nom])); }
  catch (e) { toast('Table illisible : ' + e.message, 'no'); return; }

  const corps = h('div');
  const pied = h('p.muted', { style: { margin: '10px 0 0', fontSize: '12.5px' } }, '');
  let modeJson = !tabEstListe(copie);

  const compter = () => {
    const n = Array.isArray(copie) ? copie.length : Object.keys(copie || {}).length;
    pied.textContent = (Array.isArray(copie) ? n + ' entrée(s)' : n + ' rubrique(s)')
      + ' · ' + Math.round(JSON.stringify(copie).length / 1024) + ' Ko'
      + ' · source actuelle : ' + (LIVRE.source(nom) === 'base' ? 'la base' : 'le dossier data/');
  };

  /* ---- Vue JSON : toujours disponible, pour tout ---- */
  const vueJson = () => {
    clear(corps);
    const ennui = h('p.muted', { style: { margin: '6px 0 0', fontSize: '12.5px' } }, '');
    const zone = tabAire({
      class: 'tb-json tb-grand', rows: 22, spellcheck: 'false',
      oninput: e => {
        try {
          const o = JSON.parse(e.target.value);
          copie = o; ennui.textContent = ''; e.target.classList.remove('faux'); compter();
        } catch (err) {
          ennui.textContent = 'JSON illisible — les modifications ne seront pas enregistrées : ' + err.message;
          e.target.classList.add('faux');
        }
      }
    }, JSON.stringify(copie, null, 1));
    corps.appendChild(h('p.muted', { style: { marginTop: 0 } },
      'Le contenu entier de la table. À manier avec précaution : une virgule de trop '
      + 'et la table ne se lit plus. Le texte devient rouge dès que c’est le cas.'));
    corps.appendChild(zone);
    corps.appendChild(ennui);
  };

  /* ---- Vue liste : la fiche d'une entrée ---- */
  const vueFiche = (i) => {
    clear(corps);
    const e = copie[i];
    corps.appendChild(h('div.row.wrap', { style: { marginBottom: '10px' } },
      h('button.btn.g.sm', { onclick: () => vueListe() }, '← Retour à la liste'),
      h('div.sp'),
      h('button.btn.d.sm', {
        onclick: () => confirmer('Supprimer', 'Supprimer « ' + tabTitre(e, i) + ' » de cette table ?',
          () => { copie.splice(i, 1); compter(); vueListe(); })
      }, 'Supprimer cette entrée')));
    const grille = h('div.net-form.tb-form');
    Object.keys(e).forEach(k => grille.appendChild(tabChamp(k, e[k], v => { e[k] = v; compter(); })));
    corps.appendChild(grille);

    /* Ajouter un champ qui n'existe pas encore sur cette entrée */
    const nouveau = h('input', { type: 'text', placeholder: 'nom du champ', style: { maxWidth: '220px' } });
    corps.appendChild(h('div.row.wrap', { style: { marginTop: '12px' } },
      nouveau,
      h('button.btn.g.sm', {
        onclick: () => {
          const k = nouveau.value.trim();
          if (!k) return;
          if (k in e) { toast('Ce champ existe déjà.', 'no'); return; }
          e[k] = ''; vueFiche(i);
        }
      }, 'Ajouter ce champ')));
  };

  /* ---- Vue liste : le sommaire ----
     La case de recherche est construite une fois pour toutes : la
     reconstruire à chaque frappe ferait perdre le curseur. Seule la
     liste au-dessous est redessinée. */
  const vueListe = () => {
    clear(corps);
    const resultats = h('div.rz-comp');
    const recherche = h('input.tb-rech', {
      type: 'search', placeholder: 'Chercher dans la table…',
      oninput: () => remplir(recherche.value)
    });

    const remplir = (filtre) => {
      clear(resultats);
      const f = noAcc(filtre || '');
      let vus = 0, trop = false;
      copie.forEach((e, i) => {
        if (f && noAcc(JSON.stringify(e)).indexOf(f) < 0) return;
        if (++vus > 300) { trop = true; return; }
        resultats.appendChild(h('div.rz-l.tb-clic', { onclick: () => vueFiche(i) },
          h('span.n', tabTitre(e, i)),
          h('i', Object.keys(e).length + ' champs')));
      });
      if (!vus) resultats.appendChild(h('p.muted', { style: { margin: 0 } }, 'Rien ne correspond.'));
      else if (trop) resultats.appendChild(h('p.muted', { style: { margin: '6px 0 0' } },
        'Les 300 premières seulement — affine la recherche.'));
    };

    corps.appendChild(recherche);
    corps.appendChild(resultats);
    corps.appendChild(h('div.row.wrap', { style: { marginTop: '12px' } },
      h('button.btn.g.sm', {
        onclick: () => {
          /* La nouvelle entrée reprend les champs de la première : c'est la
             forme que le reste du site sait lire. */
          const modele = {};
          Object.keys(copie[0] || {}).forEach(k => {
            const v = copie[0][k];
            modele[k] = Array.isArray(v) ? [] : (typeof v === 'number' ? 0 : (typeof v === 'boolean' ? false : ''));
          });
          modele.nom = 'Nouvelle entrée';
          copie.push(modele); compter(); vueFiche(copie.length - 1);
        }
      }, '+ Ajouter une entrée')));
    remplir('');
  };

  const dessiner = () => { modeJson ? vueJson() : vueListe(); compter(); };
  dessiner();

  /* Les tables qui ne sont pas une liste de fiches (les règles, l'univers, la
     mise en page de la feuille) n'ont pas de forme régulière : il n'y a rien de
     mieux à leur proposer que leur JSON. Le bouton reste alors éteint. */
  const bascule = h('button.btn.g.sm', {
    onclick: () => {
      if (!modeJson) { modeJson = true; dessiner(); bascule.textContent = 'Revenir aux fiches'; return; }
      if (!tabEstListe(copie)) { toast('Cette table n’est pas une liste de fiches.', 'no'); return; }
      modeJson = false; dessiner(); bascule.textContent = 'Modifier le JSON';
    }
  }, modeJson ? 'Revenir aux fiches' : 'Modifier le JSON');
  if (modeJson && !tabEstListe(copie)) {
    bascule.disabled = true;
    bascule.textContent = 'Table sans fiches : JSON seulement';
  }

  const m = modal({
    wide: true,
    title: TABLE_NOM(nom) + ' — ' + nom + '.json',
    body: h('div', h('div.row.wrap', { style: { marginBottom: '10px' } },
      bascule, h('div.sp'),
      h('button.btn.g.sm', {
        onclick: () => confirmer('Repartir du dossier',
          'Remplacer ce que tu es en train de modifier par le contenu du fichier data/' + nom + '.json ?',
          () => LIVRE.duDossier(nom).then(o => { copie = o; dessiner(); toast('Contenu du dossier rechargé.', 'ok'); })
            .catch(e => toast(e.message, 'no')))
      }, 'Repartir du fichier du dossier')),
      corps, pied),
    actions: [
      { label: 'Annuler' },
      {
        label: 'Enregistrer dans la base', cls: '.p', keep: true, fn: function () {
          const bouton = m.el.querySelector('.mf .btn.p');
          cptOccupe(bouton, async () => {
            await LIVRE.envoyer(nom, copie);
            toast(TABLE_NOM(nom) + ' : enregistré dans la base.', 'ok');
            m.close();
            if (apres) apres();
          }, 'Envoi…');
        }
      }
    ]
  });
}


/* ============================================================
   LE PANNEAU DU TABLEAU DE BORD
   ============================================================ */

function cptTables() {
  const box = h('div.panel', { style: { marginBottom: '12px' } });
  const host = h('div');

  const dessine = () => {
    clear(box);
    const n = LIVRE.enBase().length;
    box.appendChild(h('div.panel-h', h('h3', 'Tables du livre'), h('div.sp'),
      h('span.chip' + (n ? '.a' : ''), n ? n + ' en ligne sur ' + TABLES.length : 'toutes au dossier')));
    box.appendChild(h('p.muted', { style: { marginTop: 0 } },
      'Le dossier ', h('code', 'data/'), ' reste la référence : c’est lui qui fait marcher le '
      + 'site, hors ligne compris. Une table envoyée dans la base passe devant lui — elle '
      + 'est alors lue en ligne par tout le monde, sans rien republier sur GitHub. La '
      + 'retirer de la base remet le fichier du dossier aux commandes.'));

    if (LIVRE.panne) box.appendChild(h('p.muted', { style: { marginTop: 0, color: 'var(--ink-3)' } },
      '⚠ ' + LIVRE.panne));

    box.appendChild(host);
    box.appendChild(h('div.row.wrap', { style: { marginTop: '12px' } },
      h('button.btn.g.sm', {
        onclick: e => cptOccupe(e.target, async () => {
          await LIVRE.appliquer(await LIVRE.manifester());
          toast('Relu depuis la base.', 'ok'); dessine();
        }, 'Lecture…')
      }, 'Relire la base'),
      h('div.sp'),
      h('button.btn.d.sm', {
        onclick: () => confirmer('Tout remettre au dossier',
          'Retirer de la base les ' + LIVRE.enBase().length + ' table(s) qui y sont ? Le site '
          + 'relira alors les fichiers du dossier data/. Tes corrections en ligne seront perdues.',
          () => cptOccupe(null, async () => {
            for (const nom of LIVRE.enBase()) await LIVRE.retirer(nom);
            toast('Tout est revenu au dossier.', 'ok'); dessine();
          }))
      }, 'Tout remettre au dossier')));
    liste();
  };

  const liste = () => {
    clear(host);
    const grille = h('div.rz-comp');
    TABLES.forEach(({ id, t }) => {
      const enBase = LIVRE.source(id) === 'base';
      const e = LIVRE.etat[id] || {};
      grille.appendChild(h('div.rz-l',
        h('span.n', t),
        h('span.chip' + (enBase ? '.a' : ''), enBase ? 'base' : 'dossier'),
        h('i', LIVRE.poids(id) + ' Ko' + (e.maj ? ' · ' + dateFr(e.maj) : '')),
        h('button.btn.g.xs', { onclick: () => tabEditeur(id, dessine) }, 'Modifier'),
        enBase
          ? h('button.btn.g.xs', {
            onclick: ev => confirmer('Remettre au dossier',
              'Retirer « ' + t + ' » de la base ? Le site relira data/' + id + '.json, et '
              + 'les corrections faites en ligne sur cette table seront perdues.',
              () => cptOccupe(ev.target, async () => {
                await LIVRE.retirer(id); toast(t + ' : revenu au dossier.', 'ok'); dessine();
              }, 'Retrait…'))
          }, 'Remettre au dossier')
          : h('button.btn.g.xs', {
            onclick: ev => cptOccupe(ev.target, async () => {
              await LIVRE.envoyer(id, await LIVRE.duDossier(id));
              toast(t + ' : envoyé dans la base.', 'ok'); dessine();
            }, 'Envoi…')
          }, 'Envoyer dans la base')));
    });
    host.appendChild(grille);
  };

  dessine();
  return box;
}

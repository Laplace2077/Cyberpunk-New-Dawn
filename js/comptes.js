/* ============================================================
   COMPTES

   Deux régimes, et le site choisit tout seul :

   • EN LIGNE — quand l'adresse de la base est renseignée (nuage.js).
     Les comptes sont de vrais comptes : le mot de passe est vérifié par
     le serveur, les personnages et les cartes vivent dans la base, et
     on les retrouve depuis n'importe quel téléphone. Ce qui est écrit
     reste aussi dans le navigateur, pour que le site continue de
     fonctionner quand le réseau tombe ; ce qui n'a pas pu partir est
     mis de côté et repart à la prochaine occasion.

   • LOCAL — dans le fichier hors-ligne, qui n'a pas d'adresse de base.
     Les comptes ne servent alors qu'à séparer les affaires de plusieurs
     personnes sur le même navigateur. C'est un rangement, pas une
     serrure, et la page le dit.
   ============================================================ */
'use strict';

const EN_LIGNE = (typeof NUAGE !== 'undefined') && NUAGE.dispo();

const dateFr = t => t ? new Date(t).toLocaleString('fr-FR',
  { dateStyle: 'short', timeStyle: 'short' }) : '—';

/* ============================================================
   1. COMPTES LOCAUX  (fichier hors-ligne, et repli)
   ============================================================ */

const CPT_CLE = 'cpnd.comptes.v1';

const CPT = {
  enLigne: false,
  mem: null,
  _lire() {
    if (this.mem) return this.mem;
    let brut = null;
    try { brut = localStorage.getItem(CPT_CLE); } catch (e) { }
    try { this.mem = brut ? JSON.parse(brut) : { profils: [], actif: null }; }
    catch (e) { this.mem = { profils: [], actif: null }; }
    if (!Array.isArray(this.mem.profils)) this.mem.profils = [];
    return this.mem;
  },
  _ecrire() {
    try { localStorage.setItem(CPT_CLE, JSON.stringify(this.mem)); return true; }
    catch (e) { toast("Impossible d’enregistrer les comptes dans ce navigateur.", 'no'); return false; }
  },
  tous() { return this._lire().profils; },
  parPseudo(p) { return this.tous().find(x => noAcc(x.pseudo) === noAcc(p)) || null; },
  parId(id) { return this.tous().find(x => x.id === id) || null; },
  actif() { const s = this._lire(); return s.actif ? this.parId(s.actif) : null; },
  estAdmin() { const a = this.actif(); return !!(a && a.role === 'admin'); },

  /** Empreinte du mot de passe : SHA-256 sur « sel + mot de passe », 60 000 fois. */
  async empreinte(mdp, sel) {
    const enc = new TextEncoder();
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.importKey) {
      const cle = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(sel), iterations: 60000, hash: 'SHA-256' }, cle, 256);
      return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0, t = sel + '|' + mdp;
    for (let i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) | 0; }
    return 'faible:' + (h >>> 0).toString(16);
  },

  async creer(pseudo, mdp) {
    pseudo = (pseudo || '').trim();
    if (pseudo.length < 2) throw new Error("L’identifiant fait au moins deux caractères.");
    if (this.parPseudo(pseudo)) throw new Error("Cet identifiant est déjà pris sur cet appareil.");
    if ((mdp || '').length < 4) throw new Error("Le mot de passe fait au moins quatre caractères.");
    const sel = uid() + uid();
    const p = {
      id: uid(), pseudo, sel, mdp: await this.empreinte(mdp, sel),
      role: this.tous().length ? 'joueur' : 'admin',   // le premier compte tient la maison
      cree: new Date().toISOString(), vu: new Date().toISOString(), journal: []
    };
    this._lire().profils.push(p);
    this._ecrire();
    this.connecter(p);
    return p;
  },

  async verifier(pseudo, mdp) {
    const p = this.parPseudo(pseudo);
    if (!p) throw new Error("Aucun compte sous cet identifiant sur cet appareil.");
    if (await this.empreinte(mdp, p.sel) !== p.mdp) throw new Error("Mot de passe incorrect.");
    return p;
  },
  async entrer(pseudo, mdp) { const p = await this.verifier(pseudo, mdp); this.connecter(p); return p; },

  connecter(p) {
    this._lire().actif = p.id;
    p.vu = new Date().toISOString();
    this._ecrire();
    STORE.changerProfil(p.id);
  },
  async sortir() {
    this._lire().actif = null;
    this._ecrire();
    STORE.changerProfil(null);
  },
  async changerMdp(ancien, nouveau) {
    const p = this.actif();
    await this.verifier(p.pseudo, ancien);
    if ((nouveau || '').length < 4) throw new Error("Le nouveau mot de passe fait au moins quatre caractères.");
    p.sel = uid() + uid();
    p.mdp = await this.empreinte(nouveau, p.sel);
    this._ecrire();
  },
  supprimer(id, avecDonnees) {
    const s = this._lire();
    s.profils = s.profils.filter(x => x.id !== id);
    if (s.actif === id) { s.actif = null; STORE.changerProfil(null); }
    if (avecDonnees) { try { localStorage.removeItem(STORE.KEY + ':' + id); } catch (e) { } }
    this._ecrire();
  },

  noter(action, quoi) {
    const p = this.actif();
    if (!p) return;
    p.journal = (p.journal || []).concat([{ t: Date.now(), a: action, q: quoi || '' }]).slice(-400);
    p.vu = new Date().toISOString();
    this._ecrire();
  },

  /** Ce que contient un tiroir, lu dans le navigateur. */
  contenu(id) {
    let brut = '', d = null;
    try { brut = localStorage.getItem(STORE.KEY + ':' + id) || ''; d = JSON.parse(brut || 'null'); } catch (e) { }
    const chars = (d && d.chars) || [], cartes = (d && d.cartes) || [];
    return {
      personnages: chars.length, cartes: cartes.length,
      noms: chars.map(c => c.nom || 'Sans nom'),
      nomsCartes: cartes.map(c => c.nom || 'Sans nom'),
      octets: brut.length
    };
  },

  /** L'admin local lit tout dans le navigateur : c'est immédiat. */
  async tableau() {
    return this.tous().map(p => Object.assign({
      id: p.id, pseudo: p.pseudo, role: p.role, cree: p.cree, vu: p.vu,
      journal: (p.journal || []).slice().reverse().slice(0, 6)
        .map(e => ({ a: e.a, q: e.q, t: e.t }))
    }, this.contenu(p.id)));
  }
};

/* ============================================================
   2. COMPTES EN LIGNE
   ============================================================ */

const CPTN = {
  enLigne: true,
  profil: null,        // { id, pseudo, role, cree, vu }
  RETARD: 'cpnd.nuage.retard',

  actif() { return this.profil; },
  estAdmin() { return !!(this.profil && this.profil.role === 'admin'); },

  /* ---------- Entrer, sortir ---------- */

  async creer(pseudo, mdp) {
    await NUAGE.inscrire(pseudo, mdp);
    await this.ouvrir(pseudo);
    return this.profil;
  },
  async entrer(pseudo, mdp) {
    await NUAGE.entrer(pseudo, mdp);
    await this.ouvrir(pseudo);
    return this.profil;
  },

  /** Après une connexion volontaire : on attend, la personne regarde. */
  async ouvrir(pseudoDeSecours) {
    if (!this.reprendreVite(pseudoDeSecours)) throw new Error("Session absente.");
    await this.rafraichir(true);
  },

  async sortir() {
    await NUAGE.sortir();
    this.profil = null;
    STORE.changerProfil(null);
  },

  /** Reprise immédiate, sans toucher au réseau : le site s'affiche tout de
      suite avec la copie gardée dans le navigateur. Le reste vient après. */
  reprendreVite(pseudoDeSecours) {
    if (!NUAGE.connecte()) return false;
    const u = NUAGE.moi();
    STORE.changerProfil(u.id);
    this.profil = NUAGE.session.profil || {
      id: u.id, role: 'joueur', cree: null, vu: null,
      pseudo: pseudoDeSecours || (u.meta && u.meta.pseudo) || String(u.email).split('@')[0]
    };
    if (pseudoDeSecours) this.profil.pseudo = this.profil.pseudo || pseudoDeSecours;
    return true;
  },

  /** En arrière-plan : on revérifie le profil, on rapatrie, on renvoie ce
      qui attendait. Si la base ne répond pas, le site continue sans elle. */
  async rafraichir(silencieux) {
    if (!NUAGE.connecte()) return;
    const empreinte = () => JSON.stringify([
      (STORE._read().chars || []).map(c => c.id + '|' + c.maj),
      (STORE._read().cartes || []).map(c => c.id + '|' + c.maj)]);
    const avant = empreinte();
    try {
      const p = (await NUAGE.lire('profils', 'select=*&id=eq.' + NUAGE.moi().id))[0];
      if (p) {
        this.profil = p;
        NUAGE.session.profil = p;
        NUAGE._garder(NUAGE.session);
      }
      NUAGE.rpc('vu').catch(() => { });
      await this.tirer();
      await this.rattraper();
    } catch (e) {
      if (/expir|session/i.test(e.message)) {
        NUAGE._garder(null); this.profil = null; STORE.changerProfil(null);
      }
      if (!silencieux) return;      // au démarrage, on ne crie pas : la copie locale suffit
      throw e;
    }
    /* Quelque chose a bougé, ou nous sommes justement sur la page du compte */
    if (!silencieux && typeof document !== 'undefined' && document.getElementById('view')
      && (avant !== empreinte() || PAGE === 'compte')) route();
  },

  async changerMdp(ancien, nouveau) {
    await NUAGE.entrer(this.profil.pseudo, ancien);   // on redemande l'ancien, par principe
    await NUAGE.changerMdp(nouveau);
  },

  /* ---------- Le va-et-vient ---------- */

  /** Descend de la base ce qui est à nous, et le range dans le navigateur. */
  async tirer() {
    const u = NUAGE.moi(); if (!u) return;
    const [ps, cs] = await Promise.all([
      NUAGE.lire('personnages', 'select=id,donnees,maj&proprio=eq.' + u.id),
      NUAGE.lire('cartes', 'select=id,donnees,maj&proprio=eq.' + u.id)
    ]);
    const s = STORE._read();
    const quand = v => { const n = Date.parse(v || 0); return isNaN(n) ? 0 : n; };
    const fondre = (locaux, distants, aPousser, table) => {
      const parId = {};
      locaux.forEach(x => { parId[x.id] = x; });
      distants.forEach(r => {
        const l = parId[r.id];
        /* Le plus récent gagne. À égalité ou sans date, le distant fait foi. */
        if (!l || quand(r.maj) >= quand(l.maj)) parId[r.id] = r.donnees;
      });
      const vus = {}; distants.forEach(r => { vus[r.id] = 1; });
      /* Ce qui a été créé hors connexion n'est pas encore là-haut : on l'envoie. */
      locaux.forEach(x => { if (!vus[x.id]) aPousser.push([table, x]); });
      return Object.values(parId);
    };
    const envois = [];
    s.chars = fondre(s.chars || [], ps, envois, 'personnages');
    s.cartes = fondre(s.cartes || [], cs, envois, 'cartes');
    if (s.current && !s.chars.some(c => c.id === s.current)) s.current = s.chars[0] ? s.chars[0].id : null;
    if (!s.current && s.chars[0]) s.current = s.chars[0].id;
    STORE._write();
    for (const [t, o] of envois) this.pousser(t, o);
  },

  _ligne(table, o) {
    return {
      id: o.id, proprio: NUAGE.moi().id, nom: o.nom || '',
      donnees: o, maj: o.maj || new Date().toISOString()
    };
  },

  /** Envoie un personnage ou une carte. Si ça échoue, on le met de côté. */
  async pousser(table, o) {
    if (!NUAGE.connecte()) return;
    try { await NUAGE.poser(table, this._ligne(table, o)); this._deRetard(table, o.id); }
    catch (e) { this._enRetard(table, o.id); this._plaindre(e); }
  },
  async oter(table, id) {
    if (!NUAGE.connecte()) return;
    try { await NUAGE.oter(table, 'id=eq.' + encodeURIComponent(id)); this._deRetard(table, id); }
    catch (e) { this._plaindre(e); }
  },

  /* ---------- Ce qui n'est pas parti ---------- */

  _retards() {
    try { return JSON.parse(localStorage.getItem(this.RETARD) || '[]'); } catch (e) { return []; }
  },
  _ecrireRetards(l) {
    try { localStorage.setItem(this.RETARD, JSON.stringify(l.slice(-200))); } catch (e) { }
  },
  _enRetard(table, id) {
    const l = this._retards();
    if (!l.some(x => x.t === table && x.i === id)) { l.push({ t: table, i: id }); this._ecrireRetards(l); }
  },
  _deRetard(table, id) {
    this._ecrireRetards(this._retards().filter(x => !(x.t === table && x.i === id)));
  },
  enRetard() { return this._retards().length; },

  /** Renvoie tout ce qui attendait. Renvoie le nombre de pièces reparties. */
  async rattraper() {
    if (!NUAGE.connecte()) return 0;
    const l = this._retards(); let n = 0;
    for (const x of l) {
      const o = x.t === 'personnages' ? STORE.get(x.i)
        : (typeof NETS !== 'undefined' ? NETS.get(x.i) : null);
      if (!o) { this._deRetard(x.t, x.i); continue; }
      try { await NUAGE.poser(x.t, this._ligne(x.t, o)); this._deRetard(x.t, x.i); n++; }
      catch (e) { break; }   // toujours fâché : on réessaiera plus tard
    }
    return n;
  },

  _plaignant: 0,
  _plaindre(e) {
    if (Date.now() - this._plaignant < 20000) return;   // une fois, pas dix
    this._plaignant = Date.now();
    toast("Enregistré ici, mais pas encore en ligne : " + e.message, 'no');
  },

  /* ---------- Journal ---------- */

  noter(action, quoi) {
    if (!NUAGE.connecte()) return;
    NUAGE.ajouter('journal', {
      proprio: NUAGE.moi().id, action, quoi: quoi || '', t: new Date().toISOString()
    }).catch(() => { });   // le journal n'est pas assez important pour déranger
  },

  /* ---------- Lectures ---------- */

  async contenu() {
    const u = NUAGE.moi(); if (!u) return { personnages: 0, cartes: 0, noms: [], nomsCartes: [], octets: 0 };
    const [ps, cs, j] = await Promise.all([
      NUAGE.lire('personnages', 'select=nom&proprio=eq.' + u.id),
      NUAGE.lire('cartes', 'select=nom&proprio=eq.' + u.id),
      NUAGE.lire('journal', 'select=action,quoi,t&proprio=eq.' + u.id + '&order=t.desc&limit=40')
    ]);
    return {
      personnages: ps.length, cartes: cs.length,
      noms: ps.map(x => x.nom || 'Sans nom'), nomsCartes: cs.map(x => x.nom || 'Sans nom'),
      journal: j.map(e => ({ a: e.action, q: e.quoi, t: e.t })), octets: 0
    };
  },

  /** Le tableau de l'admin : tout le monde, en quatre lectures.
      C'est la base qui décide de ce qu'on a le droit de voir. */
  async tableau() {
    const [profils, ps, cs, j] = await Promise.all([
      NUAGE.lire('profils', 'select=*&order=vu.desc'),
      NUAGE.lire('personnages', 'select=id,nom,proprio,maj'),
      NUAGE.lire('cartes', 'select=id,nom,proprio,maj'),
      NUAGE.lire('journal', 'select=proprio,action,quoi,t&order=t.desc&limit=400')
    ]);
    return profils.map(p => {
      const mp = ps.filter(x => x.proprio === p.id), mc = cs.filter(x => x.proprio === p.id);
      return {
        id: p.id, pseudo: p.pseudo, role: p.role, cree: p.cree, vu: p.vu,
        personnages: mp.length, cartes: mc.length,
        noms: mp.map(x => x.nom || 'Sans nom'), nomsCartes: mc.map(x => x.nom || 'Sans nom'),
        octets: 0,
        journal: j.filter(x => x.proprio === p.id).slice(0, 6)
          .map(e => ({ a: e.action, q: e.quoi, t: e.t }))
      };
    });
  },

  /* ---------- Gestes d'administration ---------- */

  async changerRole(id, role) { await NUAGE.majour('profils', 'id=eq.' + id, { role }); },
  async viderTiroir(id) {
    const q = 'proprio=eq.' + id;
    await NUAGE.oter('personnages', q);
    await NUAGE.oter('cartes', q);
    await NUAGE.oter('journal', q);
  },
  async exporter(id) {
    const [ps, cs] = await Promise.all([
      NUAGE.lire('personnages', 'select=donnees&proprio=eq.' + id),
      NUAGE.lire('cartes', 'select=donnees&proprio=eq.' + id)
    ]);
    return { app: 'cyberpunk-new-dawn', v: 1, date: new Date().toISOString(),
      chars: ps.map(x => x.donnees), cartes: cs.map(x => x.donnees) };
  }
};

/* Le régime en cours. Tout le reste du fichier parle à celui-là. */
const COMPTES = EN_LIGNE ? CPTN : CPT;

/* ============================================================
   3. LES ENREGISTREMENTS PASSENT PAR LÀ
   ============================================================ */

(function () {
  const saveOrig = STORE.save, removeOrig = STORE.remove;
  STORE.save = function (ch) {
    const neuf = !this.get(ch.id);
    const r = saveOrig.call(this, ch);
    COMPTES.noter(neuf ? 'personnage-créé' : 'personnage-modifié', ch.nom || 'Sans nom');
    if (COMPTES.pousser) COMPTES.pousser('personnages', ch);
    return r;
  };
  STORE.remove = function (id) {
    const c = this.get(id);
    removeOrig.call(this, id);
    COMPTES.noter('personnage-supprimé', (c && c.nom) || '');
    if (COMPTES.oter) COMPTES.oter('personnages', id);
  };
  if (typeof NETS !== 'undefined') {
    const cSave = NETS.save, cDel = NETS.remove;
    NETS.save = function (c) {
      const neuf = !this.get(c.id);
      const r = cSave.call(this, c);
      COMPTES.noter(neuf ? 'carte-créée' : 'carte-modifiée', c.nom || 'Sans nom');
      if (COMPTES.pousser) COMPTES.pousser('cartes', c);
      return r;
    };
    NETS.remove = function (id) {
      const c = this.get(id);
      cDel.call(this, id);
      COMPTES.noter('carte-supprimée', (c && c.nom) || '');
      if (COMPTES.oter) COMPTES.oter('cartes', id);
    };
  }
})();

/* Au chargement : on se replace dans le bon tiroir tout de suite, sans
   attendre le réseau, puis on va voir en ligne ce qui a changé. */
const COMPTES_PRETS = (function () {
  if (!EN_LIGNE) {
    const a = CPT.actif(); if (a) STORE.changerProfil(a.id);
    return Promise.resolve();
  }
  CPTN.reprendreVite();
  return CPTN.rafraichir().catch(() => { });
})();

/* ============================================================
   4. LA PAGE
   ============================================================ */

function cptFormulaire(titre, boutons, champs, aide) {
  const vals = {};
  const box = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', titre)));
  if (aide) box.appendChild(h('p.muted', { style: { marginTop: 0 } }, aide));
  const grille = h('div.net-form');
  champs.forEach(c => {
    vals[c.k] = c.v || '';
    grille.appendChild(h('label.net-ch', h('span', c.t),
      h('input', {
        type: c.type || 'text', value: vals[c.k], autocomplete: c.auto || 'off',
        oninput: e => { vals[c.k] = e.target.value; },
        onkeydown: e => { if (e.key === 'Enter' && boutons[0]) boutons[0].fn(vals, e.target); }
      })));
  });
  box.appendChild(grille);
  box.appendChild(h('div.row.wrap', { style: { marginTop: '12px' } },
    ...boutons.map(b => h('button.btn' + (b.cls || '.g'),
      { onclick: e => b.fn(vals, e.target) }, b.t))));
  return box;
}

/** Empêche le double-clic pendant qu'on attend le serveur. */
async function cptOccupe(bouton, travail, libelle) {
  const avant = bouton ? bouton.textContent : '';
  if (bouton) { bouton.disabled = true; bouton.textContent = libelle || 'Un instant…'; }
  try { await travail(); }
  catch (e) { toast(e.message, 'no'); }
  finally { if (bouton && bouton.isConnected) { bouton.disabled = false; bouton.textContent = avant; } }
}

VIEWS.compte = function () {
  const wrap = h('div.view-inner');
  const moi = COMPTES.actif();
  if (!moi) cptDeconnecte(wrap); else cptConnecte(wrap, moi);
  return wrap;
};

/* ---------- Déconnecté ---------- */

function cptDeconnecte(wrap) {
  wrap.appendChild(sectionTitle(EN_LIGNE ? 'Ton compte' : 'Sur cet appareil', 'Compte',
    EN_LIGNE
      ? "Un compte garde tes personnages et tes cartes en ligne : tu les retrouves "
      + "sur n’importe quel téléphone, et personne d’autre ne les voit. Sans compte, "
      + "le site marche aussi — mais tout reste dans ce navigateur-là."
      : "Un compte sert à ranger tes personnages et tes cartes à part, quand plusieurs "
      + "personnes se servent du même navigateur. Sans compte, tout marche aussi — "
      + "les données sont simplement rangées en commun."));

  wrap.appendChild(cptFormulaire('Se connecter',
    [{
      t: 'Se connecter', cls: '.p', fn: (v, b) => cptOccupe(b, async () => {
        const p = await COMPTES.entrer(v.pseudo, v.mdp);
        toast('Bonjour ' + p.pseudo + '.', 'ok'); route();
      }, 'Connexion…')
    }],
    [{ k: 'pseudo', t: 'Identifiant', auto: 'username' },
    { k: 'mdp', t: 'Mot de passe', type: 'password', auto: 'current-password' }]));

  wrap.appendChild(cptFormulaire('Créer un compte',
    [{
      t: 'Créer le compte', cls: '.p', fn: (v, b) => cptOccupe(b, async () => {
        const p = await COMPTES.creer(v.pseudo, v.mdp);
        toast(p.role === 'admin' ? 'Compte créé — tu es administratrice.' : 'Compte créé.', 'ok');
        route();
      }, 'Création…')
    }],
    [{ k: 'pseudo', t: 'Identifiant', auto: 'username' },
    { k: 'mdp', t: 'Mot de passe', type: 'password', auto: 'new-password' }],
    EN_LIGNE
      ? "Pas d’adresse électronique à donner : un identifiant, un mot de passe de six "
      + "caractères au moins, et c’est tout. Prends-en un que tu n’utilises nulle part ailleurs."
      : "Choisis un mot de passe que tu n’utilises nulle part ailleurs : il ne protège "
      + "que ce tiroir, sur cet appareil. Le premier compte créé devient administrateur."));

  if (!EN_LIGNE && CPT.tous().length) {
    wrap.appendChild(h('div.panel', { style: { marginBottom: '12px' } },
      h('div.panel-h', h('h3', 'Comptes sur cet appareil')),
      h('div.row.wrap', ...CPT.tous().map(p =>
        h('span.chip', p.pseudo + (p.role === 'admin' ? ' · admin' : ''))))));
  }
  wrap.appendChild(cptAvertissement());
}

/* ---------- Connecté ---------- */

function cptConnecte(wrap, moi) {
  wrap.appendChild(sectionTitle(moi.role === 'admin' ? 'Administrateur' : 'Compte', moi.pseudo,
    'Compte créé le ' + dateFr(moi.cree) + (EN_LIGNE ? ' · enregistré en ligne' : ' · sur cet appareil') + '.'));

  /* Tes affaires — rempli dès qu'on a la réponse */
  const chiffres = h('div.rz-grid.cpt-chiffres', h('p.muted', { style: { margin: 0 } }, 'Lecture…'));
  wrap.appendChild(h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Tes affaires'), h('div.sp'),
      h('button.btn.g.sm', {
        onclick: e => cptOccupe(e.target, async () => {
          await COMPTES.sortir(); toast('Déconnectée.', 'ok'); route();
        }, 'Sortie…')
      }, 'Se déconnecter')),
    chiffres));

  const jbox = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Ton journal')),
    h('p.muted', { style: { margin: 0 } }, 'Lecture…'));

  Promise.resolve(COMPTES.contenu(moi.id)).then(c => {
    clear(chiffres);
    [tuile('Personnages', c.personnages), tuile('Cartes du Net', c.cartes),
    EN_LIGNE
      ? tuile('Sauvegarde', CPTN.enRetard() ? CPTN.enRetard() + ' en attente' : 'à jour', 'en ligne')
      : tuile('Place utilisée', Math.round(c.octets / 1024) + ' Ko'),
    tuile('Actions', (c.journal || (moi.journal || [])).length)]
      .forEach(t => chiffres.appendChild(t));
    const j = c.journal || (moi.journal || []).slice().reverse()
      .map(e => ({ a: e.a, q: e.q, t: e.t }));
    clear(jbox).appendChild(h('div.panel-h', h('h3', 'Ton journal')));
    if (!j.length) jbox.appendChild(h('p.muted', { style: { margin: 0 } }, 'Rien d’enregistré pour l’instant.'));
    else {
      const host = h('div.rz-comp');
      j.slice(0, 40).forEach(e => host.appendChild(h('div.rz-l',
        h('span.n', String(e.a).replace(/-/g, ' ') + (e.q ? ' — ' + e.q : '')),
        h('i', dateFr(e.t)))));
      jbox.appendChild(host);
    }
  }).catch(e => {
    clear(chiffres).appendChild(h('p.muted', { style: { margin: 0 } }, e.message));
    clear(jbox).appendChild(h('div.panel-h', h('h3', 'Ton journal')));
    jbox.appendChild(h('p.muted', { style: { margin: 0 } }, 'Journal illisible : ' + e.message));
  });

  /* Ce qui n'est pas encore parti en ligne */
  if (EN_LIGNE && CPTN.enRetard()) wrap.appendChild(cptRetard());

  wrap.appendChild(cptFormulaire('Changer de mot de passe',
    [{
      t: 'Changer', fn: (v, b) => cptOccupe(b, async () => {
        await COMPTES.changerMdp(v.ancien, v.nouveau);
        toast('Mot de passe changé.', 'ok'); route();
      }, 'Changement…')
    }],
    [{ k: 'ancien', t: 'Mot de passe actuel', type: 'password', auto: 'current-password' },
    { k: 'nouveau', t: 'Nouveau mot de passe', type: 'password', auto: 'new-password' }]));

  wrap.appendChild(jbox);

  if (moi.role === 'admin') wrap.appendChild(cptAdmin());
  wrap.appendChild(cptQuitter(moi));
  wrap.appendChild(cptAvertissement());
}

function cptRetard() {
  const box = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'En attente d’envoi')));
  box.appendChild(h('p.muted', { style: { marginTop: 0 } },
    CPTN.enRetard() + " enregistrement(s) n’ont pas pu partir en ligne — ils sont "
    + "bien dans ce navigateur, et repartiront tout seuls à la prochaine connexion."));
  box.appendChild(h('div.row.wrap',
    h('button.btn.g', {
      onclick: e => cptOccupe(e.target, async () => {
        const n = await CPTN.rattraper();
        toast(n ? n + ' envoyé(s).' : "Toujours pas de réponse de la base.", n ? 'ok' : 'no');
        route();
      }, 'Envoi…')
    }, 'Envoyer maintenant')));
  return box;
}

function cptQuitter(moi) {
  const box = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', EN_LIGNE ? 'Effacer tes affaires' : 'Supprimer ce compte')));
  if (EN_LIGNE) {
    box.appendChild(h('p.muted', { style: { marginTop: 0 } },
      "Efface tous tes personnages, tes cartes et ton journal, ici comme en ligne. "
      + "Le compte lui-même reste : pour le faire disparaître tout à fait, il faut passer "
      + "par le tableau de bord Supabase (Authentication → Users)."));
    box.appendChild(h('div.row.wrap', h('button.btn.d', {
      onclick: () => confirmer('Tout effacer',
        "Effacer tous tes personnages et toutes tes cartes, en ligne comme ici ? C’est définitif.",
        () => cptOccupe(null, async () => {
          await CPTN.viderTiroir(moi.id);
          const s = STORE._read(); s.chars = []; s.cartes = []; s.current = null; STORE._write();
          toast('Tout est effacé.', 'ok'); route();
        }))
    }, 'Effacer toutes mes données')));
  } else {
    box.appendChild(h('p.muted', { style: { marginTop: 0 } },
      "Le compte disparaît de cet appareil. Tu choisis si ses personnages et ses cartes partent avec."));
    box.appendChild(h('div.row.wrap',
      h('button.btn.d', {
        onclick: () => confirmer('Supprimer', 'Supprimer le compte et garder ses données dans le tiroir commun ?',
          () => { CPT.supprimer(moi.id, false); toast('Compte supprimé.', 'ok'); route(); })
      }, 'Supprimer le compte'),
      h('button.btn.d', {
        onclick: () => confirmer('Tout supprimer', 'Supprimer le compte ET tous ses personnages et cartes ? C’est définitif.',
          () => { CPT.supprimer(moi.id, true); toast('Compte et données supprimés.', 'ok'); route(); })
      }, 'Supprimer le compte et ses données')));
  }
  return box;
}

/* ---------- Le tableau de bord ---------- */

function cptAdmin() {
  const box = h('div.panel', { style: { marginBottom: '12px' } },
    h('div.panel-h', h('h3', 'Tableau de bord')));
  const tri = { par: 'vu' };
  const host = h('div', h('p.muted', { style: { margin: 0 } }, 'Lecture…'));
  let profils = [];

  const dessine = () => {
    clear(host);
    if (!profils.length) {
      host.appendChild(h('p.muted', { style: { margin: 0 } }, 'Aucun compte pour l’instant.'));
      return;
    }
    profils.slice().sort((a, b) =>
      tri.par === 'pseudo' ? String(a.pseudo).localeCompare(String(b.pseudo))
        : tri.par === 'personnages' ? b.personnages - a.personnages
          : tri.par === 'cartes' ? b.cartes - a.cartes
            : String(b.vu || '').localeCompare(String(a.vu || '')))
      .forEach(x => host.appendChild(cptFiche(x, recharger)));
  };

  const recharger = () => Promise.resolve(COMPTES.tableau()).then(l => { profils = l; dessine(); })
    .catch(e => { clear(host).appendChild(h('p.muted', { style: { margin: 0 } }, 'Lecture impossible : ' + e.message)); });

  const boutonsTri = [['vu', 'Dernière visite'], ['pseudo', 'Identifiant'],
  ['personnages', 'Personnages'], ['cartes', 'Cartes']]
    .map(([k, t]) => h('button.btn.g.xs' + (tri.par === k ? '.on' : ''),
      { 'data-tri': k, onclick: () => { tri.par = k; marquer(); dessine(); } }, t));
  const marquer = () => boutonsTri.forEach(b =>
    b.classList.toggle('on', b.getAttribute('data-tri') === tri.par));

  box.appendChild(h('div.row.wrap.cpt-tri', { style: { marginBottom: '10px' } },
    h('span.muted', { style: { fontSize: '13px' } }, 'Trier par :'), ...boutonsTri,
    h('div.sp'),
    h('button.btn.g.xs', { onclick: e => cptOccupe(e.target, recharger, '…') }, 'Rafraîchir')));
  box.appendChild(host);
  recharger();

  /* Le tiroir commun : ce qu'ont laissé les visiteurs sans compte, ici. */
  if (!EN_LIGNE) {
    let commun = null;
    try { commun = JSON.parse(localStorage.getItem(STORE.KEY) || 'null'); } catch (e) { }
    if (commun && ((commun.chars || []).length || (commun.cartes || []).length)) {
      box.appendChild(h('div.uv-fiche',
        h('h3', 'Sans compte — tiroir commun'),
        h('div.ct', h('p', { style: { margin: 0 } },
          (commun.chars || []).length + ' personnage(s), ' + (commun.cartes || []).length + ' carte(s) : '
          + (commun.chars || []).map(c => c.nom || 'Sans nom').join(', ')))));
    }
  }
  return box;
}

function cptFiche(x, recharger) {
  const moi = COMPTES.actif();
  const soi = moi && x.id === moi.id;
  const telecharger = (nom, objet) => {
    const b = new Blob([JSON.stringify(objet, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(b), download: nom });
    document.body.appendChild(a); a.click(); a.remove();
  };

  const actions = h('div.row.wrap', { style: { marginTop: '10px' } },
    h('button.btn.g.sm', {
      onclick: e => cptOccupe(e.target, async () => {
        const d = EN_LIGNE ? await CPTN.exporter(x.id)
          : JSON.parse(localStorage.getItem(STORE.KEY + ':' + x.id) || '{}');
        telecharger(String(x.pseudo).replace(/[^\w\-]+/g, '_') + '.json', d);
      }, 'Export…')
    }, 'Exporter ses données'));

  if (EN_LIGNE && !soi) {
    actions.appendChild(h('button.btn.g.sm', {
      onclick: e => cptOccupe(e.target, async () => {
        await CPTN.changerRole(x.id, x.role === 'admin' ? 'joueur' : 'admin');
        toast(x.pseudo + (x.role === 'admin' ? ' redevient joueur.' : ' passe administrateur.'), 'ok');
        await recharger();
      }, '…')
    }, x.role === 'admin' ? 'Retirer l’administration' : 'Faire administrateur'));
    actions.appendChild(h('button.btn.d.sm', {
      onclick: () => confirmer('Effacer',
        `Effacer tous les personnages et toutes les cartes de « ${x.pseudo} » ? C’est définitif. Le compte, lui, reste.`,
        () => cptOccupe(null, async () => {
          await CPTN.viderTiroir(x.id); toast('Données effacées.', 'ok'); await recharger();
        }))
    }, 'Effacer ses données'));
  }
  if (!EN_LIGNE && x.role !== 'admin') {
    actions.appendChild(h('button.btn.d.sm', {
      onclick: () => confirmer('Supprimer', `Supprimer le compte « ${x.pseudo} » et ses données ?`,
        () => { CPT.supprimer(x.id, true); toast('Compte supprimé.', 'ok'); route(); })
    }, 'Supprimer'));
  }

  return h('div.uv-fiche',
    h('h3', x.pseudo + (x.role === 'admin' ? ' — administrateur' : '')),
    h('div.ct',
      h('div.ident',
        h('span', h('b', 'Créé : '), dateFr(x.cree)),
        h('span', h('b', 'Vu : '), dateFr(x.vu)),
        h('span', h('b', 'Personnages : '), String(x.personnages)),
        h('span', h('b', 'Cartes : '), String(x.cartes)),
        x.octets ? h('span', h('b', 'Place : '), Math.round(x.octets / 1024) + ' Ko') : null),
      x.noms.length ? h('p', { style: { margin: '0 0 6px' } },
        h('b', 'Personnages : '), x.noms.join(', ')) : null,
      x.nomsCartes.length ? h('p', { style: { margin: '0 0 6px' } },
        h('b', 'Cartes : '), x.nomsCartes.join(', ')) : null,
      (x.journal || []).length
        ? h('div.rz-comp', ...x.journal.map(e => h('div.rz-l',
          h('span.n', String(e.a).replace(/-/g, ' ') + (e.q ? ' — ' + e.q : '')),
          h('i', dateFr(e.t)))))
        : h('p.muted', { style: { margin: 0 } }, 'Aucune activité.'),
      actions));
}

/* ---------- Ce qu'il faut savoir ---------- */

function cptAvertissement() {
  const bloc = h('details.entry.apropos', { style: { marginTop: '12px' } },
    h('summary', 'Ce que ces comptes font, et ne font pas'));
  const ct = h('div.ct.prose', { style: { maxWidth: 'none' } });
  bloc.appendChild(ct);

  if (EN_LIGNE) {
    ct.appendChild(h('p', h('b', 'Les données suivent.'), " Tes personnages et tes cartes sont "
      + "enregistrés dans une base en ligne : tu les retrouves sur ton téléphone, sur un autre "
      + "ordinateur, chez quelqu’un d’autre. Le navigateur en garde une copie, pour que le site "
      + "continue de marcher quand le réseau est mauvais."));
    ct.appendChild(h('p', h('b', 'Le mot de passe est vérifié par le serveur'), " et n’est jamais "
      + "enregistré en clair. Il te faut six caractères au moins. Prends-en un que tu n’utilises "
      + "nulle part ailleurs : ce site est une aide de jeu, pas une banque."));
    ct.appendChild(h('p', h('b', 'Personne ne lit chez toi.'), " Ce n’est pas le site qui le décide, "
      + "c’est la base : elle refuse de montrer une ligne à qui n’en est pas le propriétaire. "
      + "Seul le compte administrateur voit l’ensemble."));
    ct.appendChild(h('p', h('b', 'Pas d’adresse électronique demandée.'), " Le site en fabrique une, "
      + "invisible, à partir de l’identifiant, parce que la base en réclame une. Aucun courrier "
      + "n’est jamais envoyé — ce qui veut dire aussi qu’un mot de passe oublié ne peut pas être "
      + "renvoyé : c’est l’administrateur qui dépanne."));
    ct.appendChild(h('p', { style: { marginBottom: 0 } }, h('b', 'Le projet peut s’endormir.'),
      " Une base gratuite se met en veille après une semaine sans la moindre visite. Elle se "
      + "réveille d’un clic depuis le tableau de bord Supabase. D’ici là, le site marche quand "
      + "même : il se sert de la copie gardée dans le navigateur."));
  } else {
    ct.appendChild(h('p', h('b', 'Ils rangent, ils ne protègent pas.'), " Ce fichier n’a pas de "
      + "serveur : tout est enregistré dans le navigateur. Un compte sépare tes affaires de celles "
      + "des autres personnes qui se servent du même appareil, et c’est tout."));
    ct.appendChild(h('p', h('b', 'Le mot de passe n’est pas stocké en clair'), " — on n’en garde "
      + "qu’une empreinte salée, calculée soixante mille fois. Mais quelqu’un qui a la main sur le "
      + "navigateur peut ouvrir le tiroir sans passer par la page de connexion."));
    ct.appendChild(h('p', { style: { marginBottom: 0 } }, h('b', 'Exporte.'), " C’est la seule vraie "
      + "sauvegarde : un effacement des données de navigation emporte comptes et personnages."));
  }
  return bloc;
}

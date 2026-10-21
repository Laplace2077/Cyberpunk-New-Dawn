/* ============================================================
   LE NUAGE
   Le lien avec la base en ligne (Supabase). Écrit à la main, en fetch
   pur : pas de bibliothèque à aller chercher sur un serveur tiers, donc
   le site reste un dossier de fichiers qu'on dépose et qui marche.

   Deux clés vivent ici en clair, et c'est voulu : l'adresse du projet et
   la clé « publishable ». Ce ne sont pas des secrets — ce sont les règles
   d'accès inscrites dans la base elle-même qui protègent les données.
   Avec ces deux clés seules, on ne peut rien lire du tout.
   ============================================================ */
'use strict';

const NUAGE = {
  URL: 'https://mbeaspaprqifdnclhlty.supabase.co',
  CLE: 'sb_publishable_VTLE9334mZ-sFZyeLC_3nA_N868DuEQ',
  /** Domaine de façade : Supabase réclame une adresse, les joueurs n'en
      donnent pas. On en fabrique une à partir de l'identifiant. Aucun
      courrier n'est jamais envoyé. */
  DOM: '@joueurs.new-dawn.fr',
  SES: 'cpnd.nuage.v1',

  session: null,
  panne: null,          // dernier échec réseau, pour l'expliquer sans mentir

  /* ---------- État ---------- */

  /** Le nuage est-il utilisable ici ? Le fichier hors-ligne, lui, n'a ni
      adresse ni clé : il retombe alors sur les comptes locaux. */
  dispo() {
    return !!(this.URL && this.CLE && typeof fetch === 'function'
      && this.URL.indexOf('http') === 0);
  },
  connecte() { return !!(this.session && this.session.user && this.session.access_token); },
  moi() { return this.connecte() ? this.session.user : null; },

  adresse(pseudo) {
    const n = noAcc(pseudo).replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return n + this.DOM;
  },

  /* ---------- Session gardée d'une visite à l'autre ---------- */

  _charger() {
    try { this.session = JSON.parse(localStorage.getItem(this.SES) || 'null'); }
    catch (e) { this.session = null; }
    return this.session;
  },
  _garder(s) {
    this.session = s;
    try {
      if (s) localStorage.setItem(this.SES, JSON.stringify(s));
      else localStorage.removeItem(this.SES);
    } catch (e) { }
  },
  _poserSession(r) {
    if (!r || !r.access_token) return null;
    const s = {
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      expire: Math.floor(Date.now() / 1000) + (r.expires_in || 3600),
      user: { id: r.user.id, email: r.user.email, meta: r.user.user_metadata || {} }
    };
    this._garder(s);
    return s;
  },

  /* ---------- L'appel ---------- */

  entetes(json) {
    const e = { apikey: this.CLE };
    e.Authorization = 'Bearer ' + (this.connecte() ? this.session.access_token : this.CLE);
    if (json) e['Content-Type'] = 'application/json';
    return e;
  },

  /** Traduit ce que renvoie Supabase en français, sans inventer. */
  _ennui(r, corps) {
    const m = String((corps && (corps.msg || corps.message || corps.error_description
      || corps.error || corps.hint)) || '');
    if (/already registered|already been registered|duplicate key/i.test(m))
      return "Cet identifiant est déjà pris.";
    if (/invalid login credentials/i.test(m))
      return "Identifiant ou mot de passe incorrect.";
    if (/password should be at least (\d+)/i.test(m))
      return "Le mot de passe fait au moins " + m.match(/at least (\d+)/i)[1] + " caractères.";
    if (/email.*invalid|invalid.*email/i.test(m))
      return "Cet identifiant ne passe pas : utilise des lettres, des chiffres, un tiret ou un point.";
    if (/signups? not allowed|disabled/i.test(m))
      return "Les inscriptions sont fermées sur la base.";
    if (/email.*not confirmed|confirm/i.test(m))
      return "La base attend une confirmation par courriel. Dans Supabase : "
        + "Authentication → Sign In / Providers → Email → décocher « Confirm email ».";
    if (/jwt|token/i.test(m) && r && r.status === 401)
      return "La session a expiré. Reconnecte-toi.";
    if (/permission denied|violates row-level/i.test(m))
      return "La base refuse cette opération : ce n’est pas ton tiroir.";
    if (/relation .* does not exist/i.test(m))
      return "Les tables ne sont pas créées. Relance le script SQL dans Supabase.";
    return m || ('La base a répondu ' + (r ? r.status : '?') + '.');
  },

  async appel(chemin, opts) {
    opts = opts || {};
    if (!this.dispo()) throw new Error("La base en ligne n’est pas configurée ici.");
    /* Jeton bientôt périmé : on le renouvelle avant de s'en servir. */
    if (this.connecte() && !opts.brut
      && this.session.expire - 60 < Math.floor(Date.now() / 1000)) {
      await this.renouveler();
    }
    let r;
    try {
      r = await fetch(this.URL + chemin, {
        method: opts.methode || 'GET',
        headers: Object.assign(this.entetes(!!opts.corps), opts.entetes || {}),
        body: opts.corps ? JSON.stringify(opts.corps) : undefined
      });
    } catch (e) {
      this.panne = "Pas de réponse de la base : connexion coupée, ou le projet Supabase "
        + "est en veille (un projet gratuit s’endort après une semaine sans visite ; "
        + "il se réveille depuis le tableau de bord).";
      throw new Error(this.panne);
    }
    this.panne = null;
    const txt = await r.text();
    let corps = null;
    try { corps = txt ? JSON.parse(txt) : null; } catch (e) { corps = { message: txt }; }
    if (!r.ok) throw new Error(this._ennui(r, corps));
    return corps;
  },

  /* ---------- Comptes ---------- */

  async renouveler() {
    const s = this.session;
    if (!s || !s.refresh_token) throw new Error("Session perdue.");
    const r = await fetch(this.URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: this.CLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { this._garder(null); throw new Error("La session a expiré. Reconnecte-toi."); }
    return this._poserSession(await r.json());
  },

  async inscrire(pseudo, mdp) {
    pseudo = (pseudo || '').trim();
    if (pseudo.length < 2) throw new Error("L’identifiant fait au moins deux caractères.");
    if (!/^[A-Za-zÀ-ÿ0-9 ._-]+$/.test(pseudo))
      throw new Error("L’identifiant n’accepte que lettres, chiffres, espace, point, tiret.");
    if ((mdp || '').length < 6) throw new Error("Le mot de passe fait au moins six caractères.");
    const r = await this.appel('/auth/v1/signup', {
      methode: 'POST', brut: 1,
      corps: { email: this.adresse(pseudo), password: mdp, data: { pseudo } }
    });
    /* Pas de jeton en retour : la confirmation par courriel est restée active. */
    if (!r || !r.access_token) {
      throw new Error("Le compte est créé mais la base attend une confirmation par courriel, "
        + "qui n’arrivera jamais. Dans Supabase : Authentication → Sign In / Providers → "
        + "Email → décocher « Confirm email », puis réessaie.");
    }
    return this._poserSession(r);
  },

  async entrer(pseudo, mdp) {
    const r = await this.appel('/auth/v1/token?grant_type=password', {
      methode: 'POST', brut: 1,
      corps: { email: this.adresse(pseudo), password: mdp }
    });
    return this._poserSession(r);
  },

  async sortir() {
    try { await this.appel('/auth/v1/logout', { methode: 'POST', corps: {} }); } catch (e) { }
    this._garder(null);
  },

  async changerMdp(nouveau) {
    if ((nouveau || '').length < 6) throw new Error("Le mot de passe fait au moins six caractères.");
    await this.appel('/auth/v1/user', { methode: 'PUT', corps: { password: nouveau } });
  },

  /* ---------- Tables ---------- */

  lire(table, requete) {
    return this.appel('/rest/v1/' + table + (requete ? '?' + requete : ''));
  },
  /** Écrit ou remplace, selon la clé primaire. */
  poser(table, lignes) {
    return this.appel('/rest/v1/' + table, {
      methode: 'POST', corps: Array.isArray(lignes) ? lignes : [lignes],
      entetes: { Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
  },
  /** Ajoute sans rien remplacer (le journal, qui n'a pas de doublon possible). */
  ajouter(table, lignes) {
    return this.appel('/rest/v1/' + table, {
      methode: 'POST', corps: Array.isArray(lignes) ? lignes : [lignes],
      entetes: { Prefer: 'return=minimal' }
    });
  },
  /** Ne touche qu'aux colonnes données, sur les lignes désignées. */
  majour(table, requete, champs) {
    return this.appel('/rest/v1/' + table + '?' + requete, {
      methode: 'PATCH', corps: champs, entetes: { Prefer: 'return=minimal' }
    });
  },
  oter(table, requete) {
    return this.appel('/rest/v1/' + table + '?' + requete, {
      methode: 'DELETE', entetes: { Prefer: 'return=minimal' }
    });
  },
  rpc(nom, args) {
    return this.appel('/rest/v1/rpc/' + nom, { methode: 'POST', corps: args || {} });
  }
};

NUAGE._charger();

# Cyberpunk : New Dawn — création de personnage

Le livre *Cyberpunk : New Dawn* en version utilisable : la création de personnage
(questionnaire, création guidée en neuf étapes, tirage complet au hasard), la feuille
remplissable et imprimable avec sa progression, l'univers de Cyberpunk 2020 de 1990 à
2020, et l'intégralité des tables consultables — y compris le *Livre du Net*.

Tout fonctionne dans le navigateur, sans compte et sans serveur. Les personnages sont
enregistrés dans le navigateur de la personne qui joue ; rien n'est envoyé nulle part.

---

## Mettre le site en ligne sur GitHub Pages

1. Créer un dépôt sur GitHub et y déposer le contenu de ce dossier (le fichier
   `index.html` doit se trouver à la racine du dépôt, pas dans un sous-dossier).
2. Dans le dépôt : **Settings → Pages**.
3. *Source* : « Deploy from a branch ». *Branch* : `main`, dossier `/ (root)`. Enregistrer.
4. Au bout d'une minute, le site est à l'adresse
   `https://<ton-compte>.github.io/<nom-du-depot>/`.

Le fichier `.nojekyll` à la racine sert à ça : il dit à GitHub de servir les fichiers
tels quels, sans passer par son moteur de blog.

---

## Ce qu'il y a dans le dossier

```
index.html            Accueil : personnages enregistrés, les quatre entrées, sources
personnage.html       Création : questionnaire, création assistée, tirage au hasard
fiche.html            Feuille remplissable et imprimable, et progression
univers.html          Chronologie, monde en 2020, villes, puissances, figures
codex.html            Toutes les tables des livres

questionnaire.html, creation.html, aleatoire.html et progression.html sont conservés :
ce sont de simples redirections vers les onglets correspondants, pour que les anciens
favoris continuent de fonctionner.

css/style.css         Toute la mise en forme du site
js/                   Le code, découpé par domaine
data/                 Les tables des livres, en JSON
assets/               Les images du site (illustration d'accueil, feuille scannée, ornements)
hors-ligne/           Le site en un seul fichier, pour jouer sans connexion
build/                Le script qui refabrique ce fichier unique
```

### Le dossier `js/`

| Fichier | Ce qu'il contient |
|---|---|
| `core.js` | Le socle : règles du jeu, stockage, routeur, briques d'affichage |
| `quiz.js` | Le questionnaire et les dix archétypes |
| `creation.js` | Les neuf étapes de création et la boutique |
| `sheet.js` | L'onglet Progression |
| `feuille.js` | La feuille de personnage interactive |
| `random.js` | Le générateur de personnage aléatoire |
| `codex.js` | Le codex et ses catalogues |
| `univers.js` | L'univers : chronologie, monde, villes, puissances, figures |
| `accueil.js` | La page d'accueil |
| `app.js` | Le démarrage : ossature commune, chargement des données |

Les fichiers sont chargés dans cet ordre par chaque page ; `core.js` doit venir en
premier et `app.js` en dernier.

### Le dossier `data/`

Une table du livre par fichier : `skills.json`, `weapons.json`, `armor.json`,
`cyberware.json`, `advantages.json`, `defects.json`, `lifepath.json`, `crimes.json`,
`equipment.json`, `ammo.json`, `weapon_accessories.json`, `martial_arts.json`,
`rules.json`, `rules_skills.json`, `annexes.json`, `cyber_rules.json`,
`drugs_rules.json`, `fiche_layout.json`, et pour le *Livre du Net* :
`net_programs.json`, `net_hardware.json`, `net_rules.json`.

`univers.json` est à part : ce n'est pas une table de règles mais la matière de la
section Univers — 276 entrées de chronologie, 11 dossiers thématiques, 13 villes,
18 corporations, 24 gangs, 9 familles nomades, 8 forces de l'ordre et 24 figures.
Chaque entrée porte sa source.

`fiche_layout.json` est un cas à part : il contient la position de chacun des 924
champs de saisie posés sur les quatre pages scannées de la feuille de personnage.

---

## Travailler sur le site

Ouvrir `index.html` par un double-clic **ne marche pas** : le site lit ses tables dans
`data/`, et les navigateurs interdisent cette lecture en accès direct au disque. Il faut
un petit serveur local. Depuis le dossier du site :

```bash
python -m http.server 8000
```

puis ouvrir `http://localhost:8000/`. N'importe quel autre serveur statique fait l'affaire
(`npx serve`, l'extension Live Server de VS Code…).

### Modifier le contenu

- **Une valeur, un prix, un texte de règle** : dans le fichier `data/` correspondant.
  Aucun code à toucher.
- **La mise en forme** : `css/style.css`.
- **Le comportement** : le fichier de `js/` correspondant au domaine.

Après toute modification, penser à refabriquer la version hors ligne (ci-dessous),
sinon elle reste sur l'ancienne version.

---

## La version hors ligne

`hors-ligne/cyberpunk-new-dawn.html` est le site entier — pages, styles, code, tables et
images — rassemblé dans un seul fichier de 2,6 Mo. Il s'ouvre par un double-clic, sans
serveur et sans connexion : c'est la version à emporter à la table de jeu, sur un portable
ou une tablette.

Pour le refabriquer après une modification :

```bash
python build/build.py
```

Le script relit `css/`, `js/`, `data/` et `assets/`, vérifie que le CSS et le JavaScript
assemblés sont valides, et réécrit le fichier.

---

## Quelques points à savoir

**Les personnages.** Ils sont enregistrés dans le stockage local du navigateur, sous la
clé `cpnd.v1`. Ils ne suivent pas d'un appareil à l'autre ni d'un navigateur à l'autre :
pour ça, il y a les boutons *Exporter* et *Importer* (un fichier JSON). Effacer les
données de navigation efface aussi les personnages.

**La version en ligne et la version hors ligne ne partagent pas leurs personnages** :
ce sont deux origines différentes pour le navigateur.

**Les polices** viennent de Google Fonts. Sans connexion, le site reste parfaitement
lisible : il repasse sur les polices étroites du système.

**L'impression de la feuille** sort quatre pages A4, copie conforme de la feuille
d'origine. Dans la fenêtre d'impression, laisser les marges par défaut et cocher
l'impression des arrière-plans.

---

## Sources

Les règles et les tables proviennent du PDF *Cyberpunk : New Dawn* (version du 26.08.2016,
mise à jour le 09.07.2025), une synthèse francophone de Cyberpunk 2020. S'y ajoutent le
*Livre du Net* (version du 25.06.2026) et, pour ce qui manquait à New Dawn, les armures et
les drogues de *Cyberpunk 2020 : Les Années Noires*. Chaque entrée venue d'un autre livre
porte sa source dans le codex.

La section Univers est écrite à partir de la chronologie canonique compilée pour Cyberpunk
2020, du livre de base français *Les Années Noires*, des trois *Corpbooks* (Arasaka et IEC,
Lazarus et Militech, Petrochem et SovOil), complétés par les wikis pour ce que ces livres ne
disent pas. Les textes sont des résumés, pas des reprises. La chronologie s'arrête en 2020,
présent du jeu : rien de ce qui vient après n'y figure.

Cyberpunk 2020 est une marque de R. Talsorian Games. Ce site est un outil personnel de
table de jeu, sans but commercial.

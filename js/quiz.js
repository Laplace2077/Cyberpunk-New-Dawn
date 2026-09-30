/* ============================================================
   QUESTIONNAIRE D'ORIENTATION
   Objectif : sortir un CONCEPT jouable et une construction chiffrée.
   3 blocs : 10 situations de jeu concrètes, une grille de domaines,
   5 réglages pratiques. ~5 minutes.
   ============================================================ */
'use strict';

const AXES = {
  COMBAT: 'Combat',
  NET: 'Réseau & électronique',
  TECH: 'Technique & fabrication',
  SOIN: 'Médecine',
  SOCIAL: 'Relations & influence',
  RUE: 'Rue & infiltration',
  CORPO: 'Institution & argent',
  SCENE: 'Scène & médias',
  MOBIL: 'Conduite & pilotage'
};

/* ---------- BLOC A : 10 situations de jeu ---------- */
const SITUATIONS = [
  {
    q: "Le groupe doit entrer dans un entrepôt gardé. Concrètement, tu fais quoi ?",
    hint: "Réponds par ce que ton personnage ferait à la table, pas par ce qui serait le plus malin.",
    o: [
      { t: "J'enfonce la porte et je tire", d: "Entrée directe, on gère la suite après.", w: { COMBAT: 3 } },
      { t: "Je coupe les caméras et l'alarme", d: "Sécurité électronique, puis tout le monde entre tranquillement.", w: { NET: 2, TECH: 2 } },
      { t: "Je passe seul par la ventilation", d: "Discrétion, repérage, j'ouvre de l'intérieur.", w: { RUE: 3 } },
      { t: "J'arrive en camion avec un faux bon de livraison", d: "Le gardien nous ouvre lui-même.", w: { SOCIAL: 2, MOBIL: 1, CORPO: 1 } }
    ]
  },
  {
    q: "Une fusillade éclate à dix mètres. Ton premier geste ?",
    o: [
      { t: "Je dégaine et je tire le premier", w: { COMBAT: 3 } },
      { t: "Je me mets à couvert et je couvre les autres", w: { COMBAT: 2, SOIN: 1 } },
      { t: "Je fonce au contact", w: { COMBAT: 2, SCENE: 1 } },
      { t: "Je recule et je prépare l'extraction", d: "Moteur qui tourne, portière ouverte.", w: { MOBIL: 3 } }
    ]
  },
  {
    q: "Il vous faut le plan d'un immeuble corpo. Tu t'en occupes comment ?",
    o: [
      { t: "Je le sors du réseau", w: { NET: 3 } },
      { t: "Je l'achète à un contact", w: { RUE: 3 } },
      { t: "Je vais le photographier sur place", d: "Repérage physique, deux jours de planque.", w: { RUE: 2, MOBIL: 1 } },
      { t: "Je le fais donner par quelqu'un qui l'a", d: "Un architecte, un stagiaire, un employé bavard.", w: { SOCIAL: 3 } }
    ]
  },
  {
    q: "Un coéquipier prend une balle dans le torse, en pleine mission.",
    o: [
      { t: "Je le stabilise moi-même", d: "Compétence Medtech, sur place, tout de suite.", w: { SOIN: 3 } },
      { t: "Je le porte pendant que les autres couvrent", w: { COMBAT: 1, SOIN: 1 } },
      { t: "J'appelle Trauma Team et je paye", w: { CORPO: 2, SOCIAL: 1 } },
      { t: "On termine d'abord, il tiendra", w: { COMBAT: 2, RUE: 1 } }
    ]
  },
  {
    q: "L'équipe a 5 000 €$ à dépenser. Tu votes pour quoi ?",
    o: [
      { t: "Des armes et des munitions", w: { COMBAT: 3 } },
      { t: "Du matériel électronique et de surveillance", w: { NET: 2, TECH: 1 } },
      { t: "De la cybernétique", w: { TECH: 1, COMBAT: 1, NET: 1 }, cy: 3 },
      { t: "Un véhicule correct", w: { MOBIL: 3 } }
    ]
  },
  {
    q: "Une porte verrouillée électroniquement, personne pour t'aider.",
    o: [
      { t: "Je pirate le lecteur", w: { NET: 3 } },
      { t: "Je démonte le mécanisme", d: "Crocheter, Électronique, tournevis.", w: { TECH: 3 } },
      { t: "Je la fais sauter", w: { COMBAT: 2, TECH: 1 } },
      { t: "Je vole un badge à quelqu'un", w: { RUE: 2, SOCIAL: 1 } }
    ]
  },
  {
    q: "Une négociation tourne mal. L'autre se lève et hausse le ton.",
    o: [
      { t: "Je hausse le ton plus fort", d: "Intimidation.", w: { COMBAT: 1, SOCIAL: 1, RUE: 1 } },
      { t: "Je désamorce et je recadre", d: "Éloquence, Baratin & Persuasion.", w: { SOCIAL: 3 } },
      { t: "Je pose mon arme sur la table", w: { COMBAT: 3 } },
      { t: "Je note tout et je m'en servirai plus tard", w: { CORPO: 2, NET: 1, SCENE: 1 } }
    ]
  },
  {
    q: "Entre deux contrats, ton personnage passe son temps à…",
    o: [
      { t: "Entretenir et modifier son matériel", w: { TECH: 3 } },
      { t: "Traîner là où on parle", d: "Bars, marchés, arrière-salles : les infos circulent.", w: { RUE: 3 } },
      { t: "Surveiller le réseau", w: { NET: 3 } },
      { t: "S'entraîner", d: "Salle, stand de tir, tatami.", w: { COMBAT: 3 } }
    ]
  },
  {
    q: "Sur ta fiche, tu veux voir en priorité…",
    hint: "Ça détermine si l'application te propose un personnage pointu ou polyvalent.",
    o: [
      { t: "Un très gros score de combat", w: { COMBAT: 3 } },
      { t: "Un très gros score technique ou informatique", w: { TECH: 2, NET: 2 } },
      { t: "Un très gros score social", w: { SOCIAL: 2, SCENE: 1, CORPO: 1 } },
      { t: "Des scores corrects partout", d: "Utile dans toutes les scènes, dominant dans aucune.", w: {} }
    ]
  },
  {
    q: "Ton MJ demande : « qu'est-ce que ton perso sait faire que personne d'autre du groupe ne sait faire ? »",
    hint: "C'est la question qui définit vraiment ta place à la table.",
    o: [
      { t: "Tuer, proprement et sans hésiter", w: { COMBAT: 3 } },
      { t: "Entrer dans n'importe quel système", w: { NET: 3 } },
      { t: "Réparer ou fabriquer n'importe quoi", w: { TECH: 3 } },
      { t: "Obtenir n'importe quoi de n'importe qui", w: { SOCIAL: 2, RUE: 2 } },
      { t: "Ramener quelqu'un que la médecine légale attendait", w: { SOIN: 3 } },
      { t: "Conduire ou piloter n'importe quoi, n'importe où", w: { MOBIL: 3 } }
    ]
  }
];

/* ---------- BLOC B : grille de domaines ---------- */
const DOMAINES = [
  { n: "Armes à feu", d: "Pistolets, fusils, armes automatiques.", w: { COMBAT: 3 } },
  { n: "Corps à corps", d: "Bagarre, mêlée, arts martiaux.", w: { COMBAT: 2, SCENE: 1 } },
  { n: "Réseau & intrusion", d: "Interface, piratage, data-havens.", w: { NET: 3 } },
  { n: "Électronique & sécurité", d: "Alarmes, caméras, systèmes de sécurité.", w: { NET: 2, TECH: 2 } },
  { n: "Mécanique & fabrication", d: "Réparer, modifier, bricoler, cyber-tech.", w: { TECH: 3 } },
  { n: "Médecine & biologie", d: "Medtech, diagnostic, pharmacologie.", w: { SOIN: 3 } },
  { n: "Négociation & séduction", d: "Convaincre, mentir, charmer.", w: { SOCIAL: 3 } },
  { n: "Commandement & parole", d: "Diriger, haranguer, imposer.", w: { SOCIAL: 2, SCENE: 1 } },
  { n: "Contacts & marché noir", d: "Connaissance de la rue, réseau d'indics.", w: { RUE: 3 } },
  { n: "Discrétion & filature", d: "Se cacher, suivre, ne pas exister.", w: { RUE: 2, NET: 1 } },
  { n: "Conduite & pilotage", d: "Voitures, motos, AV, engins lourds.", w: { MOBIL: 3 } },
  { n: "Argent & institutions", d: "Gestion, investissement, étiquette corpo.", w: { CORPO: 3 } },
  { n: "Scène & médias", d: "Musique, performance, interview, image.", w: { SCENE: 3 } }
];
const NOTES = ['Non', 'Un peu', 'Beaucoup', 'À fond'];

/* ---------- BLOC C : réglages ---------- */
const REGLAGES = [
  {
    id: 'age', q: "Quel âge a ton personnage ?",
    hint: "L'âge donne les points de compétence supplémentaires et le niveau maximum autorisé à la création.",
    o: [{ t: '16 ans', d: '+11 PC, niveau max 5.', v: 16 }, { t: '18 ans', d: '+17 PC, niveau max 6. Le standard.', v: 18 },
    { t: '22 ans', d: '+26 PC, niveau max 7.', v: 22 }, { t: '28 ans', d: '+33 PC, niveau max 8. Le sommet avant le déclin.', v: 28 }]
  },
  {
    id: 'cyber', q: "Combien de cybernétique ?",
    hint: "Chaque tranche de 10 points d'humanité perdue coûte 1 point d'Empathie.",
    o: [{ t: 'Aucune ou presque', d: "Je garde mon EMP intacte.", v: 0 }, { t: 'Le strict utile', d: "Deux ou trois pièces bien choisies.", v: 1 },
    { t: "Autant qu'il en faut", d: "L'efficacité prime.", v: 2 }, { t: 'Du chrome partout', d: "Je vise la limite, quitte à flirter avec la cyberpsychose.", v: 3 }]
  },
  {
    id: 'spec', q: "Pointu ou polyvalent ?",
    hint: "Détermine la forme de la répartition de compétences proposée.",
    o: [{ t: 'Très pointu', d: "Deux ou trois compétences très hautes, le reste au minimum.", v: 'tres' },
    { t: 'Spécialisé', d: "Un domaine dominant et de quoi survivre ailleurs.", v: 'normal' },
    { t: 'Polyvalent', d: "Beaucoup de compétences moyennes, aucune vedette.", v: 'poly' }]
  },
  {
    id: 'evite', q: "Ce que tu ne veux surtout pas faire en partie",
    hint: "L'application évitera de te pousser vers ce type de personnage.",
    o: [{ t: 'Rien, je prends tout', v: null }, { t: 'Les longues scènes techniques', d: "Piratage, réparation, procédures.", v: 'tech' },
    { t: 'Les scènes sociales', d: "Négociations, mondanités, intrigues.", v: 'social' }, { t: 'Les fusillades', d: "Je préfère éviter le combat direct.", v: 'combat' }]
  },
  {
    id: 'place', q: "Ta place dans le groupe",
    o: [{ t: 'En première ligne', d: "Je prends les coups.", v: 'front', w: { COMBAT: 2 } },
    { t: 'En soutien', d: "Je fais fonctionner les autres.", v: 'appui', w: { SOIN: 1, TECH: 1, MOBIL: 1 } },
    { t: 'En électron libre', d: "Je pars de mon côté et je reviens avec le résultat.", v: 'libre', w: { RUE: 2, NET: 1 } },
    { t: 'À la tête', d: "Je parle, je décide, je négocie.", v: 'chef', w: { SOCIAL: 2, CORPO: 1 } }]
  }
];

const AVERSION = { tech: { NET: -4, TECH: -4 }, social: { SOCIAL: -4, CORPO: -3, SCENE: -3 }, combat: { COMBAT: -5 } };

/* ============================================================
   ARCHÉTYPES
   ============================================================ */
const ARCHETYPES = [
  {
    id: 'solo', nom: 'Solo', tag: 'Muscle, arme, contrat',
    vec: { COMBAT: 5, RUE: 2, MOBIL: 1, TECH: 1 },
    desc: "Un professionnel de la violence : garde du corps, tueur, soldat sous contrat. Ce qui te définit, c'est de survivre à un échange de tirs et de faire en sorte que l'autre n'y survive pas.",
    caracs: { REF: 9, CON: 8, MV: 7, INT: 6, TECH: 5, SF: 8, EMP: 5, BT: 5, CH: 7 },
    skills: [['ARMES AUTOMATIQUES', 6], ['ESQUIVE', 5], ['PISTOLET', 5], ['PERCEPTION', 4], ['MÊLÉE', 4], ['ADRÉNALINE', 2], ['ARMURIER', 4], ['ENDURANCE', 4], ['INTIMIDATION', 3], ['CONNAISSANCE DE LA RUE', 3], ['ATHLETISME', 3], ['FORCE', 3], ['DISCRETION', 3], ['ARMES LOURDE', 3], ['CONDUIRE AUTOMOBILE', 2], ['MEDTECH', 2], ['SE CACHER / SEMER', 2]],
    av: ['REFLEXE DE COMBAT', 'TIREUR D’ELITE', 'RÉSISTANT A LA DOULEUR', 'RAPIDE', 'SENS DU DANGER'],
    df: ['ENNEMI', 'VENDETTA', 'MAUVAIS CARACTERE', 'CASIER JUDICIERE'],
    gear: "Une armure lourde ou sous-dermique, une arme longue automatique, un pistolet de secours, des munitions en quantité, et les permis correspondants.",
    cyber: "Réflexes implantés, optique avec compteur de munitions, prise de données pour armes intelligentes. C'est le profil qui consomme le plus d'humanité.",
    split: { cyber: 45, armes: 30, armure: 20, divers: 5 },
    metiers: ["Garde du corps freelance", "Videur d'un club de Night City", "Nettoyeur sous contrat corpo", "Ancien soldat des guerres corporatistes",
      "Escorteur de convois", "Combattant de cages reconverti", "Chasseur de primes", "Chef de sécurité déchu", "Exécuteur pour un gang"]
  },
  {
    id: 'netrunner', nom: 'Netrunner', tag: 'Interface, intrusion, données',
    vec: { NET: 5, TECH: 2, RUE: 1 },
    desc: "Tu vis à moitié ailleurs. New Dawn a supprimé la capacité spéciale : Interface est une compétence d'Intelligence que tout le monde peut apprendre. Ce qui te distingue, c'est le niveau que tu y as mis et le matériel branché derrière ton crâne.",
    caracs: { INT: 9, TECH: 8, REF: 6, EMP: 6, MV: 5, BT: 5, CON: 5, SF: 7, CH: 9 },
    skills: [['INTERFACE', 7], ['ELECTRONIQUE', 5], ['SECURITE ELECTRONIQUE', 5], ['EDUCATION', 4], ['PERCEPTION', 4], ['CYBER-TECH', 3], ['BIBLIOTHEQUE', 3], ['MATHEMATIQUES', 3], ['CONNAISSANCE DE LA RUE', 3], ['DISCRETION', 3], ['EXPERT', 3], ['ADRÉNALINE', 2], ['CONTREFACONS', 2], ['PISTOLET', 2], ['ESQUIVE', 2], ['BARATIN & PERSUASION', 2]],
    av: ['RÉFLEXE D’INTERFACE', 'DON POUR L’INFORMATIQUE', 'MÉMOIRE EIDETIQUE', 'CALCULATEUR PRODIGE', 'CYBER-AFFINITE'],
    df: ['PARANOÏA', 'DISTANT', 'DEPENDANCE', 'DETTE D’ARGENT'],
    gear: "Un poste de travail, du matériel de communication et de surveillance, une arme discrète, un logement où personne ne frappe à la porte.",
    cyber: "Prise neurale, neuromat, support de puces, liaison cybercom. Le neuromatériel est ton cœur de métier.",
    split: { cyber: 55, armes: 10, armure: 10, divers: 25 },
    metiers: ["Netrunner indépendant", "Analyste sécurité grillé par son employeur", "Pirate de data-havens", "Spécialiste de l'effacement de dossiers",
      "Cracker de systèmes bancaires", "Consultant en intrusion « légale »", "Archiviste clandestin", "Voleur d'identités"]
  },
  {
    id: 'techie', nom: 'Techie', tag: 'Réparer, modifier, fabriquer',
    vec: { TECH: 5, NET: 2, RUE: 1 },
    desc: "Tu es celui qui remet tout en marche : entretien, modification, fabrication, bricolage de génie à trois heures du matin. Dans une équipe, ton absence se remarque plus vite que celle du tireur.",
    caracs: { TECH: 10, INT: 9, REF: 6, CON: 6, SF: 6, EMP: 5, MV: 5, BT: 4, CH: 9 },
    skills: [['CYBER-TECH', 6], ['ELECTRONIQUE', 6], ['ARMURIER', 4], ['SECURITE ELECTRONIQUE', 4], ['CROCHETER', 4], ['EXPERT', 4], ['PERCEPTION', 3], ['EXPLOSIF', 3], ['GYRO-TECH', 3], ['CONNAISSANCE DE LA RUE', 3], ['INTERFACE', 3], ['MATHEMATIQUES', 3], ['ADRÉNALINE', 2], ['AV-TECH', 2], ['PISTOLET', 2], ['CONDUIRE AUTOMOBILE', 2]],
    av: ['APTITUDE TECHNIQUE', 'CYBER-AFFINITE', 'DOUÉ', 'CONNAISSEUR', 'SENS AIGUISE'],
    df: ['COMPULSION', 'DETTE D’ARGENT', 'MALADROIT', 'SIGNATURE'],
    gear: "Un atelier complet, des outils électroniques, du matériel de sécurité, un véhicule utilitaire. L'équipement compte plus que les armes.",
    cyber: "Main à outils intégrés, optique de précision, liaison technique. Le cyber augmente directement ce que tu sais faire.",
    split: { cyber: 35, armes: 10, armure: 10, divers: 45 },
    metiers: ["Mécano de gang devenu indispensable", "Ripperdoc-bricoleur de matériel volé", "Armurier clandestin", "Réparateur de cyberware d'occasion",
      "Ancien technicien d'usine licencié", "Fabricant de faux papiers et d'électronique", "Démonteur d'épaves", "Ingénieur corpo passé au noir"]
  },
  {
    id: 'medtech', nom: 'Medtech', tag: 'Recoudre, diagnostiquer, ramener',
    vec: { SOIN: 5, TECH: 2, SOCIAL: 1 },
    desc: "Medtech est l'une des deux seules compétences conservées de l'ancien système, devenue une compétence d'INT accessible à tous. Toi, tu en as fait ton métier : traumatologie de rue, cyber-chirurgie clandestine, pharmacologie.",
    caracs: { INT: 9, TECH: 8, EMP: 7, SF: 7, CH: 7, REF: 6, CON: 6, MV: 5, BT: 5 },
    skills: [['MEDTECH', 7], ['DIAGNOSTIC', 5], ['PHARMACOLOGIE', 4], ['BIOLOGIE', 4], ['CYBER-TECH', 3], ['CHIMIE', 3], ['UTILISER CAISSON CRYO', 3], ['PERCEPTION', 3], ['PERCEPTION HUMAINE', 3], ['EDUCATION', 3], ['GEN-TECH', 3], ['ADRÉNALINE', 2], ['CONDUIRE AUTOMOBILE', 2], ['PISTOLET', 2], ['ESQUIVE', 2], ['CONNAISSANCE DE LA RUE', 2]],
    av: ['GUERISSEUR', 'APTITUDE SCIENTIFIQUE', 'TÊTE FROIDE', 'MÉMOIRE EIDETIQUE', 'GUERISON RAPIDE'],
    df: ['SENS MORAL', 'HONNEUR', 'DEPENDANCE', 'ÊTRE CHER'],
    gear: "Trousse de traumatologie, matériel de diagnostic, accélérateurs de guérison, drogues, et de préférence un abonnement Trauma Team pour toi.",
    cyber: "Nanochirurgiens, biomoniteur, optique médicale, mains de précision. Le biomatériel coûte souvent moins d'humanité que la ferraille.",
    split: { cyber: 35, armes: 10, armure: 15, divers: 40 },
    metiers: ["Ripperdoc de sous-sol", "Urgentiste d'une clinique de quartier", "Ancien de Trauma Team viré", "Chirurgien radié qui opère au noir",
      "Chimiste-pharmacien du marché noir", "Vétérinaire reconverti sur des humains", "Infirmier de gang", "Chercheur en biotech en fuite"]
  },
  {
    id: 'media', nom: 'Media', tag: 'Enquêter, publier, exposer',
    vec: { SCENE: 3, SOCIAL: 3, NET: 2, RUE: 1 },
    desc: "Journaliste, documentariste, fouille-merde. Ton arme est la diffusion : ce que tu sais devient dangereux au moment où tout le monde le sait.",
    caracs: { INT: 8, EMP: 8, CH: 9, BT: 7, TECH: 6, REF: 6, SF: 6, MV: 5, CON: 5 },
    skills: [['INTERVIEW', 6], ['ELOQUENCE', 5], ['PERCEPTION HUMAINE', 5], ['PHOTOS & FILMS', 4], ['CONNAISSANCE DE LA RUE', 4], ['BARATIN & PERSUASION', 4], ['PERCEPTION', 3], ['EDUCATION', 3], ['INTERFACE', 3], ['LOOK', 3], ['SE CACHER / SEMER', 3], ['SUIVRE / PISTER', 3], ['ADRÉNALINE', 2], ['ETIQUETTE', 2], ['PISTOLET', 2], ['HISTOIRE', 2]],
    av: ['VOIX', 'PHYSIONOMISTE', 'EMPATHIE', 'CONTACT', 'QUELCONQUE'],
    df: ['ENNEMI', 'CASIER JUDICIERE', 'IMPULSIF', 'HONNÊTE'],
    gear: "Matériel d'enregistrement et de surveillance, cybercam, communications chiffrées, une arme dissimulable, un logement discret.",
    cyber: "Cyberoptique avec enregistrement, cyberaudio amplifié, liaison micro-enregistreur. Tu achètes des témoins, pas des muscles.",
    split: { cyber: 40, armes: 10, armure: 15, divers: 35 },
    metiers: ["Pigiste sur un dossier trop gros", "Documentariste de rue", "Présentateur déchu d'une chaîne corpo", "Photographe d'émeutes",
      "Enquêteur pour un média indépendant", "Blogueur suivi par des millions de gens", "Ancien attaché de presse corpo", "Chroniqueur judiciaire"]
  },
  {
    id: 'rockerboy', nom: 'Rocker', tag: 'Scène, foule, révolte',
    vec: { SCENE: 5, SOCIAL: 3 },
    desc: "Musicien, tribun, performeur. Tu ne convaincs pas les gens un par un, tu les prends par centaines. La compétence Performance et l'Empathie sont l'outil le plus dangereux de la salle.",
    caracs: { EMP: 9, BT: 9, CH: 8, SF: 7, INT: 6, REF: 6, TECH: 5, MV: 5, CON: 5 },
    skills: [['PERFORMANCE', 7], ['MUSIQUE', 5], ['ELOQUENCE', 5], ['LOOK', 4], ['BARATIN & PERSUASION', 4], ['SEDUCTION', 4], ['HABILLEMENT ET STYLES', 3], ['CONNAISSANCE DE LA RUE', 3], ['PERCEPTION HUMAINE', 3], ['BAGARRE', 3], ['ADRÉNALINE', 2], ['DANSE', 2], ['ESQUIVE', 2], ['PISTOLET', 2], ['INTERVIEW', 2]],
    av: ['ARTISTE', 'VOIX', 'OREILLE MUSICALE', 'BOURREAU DES COEURS', 'CHEF NATUREL'],
    df: ['SIGNE PARTICULIER', 'DEPENDANCE', 'TROP SÛR DE SOI', 'RIVAL'],
    gear: "Instruments, sono, vêtements qui font l'affiche, un véhicule de tournée, et une arme dans la poche parce que la salle n'est pas toujours amicale.",
    cyber: "Accessoires de mode, techchev, tatouages lumineux, éditeur de son. Attention : chaque implant coûte de l'EMP, et l'EMP est ton métier.",
    split: { cyber: 25, armes: 10, armure: 10, divers: 55 },
    metiers: ["Chanteuse dont le groupe a été racheté", "Guitariste d'un groupe qui monte", "Agitateur qui remplit les places",
      "DJ d'un club appartenant au mauvais type", "Comédien de rue devenu porte-voix", "Idole corpo en rupture de contrat", "Poète de bloc", "Performeur de combats-spectacles"]
  },
  {
    id: 'fixer', nom: 'Fixer', tag: 'Contacts, marché noir, arrangements',
    vec: { RUE: 5, SOCIAL: 3, CORPO: 1 },
    desc: "Tu es le nœud du réseau. Tu ne possèdes presque rien, mais tu sais qui possède quoi et à quel prix. Sans capacité spéciale dans New Dawn, ton pouvoir tient à Connaissance de la Rue et aux avantages Contact et Confrérie achetés à la création.",
    caracs: { EMP: 8, INT: 8, CH: 9, SF: 7, BT: 6, REF: 6, TECH: 6, MV: 5, CON: 5 },
    skills: [['CONNAISSANCE DE LA RUE', 7], ['BARATIN & PERSUASION', 5], ['PERCEPTION HUMAINE', 5], ['ELOQUENCE', 4], ['GESTION', 4], ['INTIMIDATION', 3], ['CONTREFACONS', 3], ['INVESTISSEMENT', 3], ['ETIQUETTE', 3], ['JEU', 3], ['PISTOLET', 3], ['ADRÉNALINE', 2], ['ESQUIVE', 2], ['DISCRETION', 2], ['SEDUCTION', 2], ['PICKPOCKET', 2]],
    av: ['CONTACT', 'CONFRERIE', 'RESSOURCES', 'VENDEUR', 'FAVEUR'],
    df: ['DETTE D’ARGENT', 'ENNEMI', 'LOYAUTE PARTAGE', 'CASIER JUDICIERE'],
    gear: "Peu d'équipement lourd, beaucoup de communication, un logement correct, une arme dissimulable, et du liquide gardé disponible.",
    cyber: "Cybercom, analyseur de stress vocal, optique discrète. Reste léger : ton visage et ton EMP sont ton fonds de commerce.",
    split: { cyber: 25, armes: 15, armure: 15, divers: 45 },
    metiers: ["Intermédiaire du marché noir", "Patron d'un bar qui sert de boîte aux lettres", "Recruteur pour équipes freelance",
      "Prêteur sur gages très bien informé", "Ancien coursier devenu grossiste", "Organisateur de paris clandestins", "Passeur de marchandises", "Agent d'artistes et de mercenaires"]
  },
  {
    id: 'lediv', nom: 'LEDiv / Flic', tag: 'Insigne, autorité, terrain',
    vec: { COMBAT: 3, CORPO: 3, RUE: 2 },
    desc: "Tu portes un insigne, ou tu l'as porté. Tu connais les priorités de crime, les procédures, et à quel moment personne ne viendra en renfort. New Dawn a supprimé la capacité « Autorité » : il te reste l'intimidation, l'interrogatoire et la loi telle qu'elle s'applique.",
    caracs: { CON: 8, REF: 8, SF: 8, INT: 7, CH: 7, EMP: 6, MV: 6, TECH: 5, BT: 5 },
    skills: [['PISTOLET', 6], ['PERCEPTION', 5], ['INTERROGATOIRE', 5], ['ESQUIVE', 4], ['INTIMIDATION', 4], ['CONNAISSANCE DE LA RUE', 4], ['BAGARRE', 3], ['ARMES AUTOMATIQUES', 3], ['CONDUIRE AUTOMOBILE', 3], ['EDUCATION', 3], ['ENDURANCE', 3], ['SUIVRE / PISTER', 3], ['ADRÉNALINE', 2], ['MEDTECH', 2], ['ELOQUENCE', 2]],
    av: ['SENS DU DANGER', 'REFLEXE DE COMBAT', 'IMPOSANT', 'PHYSIONOMISTE', 'TÊTE FROIDE'],
    df: ['ENNEMI', 'HONNEUR', 'SENS MORAL', 'VENDETTA'],
    gear: "Armure de service, arme de poing réglementaire, fusil à pompe, matériel de contrainte, véhicule. Les permis sont ton avantage principal.",
    cyber: "Optique avec liaison base de données, cyberaudio, prise de données. Le service en paye parfois une partie : à discuter avec ton MJ.",
    split: { cyber: 35, armes: 25, armure: 25, divers: 15 },
    metiers: ["Flic de la LEDiv en service", "Ex-flic radié qui vend ses anciens dossiers", "Enquêteur privé sous licence",
      "Agent de sécurité corpo en uniforme", "Ancien de la brigade psycho", "Inspecteur muté au Combat Zone", "Marshal d'autoroute", "Chasseur de cyberpsychos"]
  },
  {
    id: 'corpo', nom: 'Corporatiste', tag: 'Budget, hiérarchie, ressources',
    vec: { CORPO: 5, SOCIAL: 3 },
    desc: "Tu joues à une autre échelle : budgets, rapports, et gens qu'on peut envoyer à ta place. Ton arme est l'accès. Ton risque est de devenir une ligne de coût que quelqu'un décide de supprimer.",
    caracs: { INT: 9, EMP: 8, CH: 8, BT: 7, SF: 7, CON: 6, TECH: 5, REF: 5, MV: 5 },
    skills: [['GESTION', 6], ['ETIQUETTE', 5], ['ELOQUENCE', 5], ['INVESTISSEMENT', 4], ['PERCEPTION HUMAINE', 4], ['BARATIN & PERSUASION', 4], ['EDUCATION', 4], ['COMMANDEMENT', 3], ['HABILLEMENT ET STYLES', 3], ['LANGUES ETRANGÈRES', 3], ['ADRÉNALINE', 2], ['INTERFACE', 2], ['PISTOLET', 2], ['ESQUIVE', 2], ['HISTOIRE', 2]],
    av: ['RESSOURCES', 'CHEF NATUREL', 'CONTACT', 'CONNAISSEUR', 'BILINGUE'],
    df: ['LOYAUTE PARTAGE', 'RIVAL', 'DOMINANT', 'TRAVAIL DE JOUR'],
    gear: "Vêtements de qualité, communications sécurisées, un logement en zone corpo, une arme dissimulable et l'armure la plus discrète possible.",
    cyber: "Chrome invisible : liaison cybercom, optique standard, biomoniteur. Ton image compte autant que tes capacités.",
    split: { cyber: 30, armes: 10, armure: 15, divers: 45 },
    metiers: ["Cadre déclassé qui a encore des accès", "Négociateur de contrats", "Auditeur interne qui a vu ce qu'il fallait pas",
      "Responsable des ressources « spéciales »", "Analyste financier reconverti", "Attaché juridique d'une filiale", "Chef de projet mis au placard", "Héritier d'une petite corpo rachetée"]
  },
  {
    id: 'nomade', nom: 'Nomade', tag: 'Convoi, route, famille',
    vec: { MOBIL: 5, COMBAT: 2, TECH: 2, RUE: 1 },
    desc: "Ta famille est un convoi et ta maison a des roues. Tu sais conduire, réparer, survivre et te battre, dans cet ordre. Tu arrives et tu repars, et tu connais des routes que personne d'autre ne prend.",
    caracs: { REF: 9, CON: 8, MV: 8, TECH: 7, INT: 6, EMP: 6, SF: 6, BT: 5, CH: 5 },
    skills: [['CONDUIRE AUTOMOBILE', 6], ['SURVIE', 5], ['MÊLÉE', 4], ['PERCEPTION', 4], ['ENDURANCE', 4], ['FUSIL', 4], ["CONDUITE D'ENGINS LOURDS", 4], ['ELECTRONIQUE', 3], ['ARMURIER', 3], ['MEDTECH', 3], ['CONDUIRE MOTO', 3], ['ESQUIVE', 3], ['ATHLETISME', 3], ['ADRÉNALINE', 2], ['CONNAISSANCE DE LA RUE', 2], ['PILOTER', 2]],
    av: ['AS DU VOLANT', 'CONFRERIE', 'SENS DE L’ORIENTATION', 'CORIACE', 'EQUILIBRE'],
    df: ['LOYAUTE PARTAGE', 'ENNEMI', 'REBELLE', 'SINER'],
    gear: "Un véhicule, d'abord. Puis une arme longue, une armure souple, des outils et du matériel de survie.",
    cyber: "Cyberoptique, articulations renforcées, résistance aux UV, réserve de glycogène. Le biomatériel est ton meilleur rapport qualité/humanité.",
    split: { cyber: 25, armes: 20, armure: 15, divers: 40 },
    metiers: ["Coursier qui connaît toutes les sorties", "Chauffeur d'extraction", "Convoyeur de marchandises sensibles",
      "Éclaireur d'un clan nomade", "Pilote d'AV sans licence", "Mécanicien-routier de convoi", "Passeur de frontières", "Ancien pilote militaire"]
  }
];

/* ---------- Amorces de concept ---------- */
const ORIGINES = [
  "sorti d'un bloc du Combat Zone", "élevé dans une arcologie corpo", "descendu d'un convoi nomade",
  "formé par l'armée puis lâché sans rien", "monté de la rue sans jamais rien devoir à personne",
  "ancien élève d'une école corpo qui l'a recraché", "né dans un quartier ouvrier au-dessus d'un atelier",
  "arrivé en ville il y a six mois", "rescapé d'un gang dissous en une nuit", "recruté à quinze ans par un fixer",
  "produit d'un orphelinat sous contrat corporatiste", "revenu d'Europe sans papiers ni relations"
];
const ACCROCHES = [
  "et qui doit de l'argent à quelqu'un de très patient",
  "avec un dossier qu'il ne devrait pas avoir",
  "qui cherche la personne qui a signé son licenciement",
  "grillé dans le milieu depuis un contrat qui a mal tourné",
  "qui paye chaque mois les soins de quelqu'un d'autre",
  "recherché sous un nom qui n'est plus le sien",
  "en fuite depuis une nuit précise dont il ne parle jamais",
  "sous contrat exclusif avec un employeur qu'il déteste",
  "qui a laissé un partenaire derrière lui et le sait",
  "en train de rembourser sa propre cybernétique",
  "à qui il reste onze mois de crédit d'implants",
  "surveillé par la LEDiv depuis six mois sans savoir pourquoi",
  "avec une réputation qu'il n'a jamais méritée",
  "qui essaye de faire sortir sa sœur d'un contrat corpo"
];

/* ============================================================
   CALCUL
   ============================================================ */
function quizScore(st) {
  const ax = {}; Object.keys(AXES).forEach(k => ax[k] = 0);
  const add = w => { for (const k in (w || {})) ax[k] = (ax[k] || 0) + w[k]; };
  let cy = [];

  st.sit.forEach((ai, qi) => {
    if (ai === null || ai === undefined) return;
    const o = SITUATIONS[qi].o[ai]; if (!o) return;
    add(o.w);
    if (o.cy !== undefined) cy.push(o.cy);
  });
  DOMAINES.forEach((dm, i) => {
    const n = st.dom[i] || 0;
    if (!n) return;
    for (const k in dm.w) ax[k] += dm.w[k] * n * 0.9;
  });
  const place = REGLAGES.find(r => r.id === 'place').o.find(o => o.v === st.reg.place);
  if (place) add(place.w);
  if (st.reg.evite && AVERSION[st.reg.evite]) add(AVERSION[st.reg.evite]);
  if (st.reg.cyber !== null && st.reg.cyber !== undefined) cy.push(st.reg.cyber);

  Object.keys(ax).forEach(k => ax[k] = Math.max(0, ax[k]));
  const max = Math.max(1, ...Object.values(ax));
  const norm = {}; Object.keys(ax).forEach(k => norm[k] = Math.round(ax[k] / max * 100));

  const ranked = ARCHETYPES.map(a => {
    let dot = 0, na = 0, nb = 0;
    Object.keys(AXES).forEach(k => {
      const va = ax[k] || 0, vb = a.vec[k] || 0;
      dot += va * vb; na += va * va; nb += vb * vb;
    });
    return { a, score: (na && nb) ? dot / Math.sqrt(na * nb) : 0 };
  }).sort((x, y) => y.score - x.score);

  return {
    ax, norm, ranked,
    cyber: cy.length ? cy.reduce((a, b) => a + b, 0) / cy.length : 1.5,
    age: st.reg.age || 18,
    spec: st.reg.spec || 'normal'
  };
}

/** Applique la forme « pointu / spécialisé / polyvalent » aux cibles de compétences */
function shapeTargets(list, spec) {
  if (spec === 'tres') return list.map(([n, t], i) => [n, i < 4 ? Math.min(10, t + 1) : Math.max(1, t - 1)]);
  if (spec === 'poly') return list.map(([n, t]) => [n, Math.max(2, Math.min(4, t))]);
  return list.slice();
}

/** Répartit les compétences conseillées dans le budget réel, par ordre de priorité */
function allocSkills(list, budget, cap) {
  const cur = list.map(([n, t]) => ({ nom: n, niv: 0, cible: t }));
  let left = budget, moved = true;
  while (left > 0 && moved) {
    moved = false;
    for (const s of cur) {
      const lim = Math.min(s.cible, noAcc(s.nom) === 'adrenaline' ? 2 : cap);
      const co = RULES.skillCoeff(s.nom);
      if (s.niv < lim && left >= co) { s.niv++; left -= co; moved = true; }
    }
  }
  return { skills: cur.filter(s => s.niv > 0).map(s => ({ nom: s.nom, niv: s.niv })), reste: left };
}

/** Fabrique n propositions de concept pour un archétype */
function makeConcepts(arch, n) {
  /* un métier, une origine et une accroche différents pour chaque proposition */
  const shuffle = a => { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  const M = shuffle(arch.metiers), O = shuffle(ORIGINES), A = shuffle(ACCROCHES);
  const out = [];
  for (let i = 0; i < Math.min(n, M.length); i++) {
    const m = M[i], o = O[i % O.length], a = A[i % A.length];
    out.push({ court: m, long: `${m}, ${o}, ${a}.` });
  }
  return out;
}

/* ============================================================
   VUE
   ============================================================ */
const QZ = {
  state: {
    page: -1,                                   // -1 intro · 0..9 situations · 10 domaines · 11 réglages · 99 résultat
    sit: new Array(SITUATIONS.length).fill(null),
    dom: new Array(DOMAINES.length).fill(null),
    reg: { age: 18, cyber: null, spec: 'normal', evite: null, place: null },
    chosen: null,
    concepts: null
  }
};
const QZ_LAST = SITUATIONS.length + 1;          // index de la dernière page (réglages) = 11

SOUS.quiz = function () {
  const st = QZ.state;
  if (st.page === 99) return quizResult();
  if (st.page < 0) return quizIntro();
  if (st.page < SITUATIONS.length) return quizSituation();
  if (st.page === SITUATIONS.length) return quizDomaines();
  return quizReglages();
};

function quizProgress(i, total, label) {
  return h('div.qz-bar',
    h('span.qz-step', label),
    meter((i / total) * 100),
    h('span.qz-step', `${i} / ${total}`));
}

function quizIntro() {
  const st = QZ.state;
  const started = st.sit.some(a => a !== null) || st.dom.some(a => a !== null);
  return h('div',
    sectionTitle('Étape 0 — facultative', "Quel personnage veux-tu jouer ?",
      "Ce questionnaire ne cherche pas à te psychanalyser : il te demande ce que tu veux faire concrètement en partie, et il en déduit un concept, une répartition de caractéristiques et une liste de compétences prêtes à appliquer."),
    h('div.g3.rise', { style: { marginBottom: '18px' } },
      h('div.panel', h('div.panel-h', h('h3', '1 · Dix situations')),
        h('p', { style: { margin: 0, fontSize: '15px', color: 'var(--ink-2)' } },
          "Des scènes de jeu réelles — une porte gardée, une fusillade, un blessé, un budget à dépenser — et ce que tu ferais. Une question par écran.")),
      h('div.panel', h('div.panel-h', h('h3', '2 · Tes domaines')),
        h('p', { style: { margin: 0, fontSize: '15px', color: 'var(--ink-2)' } },
          "Treize domaines de compétence à noter de « pas du tout » à « c'est mon truc ». Un seul écran, c'est le plus rapide et le plus déterminant.")),
      h('div.panel', h('div.panel-h', h('h3', '3 · Cinq réglages')),
        h('p', { style: { margin: 0, fontSize: '15px', color: 'var(--ink-2)' } },
          "Âge, quantité de cybernétique, personnage pointu ou polyvalent, ce que tu veux éviter, ta place dans le groupe."))),
    h('div.panel.rise', { style: { marginBottom: '18px' } },
      h('div.tag.a', 'En sortie'),
      h('p', { style: { margin: '10px 0 0', fontSize: '16px', color: 'var(--ink-2)', lineHeight: 1.55 } },
        "Les dix archétypes classés par compatibilité — et tu peux en choisir n'importe lequel, pas seulement le premier. Pour celui que tu retiens : cinq propositions de concept rédigées, regénérables, à cliquer pour l'adopter ; la répartition des 60 points de caractéristiques ; la liste de compétences calée sur ton budget réel ; les avantages, défauts, équipement et cyber conseillés."),
      h('p', { style: { margin: '10px 0 0', fontSize: '15px', color: 'var(--ink-3)' } },
        "Rien n'est verrouillé. New Dawn n'a plus de classes de personnage : l'archétype est un repère de lecture, pas une règle.")),
    h('div.row.wrap.rise',
      h('button.btn.p', { onclick: () => { QZ.state.page = 0; route(); } }, started ? 'Reprendre' : 'Commencer'),
      h('button.btn.g', { onclick: () => { if (!STORE.current()) STORE.save(RULES.blank()); go('creation'); } }, 'Passer — créer directement'),
      started ? h('button.btn.g', { onclick: () => { QZ.state.page = 99; route(); } }, 'Voir le résultat') : null,
      started ? h('button.btn.g', {
        onclick: () => {
          QZ.state = { page: -1, sit: new Array(SITUATIONS.length).fill(null), dom: new Array(DOMAINES.length).fill(null), reg: { age: 18, cyber: null, spec: 'normal', evite: null, place: null }, chosen: null, concepts: null };
          route();
        }
      }, 'Tout effacer') : null)
  );
}

function quizSituation() {
  const st = QZ.state, i = st.page, q = SITUATIONS[i];
  const card = h('div.panel.rise',
    h('div.qz-sect', `Situation ${i + 1} sur ${SITUATIONS.length}`),
    h('h2.qz-q', q.q),
    q.hint ? h('p.qz-hint', q.hint) : null,
    h('div.qz-opts', ...q.o.map((o, oi) =>
      h('button.qz-opt' + (st.sit[i] === oi ? '.on' : ''), {
        onclick: () => { st.sit[i] = oi; st.page = i + 1; route(); }
      }, h('span.kx', 'ABCDEF'[oi]), h('span.tx', h('b', o.t), o.d ? h('i', o.d) : null))))
  );
  return h('div',
    quizProgress(i, QZ_LAST + 1, 'Bloc 1 — situations de jeu'),
    card,
    h('div.wiz-nav',
      h('button.btn.g', { onclick: () => { st.page = i - 1; route(); } }, '← Précédent'),
      h('button.btn.g', { onclick: () => { st.page = i + 1; route(); } }, 'Passer'),
      h('div.sp'),
      h('button.btn.g', { onclick: () => { st.page = SITUATIONS.length; route(); } }, 'Aller aux domaines →')));
}

function quizDomaines() {
  const st = QZ.state;
  const host = h('div');
  const draw = () => {
    clear(host);
    DOMAINES.forEach((dm, i) => {
      host.appendChild(h('div.dom',
        h('div.nm', h('b', dm.n), h('i', dm.d)),
        h('div.sc', ...NOTES.map((lb, n) =>
          h('button' + (st.dom[i] === n ? '.on' : ''), {
            onclick: () => { st.dom[i] = n; draw(); }
          }, lb)))));
    });
  };
  draw();
  const done = st.dom.filter(x => x !== null).length;
  return h('div',
    quizProgress(SITUATIONS.length, QZ_LAST + 1, 'Bloc 2 — tes domaines'),
    h('div.panel.rise',
      h('div.qz-sect', `Bloc 2 · ${done} / ${DOMAINES.length} notés`),
      h('h2.qz-q', "Note chaque domaine selon l'envie que tu en as"),
      h('p.qz-hint', "C'est le bloc le plus déterminant : il pèse directement sur les compétences qui te seront proposées. Ce que tu ne notes pas est considéré comme indifférent."),
      host,
      h('div.row.wrap', { style: { marginTop: '14px' } },
        h('button.btn.g.sm', { onclick: () => { st.dom = st.dom.map(() => 1); draw(); } }, 'Tout à « un peu »'),
        h('button.btn.g.sm', { onclick: () => { st.dom = st.dom.map(() => null); draw(); } }, 'Tout effacer'))),
    h('div.wiz-nav',
      h('button.btn.g', { onclick: () => { st.page = SITUATIONS.length - 1; route(); } }, '← Situations'),
      h('div.sp'),
      h('button.btn.p', { onclick: () => { st.page = SITUATIONS.length + 1; route(); } }, 'Réglages →')));
}

function quizReglages() {
  const st = QZ.state;
  const host = h('div');
  const draw = () => {
    clear(host);
    REGLAGES.forEach(r => {
      host.appendChild(h('div', { style: { marginBottom: '20px' } },
        h('h3', { style: { margin: '0 0 3px', font: '700 18px/1.2 var(--f-disp)', letterSpacing: '.03em', textTransform: 'uppercase' } }, r.q),
        r.hint ? h('p', { style: { margin: '0 0 9px', fontSize: '14.5px', color: 'var(--ink-3)' } }, r.hint) : null,
        h('div.qz-opts', ...r.o.map(o =>
          h('button.qz-opt' + (st.reg[r.id] === o.v ? '.on' : ''), {
            onclick: () => { st.reg[r.id] = o.v; draw(); }
          }, h('span.tx', h('b', o.t), o.d ? h('i', o.d) : null))))));
    });
  };
  draw();
  return h('div',
    quizProgress(QZ_LAST, QZ_LAST + 1, 'Bloc 3 — réglages'),
    h('div.panel.rise', h('div.qz-sect', 'Bloc 3 · réglages du personnage'), host),
    h('div.wiz-nav',
      h('button.btn.g', { onclick: () => { st.page = SITUATIONS.length; route(); } }, '← Domaines'),
      h('div.sp'),
      h('button.btn.p', { onclick: () => { st.page = 99; st.chosen = null; st.concepts = null; route(); } }, 'Voir le résultat →')));
}

/* ---------- Résultat ---------- */
function quizResult() {
  const st = QZ.state;
  const res = quizScore(st);
  if (!st.chosen) st.chosen = res.ranked[0].a.id;
  const arch = ARCHETYPES.find(a => a.id === st.chosen) || res.ranked[0].a;
  if (!st.concepts || st.conceptsFor !== arch.id) { st.concepts = makeConcepts(arch, 5); st.conceptsFor = arch.id; st.conceptPick = null; }

  const wrap = h('div');
  wrap.appendChild(sectionTitle('Résultat', 'Ton profil',
    "Choisis le profil que tu veux jouer — pas forcément le premier. Tout ce qui suit s'adapte à ta sélection."));

  /* -- Axes -- */
  const axes = h('div.axes');
  Object.keys(AXES).sort((a, b) => res.norm[b] - res.norm[a]).forEach(k =>
    axes.appendChild(h('div.axe', h('span.nm', AXES[k]), meter(res.norm[k]), h('span.vv', res.norm[k]))));

  /* -- Classement, tous sélectionnables -- */
  const list = h('div.arch');
  res.ranked.forEach((r, i) => {
    const on = r.a.id === arch.id;
    const c = h('div.arch-card' + (on ? '.win' : ''),
      h('div.hd',
        h('span.tag', on ? 'Sélectionné' : (i === 0 ? 'Le plus proche' : `n° ${i + 1}`)),
        h('h4', r.a.nom),
        h('span.pct', Math.round(r.score * 100) + '%')),
      h('div.mini', h('span.chip.c', r.a.tag)),
      h('p', r.a.desc),
      h('div.acts',
        on ? h('span.chip.a', '✓ Profil retenu')
          : h('button.btn.sm', { onclick: () => { st.chosen = r.a.id; route(); } }, 'Choisir ce profil')));
    if (on) {
      c.appendChild(h('div.mini', h('span.tag', 'Avantages'), ...r.a.av.map(x => h('span.chip', x))));
      c.appendChild(h('div.mini', h('span.tag', 'Défauts'), ...r.a.df.map(x => h('span.chip.m', x))));
    }
    list.appendChild(c);
  });

  wrap.appendChild(h('div.g2.rise', { style: { marginBottom: '16px', alignItems: 'start' } },
    h('div.col',
      h('div.panel', h('div.panel-h', h('h3', 'Profil sur 9 axes')), axes,
        h('p', { style: { margin: '14px 0 0', fontSize: '14px', color: 'var(--ink-3)' } },
          `Cybernétique souhaitée : ${['très faible', 'faible', 'modérée', 'élevée'][clamp(Math.round(res.cyber), 0, 3)]}. `
          + `Âge : ${res.age} ans (${RULES.ageRow(res.age).tpc} PC supplémentaires, niveau max ${RULES.ageRow(res.age).max}). `
          + `Forme : ${{ tres: 'très pointu', normal: 'spécialisé', poly: 'polyvalent' }[res.spec]}.`)),
      conceptPanel(arch, st)),
    h('div.panel.flat', list)));

  /* -- Construction conseillée -- */
  const draft = RULES.blank({ age: res.age, caracs: Object.assign({}, arch.caracs) });
  const budget = RULES.skillPoints(draft);
  const cap = RULES.ageRow(res.age).max;
  const alloc = allocSkills(shapeTargets(arch.skills, res.spec), budget, cap);
  const argent = ((arch.caracs.INT || 0) + (arch.caracs.BT || 0)) * 1000;
  const sp = arch.split;

  const statsBox = h('div.sblock');
  RULES.STATS.forEach(s => statsBox.appendChild(h('div.s', h('span', s), h('b', arch.caracs[s]), h('i', RULES.STAT_NAMES[s]))));
  const skBox = h('div.sk-sheet');
  alloc.skills.forEach(s => {
    const def = DB.skills.find(x => x.nom === s.nom);
    skBox.appendChild(h('div.l', h('span.cx', def && def.carac ? def.carac : '—'), h('span.nn', s.nom), h('span.vv', s.niv)));
  });

  wrap.appendChild(h('div.panel.rise', { style: { marginBottom: '16px' } },
    h('div.panel-h', h('h3', 'Construction conseillée — ' + arch.nom)),
    h('div.tag.a', 'Caractéristiques · 60 points'),
    h('div', { style: { height: '8px' } }), statsBox,
    h('div', { style: { height: '18px' } }),
    h('span.tag.a', `Compétences · ${budget - alloc.reste} / ${budget} points, plafond ${cap}`),
    h('div', { style: { height: '8px' } }), skBox,
    h('div.g2', { style: { marginTop: '18px' } },
      h('div', h('div.tag.a', `Argent de départ · ${eb(argent)}`),
        h('div', { style: { height: '8px' } }),
        h('div.dv-grid',
          h('div.dv', h('span', 'Cyber'), h('b', eb(Math.round(argent * sp.cyber / 100))), h('i', sp.cyber + ' %')),
          h('div.dv', h('span', 'Armes'), h('b', eb(Math.round(argent * sp.armes / 100))), h('i', sp.armes + ' %')),
          h('div.dv', h('span', 'Armure'), h('b', eb(Math.round(argent * sp.armure / 100))), h('i', sp.armure + ' %')),
          h('div.dv', h('span', 'Divers'), h('b', eb(Math.round(argent * sp.divers / 100))), h('i', sp.divers + ' %')))),
      h('div',
        h('div.tag.a', 'Équipement'),
        h('p', { style: { margin: '8px 0 14px', fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.5 } }, arch.gear),
        h('div.tag.a', 'Cybernétique'),
        h('p', { style: { margin: '8px 0 0', fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.5 } }, arch.cyber)))));

  /* -- Application -- */
  wrap.appendChild(h('div.panel.acc.rise',
    h('div.panel-h', h('h3', 'Appliquer')),
    h('p', { style: { margin: '0 0 14px', fontSize: '16px', color: 'var(--ink-2)', lineHeight: 1.55 } },
      "Crée un personnage pré-rempli aux étapes 1 à 4 — concept, âge, caractéristiques, compétences. Tout reste modifiable ensuite, et les étapes suivantes (événements de vie, avantages, achats) restent à faire."),
    h('div.row.wrap',
      h('button.btn.p', {
        onclick: () => {
          const cpt = st.conceptPick !== null && st.concepts[st.conceptPick] ? st.concepts[st.conceptPick] : null;
          const ch = RULES.blank({
            concept: cpt ? cpt.court : arch.nom,
            description: cpt ? cpt.long : '',
            age: res.age,
            caracs: Object.assign({}, arch.caracs),
            competences: alloc.skills.map(s => ({ nom: s.nom, niv: s.niv, spec: '' })),
            quiz: { axes: res.norm, archetype: arch.id, cyber: res.cyber, spec: res.spec, date: new Date().toISOString() },
            etape: 0
          });
          ch.journal = [{ d: today(), t: `Créé depuis le questionnaire — profil « ${arch.nom} »${cpt ? `, concept « ${cpt.court} »` : ''}.` }];
          STORE.save(ch);
          toast('Personnage pré-rempli. À toi de finir.', 'ok');
          go('creation');
        }
      }, `Créer un ${arch.nom}`),
      h('button.btn.g', {
        onclick: () => {
          const ch = STORE.current();
          if (!ch) return toast("Aucun personnage actif à mettre à jour.", 'no');
          ch.caracs = Object.assign({}, arch.caracs); ch.age = res.age;
          ch.quiz = { axes: res.norm, archetype: arch.id, cyber: res.cyber, spec: res.spec, date: new Date().toISOString() };
          STORE.save(ch); toast('Caractéristiques appliquées au personnage actif.', 'ok'); go('creation');
        }
      }, 'Appliquer au personnage actif'),
      h('button.btn.g', { onclick: () => { st.page = QZ_LAST; route(); } }, 'Revoir mes réponses'),
      h('button.btn.g', {
        onclick: () => {
          QZ.state = { page: -1, sit: new Array(SITUATIONS.length).fill(null), dom: new Array(DOMAINES.length).fill(null), reg: { age: 18, cyber: null, spec: 'normal', evite: null, place: null }, chosen: null, concepts: null };
          route();
        }
      }, 'Refaire'))));
  return wrap;
}

function conceptPanel(arch, st) {
  const host = h('div');
  const draw = () => {
    clear(host);
    st.concepts.forEach((c, i) => {
      host.appendChild(h('div.cpt' + (st.conceptPick === i ? '.on' : ''), {
        onclick: () => { st.conceptPick = st.conceptPick === i ? null : i; draw(); }
      }, h('span.kx.chip' + (st.conceptPick === i ? '.a' : ''), st.conceptPick === i ? '✓' : String(i + 1)),
        h('div.grow', h('div.t', c.court), h('div.d', c.long))));
    });
  };
  draw();
  return h('div.panel',
    h('div.panel-h', h('h3', 'Concept — ' + arch.nom)),
    h('p', { style: { margin: '0 0 12px', fontSize: '15px', color: 'var(--ink-2)', lineHeight: 1.5 } },
      "Étape 1 du livre : « faites-vous une idée générale de votre personnage en choisissant un concept le caractérisant ». Voici cinq propositions construites sur le profil retenu. Clique pour en adopter une — le titre devient ton concept, la phrase complète part dans la description."),
    host,
    h('div.row.wrap', { style: { marginTop: '10px' } },
      h('button.btn.g.sm', { onclick: () => { st.concepts = makeConcepts(arch, 5); st.conceptPick = null; route(); } }, '↻ Autres propositions'),
      st.conceptPick !== null ? h('span.chip.a', 'Concept retenu') : h('span.chip', 'Aucun retenu — facultatif')));
}

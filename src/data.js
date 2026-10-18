// Données du jeu : époques, découvertes, bâtiments, métiers.
// Source unique des chiffres et des textes en jeu (cf. kb/domains/tech/tech.md).
// Le contenu historique est conçu dans kb/domains/contenu-historique/epoques.md.
var Donnees = (function () {
  var epoques = [
    {
      id: 1,
      nom: "L'âge de pierre",
      intro: "Il y a très, très longtemps, une petite tribu arrive dans la vallée. Aide-la à grandir !"
    },
    {
      id: 2,
      nom: 'Le néolithique',
      intro: "Des milliers d'années ont passé. Les gens ont appris à planter des graines : c'est le temps des premiers paysans !"
    }
  ];

  // Découvertes, dans l'ordre historique (ADR-001)
  var decouvertes = {
    outils: {
      nom: 'Les outils', epoque: 1, idees: 4, prerequis: [], icone: '01-pierre/atelier-silex',
      texte: "Avant, on n'arrivait pas à couper le bois ni la viande. Maintenant, on tape une pierre contre une autre pour faire des outils qui coupent !"
    },
    feu: {
      nom: 'Le feu', epoque: 1, idees: 4, prerequis: [], icone: '01-pierre/feu',
      texte: "Avant, il faisait froid et tout noir la nuit. Maintenant, grâce au feu, on a chaud, on y voit, et on cuit la viande !"
    },
    chasse: {
      nom: 'La chasse et la pêche', epoque: 1, idees: 7, prerequis: ['outils'], icone: '01-pierre/ratelier-lances',
      texte: "Avant, on avait souvent faim. Maintenant, avec des lances, on chasse dans la forêt et on pêche dans la rivière !"
    },
    abri: {
      nom: 'Les huttes en peaux', epoque: 1, idees: 7, prerequis: ['chasse'], icone: '01-pierre/hutte-peaux',
      texte: "Avant, on dormait sous des branches et le vent passait. Maintenant, on coud des peaux de bêtes pour faire des huttes bien chaudes !"
    },
    peinture: {
      nom: 'La peinture', epoque: 1, idees: 9, prerequis: ['feu'], icone: '01-pierre/peintures-rupestres',
      texte: "Avant, on oubliait nos histoires. Maintenant, à la lumière du feu, on les peint sur les murs de la grotte !"
    },
    agriculture: {
      nom: "L'agriculture", epoque: 2, idees: 9, prerequis: [], icone: '02-neolithique/champ-ble',
      texte: "Avant, il fallait marcher toute la journée pour trouver à manger. Maintenant, on plante des graines, le blé pousse, et on peut rester au même endroit !"
    },
    elevage: {
      nom: "L'élevage", epoque: 2, idees: 9, prerequis: ['chasse'], icone: '02-neolithique/enclos-moutons',
      texte: "Avant, il fallait courir après les animaux. Maintenant, on garde des moutons dans un enclos : on a de la laine et du lait !"
    },
    grenier: {
      nom: 'Le grenier', epoque: 2, idees: 12, prerequis: ['agriculture'], icone: '02-neolithique/grenier',
      texte: "Avant, les souris mangeaient notre blé. Maintenant, on le range bien au sec, en hauteur, dans un grenier !"
    },
    poterie: {
      nom: 'La poterie', epoque: 2, idees: 12, prerequis: ['feu', 'agriculture'], icone: '02-neolithique/atelier-potier',
      texte: "Avant, on ne pouvait rien garder ni transporter. Maintenant, on cuit de l'argile dans le feu pour faire des pots !"
    },
    meule: {
      nom: 'La meule', epoque: 2, idees: 12, prerequis: ['agriculture'], icone: '02-neolithique/meule',
      texte: "Avant, on ne pouvait pas manger le blé tout dur. Maintenant, on l'écrase entre deux pierres : ça fait de la farine, et avec la farine, du pain !"
    }
  };

  // Bâtiments. largeur = taille à l'écran en pixels du plateau.
  // travail : le métier, où l'habitant va (aller), ce qu'il rapporte (porte),
  // combien de temps il travaille (duree, secondes) et ce que ça produit.
  var batiments = {
    'cercle-pierres': {
      nom: 'Le cercle des anciens', sprite: '01-pierre/cercle-pierres', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 176,
      travail: { metier: 'sage', aller: null, duree: 12, produit: 'idees', qte: 1 }
    },
    'tas-bois': {
      nom: 'Le tas de bois', sprite: '01-pierre/tas-bois', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 132,
      travail: { metier: 'bucheron', aller: 'foret', porte: 'bois', duree: 4, produit: 'pieces', qte: 1 }
    },
    tente: {
      nom: 'Une tente', sprite: '01-pierre/tente', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 5, bois: 2, lits: 2, largeur: 154, ameliore: 'maison-torchis'
    },
    'hutte-branches': {
      nom: 'Une hutte de branches', sprite: '01-pierre/hutte-branches', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 8, bois: 3, lits: 2, largeur: 154, ameliore: 'maison-torchis'
    },
    'buisson-baies': {
      nom: 'Un buisson de baies', sprite: '01-pierre/buisson-baies', epoque: 1, jusqua: 9,
      zone: 'pre', cout: 6, bois: 1, largeur: 106,
      travail: { metier: 'cueilleur', aller: null, duree: 7, produit: 'pieces', qte: 1 }
    },
    'atelier-silex': {
      nom: "L'atelier de silex", sprite: '01-pierre/atelier-silex', epoque: 1, jusqua: 9, debloque: 'outils',
      zone: 'grotte', cout: 10, bois: 2, largeur: 158,
      travail: { metier: 'tailleur', aller: 'grotte', porte: 'silex', duree: 4, produit: 'pieces', qte: 2 }
    },
    feu: {
      nom: 'Un feu de camp', sprite: '01-pierre/feu', epoque: 1, jusqua: 9, debloque: 'feu',
      zone: 'pre', cout: 6, bois: 2, largeur: 101, effet: 'feu'
    },
    'ratelier-lances': {
      nom: 'Le râtelier des chasseurs', sprite: '01-pierre/ratelier-lances', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'pre', cout: 10, bois: 2, largeur: 123,
      travail: { metier: 'chasseur', aller: 'foret', porte: 'viande', duree: 6, produit: 'pieces', qte: 2 }
    },
    'sechoir-poissons': {
      nom: 'Le séchoir à poissons', sprite: '01-pierre/sechoir-poissons', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'rive', cout: 10, bois: 2, largeur: 145,
      travail: { metier: 'pecheur', aller: 'riviere', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    'hutte-peaux': {
      nom: 'Une hutte en peaux', sprite: '01-pierre/hutte-peaux', epoque: 1, jusqua: 1, debloque: 'abri',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 180, ameliore: 'maison-longue'
    },
    'peintures-rupestres': {
      nom: 'La grotte peinte', sprite: '01-pierre/peintures-rupestres', epoque: 1, jusqua: 9, debloque: 'peinture',
      zone: 'grotte', cout: 12, bois: 2, largeur: 163,
      travail: { metier: 'peintre', aller: null, duree: 14, produit: 'idees', qte: 2 }
    },
    'maison-torchis': {
      nom: 'Une maison en torchis', sprite: '02-neolithique/maison-torchis', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 167
    },
    'champ-ble': {
      nom: 'Un champ de blé', sprite: '02-neolithique/champ-ble', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 12, bois: 1, largeur: 185,
      travail: { metier: 'paysan', aller: null, duree: 8, produit: 'pieces', qte: 2 }
    },
    'enclos-moutons': {
      nom: "L'enclos à moutons", sprite: '02-neolithique/enclos-moutons', epoque: 2, jusqua: 9, debloque: 'elevage',
      zone: 'pre', cout: 16, bois: 3, largeur: 189,
      travail: { metier: 'berger', aller: null, duree: 9, produit: 'pieces', qte: 2 }
    },
    grenier: {
      nom: 'Le grenier', sprite: '02-neolithique/grenier', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 18, bois: 3, largeur: 141,
      travail: { metier: 'porteur', aller: 'champ', porte: 'ble', duree: 3, produit: 'pieces', qte: 2 }
    },
    'maison-longue': {
      nom: 'Une maison longue', sprite: '02-neolithique/maison-longue', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 24, bois: 4, lits: 5, largeur: 202
    },
    'atelier-potier': {
      nom: "L'atelier du potier", sprite: '02-neolithique/atelier-potier', epoque: 2, jusqua: 9, debloque: 'poterie',
      zone: 'pre', cout: 18, bois: 2, largeur: 167,
      travail: { metier: 'potier', aller: 'riviere', porte: 'argile', duree: 4, produit: 'pieces', qte: 2 }
    },
    meule: {
      nom: 'La meule', sprite: '02-neolithique/meule', epoque: 2, jusqua: 9, debloque: 'meule',
      zone: 'pre', cout: 16, bois: 1, largeur: 119,
      travail: { metier: 'meunier', aller: 'champ', porte: 'ble', duree: 5, produit: 'pieces', qte: 2 }
    },
    pirogue: {
      nom: 'Une pirogue', sprite: '02-neolithique/pirogue', epoque: 2, jusqua: 9,
      zone: 'plage', cout: 12, bois: 2, largeur: 150,
      travail: { metier: 'pecheur', aller: 'plage', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    passerelle: {
      nom: 'La passerelle', sprite: '02-neolithique/passerelle', epoque: 2, jusqua: 9,
      zone: 'gue', cout: null, bois: 3, largeur: 176, automatique: true
    }
  };

  // L'allure d'un habitant selon son métier et l'époque
  var allures = {
    1: {
      sage: 'sage', bucheron: 'porteur-bois', cueilleur: 'cueilleuse', tailleur: 'chasseur',
      chasseur: 'chasseur', pecheur: 'chasseur', peintre: 'cueilleuse',
      adulte: ['porteur-bois', 'cueilleuse', 'chasseur'], enfant: 'enfant-pierre'
    },
    2: {
      sage: 'sage', bucheron: 'paysan', cueilleur: 'porteuse-jarre', tailleur: 'paysan',
      chasseur: 'paysan', pecheur: 'paysan', peintre: 'porteuse-jarre',
      paysan: 'paysan', berger: 'berger', porteur: 'paysan', potier: 'porteuse-jarre', meunier: 'porteuse-jarre',
      adulte: ['paysan', 'porteuse-jarre'], enfant: 'berger'
    }
  };

  return { epoques: epoques, decouvertes: decouvertes, batiments: batiments, allures: allures };
})();
if (typeof module !== 'undefined') module.exports = Donnees;

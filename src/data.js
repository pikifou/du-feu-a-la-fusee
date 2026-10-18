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
      explication: "Le cercle des anciens. Le sage s'y assoit pour réfléchir. Ses idées servent à faire des découvertes.",
      vignettes: [{ img: 'sage', texte: "Le soir, le sage réfléchit près du cercle de pierres. Il a des idées !" }],
      nom: 'Le cercle des anciens', sprite: '01-pierre/cercle-pierres', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 210, taille: 2,
      travail: { metier: 'sage', aller: null, duree: 12, produit: 'idees', qte: 1 }
    },
    'tas-bois': {
      explication: 'Le tas de bois. Le bûcheron coupe les arbres de la forêt et rapporte les bûches. Le bois sert à construire et à faire du feu.',
      vignettes: [{ img: 'bois', texte: "Avec sa hache de pierre, le bûcheron abat un arbre, puis il range les bûches." }],
      nom: 'Le tas de bois', sprite: '01-pierre/tas-bois', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 130, taille: 1,
      travail: { metier: 'bucheron', aller: 'foret', porte: 'bois', duree: 4, produit: 'pieces', qte: 1 }
    },
    tente: {
      explication: "Une tente en peaux tendues sur des bâtons. Deux personnes y dorment à l'abri du vent. Plus il y a de maisons, plus de familles viennent vivre au village.",
      nom: 'Une tente', sprite: '01-pierre/tente', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 5, bois: 2, lits: 2, largeur: 200, taille: 2, ameliore: 'maison-torchis'
    },
    'hutte-branches': {
      explication: 'Une hutte de branches entrecroisées. Trois personnes peuvent y dormir.',
      nom: 'Une hutte de branches', sprite: '01-pierre/hutte-branches', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 8, bois: 3, lits: 3, largeur: 205, taille: 2, ameliore: 'maison-torchis'
    },
    'buisson-baies': {
      explication: "Un buisson de baies. La cueilleuse ramasse les fruits sauvages : c'était une grande partie de la nourriture des premiers humains.",
      vignettes: [{ img: 'baies', texte: "La cueilleuse remplit son panier de baies sauvages." }],
      nom: 'Un buisson de baies', sprite: '01-pierre/buisson-baies', epoque: 1, jusqua: 9,
      zone: 'pre', cout: 6, bois: 1, largeur: 110, taille: 1,
      travail: { metier: 'cueilleur', aller: null, duree: 7, produit: 'pieces', qte: 1 }
    },
    'atelier-silex': {
      explication: "L'atelier du tailleur, près de la grotte. Il frappe le silex avec un caillou pour faire des lames, des grattoirs et des pointes bien tranchantes.",
      vignettes: [{ img: 'silex', texte: "Le tailleur frappe le silex avec un caillou : les éclats tranchants deviennent des pointes de lance et des couteaux." }],
      nom: "L'atelier de silex", sprite: '01-pierre/atelier-silex', epoque: 1, jusqua: 9, debloque: 'outils',
      zone: 'grotte', cout: 10, bois: 2, largeur: 130, taille: 1,
      travail: { metier: 'tailleur', aller: 'grotte', porte: 'silex', duree: 4, produit: 'pieces', qte: 2 }
    },
    feu: {
      explication: 'Le feu de camp. Il réchauffe, il éclaire la nuit, il éloigne les bêtes sauvages et il permet de cuire la viande.',
      vignettes: [{ img: 'veillee', texte: "Le soir, autour du feu, on se réchauffe, on y voit clair et on fait cuire la viande." }],
      nom: 'Un feu de camp', sprite: '01-pierre/feu', epoque: 1, jusqua: 9, debloque: 'feu',
      zone: 'pre', cout: 6, bois: 2, largeur: 105, taille: 1, effet: 'feu'
    },
    'ratelier-lances': {
      explication: 'Le râtelier des chasseurs. On y range les lances. Les chasseurs traversent la rivière pour suivre le mammouth et rapportent de la viande et des peaux.',
      vignettes: [{ img: 'chasse', texte: "Les chasseurs avancent ensemble, cachés dans les hautes herbes, vers le mammouth." }],
      nom: 'Le râtelier des chasseurs', sprite: '01-pierre/ratelier-lances', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'pre', cout: 10, bois: 2, largeur: 125, taille: 1,
      travail: { metier: 'chasseur', aller: 'mammouth', porte: 'viande', duree: 6, produit: 'pieces', qte: 2 }
    },
    'sechoir-poissons': {
      explication: "Le séchoir à poissons, au bord de l'eau. Le pêcheur attrape les poissons, puis on les fait sécher pour pouvoir les garder longtemps.",
      vignettes: [{ img: 'peche', texte: "Le pêcheur attrape les poissons avec sa lance, puis on les fait sécher sur des bâtons." }],
      nom: 'Le séchoir à poissons', sprite: '01-pierre/sechoir-poissons', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'rive', cout: 10, bois: 2, largeur: 140, taille: 1,
      travail: { metier: 'pecheur', aller: 'riviere', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    'hutte-peaux': {
      explication: 'Une grande hutte couverte de peaux cousues entre elles. Bien chaude, elle accueille trois personnes, même en hiver.',
      nom: 'Une hutte en peaux', sprite: '01-pierre/hutte-peaux', epoque: 1, jusqua: 1, debloque: 'abri',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 220, taille: 2, ameliore: 'maison-longue'
    },
    'peintures-rupestres': {
      explication: 'La grotte peinte. À la lumière du feu, on peint les animaux et les chasses sur la roche. Ces dessins racontent nos histoires et donnent des idées.',
      vignettes: [{ img: 'peinture', texte: "À la lumière d'une torche, on peint les animaux sur la paroi de la grotte." }],
      nom: 'La grotte peinte', sprite: '01-pierre/peintures-rupestres', epoque: 1, jusqua: 9, debloque: 'peinture',
      zone: 'grotte', cout: 12, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'peintre', aller: null, duree: 14, produit: 'idees', qte: 2 }
    },
    'maison-torchis': {
      explication: "Une maison en torchis : de la terre, de la paille et de l'eau collées sur des branches. Les paysans y vivent toute l'année, près de leurs champs.",
      vignettes: [{ img: 'torchis', texte: "On tresse des branches, puis on les couvre de terre mêlée de paille : c'est le torchis." }],
      nom: 'Une maison en torchis', sprite: '02-neolithique/maison-torchis', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 215, taille: 2
    },
    'champ-ble': {
      explication: "Un champ de blé. Le paysan sème les graines, puis récolte les épis. Avec les champs, on n'a plus besoin de partir chercher à manger.",
      vignettes: [{ img: 'semer', texte: "Le paysan sème les graines de blé dans la terre." }, { img: 'moisson', texte: "Quand le blé est doré, on le coupe avec une faucille et on fait des gerbes." }],
      nom: 'Un champ de blé', sprite: '02-neolithique/champ-ble', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 12, bois: 1, largeur: 240, taille: 2,
      travail: { metier: 'paysan', aller: null, duree: 8, produit: 'pieces', qte: 2 }
    },
    'enclos-moutons': {
      explication: "L'enclos à moutons. Le berger garde les moutons : ils donnent de la laine pour les vêtements, et du lait.",
      vignettes: [{ img: 'enclos', texte: "Le berger garde les moutons dans l'enclos." }],
      nom: "L'enclos à moutons", sprite: '02-neolithique/enclos-moutons', epoque: 2, jusqua: 9, debloque: 'elevage',
      zone: 'pre', cout: 16, bois: 3, largeur: 240, taille: 2,
      travail: { metier: 'berger', aller: null, duree: 9, produit: 'pieces', qte: 2 }
    },
    grenier: {
      explication: "Le grenier sur pilotis. On y range le blé en hauteur, au sec et loin des souris, pour en avoir tout l'hiver.",
      vignettes: [{ img: 'grenier', texte: "Le grenier est sur pilotis : les souris ne peuvent pas monter manger le blé." }],
      nom: 'Le grenier', sprite: '02-neolithique/grenier', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 18, bois: 3, largeur: 140, taille: 1,
      travail: { metier: 'porteur', aller: 'champ', porte: 'ble', duree: 3, produit: 'pieces', qte: 2 }
    },
    'maison-longue': {
      explication: "Une maison longue. Plusieurs familles vivent ensemble sous le même toit : jusqu'à cinq personnes.",
      vignettes: [{ img: 'torchis', texte: "Tout le monde aide à construire la maison : branches tressées, terre et toit de paille." }],
      nom: 'Une maison longue', sprite: '02-neolithique/maison-longue', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 24, bois: 4, lits: 5, largeur: 250, taille: 2
    },
    'atelier-potier': {
      explication: "L'atelier du potier. Il prend de l'argile au bord de la rivière, façonne des pots et les cuit dans le four pour qu'ils deviennent durs.",
      vignettes: [{ img: 'poterie', texte: "La potière façonne l'argile, puis elle cuit les pots dans le four." }],
      nom: "L'atelier du potier", sprite: '02-neolithique/atelier-potier', epoque: 2, jusqua: 9, debloque: 'poterie',
      zone: 'pre', cout: 18, bois: 2, largeur: 210, taille: 2,
      travail: { metier: 'potier', aller: 'riviere', porte: 'argile', duree: 4, produit: 'pieces', qte: 2 }
    },
    meule: {
      explication: 'La meule. On écrase les grains de blé entre deux pierres pour faire de la farine. Avec la farine, on fait du pain.',
      vignettes: [{ img: 'meule', texte: "On écrase les grains entre deux pierres : ça fait de la farine pour le pain." }],
      nom: 'La meule', sprite: '02-neolithique/meule', epoque: 2, jusqua: 9, debloque: 'meule',
      zone: 'pre', cout: 16, bois: 1, largeur: 120, taille: 1,
      travail: { metier: 'meunier', aller: 'champ', porte: 'ble', duree: 5, produit: 'pieces', qte: 2 }
    },
    pirogue: {
      explication: "Une pirogue, creusée dans un seul tronc d'arbre. Le pêcheur part pêcher en mer.",
      vignettes: [{ img: 'pirogue', texte: "En pirogue, le pêcheur part en mer et remonte son filet plein de poissons." }],
      nom: 'Une pirogue', sprite: '02-neolithique/pirogue', epoque: 2, jusqua: 9,
      zone: 'plage', cout: 12, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'pecheur', aller: 'plage', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    passerelle: {
      explication: 'La passerelle en bois. Plus besoin de se mouiller les pieds pour traverser la rivière !',
      nom: 'La passerelle', sprite: '02-neolithique/passerelle', epoque: 2, jusqua: 9,
      zone: 'gue', cout: null, bois: 3, largeur: 230, taille: 1, automatique: true
    }
  };

  // La pose d'un habitant qui travaille à son poste (ADR-017), selon l'époque.
  // Sans pose, il garde son allure et se balance.
  var poses = {
    1: { sage: 'sage-assis', bucheron: 'bucheron', cueilleur: 'cueilleuse', tailleur: 'tailleur', chasseur: 'chasseur', pecheur: 'pecheur', peintre: 'peintre' },
    2: { sage: 'sage-assis', paysan: 'paysan-faucille', porteur: 'paysan-faucille', berger: 'berger-agneau', potier: 'potiere', meunier: 'meuniere' }
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

  return { epoques: epoques, decouvertes: decouvertes, batiments: batiments, allures: allures, poses: poses };
})();
if (typeof module !== 'undefined') module.exports = Donnees;

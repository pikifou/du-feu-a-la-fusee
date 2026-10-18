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
      scene: 'scenes/outils', faits: ["Les plus vieux outils de pierre connus ont plus de 3 millions d'années !", "Le silex se casse en éclats très tranchants : ça coupe aussi bien qu'un couteau.", "Pour tailler, on frappait le silex avec un galet ou avec un bois de cerf."],
      nom: 'Les outils', epoque: 1, idees: 4, prerequis: [], icone: '01-pierre/atelier-silex',
      texte: "Avant, on n'arrivait pas à couper le bois ni la viande. Maintenant, on tape une pierre contre une autre pour faire des outils qui coupent !"
    },
    feu: {
      scene: 'scenes/feu', faits: ["Pour allumer un feu, on frottait très vite deux morceaux de bois, ou on frappait deux pierres pour faire des étincelles.", "Les loups et les ours ont peur du feu : il protège le camp pendant la nuit.", "La viande cuite est plus tendre et plus facile à manger."],
      nom: 'Le feu', epoque: 1, idees: 4, prerequis: [], icone: '01-pierre/feu',
      texte: "Avant, il faisait froid et tout noir la nuit. Maintenant, grâce au feu, on a chaud, on y voit, et on cuit la viande !"
    },
    chasse: {
      scene: 'scenes/chasse', faits: ["Les chasseurs partaient en groupe : à plusieurs, on est plus forts et plus malins.", "Avec un propulseur, un bâton spécial, on lance la sagaie bien plus loin.", "On ne gaspillait rien : la viande pour manger, la peau pour s'habiller, les os pour faire des outils."],
      nom: 'La chasse et la pêche', epoque: 1, idees: 7, prerequis: ['outils'], icone: '01-pierre/ratelier-lances',
      texte: "Avant, on avait souvent faim. Maintenant, avec des lances, on chasse dans la forêt et on pêche dans la rivière !"
    },
    abri: {
      scene: 'scenes/abri', faits: ["Avec une aiguille en os, on cousait les peaux de bêtes pour faire des habits et des huttes.", "Là où il n'y avait presque pas d'arbres, on a construit des huttes avec des os de mammouth !", "Dans la hutte, bien au chaud, on dormait sur des fourrures."],
      nom: 'Les huttes en peaux', epoque: 1, idees: 7, prerequis: ['chasse'], icone: '01-pierre/hutte-peaux',
      texte: "Avant, on dormait sous des branches et le vent passait. Maintenant, on coud des peaux de bêtes pour faire des huttes bien chaudes !"
    },
    peinture: {
      scene: 'scenes/peinture', faits: ["Dans la grotte Chauvet, en France, il y a des dessins de plus de 30 000 ans !", "Les couleurs venaient de la terre (l'ocre, rouge ou jaune) et du charbon de bois (le noir).", "Pour dessiner sa main, on soufflait de la couleur tout autour : ce sont des mains négatives."],
      nom: 'La peinture', epoque: 1, idees: 9, prerequis: ['feu'], icone: '01-pierre/peintures-rupestres',
      texte: "Avant, on oubliait nos histoires. Maintenant, à la lumière du feu, on les peint sur les murs de la grotte !"
    },
    agriculture: {
      scene: 'scenes/agriculture', faits: ["Les premiers champs sont apparus il y a plus de 10 000 ans, au Proche-Orient.", "On cultivait le blé, l'orge, les lentilles et les pois.", "Avec les champs, on n'a plus besoin de voyager : les premiers villages sont nés."],
      nom: "L'agriculture", epoque: 2, idees: 9, prerequis: [], icone: '02-neolithique/champ-ble',
      texte: "Avant, il fallait marcher toute la journée pour trouver à manger. Maintenant, on plante des graines, le blé pousse, et on peut rester au même endroit !"
    },
    elevage: {
      scene: 'scenes/elevage', faits: ["Les moutons et les chèvres sont parmi les tout premiers animaux apprivoisés, il y a environ 10 000 ans.", "Le chien, lui, était déjà l'ami des humains bien avant, au temps des chasseurs.", "Les animaux donnent du lait et de la viande, et plus tard de la laine pour tisser des habits."],
      nom: "L'élevage", epoque: 2, idees: 9, prerequis: ['chasse'], icone: '02-neolithique/enclos-moutons',
      texte: "Avant, il fallait courir après les animaux. Maintenant, on garde des moutons dans un enclos : on a de la laine et du lait !"
    },
    grenier: {
      scene: 'scenes/grenier', faits: ["Avec une réserve de grain, on peut manger même en hiver, quand rien ne pousse.", "Sur ses pilotis, le grenier reste au sec, et les souris ont bien du mal à y monter.", "On garde aussi les plus belles graines, pour les semer l'année suivante."],
      nom: 'Le grenier', epoque: 2, idees: 12, prerequis: ['agriculture'], icone: '02-neolithique/grenier',
      texte: "Avant, les souris mangeaient notre blé. Maintenant, on le range bien au sec, en hauteur, dans un grenier !"
    },
    poterie: {
      scene: 'scenes/poterie', faits: ["L'argile molle devient dure comme la pierre quand on la cuit dans un four très chaud.", "Les plus vieilles poteries connues ont été trouvées en Chine : elles ont environ 20 000 ans.", "Dans les pots, on garde l'eau et le grain, et on peut faire cuire la soupe."],
      nom: 'La poterie', epoque: 2, idees: 12, prerequis: ['feu', 'agriculture'], icone: '02-neolithique/atelier-potier',
      texte: "Avant, on ne pouvait rien garder ni transporter. Maintenant, on cuit de l'argile dans le feu pour faire des pots !"
    },
    meule: {
      scene: 'scenes/meule', faits: ["La meule, c'est une pierre plate et une autre pierre qu'on fait glisser dessus, d'avant en arrière.", "Il fallait des heures pour moudre la farine d'une seule journée !", "Avec la farine et un peu d'eau, on faisait des galettes cuites sur une pierre chaude."],
      nom: 'La meule', epoque: 2, idees: 12, prerequis: ['agriculture'], icone: '02-neolithique/meule',
      texte: "Avant, on ne pouvait pas manger le blé tout dur. Maintenant, on l'écrase entre deux pierres : ça fait de la farine, et avec la farine, du pain !"
    }
  };

  // Grandes pages qui ne sont pas des découvertes (ADR-018)
  var pages = {
    cueilleurs: {
      nom: 'Les chasseurs-cueilleurs', epoque: 1, scene: 'scenes/cueilleurs',
      texte: "Au tout début, on vit de ce que donne la nature : on cueille des baies, on ramasse du bois, et le sage réfléchit pour trouver de nouvelles idées.",
      faits: ["Pendant très, très longtemps, les humains n'avaient ni champs ni animaux : ils cueillaient et chassaient pour manger.",
        "Ils se déplaçaient souvent, en suivant les saisons et les troupeaux.",
        "Les plus âgés apprenaient aux plus jeunes tout ce qu'ils savaient, en racontant des histoires."]
    },
    pirogue: {
      nom: 'La pirogue', epoque: 2, scene: 'vignettes/pirogue',
      texte: "Avant, on ne pouvait pêcher que depuis la rive. Maintenant, on creuse un grand tronc d'arbre et on part sur l'eau !",
      faits: ["L'une des plus vieilles pirogues connues a été trouvée aux Pays-Bas : elle a environ 10 000 ans.",
        "Pour la creuser, on brûlait un peu le bois, puis on grattait avec des outils de pierre.",
        "Avec la pirogue, on pêche plus loin et on transporte des choses sur l'eau."]
    }
  };

  // Bâtiments. largeur = taille à l'écran en pixels du plateau.
  // travail : le métier, où l'habitant va (aller), ce qu'il rapporte (porte),
  // combien de temps il travaille (duree, secondes) et ce que ça produit.
  var batiments = {
    'cercle-pierres': {
      resume: "Le sage y réfléchit et trouve des idées 💡.", page: 'cueilleurs',
      explication: "Le cercle des anciens. Le sage s'y assoit pour réfléchir. Ses idées servent à faire des découvertes.",
      vignettes: [{ img: 'sage', texte: "Le soir, le sage réfléchit près du cercle de pierres. Il a des idées !" }],
      nom: 'Le cercle des anciens', sprite: '01-pierre/cercle-pierres', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 210, taille: 2,
      travail: { metier: 'sage', aller: null, duree: 12, produit: 'idees', qte: 1 }
    },
    'tas-bois': {
      resume: "Le bûcheron y range le bois coupé dans la forêt.", page: 'cueilleurs',
      explication: 'Le tas de bois. Le bûcheron coupe les arbres de la forêt et rapporte les bûches. Le bois sert à construire et à faire du feu.',
      vignettes: [{ img: 'bois', texte: "Avec sa hache de pierre, le bûcheron abat un arbre, puis il range les bûches." }],
      nom: 'Le tas de bois', sprite: '01-pierre/tas-bois', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, largeur: 130, taille: 1,
      travail: { metier: 'bucheron', aller: 'foret', porte: 'bois', duree: 4, produit: 'pieces', qte: 1 }
    },
    tente: {
      resume: "Une petite maison pour 2 personnes.", page: 'cueilleurs',
      explication: "Une tente en peaux tendues sur des bâtons. Deux personnes y dorment à l'abri du vent. Plus il y a de maisons, plus de familles viennent vivre au village.",
      nom: 'Une tente', sprite: '01-pierre/tente', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 5, bois: 2, lits: 2, largeur: 200, taille: 2, ameliore: 'maison-torchis'
    },
    'hutte-branches': {
      resume: "Une maison de branches pour 3 personnes.", page: 'cueilleurs',
      explication: 'Une hutte de branches entrecroisées. Trois personnes peuvent y dormir.',
      nom: 'Une hutte de branches', sprite: '01-pierre/hutte-branches', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 8, bois: 3, lits: 3, largeur: 205, taille: 2, ameliore: 'maison-torchis'
    },
    'buisson-baies': {
      resume: "La cueilleuse y ramasse des baies.", page: 'cueilleurs',
      explication: "Un buisson de baies. La cueilleuse ramasse les fruits sauvages : c'était une grande partie de la nourriture des premiers humains.",
      vignettes: [{ img: 'baies', texte: "La cueilleuse remplit son panier de baies sauvages." }],
      nom: 'Un buisson de baies', sprite: '01-pierre/buisson-baies', epoque: 1, jusqua: 9,
      zone: 'pre', cout: 6, bois: 1, largeur: 110, taille: 1,
      travail: { metier: 'cueilleur', aller: null, duree: 7, produit: 'pieces', qte: 1 }
    },
    'atelier-silex': {
      resume: "On y taille le silex pour faire des outils.",
      explication: "L'atelier du tailleur, près de la grotte. Il frappe le silex avec un caillou pour faire des lames, des grattoirs et des pointes bien tranchantes.",
      vignettes: [{ img: 'silex', texte: "Le tailleur frappe le silex avec un caillou : les éclats tranchants deviennent des pointes de lance et des couteaux." }],
      nom: "L'atelier de silex", sprite: '01-pierre/atelier-silex', epoque: 1, jusqua: 9, debloque: 'outils',
      zone: 'grotte', cout: 10, bois: 2, largeur: 130, taille: 1,
      travail: { metier: 'tailleur', aller: 'grotte', porte: 'silex', duree: 4, produit: 'pieces', qte: 2 }
    },
    feu: {
      resume: "Il chauffe et éclaire : on peut veiller le soir.",
      explication: 'Le feu de camp. Il réchauffe, il éclaire la nuit, il éloigne les bêtes sauvages et il permet de cuire la viande.',
      vignettes: [{ img: 'veillee', texte: "Le soir, autour du feu, on se réchauffe, on y voit clair et on fait cuire la viande." }],
      nom: 'Un feu de camp', sprite: '01-pierre/feu', epoque: 1, jusqua: 9, debloque: 'feu',
      zone: 'pre', cout: 6, bois: 2, largeur: 105, taille: 1, effet: 'feu'
    },
    'ratelier-lances': {
      resume: "Les chasseurs y prennent leurs lances.",
      explication: 'Le râtelier des chasseurs. On y range les lances. Les chasseurs traversent la rivière pour suivre le mammouth et rapportent de la viande et des peaux.',
      vignettes: [{ img: 'chasse', texte: "Les chasseurs avancent ensemble, cachés dans les hautes herbes, vers le mammouth." }],
      nom: 'Le râtelier des chasseurs', sprite: '01-pierre/ratelier-lances', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'pre', cout: 10, bois: 2, largeur: 125, taille: 1,
      travail: { metier: 'chasseur', aller: 'mammouth', porte: 'viande', duree: 6, produit: 'pieces', qte: 2 }
    },
    'sechoir-poissons': {
      resume: "On y fait sécher les poissons du pêcheur.",
      explication: "Le séchoir à poissons, au bord de l'eau. Le pêcheur attrape les poissons, puis on les fait sécher pour pouvoir les garder longtemps.",
      vignettes: [{ img: 'peche', texte: "Le pêcheur attrape les poissons avec sa lance, puis on les fait sécher sur des bâtons." }],
      nom: 'Le séchoir à poissons', sprite: '01-pierre/sechoir-poissons', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'rive', cout: 10, bois: 2, largeur: 140, taille: 1,
      travail: { metier: 'pecheur', aller: 'riviere', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    'hutte-peaux': {
      resume: "Une maison chaude en peaux, pour 3 personnes.",
      explication: 'Une grande hutte couverte de peaux cousues entre elles. Bien chaude, elle accueille trois personnes, même en hiver.',
      nom: 'Une hutte en peaux', sprite: '01-pierre/hutte-peaux', epoque: 1, jusqua: 1, debloque: 'abri',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 220, taille: 2, ameliore: 'maison-longue'
    },
    'peintures-rupestres': {
      resume: "On peint nos histoires sur la roche.",
      explication: 'La grotte peinte. À la lumière du feu, on peint les animaux et les chasses sur la roche. Ces dessins racontent nos histoires et donnent des idées.',
      vignettes: [{ img: 'peinture', texte: "À la lumière d'une torche, on peint les animaux sur la paroi de la grotte." }],
      nom: 'La grotte peinte', sprite: '01-pierre/peintures-rupestres', epoque: 1, jusqua: 9, debloque: 'peinture',
      zone: 'grotte', cout: 12, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'peintre', aller: null, duree: 14, produit: 'idees', qte: 2 }
    },
    'maison-torchis': {
      resume: "Une maison en terre et en paille, pour 3 personnes.",
      explication: "Une maison en torchis : de la terre, de la paille et de l'eau collées sur des branches. Les paysans y vivent toute l'année, près de leurs champs.",
      vignettes: [{ img: 'torchis', texte: "On tresse des branches, puis on les couvre de terre mêlée de paille : c'est le torchis." }],
      nom: 'Une maison en torchis', sprite: '02-neolithique/maison-torchis', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 14, bois: 3, lits: 3, largeur: 215, taille: 2
    },
    'champ-ble': {
      resume: "Le paysan y sème et récolte le blé.",
      explication: "Un champ de blé. Le paysan sème les graines, puis récolte les épis. Avec les champs, on n'a plus besoin de partir chercher à manger.",
      vignettes: [{ img: 'semer', texte: "Le paysan sème les graines de blé dans la terre." }, { img: 'moisson', texte: "Quand le blé est doré, on le coupe avec une faucille et on fait des gerbes." }],
      nom: 'Un champ de blé', sprite: '02-neolithique/champ-ble', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 12, bois: 1, largeur: 240, taille: 2,
      travail: { metier: 'paysan', aller: null, duree: 8, produit: 'pieces', qte: 2 }
    },
    'enclos-moutons': {
      resume: "Le berger y garde les moutons et les chèvres.",
      explication: "L'enclos à moutons. Le berger garde les moutons : ils donnent de la laine pour les vêtements, et du lait.",
      vignettes: [{ img: 'enclos', texte: "Le berger garde les moutons dans l'enclos." }],
      nom: "L'enclos à moutons", sprite: '02-neolithique/enclos-moutons', epoque: 2, jusqua: 9, debloque: 'elevage',
      zone: 'pre', cout: 16, bois: 3, largeur: 240, taille: 2,
      travail: { metier: 'berger', aller: null, duree: 9, produit: 'pieces', qte: 2 }
    },
    grenier: {
      resume: "On y garde le blé au sec, loin des souris.",
      explication: "Le grenier sur pilotis. On y range le blé en hauteur, au sec et loin des souris, pour en avoir tout l'hiver.",
      vignettes: [{ img: 'grenier', texte: "Le grenier est sur pilotis : les souris ne peuvent pas monter manger le blé." }],
      nom: 'Le grenier', sprite: '02-neolithique/grenier', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 18, bois: 3, largeur: 140, taille: 1,
      travail: { metier: 'porteur', aller: 'champ', porte: 'ble', duree: 3, produit: 'pieces', qte: 2 }
    },
    'maison-longue': {
      resume: "Une grande maison pour 5 personnes.",
      explication: "Une maison longue. Plusieurs familles vivent ensemble sous le même toit : jusqu'à cinq personnes.",
      vignettes: [{ img: 'torchis', texte: "Tout le monde aide à construire la maison : branches tressées, terre et toit de paille." }],
      nom: 'Une maison longue', sprite: '02-neolithique/maison-longue', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 24, bois: 4, lits: 5, largeur: 250, taille: 2
    },
    'atelier-potier': {
      resume: "La potière y fait des pots en terre cuite.",
      explication: "L'atelier du potier. Il prend de l'argile au bord de la rivière, façonne des pots et les cuit dans le four pour qu'ils deviennent durs.",
      vignettes: [{ img: 'poterie', texte: "La potière façonne l'argile, puis elle cuit les pots dans le four." }],
      nom: "L'atelier du potier", sprite: '02-neolithique/atelier-potier', epoque: 2, jusqua: 9, debloque: 'poterie',
      zone: 'pre', cout: 18, bois: 2, largeur: 210, taille: 2,
      travail: { metier: 'potier', aller: 'riviere', porte: 'argile', duree: 4, produit: 'pieces', qte: 2 }
    },
    meule: {
      resume: "On y écrase le blé pour faire de la farine.",
      explication: 'La meule. On écrase les grains de blé entre deux pierres pour faire de la farine. Avec la farine, on fait du pain.',
      vignettes: [{ img: 'meule', texte: "On écrase les grains entre deux pierres : ça fait de la farine pour le pain." }],
      nom: 'La meule', sprite: '02-neolithique/meule', epoque: 2, jusqua: 9, debloque: 'meule',
      zone: 'pre', cout: 16, bois: 1, largeur: 120, taille: 1,
      travail: { metier: 'meunier', aller: 'champ', porte: 'ble', duree: 5, produit: 'pieces', qte: 2 }
    },
    pirogue: {
      resume: "Le pêcheur part sur l'eau dans un tronc creusé.", page: 'pirogue',
      explication: "Une pirogue, creusée dans un seul tronc d'arbre. Le pêcheur part pêcher en mer.",
      vignettes: [{ img: 'pirogue', texte: "En pirogue, le pêcheur part en mer et remonte son filet plein de poissons." }],
      nom: 'Une pirogue', sprite: '02-neolithique/pirogue', epoque: 2, jusqua: 9,
      zone: 'plage', cout: 12, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'pecheur', aller: 'plage', porte: 'poisson', duree: 6, produit: 'pieces', qte: 2 }
    },
    passerelle: {
      resume: "Un pont de bois pour traverser la rivière.",
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

  // Ce qu'on porte dans les bras, selon l'époque (h : homme, f : femme)
  var porteurs = {
    1: { bois: { h: 'e1-bois-h', f: 'e1-bois-f' }, viande: 'e1-viande', poisson: 'e1-poisson', silex: 'e1-silex' },
    2: { bois: { h: 'e2-bois-h', f: 'e2-bois-f' }, ble: { h: 'e2-ble-h', f: 'e2-ble-f' }, argile: { h: 'e2-argile-h', f: 'e2-argile-f' }, poisson: 'e2-poisson' }
  };
  var femmes = ['cueilleuse', 'porteuse-jarre'];

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

  return { epoques: epoques, decouvertes: decouvertes, pages: pages, batiments: batiments, allures: allures, poses: poses, porteurs: porteurs, femmes: femmes };
})();
if (typeof module !== 'undefined') module.exports = Donnees;

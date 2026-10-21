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
      nom: 'Les outils', epoque: 1, idees: 6, prerequis: [], icone: '01-pierre/atelier-silex',
      texte: "Avant, on n'arrivait pas à couper le bois ni la viande. Maintenant, on tape une pierre contre une autre pour faire des outils qui coupent !"
    },
    feu: {
      scene: 'scenes/feu', faits: ["Pour allumer un feu, on frottait très vite deux morceaux de bois, ou on frappait deux pierres pour faire des étincelles.", "Les loups et les ours ont peur du feu : il protège le camp pendant la nuit.", "La viande cuite est plus tendre et plus facile à manger."],
      nom: 'Le feu', epoque: 1, idees: 6, prerequis: [], icone: '01-pierre/feu',
      texte: "Avant, il faisait froid et tout noir la nuit. Maintenant, grâce au feu, on a chaud, on y voit, et on cuit la viande !"
    },
    chasse: {
      scene: 'scenes/chasse', faits: ["Les chasseurs partaient en groupe : à plusieurs, on est plus forts et plus malins.", "Avec un propulseur, un bâton spécial, on lance la sagaie bien plus loin.", "On ne gaspillait rien : la viande pour manger, la peau pour s'habiller, les os pour faire des outils."],
      nom: 'La chasse et la pêche', epoque: 1, idees: 10, prerequis: ['outils'], icone: '01-pierre/ratelier-lances',
      texte: "Avant, on avait souvent faim. Maintenant, avec des lances, on chasse dans la forêt et on pêche dans la rivière !"
    },
    abri: {
      scene: 'scenes/abri', faits: ["Avec une aiguille en os, on cousait les peaux de bêtes pour faire des habits et des huttes.", "Là où il n'y avait presque pas d'arbres, on a construit des huttes avec des os de mammouth !", "Dans la hutte, bien au chaud, on dormait sur des fourrures."],
      nom: 'Les huttes en peaux', epoque: 1, idees: 10, prerequis: ['chasse'], icone: '01-pierre/hutte-peaux',
      texte: "Avant, on dormait sous des branches et le vent passait. Maintenant, on coud des peaux de bêtes pour faire des huttes bien chaudes !"
    },
    peinture: {
      scene: 'scenes/peinture', faits: ["Dans la grotte Chauvet, en France, il y a des dessins de plus de 30 000 ans !", "Les couleurs venaient de la terre (l'ocre, rouge ou jaune) et du charbon de bois (le noir).", "Pour dessiner sa main, on soufflait de la couleur tout autour : ce sont des mains négatives."],
      nom: 'La peinture', epoque: 1, idees: 14, prerequis: ['feu'], icone: '01-pierre/peintures-rupestres',
      texte: "Avant, on oubliait nos histoires. Maintenant, à la lumière du feu, on les peint sur les murs de la grotte !"
    },
    agriculture: {
      scene: 'scenes/agriculture', faits: ["Les premiers champs sont apparus il y a plus de 10 000 ans, au Proche-Orient.", "On cultivait le blé, l'orge, les lentilles et les pois.", "Avec les champs, on n'a plus besoin de voyager : les premiers villages sont nés."],
      nom: "L'agriculture", epoque: 2, idees: 12, prerequis: [], icone: '02-neolithique/champ-ble',
      texte: "Avant, il fallait marcher toute la journée pour trouver à manger. Maintenant, on plante des graines, le blé pousse, et on peut rester au même endroit !"
    },
    elevage: {
      scene: 'scenes/elevage', faits: ["Les moutons et les chèvres sont parmi les tout premiers animaux apprivoisés, il y a environ 10 000 ans.", "Le chien, lui, était déjà l'ami des humains bien avant, au temps des chasseurs.", "Les animaux donnent du lait et de la viande, et plus tard de la laine pour tisser des habits."],
      nom: "L'élevage", epoque: 2, idees: 12, prerequis: ['chasse'], icone: '02-neolithique/enclos-moutons',
      texte: "Avant, il fallait courir après les animaux. Maintenant, on garde des moutons dans un enclos : on a de la laine et du lait !"
    },
    grenier: {
      scene: 'scenes/grenier', faits: ["Avec une réserve de grain, on peut manger même en hiver, quand rien ne pousse.", "Sur ses pilotis, le grenier reste au sec, et les souris ont bien du mal à y monter.", "On garde aussi les plus belles graines, pour les semer l'année suivante."],
      nom: 'Le grenier', epoque: 2, idees: 15, prerequis: ['agriculture'], icone: '02-neolithique/grenier',
      texte: "Avant, les souris mangeaient notre blé. Maintenant, on le range bien au sec, en hauteur, dans un grenier !"
    },
    poterie: {
      scene: 'scenes/poterie', faits: ["L'argile molle devient dure comme la pierre quand on la cuit dans un four très chaud.", "Les plus vieilles poteries connues ont été trouvées en Chine : elles ont environ 20 000 ans.", "Dans les pots, on garde l'eau et le grain, et on peut faire cuire la soupe."],
      nom: 'La poterie', epoque: 2, idees: 15, prerequis: ['feu', 'agriculture'], icone: '02-neolithique/atelier-potier',
      texte: "Avant, on ne pouvait rien garder ni transporter. Maintenant, on cuit de l'argile dans le feu pour faire des pots !"
    },
    meule: {
      scene: 'scenes/meule', faits: ["La meule, c'est une pierre plate et une autre pierre qu'on fait glisser dessus, d'avant en arrière.", "Il fallait des heures pour moudre la farine d'une seule journée !", "Avec la farine et un peu d'eau, on faisait des galettes cuites sur une pierre chaude."],
      nom: 'La meule', epoque: 2, idees: 15, prerequis: ['agriculture'], icone: '02-neolithique/meule',
      texte: "Avant, on ne pouvait pas manger le blé tout dur. Maintenant, on l'écrase entre deux pierres : ça fait de la farine, et avec la farine, du pain !"
    }
  };

  // Grandes pages qui ne sont pas des découvertes (ADR-018)
  var pages = {
    'deco-peinture-chauvet': {
      nom: "Les chevaux de Chauvet", epoque: 1, image: 'deco/peinture-chauvet', deco: true,
      texte: "Dans la grotte Chauvet, en Ardèche, des artistes ont peint des chevaux, des lions et des rhinocéros il y a plus de 30 000 ans.",
      faits: ["La grotte a été découverte en 1994 par trois spéléologues.", "Ce sont parmi les plus anciennes peintures connues au monde."]
    },
    'deco-peinture-lascaux': {
      nom: "Le taureau de Lascaux", epoque: 1, image: 'deco/peinture-lascaux', deco: true,
      texte: "Dans la grotte de Lascaux, en Dordogne, on a peint d'immenses taureaux, des chevaux et des cerfs, il y a environ 18 000 ans.",
      faits: ["Elle a été découverte en 1940 par quatre adolescents… et leur chien Robot !", "Pour la protéger, on visite aujourd'hui une copie de la grotte."]
    },
    'deco-peinture-altamira': {
      nom: "Les bisons d'Altamira", epoque: 1, image: 'deco/peinture-altamira', deco: true,
      texte: "En Espagne, au plafond de la grotte d'Altamira, des bisons rouges et noirs semblent bouger à la lumière des torches.",
      faits: ["C'est une petite fille de 8 ans, María, qui les a vus la première, en 1879.", "Les peintres se servaient des bosses de la roche pour donner du relief aux animaux."]
    },
    'deco-peinture-mains': {
      nom: "Les mains de Gargas", epoque: 1, image: 'deco/peinture-mains', deco: true,
      texte: "Dans la grotte de Gargas, dans les Pyrénées, il y a des centaines de mains peintes, vieilles d'environ 27 000 ans.",
      faits: ["On posait sa main sur la roche et on soufflait de la couleur tout autour.", "Sur certaines mains, des doigts semblent manquer : peut-être des doigts repliés, comme un langage secret."]
    },
    'deco-hutte-mammouth': {
      nom: "La hutte en os de mammouth", epoque: 1, image: 'deco/hutte-mammouth', deco: true,
      texte: "À Mejyritch, en Ukraine, il y a environ 15 000 ans, on a construit des huttes avec des os et des défenses de mammouth.",
      faits: ["Là-bas, il n'y avait presque pas d'arbres : les os remplaçaient le bois.", "Il fallait des dizaines d'os de mammouth pour une seule hutte !"]
    },
    'deco-menhir': {
      nom: "Un menhir", epoque: 2, image: 'deco/menhir', deco: true,
      texte: "Un menhir est une grande pierre dressée. En breton, « men hir » veut dire « pierre longue ».",
      faits: ["On en a dressé beaucoup en Bretagne, il y a plus de 6 000 ans.", "Le plus grand, à Locmariaquer, mesurait 20 mètres : aussi haut qu'un immeuble de six étages !"]
    },
    'deco-statue-menhir': {
      nom: "La Dame de Saint-Sernin", epoque: 2, image: 'deco/statue-menhir', deco: true,
      texte: "Une statue-menhir est une pierre dressée sculptée comme une personne : un visage, des bras, une ceinture.",
      faits: ["La Dame de Saint-Sernin, dans l'Aveyron, a été sculptée il y a environ 5 000 ans.", "C'est l'une des plus anciennes statues de personne en France."]
    },
    'deco-dolmen': {
      nom: "Un dolmen", epoque: 2, image: 'deco/dolmen', deco: true,
      texte: "Un dolmen, c'est une grande pierre plate posée sur des pierres dressées, comme une table géante.",
      faits: ["C'était une tombe : on y déposait les morts, puis on la couvrait de terre et de pierres.", "Le mot vient du breton : « taol » veut dire table, et « men » veut dire pierre."]
    },
    'deco-alignements': {
      nom: "Les alignements de Carnac", epoque: 2, image: 'deco/alignements', deco: true,
      texte: "À Carnac, en Bretagne, des milliers de menhirs sont dressés en longues rangées, depuis plus de 6 000 ans.",
      faits: ["Il y en a environ 3 000 !", "Personne ne sait vraiment à quoi ils servaient : un calendrier, un lieu de fête, un hommage aux ancêtres ?"]
    },
    'deco-cairn': {
      nom: "Le cairn de Barnenez", epoque: 2, image: 'deco/cairn', deco: true,
      texte: "Dans le Finistère, le cairn de Barnenez est un grand monument de pierres sèches, construit il y a environ 6 500 ans.",
      faits: ["À l'intérieur, il y a onze chambres, chacune avec son couloir.", "Il est plus vieux que les pyramides d'Égypte !"]
    },
    'deco-stonehenge': {
      nom: "Stonehenge", epoque: 2, image: 'deco/stonehenge', deco: true,
      texte: "En Angleterre, Stonehenge est un grand cercle de pierres, construit il y a environ 5 000 ans, petit à petit, pendant des siècles.",
      faits: ["Le matin du plus long jour de l'année, le soleil se lève dans l'axe des pierres.", "Certaines pierres viennent du pays de Galles, à plus de 200 kilomètres !"]
    },
    'deco-gobekli-tepe': {
      nom: "Göbekli Tepe", epoque: 2, image: 'deco/gobekli-tepe', deco: true,
      texte: "En Turquie, Göbekli Tepe est un cercle de grands piliers sculptés de renards, de sangliers et de vautours, élevé il y a environ 11 500 ans.",
      faits: ["C'est l'un des plus vieux grands monuments connus, bien plus ancien que Stonehenge.", "Il a été construit par des chasseurs-cueilleurs, juste avant que l'agriculture se répande."]
    },
    'deco-bruniquel': {
      nom: "Les cercles de Bruniquel", epoque: 1, image: 'deco/bruniquel', deco: true,
      texte: "Il y a 176 000 ans, bien avant les premières peintures, des Néandertaliens sont entrés tout au fond d'une grotte, à Bruniquel, en France. À la lumière du feu, ils ont cassé des stalagmites et les ont rangées en grands cercles.",
      faits: ["On a compté environ 400 morceaux de stalagmites, rangés en deux grands cercles.", "Des traces de feu montrent qu'ils s'éclairaient pour travailler dans le noir.", "C'est l'une des plus vieilles constructions humaines connues. À quoi servaient ces cercles ? C'est encore un mystère !"]
    },
    'deco-homme-lion': {
      nom: "L'homme-lion", epoque: 1, image: 'deco/homme-lion', deco: true,
      texte: "Il y a environ 40 000 ans, quelqu'un a sculpté dans une défense de mammouth un personnage debout, avec une tête de lion. On l'a retrouvé en morceaux dans une grotte d'Allemagne.",
      faits: ["Il mesure à peu près 30 centimètres, comme une grande règle.", "Il a fallu des centaines d'heures pour le sculpter avec des outils de silex.", "C'est l'une des plus vieilles sculptures du monde."]
    },
    'deco-bisons-argile': {
      nom: "Les bisons d'argile", epoque: 1, image: 'deco/bisons-argile', deco: true,
      texte: "Il y a environ 15 000 ans, au fond de la grotte du Tuc d'Audoubert, en Ariège, des artistes ont modelé deux bisons en argile, appuyés contre un rocher. Ils sont toujours là !",
      faits: ["Chaque bison mesure environ 60 centimètres de long.", "On voit encore les traces des doigts qui ont lissé l'argile.", "La grotte est fermée au public pour protéger les bisons."]
    },
    'deco-peinture-lions': {
      nom: "Les lions de Chauvet", epoque: 1, image: 'deco/peinture-lions', deco: true,
      texte: "Dans la grotte Chauvet, il y a environ 36 000 ans, des artistes ont dessiné au charbon de bois toute une troupe de lions des cavernes, qui semblent chasser ensemble.",
      faits: ["Sur les dessins, les lions n'ont pas de crinière.", "Les lions des cavernes étaient plus grands que les lions d'aujourd'hui."]
    },
    'deco-peinture-cerfs': {
      nom: "Les cerfs de Lascaux", epoque: 1, image: 'deco/peinture-cerfs', deco: true,
      texte: "Dans la grotte de Lascaux, les artistes ont peint de grands cerfs aux bois immenses, en noir et en rouge.",
      faits: ["Sur une paroi, une rangée de têtes de cerfs semble traverser une rivière à la nage !", "Ces peintures ont environ 17 000 ans.", "Pour peindre, on écrasait des pierres colorées, comme l'ocre, et on les mélangeait avec de l'eau ou de la graisse."]
    },
    'deco-menhir-brise': {
      nom: "Le grand menhir brisé", epoque: 2, image: 'deco/menhir-brise', deco: true,
      texte: "Il y a près de 7 000 ans, à Locmariaquer en Bretagne, on a dressé le plus grand menhir connu : plus de 20 mètres de haut ! Aujourd'hui, il est couché par terre, cassé en quatre morceaux.",
      faits: ["Il pèse à peu près 280 tonnes, autant que 50 éléphants.", "La pierre a été apportée de plusieurs kilomètres, sans roues ni machines."]
    },
    'deco-gavrinis': {
      nom: "La pierre gravée de Gavrinis", epoque: 2, image: 'deco/gavrinis', deco: true,
      texte: "Sur l'île de Gavrinis, en Bretagne, un couloir de pierre est couvert de gravures : des spirales, des vagues et des lignes qui tournent comme des empreintes de doigts.",
      faits: ["Ces gravures ont environ 5 500 ans.", "Les sculpteurs n'avaient pas de métal : ils gravaient avec des outils en pierre très dure, comme le quartz."]
    },
    'deco-cromlech': {
      nom: "Un cromlech", epoque: 2, image: 'deco/cromlech', deco: true,
      texte: "Un cromlech, c'est un cercle de pierres dressées. Il y en a beaucoup en Bretagne et en Grande-Bretagne.",
      faits: ["À Er Lannic, en Bretagne, il y a deux cromlechs : l'un est aujourd'hui à moitié sous la mer !", "On pense que ces cercles servaient à se rassembler et à suivre le soleil."]
    },
    'deco-ain-ghazal': {
      nom: "La statue d'Aïn Ghazal", epoque: 2, image: 'deco/ain-ghazal', deco: true,
      texte: "À Aïn Ghazal, en Jordanie, il y a environ 9 000 ans, on fabriquait de grandes statues en plâtre, avec de grands yeux soulignés de noir.",
      faits: ["À l'intérieur, il y avait une armature de roseaux.", "On en a retrouvé une trentaine, enterrées avec soin."]
    },
    'deco-skara-brae': {
      nom: "La maison de Skara Brae", epoque: 2, image: 'deco/skara-brae', deco: true,
      texte: "Skara Brae est un village de maisons en pierre, en Écosse, sur les îles Orcades. Il a environ 5 000 ans.",
      faits: ["Dans les maisons, même les meubles sont en pierre : les lits, les buffets et le foyer.", "Le village a été découvert en 1850, quand une grande tempête a emporté le sable qui le recouvrait."]
    },
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
      zone: 'pre', cout: null, prixNiveau: 60, largeur: 210, taille: 2,
      travail: { metier: 'sage', aller: null, duree: 12, produit: 'idees', qte: 1 }
    },
    'tas-bois': {
      resume: "On y range le bois rapporté de la forêt.", page: 'cueilleurs',
      explication: "Le tas de bois. Au début, on ramasse les branches tombées dans la forêt. Avec une hache de pierre, le bûcheron pourra couper les arbres. Le bois sert à construire et à faire du feu.",
      vignettes: [{ img: 'bois', texte: "Avec sa hache de pierre, le bûcheron abat un arbre, puis il range les bûches." }],
      nom: 'Le tas de bois', sprite: '01-pierre/tas-bois', epoque: 1, jusqua: 9,
      zone: 'pre', cout: null, prixNiveau: 40, largeur: 130, taille: 1,
      travail: { metier: 'bucheron', aller: 'foret', porte: 'bois', duree: 4, produit: 'pieces', qte: { 1: 3, 2: 6 } }
    },
    tente: {
      evolue: [{ vers: 'hutte-peaux', cout: 30, decouverte: 'abri' }, { vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }],
      resume: "Une petite maison pour 2 personnes.", page: 'cueilleurs',
      explication: "Une tente en peaux tendues sur des bâtons. Deux personnes y dorment à l'abri du vent. Plus il y a de maisons, plus de familles viennent vivre au village.",
      nom: 'Une tente', sprite: '01-pierre/tente', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 10, bois: 2, lits: 2, largeur: 200, taille: 2
    },
    'hutte-branches': {
      evolue: [{ vers: 'hutte-peaux', cout: 30, decouverte: 'abri' }, { vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }],
      resume: "Une maison de branches pour 3 personnes.", page: 'cueilleurs',
      explication: 'Une hutte de branches entrecroisées. Trois personnes peuvent y dormir.',
      nom: 'Une hutte de branches', sprite: '01-pierre/hutte-branches', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 20, bois: 3, lits: 3, largeur: 205, taille: 2
    },
    'buisson-baies': {
      resume: "La cueilleuse y ramasse des baies.", page: 'cueilleurs',
      explication: "Un buisson de baies. La cueilleuse ramasse les fruits sauvages : c'était une grande partie de la nourriture des premiers humains.",
      vignettes: [{ img: 'baies', texte: "La cueilleuse remplit son panier de baies sauvages." }],
      nom: 'Un buisson de baies', sprite: '01-pierre/buisson-baies', epoque: 1, jusqua: 9,
      zone: 'pre', cout: 15, bois: 1, largeur: 110, taille: 1,
      travail: { metier: 'cueilleur', aller: null, porte: 'baies', duree: 10, produit: 'nourriture', qte: 1 }
    },
    'atelier-silex': {
      resume: "On y taille le silex pour faire des outils.",
      explication: "L'atelier du tailleur, près de la grotte. Il frappe le silex avec un caillou pour faire des lames, des grattoirs et des pointes bien tranchantes.",
      vignettes: [{ img: 'silex', texte: "Le tailleur frappe le silex avec un caillou : les éclats tranchants deviennent des pointes de lance et des couteaux." }],
      nom: "L'atelier de silex", sprite: '01-pierre/atelier-silex', epoque: 1, jusqua: 9, debloque: 'outils',
      zone: 'grotte', cout: 35, bois: 2, largeur: 130, taille: 1,
      travail: { metier: 'tailleur', aller: 'grotte', porte: 'silex', duree: 4, produit: 'pieces', qte: { 1: 5, 2: 8 } }
    },
    feu: {
      resume: "Il chauffe et éclaire : on peut veiller le soir.",
      explication: 'Le feu de camp. Il réchauffe, il éclaire la nuit, il éloigne les bêtes sauvages et il permet de cuire la viande.',
      vignettes: [{ img: 'veillee', texte: "Le soir, autour du feu, on se réchauffe, on y voit clair et on fait cuire la viande." }],
      nom: 'Un feu de camp', sprite: '01-pierre/feu', epoque: 1, jusqua: 9, debloque: 'feu',
      zone: 'pre', cout: 20, bois: 2, largeur: 105, taille: 1, effet: 'feu'
    },
    'ratelier-lances': {
      resume: "Les chasseurs y prennent leurs lances.",
      explication: "Le râtelier des chasseurs. On y range les lances. Les chasseurs attrapent les lapins près de la forêt, et parfois un mammouth de l'autre côté de la rivière.",
      vignettes: [{ img: 'chasse', texte: "Les chasseurs avancent ensemble, cachés dans les hautes herbes, vers le mammouth." }],
      nom: 'Le râtelier des chasseurs', sprite: '01-pierre/ratelier-lances', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'pre', cout: 25, bois: 2, largeur: 125, taille: 1,
      finitAvec: 'elevage',
      travail: { metier: 'chasseur', aller: 'gibier', porte: 'viande', duree: 6, produit: 'nourriture', qte: 4 }
    },
    'sechoir-poissons': {
      resume: "On y fait sécher les poissons pour les garder : la réserve grandit.",
      explication: "Le séchoir à poissons, au bord de l'eau. Le pêcheur attrape les poissons, puis on les fait sécher pour pouvoir les garder longtemps.",
      vignettes: [{ img: 'peche', texte: "Le pêcheur attrape les poissons avec sa lance, puis on les fait sécher sur des bâtons." }],
      nom: 'Le séchoir à poissons', sprite: '01-pierre/sechoir-poissons', epoque: 1, jusqua: 9, debloque: 'chasse',
      zone: 'rive', cout: 30, bois: 2, largeur: 140, taille: 1,
      travail: { metier: 'pecheur', aller: 'riviere', porte: 'poisson', duree: 6, produit: 'nourriture', qte: 2 }
    },
    'hutte-peaux': {
      resume: "Une maison chaude en peaux, pour 3 personnes.",
      explication: 'Une grande hutte couverte de peaux cousues entre elles. Bien chaude, elle accueille trois personnes, même en hiver.',
      evolue: [{ vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }],
      nom: 'Une hutte en peaux', sprite: '01-pierre/hutte-peaux', epoque: 1, jusqua: 1, debloque: 'abri',
      zone: 'pre', cout: 40, bois: 3, lits: 3, largeur: 220, taille: 2
    },
    'peintures-rupestres': {
      resume: "On peint nos histoires sur la roche.",
      explication: 'La grotte peinte. À la lumière du feu, on peint les animaux et les chasses sur la roche. Ces dessins racontent nos histoires et donnent des idées.',
      vignettes: [{ img: 'peinture', texte: "À la lumière d'une torche, on peint les animaux sur la paroi de la grotte." }],
      nom: 'La grotte peinte', sprite: '01-pierre/peintures-rupestres', epoque: 1, jusqua: 9, debloque: 'peinture',
      zone: 'grotte', cout: 40, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'peintre', aller: null, duree: 14, produit: 'idees', qte: 2 }
    },
    'maison-torchis': {
      evolue: [{ vers: 'maison-longue', cout: 80, decouverte: 'grenier' }],
      resume: "Une maison en terre et en paille, pour 4 personnes.",
      explication: "Une maison en torchis : de la terre, de la paille et de l'eau collées sur des branches. Les paysans y vivent toute l'année, près de leurs champs.",
      vignettes: [{ img: 'torchis', texte: "On tresse des branches, puis on les couvre de terre mêlée de paille : c'est le torchis." }],
      nom: 'Une maison en torchis', sprite: '02-neolithique/maison-torchis', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 80, bois: 3, lits: 4, largeur: 215, taille: 2
    },
    'champ-ble': {
      resume: "Le paysan y sème et récolte le blé.",
      explication: "Un champ de blé. Le paysan sème les graines, puis récolte les épis. Avec les champs, on n'a plus besoin de partir chercher à manger.",
      vignettes: [{ img: 'semer', texte: "Le paysan sème les graines de blé dans la terre." }, { img: 'moisson', texte: "Quand le blé est doré, on le coupe avec une faucille et on fait des gerbes." }],
      nom: 'Un champ de blé', sprite: '02-neolithique/champ-ble', epoque: 2, jusqua: 9, debloque: 'agriculture',
      zone: 'pre', cout: 75, bois: 1, largeur: 240, taille: 2,
      travail: { metier: 'paysan', aller: null, porte: 'ble', duree: 8, produit: 'nourriture', qte: 5 }
    },
    'enclos-moutons': {
      resume: "Le berger y garde les moutons et les chèvres.",
      explication: "L'enclos à moutons. Le berger garde les moutons : ils donnent de la laine pour les vêtements, et du lait.",
      vignettes: [{ img: 'enclos', texte: "Le berger garde les moutons dans l'enclos." }],
      nom: "L'enclos à moutons", sprite: '02-neolithique/enclos-moutons', epoque: 2, jusqua: 9, debloque: 'elevage',
      zone: 'pre', cout: 70, bois: 3, largeur: 240, taille: 2,
      travail: { metier: 'berger', aller: null, livre: 'lait', duree: 9, produit: 'nourriture', qte: 5 }
    },
    grenier: {
      resume: "On y garde le blé au sec : la réserve de nourriture grandit.",
      explication: "Le grenier sur pilotis. On y range le blé en hauteur, au sec et loin des souris, pour en avoir tout l'hiver.",
      vignettes: [{ img: 'grenier', texte: "Le grenier est sur pilotis : les souris ne peuvent pas monter manger le blé." }],
      nom: 'Le grenier', sprite: '02-neolithique/grenier', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 80, bois: 3, largeur: 140, taille: 1, reserve: 60
    },
    'maison-longue': {
      resume: "Une grande maison pour 6 personnes.",
      explication: "Une maison longue. Plusieurs familles vivent ensemble sous le même toit : jusqu'à six personnes.",
      vignettes: [{ img: 'torchis', texte: "Tout le monde aide à construire la maison : branches tressées, terre et toit de paille." }],
      nom: 'Une maison longue', sprite: '02-neolithique/maison-longue', epoque: 2, jusqua: 9, debloque: 'grenier',
      zone: 'pre', cout: 150, bois: 4, lits: 6, largeur: 250, taille: 2
    },
    'atelier-potier': {
      resume: "La potière y fait des pots en terre cuite.",
      explication: "L'atelier du potier. Il prend de l'argile au bord de la rivière, façonne des pots et les cuit dans le four pour qu'ils deviennent durs.",
      vignettes: [{ img: 'poterie', texte: "La potière façonne l'argile, puis elle cuit les pots dans le four." }],
      nom: "L'atelier du potier", sprite: '02-neolithique/atelier-potier', epoque: 2, jusqua: 9, debloque: 'poterie',
      zone: 'pre', cout: 110, bois: 2, largeur: 210, taille: 2,
      travail: { metier: 'potier', aller: 'riviere', porte: 'argile', livre: 'pot', duree: 4, produit: 'pieces', qte: 10 }
    },
    meule: {
      resume: "On y écrase le blé pour faire de la farine.",
      explication: 'La meule. On écrase les grains de blé entre deux pierres pour faire de la farine. Avec la farine, on fait du pain.',
      vignettes: [{ img: 'meule', texte: "On écrase les grains entre deux pierres : ça fait de la farine pour le pain." }],
      nom: 'La meule', sprite: '02-neolithique/meule', epoque: 2, jusqua: 9, debloque: 'meule',
      zone: 'pre', cout: 50, bois: 1, largeur: 120, taille: 1,
      travail: { metier: 'meunier', aller: 'champ', porte: 'ble', livre: 'farine', duree: 5, produit: 'nourriture', qte: 4 }
    },
    pirogue: {
      resume: "Le pêcheur part sur l'eau dans un tronc creusé.", page: 'pirogue',
      explication: "Une pirogue, creusée dans un seul tronc d'arbre. Le pêcheur part pêcher en mer.",
      vignettes: [{ img: 'pirogue', texte: "En pirogue, le pêcheur part en mer et remonte son filet plein de poissons." }],
      nom: 'Une pirogue', sprite: '02-neolithique/pirogue', epoque: 2, jusqua: 9,
      zone: 'plage', cout: 35, bois: 2, largeur: 150, taille: 1,
      travail: { metier: 'pecheur', aller: 'plage', porte: 'poisson', duree: 6, produit: 'nourriture', qte: 3 }
    },
    // Décorations et merveilles d'époque, historiquement vraies (ADR-023)
    'peinture-chauvet': {
      resume: "Une paroi peinte comme dans la grotte Chauvet.", page: 'deco-peinture-chauvet',
      nom: "Les chevaux de Chauvet", sprite: 'deco/peinture-chauvet', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 25, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'peinture-lascaux': {
      resume: "Une paroi peinte comme dans la grotte de Lascaux.", page: 'deco-peinture-lascaux',
      nom: "Le taureau de Lascaux", sprite: 'deco/peinture-lascaux', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 30, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'peinture-altamira': {
      resume: "Une paroi peinte comme dans la grotte d'Altamira.", page: 'deco-peinture-altamira',
      nom: "Les bisons d'Altamira", sprite: 'deco/peinture-altamira', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 30, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'peinture-mains': {
      resume: "Une paroi couverte de mains, comme dans la grotte de Gargas.", page: 'deco-peinture-mains',
      nom: "Les mains de Gargas", sprite: 'deco/peinture-mains', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 20, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'hutte-mammouth': {
      resume: "Une merveille : une hutte faite d'os de mammouth.", page: 'deco-hutte-mammouth',
      nom: "La hutte en os de mammouth", sprite: 'deco/hutte-mammouth', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 50, bois: 4, largeur: 220, taille: 2, deco: true, merveille: true, unique: true
    },
    'homme-lion': {
      resume: "Une petite statue à tête de lion, en ivoire.", page: 'deco-homme-lion',
      nom: "L'homme-lion", sprite: 'deco/homme-lion', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 35, bois: 1, largeur: 70, taille: 1, deco: true, unique: true
    },
    'bisons-argile': {
      resume: "Deux bisons modelés dans l'argile.", page: 'deco-bisons-argile',
      nom: "Les bisons d'argile", sprite: 'deco/bisons-argile', epoque: 1, jusqua: 1,
      zone: 'grotte', cout: 30, bois: 1, largeur: 120, taille: 1, deco: true, unique: true
    },
    'peinture-lions': {
      resume: "Une paroi peinte de lions, comme dans la grotte Chauvet.", page: 'deco-peinture-lions',
      nom: "Les lions de Chauvet", sprite: 'deco/peinture-lions', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 30, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'peinture-cerfs': {
      resume: "Une paroi peinte de grands cerfs, comme à Lascaux.", page: 'deco-peinture-cerfs',
      nom: "Les cerfs de Lascaux", sprite: 'deco/peinture-cerfs', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 30, bois: 1, largeur: 140, taille: 1, deco: true, unique: true
    },
    'bruniquel': {
      resume: "Une merveille : des cercles de stalagmites au fond d'une grotte.", page: 'deco-bruniquel',
      nom: "Les cercles de Bruniquel", sprite: 'deco/bruniquel', epoque: 1, jusqua: 1,
      zone: 'grotte', cout: 40, bois: 3, largeur: 220, taille: 2, deco: true, merveille: true, unique: true
    },
    'menhir-brise': {
      resume: "Le plus grand menhir connu, couché et cassé en quatre.", page: 'deco-menhir-brise',
      nom: "Le grand menhir brisé", sprite: 'deco/menhir-brise', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 120, bois: 3, largeur: 220, taille: 2, deco: true, unique: true
    },
    'gavrinis': {
      resume: "Une pierre couverte de spirales gravées.", page: 'deco-gavrinis',
      nom: "La pierre gravée de Gavrinis", sprite: 'deco/gavrinis', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 80, bois: 2, largeur: 95, taille: 1, deco: true, unique: true
    },
    'cromlech': {
      resume: "Un petit cercle de pierres dressées.", page: 'deco-cromlech',
      nom: "Un cromlech", sprite: 'deco/cromlech', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 60, bois: 2, largeur: 150, taille: 1, deco: true
    },
    'ain-ghazal': {
      resume: "Une grande statue en plâtre aux grands yeux.", page: 'deco-ain-ghazal',
      nom: "La statue d'Aïn Ghazal", sprite: 'deco/ain-ghazal', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 90, bois: 2, largeur: 70, taille: 1, deco: true, unique: true
    },
    'skara-brae': {
      resume: "Une maison en pierre, même les meubles !", page: 'deco-skara-brae',
      nom: "La maison de Skara Brae", sprite: 'deco/skara-brae', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 130, bois: 3, largeur: 200, taille: 2, deco: true, unique: true
    },
    'menhir': {
      resume: "Une grande pierre dressée.", page: 'deco-menhir',
      nom: "Un menhir", sprite: 'deco/menhir', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 40, bois: 2, largeur: 80, taille: 1, deco: true
    },
    'statue-menhir': {
      resume: "Une pierre dressée sculptée comme une personne.", page: 'deco-statue-menhir',
      nom: "La Dame de Saint-Sernin", sprite: 'deco/statue-menhir', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 70, bois: 2, largeur: 85, taille: 1, deco: true, unique: true
    },
    'dolmen': {
      resume: "Une grande table de pierre.", page: 'deco-dolmen',
      nom: "Un dolmen", sprite: 'deco/dolmen', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 100, bois: 3, largeur: 140, taille: 1, deco: true
    },
    'alignements': {
      resume: "Une merveille : des menhirs en longues rangées.", page: 'deco-alignements',
      nom: "Les alignements de Carnac", sprite: 'deco/alignements', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 100, bois: 4, largeur: 240, taille: 2, deco: true, merveille: true, unique: true
    },
    'cairn': {
      resume: "Une merveille : un grand monument de pierres sèches.", page: 'deco-cairn',
      nom: "Le cairn de Barnenez", sprite: 'deco/cairn', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 130, bois: 5, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'stonehenge': {
      resume: "Une merveille : le grand cercle de pierres d'Angleterre.", page: 'deco-stonehenge',
      nom: "Stonehenge", sprite: 'deco/stonehenge', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 200, bois: 6, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'gobekli-tepe': {
      resume: "Une merveille : des piliers sculptés d'animaux.", page: 'deco-gobekli-tepe',
      nom: "Göbekli Tepe", sprite: 'deco/gobekli-tepe', epoque: 2, jusqua: 9,
      zone: 'pre', cout: 160, bois: 5, largeur: 240, taille: 2, deco: true, merveille: true, unique: true
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
    1: { bois: { h: 'e1-bois-h', f: 'e1-bois-f' }, viande: 'e1-viande', lapin: 'e1-lapin', poisson: 'e1-poisson', silex: 'e1-silex' },
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

  // Textes dits à voix haute en dehors des fiches (source unique : ils sont aussi enregistrés en voix, cf. scripts/voix.py)
  var textes = {
    phrases: {
    sage: ['Hmm… je réfléchis…', 'J\'ai une idée !'],
    bucheron: ['Je vais couper du bois !', 'Ce rondin est lourd !'],
    cueilleur: ['Miam, des baies !', 'Je remplis mon panier.'],
    tailleur: ['Je taille des silex.', 'Toc, toc, toc !'],
    chasseur: ['Je pars chasser !', 'Chut, il ne faut pas faire de bruit.'],
    pecheur: ['Je vais pêcher des poissons !', 'Ça mord !'],
    peintre: ['Je peins un mammouth.', 'Regarde mes peintures !'],
    paysan: ['Le blé pousse bien !', 'Je m\'occupe du champ.'],
    berger: ['Je garde les moutons !', 'Bêêê !'],
    porteur: ['Je rapporte le blé au grenier.'],
    faim: ["J'ai faim !", 'Il faudrait plus à manger…'],
    potier: ['Je vais chercher de l\'argile.', 'Je fais un joli pot.'],
    meunier: ['J\'écrase le blé.', 'Bientôt du pain !'],
    construit: ['J\'apporte du bois pour construire !', 'On construit une maison !'],
    enfant: ['Youpi !', 'On joue à chat !', 'Tu ne m\'attraperas pas !'],
    libre: ['Bonjour !', 'Il fait bon ici.', 'Quelle belle vallée !']
  },
    nature: {
    lapin: ['faune/lapin-assis', 'Un lapin', "Un lapin sauvage. Les chasseurs-cueilleurs l'attrapaient pour sa viande et sa fourrure."],
    arbre: ['nature/sapin-grand', 'Un arbre', "Le bûcheron coupe les arbres pour avoir du bois. Petit à petit, la forêt recule et laisse de la place pour construire."],
    souche: ['nature/souche', 'Une souche', 'Ici, le bûcheron a coupé un arbre. On peut construire à cet endroit.'],
    rocher: ['nature/rochers', 'Des rochers', 'On ne peut pas construire sur les rochers.'],
    grotte: ['nature/grotte', 'La grotte', "Les premiers humains s'y abritaient. C'est près d'elle qu'on trouve le silex, et qu'on peint sur la roche."],
    mammouth: ['01-pierre/mammouth', 'Le mammouth', "Un éléphant géant couvert de longs poils, qui vivait quand il faisait très froid. Les chasseurs le suivaient pour sa viande, sa fourrure et ses os."],
    chevre: ['02-neolithique/chevre', 'Une chèvre', "Les premiers paysans ont apprivoisé les chèvres : elles donnent du lait et de la laine."],
    gue: ['nature/galets', 'Le gué', "Ici, la rivière est peu profonde : on traverse en marchant sur les pierres."],
    sentier: ['nature/touffe', 'Un sentier', "À force de passer toujours au même endroit, les habitants ont usé l'herbe. Plus tard, on en fera de vraies routes !"]
  },
    aides: {
      plusDePlace: "Il n'y a plus de place pour ça !",
      piecesManquent: 'Il te faut plus de pièces. Ramasse les bulles !',
      ideesManquent: "Il te faut plus d'idées. Ramasse les bulles du cercle des anciens !",
      epoque2: "Fini de bouger ! Au néolithique, on reste au même endroit : chacun rapporte lui-même ce qu'il produit au village. Plus besoin de toucher les bulles !",
      maisonsAMain: 'Touche une hutte pour la transformer en maison du néolithique.',
      nourriture: "Les baies, la viande et le poisson vont dans la réserve de nourriture. Chaque soir, tout le monde mange !",
      nourritureInfo: "La réserve de nourriture. Chaque soir, chaque habitant mange trois parts. Pour qu'une nouvelle famille arrive, il faut assez à manger pour tout le monde. On ne peut pas tout garder : ce qui dépasse de la réserve est perdu.",
      reserveDeborde: "Ta réserve déborde ! Construis une maison pour accueillir une nouvelle famille.",
      reserveTropPetite1: "Ta réserve est trop petite pour accueillir une famille de plus. Un séchoir à poissons permet de garder plus de nourriture.",
      reserveTropPetite2: "Ta réserve est trop petite pour accueillir une famille de plus. Construis un grenier ou un atelier du potier pour garder plus de nourriture.",
      hachePolie: "Nouvel outil : la hache en pierre polie ! Le bûcheron et le tailleur de pierre travaillent bien mieux.",
      faim1: "Il n'y avait pas assez à manger ce soir ! Construis un buisson de baies, un séchoir à poissons ou un râtelier de chasseurs.",
      faim2: "Il n'y avait pas assez à manger ce soir ! Construis un champ de blé, un enclos ou une pirogue.",
      maisonsVides: "Les maisons attendent du monde, mais il faut plus à manger pour accueillir une nouvelle famille.",
      chasseursLoin: 'Les chasseurs partent loin dans la forêt pour trouver du gibier. Ils reviendront avec leur prise !',
      pretEpoque: "Prêt pour le néolithique ? Les premiers paysans vont planter du blé, élever des moutons et faire des pots. L'île va s'agrandir !",
      merveilles: 'Les merveilles ! De grands monuments qui se construisent en trois étapes. Choisis-en une !',
      merveilleEtape: 'Une étape de la merveille est finie ! Ouvre les merveilles pour lancer la suivante.',
      merveilleFinie: 'Bravo ! Ta merveille est terminée ! Tout le village fait la fête !',

      iphone: "Sur iPhone : touche Partager, puis « Sur l'écran d'accueil » pour jouer en plein écran.",
      cocorico: 'Cocorico ! Le soleil se lève, tout le monde au travail !',
      chantier: 'Regarde : les habitants vont chercher du bois pour construire !',
      maison: 'Une nouvelle maison ! Une famille va bientôt arriver.',
      bulle: 'Touche les bulles pour ramasser les pièces et les idées !',
      arrivee: "Quelqu'un arrive dans la vallée !",
      nuitFeu: 'La nuit tombe. Autour du feu, on a chaud et on y voit clair : le travail continue !',
      nuitSansFeu: 'Il fait nuit et tout le monde dort… Construis un feu de camp près du village !',
      nuit1: 'La nuit tombe ! Brrr, il fait froid et tout noir : tout le monde va dormir. Il faudrait découvrir le feu…',
      nuit2: 'Encore la nuit… Avec le feu, on pourrait continuer à travailler. Regarde dans les découvertes !',
      reveil: 'Tout le monde dort… Quand tu veux, appuie sur le coq pour faire lever le soleil !',
      idee: "Tu as assez d'idées ! Touche l'ampoule pour faire une découverte.",
      construire: "Tu as des pièces : choisis une construction en bas de l'écran !",
      finEpoque: { 1: "Tu as fait toutes les découvertes de l'âge de pierre ! Ton village est prêt à changer d'époque. Quand tu veux, touche le bouton doré en haut." },
      amelioration: "Les habitants vont chercher du bois pour améliorer le bâtiment. Ensuite, une personne de plus y travaillera !",
      outilsBois: 'Avec les outils de pierre, le bûcheron peut maintenant couper les arbres !',
      plusDeChasse: "Avec l'élevage, plus besoin d'aller chasser : la viande vient de l'enclos !",
      embellir: "Embellis ton village avec les monuments de l'époque ! Chacun raconte une vraie histoire.",
      dejaConstruit: 'Tu l\'as déjà ! Il n\'en existe qu\'un seul.',
      finJeu: "Tu as fait toutes les découvertes du néolithique ! La suite de l'histoire, l'âge des métaux, arrive bientôt."
    },
    prerequis: function (ids) {
      return "Il faut d'abord découvrir : " + ids.map(function (p) { return decouvertes[p].nom.toLowerCase(); }).join(' et ') + '.';
    }
  };

  return { epoques: epoques, decouvertes: decouvertes, pages: pages, batiments: batiments, allures: allures, poses: poses, porteurs: porteurs, femmes: femmes, textes: textes };
})();
if (typeof module !== 'undefined') module.exports = Donnees;

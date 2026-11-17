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
    },
    {
      id: 3,
      nom: "L'âge des métaux",
      intro: "Des milliers d'années ont encore passé. On a appris à faire fondre les métaux : c'est le temps des forgerons, des marchands et des premières villes !"
    },
    {
      id: 4,
      nom: 'Le Moyen Âge',
      intro: "Plus de mille ans ont passé. Voici le Moyen Âge : le temps des moulins, des maisons à colombages, des horloges et des premiers livres imprimés !"
    },
    {
      id: 5,
      nom: "L'âge de la vapeur",
      intro: "Quelques centaines d'années ont passé. Voici l'âge de la vapeur : le temps du charbon, des machines, des trains et des bateaux qui lâchent de petits nuages blancs !"
    },
    {
      id: 6,
      nom: "L'électricité",
      intro: "Encore quelques dizaines d'années, et voici le temps de l'électricité : des ampoules qui brillent, des téléphones, des voitures, et même des avions !"
    },
    {
      id: 7,
      nom: 'Le monde moderne',
      intro: "Encore quelques dizaines d'années, et voici le monde moderne : des ordinateurs, des panneaux solaires, des satellites dans le ciel… et bientôt, une fusée !"
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
    },
    // 3. L'âge des métaux et l'Antiquité (kb/domains/contenu-historique/epoques.md, section 3)
    roue: {
      scene: 'scenes/roue', faits: ["Les plus vieilles roues connues ont environ 5 500 ans.", "À la même époque est apparu le tour du potier : une roue qui tourne pour façonner des pots bien ronds.", "Les premières roues étaient pleines, faites de planches de bois ; les roues à rayons, plus légères, sont venues plus tard."],
      nom: 'La roue', epoque: 3, idees: 18, prerequis: ['poterie'], icone: '03-metaux/atelier-charron',
      texte: "Avant, on portait tout à bras, et c'était lourd. Maintenant, avec la roue, une charrette tirée par un bœuf transporte tout le blé d'un coup !"
    },
    bronze: {
      scene: 'scenes/bronze', faits: ["Le bronze, c'est un mélange : beaucoup de cuivre et un peu d'étain.", "On verse le métal fondu dans un moule en pierre : en refroidissant, il prend la forme du moule.", "L'âge du bronze a commencé il y a environ 5 000 ans."],
      nom: 'Le bronze', epoque: 3, idees: 18, prerequis: ['feu', 'poterie'], icone: '03-metaux/forge',
      texte: "Avant, nos outils de pierre se cassaient. Maintenant, on fait fondre du cuivre et de l'étain dans un four très chaud : ça donne le bronze, un métal solide !"
    },
    ecriture: {
      scene: 'scenes/ecriture', faits: ["Les premières écritures sont nées il y a environ 5 300 ans, en Mésopotamie (aujourd'hui l'Irak).", "Au début, on écrivait surtout des comptes : des sacs de grain, des moutons, des jarres.", "On écrivait avec un roseau taillé, en appuyant dans l'argile encore molle."],
      nom: "L'écriture", epoque: 3, idees: 20, prerequis: ['grenier'], icone: '03-metaux/maison-scribes',
      texte: "Avant, on oubliait combien on avait de sacs de blé. Maintenant, on dessine des signes sur des tablettes d'argile : c'est l'écriture !"
    },
    monnaie: {
      scene: 'scenes/monnaie', faits: ["Les premières pièces de monnaie ont été fabriquées il y a environ 2 600 ans, en Lydie (aujourd'hui en Turquie).", "Avant les pièces, on échangeait aussi des coquillages, ou des morceaux de métal pesés sur une balance.", "Sur les pièces, on frappait des dessins : des animaux, des visages."],
      nom: 'La monnaie', epoque: 3, idees: 24, prerequis: ['ecriture', 'bronze'], icone: '03-metaux/marche',
      texte: "Avant, pour avoir des fruits, il fallait échanger un mouton ou un sac de blé. Maintenant, on paie avec des pièces de métal !"
    },
    voile: {
      scene: 'scenes/voile', faits: ["Les Égyptiens naviguaient à la voile sur le Nil il y a plus de 5 000 ans.", "Les voiles étaient tissées en laine ou en lin, souvent à bandes de couleurs.", "Avec les bateaux à voile, on a pu commercer avec des pays lointains."],
      nom: 'La voile', epoque: 3, idees: 20, prerequis: ['elevage'], icone: '03-metaux/port',
      texte: "Avant, en pirogue, on ne pouvait pas aller bien loin. Maintenant, on tisse la laine des moutons pour faire une voile : le vent pousse le bateau !"
    },
    // 4. Le Moyen Âge (kb/domains/contenu-historique/epoques.md, section 4)
    moulin: {
      scene: 'scenes/moulin', faits: ["Il y a plus de 2 000 ans, les Grecs et les Romains connaissaient déjà le moulin à eau. Au Moyen Âge, il y en a partout : des milliers rien qu'en Angleterre !", "Le courant fait tourner la grande roue, la roue fait tourner la meule, et la meule écrase le grain.", "Le meunier pouvait moudre en une heure ce qu'une personne mettait des jours à moudre à la main."],
      nom: 'Le moulin à eau', epoque: 4, idees: 28, prerequis: ['roue', 'meule'], icone: '04-moyen-age/moulin',
      texte: "Avant, on écrasait le blé à la main, et c'était long. Maintenant, la rivière fait tourner une grande roue, et la roue fait tourner la meule toute la journée !"
    },
    fer: {
      scene: 'scenes/fer', faits: ["Pour faire du fer, on chauffe des pierres rouges, le minerai, dans un four rempli de charbon de bois.", "Le fer est bien plus courant que le cuivre et l'étain : on peut en faire beaucoup d'outils.", "Le forgeron chauffe le fer jusqu'à ce qu'il soit rouge, puis il le tape sur l'enclume pour lui donner sa forme."],
      nom: 'Le fer', epoque: 4, idees: 28, prerequis: ['bronze'], icone: '04-moyen-age/marechal',
      texte: "Avant, le bronze était rare et cher. Maintenant, on fait du fer, un métal qu'on trouve presque partout : des fers à cheval, des clous, des charrues pour labourer !"
    },
    pont: {
      scene: 'scenes/pont', faits: ["Pour bâtir un pont en arche, on posait les pierres sur un gabarit en bois en forme d'arc, qu'on retirait à la fin.", "Les pierres de l'arche se poussent les unes contre les autres : c'est ce qui la fait tenir, sans colle.", "Certains ponts de pierre du Moyen Âge sont encore debout aujourd'hui, après 800 ans !"],
      nom: 'Le pont de pierre', epoque: 4, idees: 30, prerequis: ['outils', 'roue'], icone: 'eau/pont-pierre',
      texte: "Avant, la rivière en crue emportait le pont de bois. Maintenant, on construit un pont en arches de pierre : il est solide, et les charrettes passent dessus !"
    },
    horloge: {
      scene: 'scenes/horloge', faits: ["Les premières horloges mécaniques sont apparues en Europe il y a environ 700 ans.", "Au début, elles n'avaient pas de cadran : elles sonnaient seulement les heures avec une cloche.", "Elles marchaient avec un gros poids de pierre, attaché à une corde, qui descendait tout doucement."],
      nom: "L'horloge", epoque: 4, idees: 34, prerequis: ['fer'], icone: '04-moyen-age/tour-horloge',
      texte: "Avant, on ne savait l'heure qu'en regardant le soleil. Maintenant, une horloge en fer sonne les heures pour toute la ville !"
    },
    imprimerie: {
      scene: 'scenes/imprimerie', faits: ["Vers 1450, en Allemagne, Gutenberg a eu l'idée de petites lettres en métal qu'on range pour faire des pages.", "Avant, il fallait des mois pour copier un seul livre à la main.", "Avec une presse, on pouvait imprimer des centaines de pages par jour !"],
      nom: "L'imprimerie", epoque: 4, idees: 36, prerequis: ['ecriture', 'fer'], icone: '04-moyen-age/imprimerie',
      texte: "Avant, on copiait chaque livre à la main, lettre par lettre. Maintenant, on range des petites lettres en métal, on met de l'encre, et la presse imprime la page d'un coup !"
    },
    // 5. La vapeur (kb/domains/contenu-historique/epoques.md, section 5)
    charbon: {
      scene: 'scenes/charbon', faits: ["Le charbon, ce sont des arbres et des plantes d'il y a des millions d'années, écrasés sous la terre jusqu'à devenir une pierre noire qui brûle.", "Un morceau de charbon chauffe bien plus longtemps qu'un morceau de bois de la même taille.", "Pour le trouver, les mineurs creusaient de longs tunnels sous la terre, éclairés par de petites lampes."],
      nom: 'Le charbon', epoque: 5, idees: 76, prerequis: ['fer'], icone: '05-vapeur/mine',
      texte: "Avant, on brûlait du bois, et la forêt reculait. Maintenant, on creuse la terre pour trouver le charbon, une pierre noire qui chauffe très fort et très longtemps !"
    },
    vapeur: {
      scene: 'scenes/vapeur', faits: ["Quand l'eau bout, elle devient de la vapeur, et la vapeur pousse très fort : regarde le couvercle d'une casserole qui se soulève !", "Vers 1770, l'Écossais James Watt a beaucoup amélioré la machine à vapeur : elle pouvait faire tourner des roues toute la journée.", "Une seule machine faisait le travail de dizaines de chevaux."],
      nom: 'La machine à vapeur', epoque: 5, idees: 92, prerequis: ['fer', 'charbon'], icone: '05-vapeur/usine',
      texte: "Avant, tout se faisait avec les bras ou avec les chevaux. Maintenant, le charbon fait bouillir l'eau, la vapeur pousse, et la machine fait tourner les roues toute seule !"
    },
    train: {
      scene: 'scenes/train', faits: ["En 1829, en Angleterre, la locomotive de George Stephenson a gagné une course : elle s'appelait « la Fusée » !", "Les premiers trains roulaient à peu près à la vitesse d'un cheval au galop, et tout le monde trouvait ça incroyablement rapide.", "Les rails en fer permettent aux roues de rouler sans s'enfoncer, même avec des wagons très lourds."],
      nom: 'Le train', epoque: 5, idees: 108, prerequis: ['vapeur', 'roue'], icone: '05-vapeur/gare',
      texte: "Avant, pour aller dans la ville voisine, il fallait marcher des jours. Maintenant, la locomotive à vapeur tire les wagons sur des rails de fer : on y est en quelques heures !"
    },
    bateau: {
      scene: 'scenes/bateau', faits: ["Les bateaux à vapeur avaient souvent de grandes roues à aubes sur les côtés, qui tournaient comme celles d'un moulin.", "En 1838, un bateau à vapeur a traversé tout l'océan Atlantique sans jamais attendre le vent.", "On remplissait leurs cales de charbon pour faire bouillir l'eau pendant tout le voyage."],
      nom: 'Le bateau à vapeur', epoque: 5, idees: 108, prerequis: ['vapeur', 'voile'], icone: '05-vapeur/port-vapeur',
      texte: "Avant, sans vent, le bateau à voile restait sur place. Maintenant, la machine à vapeur fait tourner de grandes roues dans l'eau : le bateau avance, même quand il n'y a pas de vent !"
    },
    // 6. L'électricité (kb/domains/contenu-historique/epoques.md, section 6)
    electricite: {
      scene: 'scenes/electricite', faits: ["Quand on fait tourner un aimant tout près de fils de cuivre, l'électricité se met à courir dans les fils : c'est ce que fait la grande roue de la centrale.", "En 1882, à New York, Thomas Edison a ouvert une des toutes premières centrales, pour éclairer tout un quartier.", "L'électricité, c'est très fort : on ne touche jamais une prise ni un fil électrique !"],
      nom: "L'électricité", epoque: 6, idees: 112, prerequis: ['vapeur'], icone: '06-electricite/centrale',
      texte: "Avant, pour faire tourner une machine, il fallait du feu et de la vapeur à côté. Maintenant, la centrale fabrique l'électricité, et elle court dans des fils jusqu'aux maisons !"
    },
    ampoule: {
      scene: 'scenes/ampoule', faits: ["Vers 1879, Thomas Edison en Amérique et Joseph Swan en Angleterre ont fabriqué des ampoules qui brillent longtemps.", "Edison a essayé des milliers de petits fils avant de trouver le bon : il a même essayé un fil de bambou !", "Dans les premières ampoules, on avait enlevé l'air : sinon, le petit fil aurait brûlé tout de suite."],
      nom: "L'ampoule", epoque: 6, idees: 122, prerequis: ['electricite'], icone: '06-electricite/lampadaire',
      texte: "Avant, on s'éclairait avec des bougies et des lampes à gaz, et le soir, les rues restaient sombres. Maintenant, un petit fil brille dans une bulle de verre : l'ampoule éclaire toute la rue !"
    },
    telephone: {
      scene: 'scenes/telephone', faits: ["En 1876, en Amérique, Alexander Graham Bell a présenté le téléphone.", "Au début, pour appeler quelqu'un, on parlait d'abord à une standardiste : elle branchait les fils à la main pour relier les deux personnes.", "Les fils du téléphone passaient sur de grands poteaux en bois, le long des routes."],
      nom: 'Le téléphone', epoque: 6, idees: 132, prerequis: ['electricite'], icone: '06-electricite/central-telephone',
      texte: "Avant, pour parler à quelqu'un, il fallait aller le voir ou lui écrire une lettre. Maintenant, la voix voyage dans un fil : on se parle de très loin, comme si on était à côté !"
    },
    voiture: {
      scene: 'scenes/voiture', faits: ["En 1886, en Allemagne, Carl Benz a construit une des premières voitures à moteur : elle n'avait que trois roues.", "Sa femme, Bertha Benz, a fait le premier long voyage en voiture avec ses deux fils, pour montrer à tout le monde que ça marchait !", "En 1908, la Ford T était si simple à fabriquer que beaucoup de familles ont pu en avoir une."],
      nom: 'La voiture', epoque: 6, idees: 142, prerequis: ['vapeur', 'roue'], icone: '06-electricite/garage',
      texte: "Avant, on allait au pas du cheval. Maintenant, un petit moteur fait tourner les roues : la voiture roule toute seule, et bien plus vite !"
    },
    avion: {
      scene: 'scenes/avion', faits: ["En 1903, en Amérique, les frères Wright ont fait voler le premier avion à moteur : le vol a duré 12 secondes !", "En 1909, Louis Blériot a traversé la mer entre la France et l'Angleterre en avion, en un peu plus d'une demi-heure.", "En 1932, Amelia Earhart a traversé tout l'océan Atlantique toute seule, aux commandes de son avion."],
      nom: "L'avion", epoque: 6, idees: 156, prerequis: ['voiture'], icone: '06-electricite/aerodrome',
      texte: "Avant, les montagnes et la mer arrêtaient les voyageurs. Maintenant, l'avion vole par-dessus : on traverse le ciel comme les oiseaux !"
    },
    // 7. Le monde moderne (kb/domains/contenu-historique/epoques.md, section 7)
    ordinateur: {
      scene: 'scenes/ordinateur', faits: ["Les premiers ordinateurs, vers 1945, étaient si gros qu'ils remplissaient toute une grande salle !", "Un ordinateur ne connaît que deux chiffres, 0 et 1, mais il les compte des millions de fois par seconde.", "Pour les premiers voyages dans l'espace, la mathématicienne Katherine Johnson vérifiait à la main les calculs des ordinateurs."],
      nom: "L'ordinateur", epoque: 7, idees: 170, prerequis: ['electricite'], icone: '07-moderne/bureau',
      texte: "Avant, on faisait tous les calculs à la main, et c'était très long. Maintenant, l'ordinateur calcule en un clin d'œil : il aide à tout préparer, même un voyage dans l'espace !"
    },
    solaire: {
      scene: 'scenes/solaire', faits: ["Un panneau solaire change la lumière du soleil en électricité, sans bruit et sans fumée.", "Les satellites, là-haut dans l'espace, ont presque tous des panneaux solaires sur leurs ailes.", "Il y a très longtemps, les moulins à vent tournaient déjà grâce au vent : l'éolienne est leur petite cousine."],
      nom: "L'énergie solaire", epoque: 7, idees: 160, prerequis: ['electricite'], icone: '07-moderne/parc-solaire',
      texte: "Avant, on brûlait du charbon pour faire l'électricité, et la fumée salissait l'air. Maintenant, des panneaux attrapent la lumière du soleil et des éoliennes tournent avec le vent : l'électricité arrive sans fumée !"
    },
    satellite: {
      scene: 'scenes/satellite', faits: ["En 1957, le tout premier satellite, Spoutnik, faisait bip, bip en tournant autour de la Terre.", "Un satellite fait le tour de la Terre en à peu près une heure et demie.", "Le soir, on peut parfois voir un satellite passer dans le ciel : on dirait une petite étoile qui avance."],
      nom: 'Le satellite', epoque: 7, idees: 190, prerequis: ['ordinateur', 'avion'], icone: '07-moderne/satellite',
      texte: "Avant, personne ne pouvait voir la Terre d'en haut. Maintenant, des satellites tournent tout autour : ils photographient les nuages, aident à prévoir la pluie et montrent le chemin !"
    },
    fusee: {
      scene: 'scenes/fusee', faits: ["En 1961, Youri Gagarine a été le premier humain à voler dans l'espace.", "En 1969, Neil Armstrong et Buzz Aldrin ont marché sur la Lune.", "Une fusée part très vite : en quelques minutes à peine, elle est déjà dans l'espace !"],
      nom: 'La fusée', epoque: 7, idees: 220, prerequis: ['satellite'], icone: '07-moderne/fusee',
      texte: "Avant, aucun avion ne pouvait sortir du ciel. Maintenant, la fusée pousse si fort avec son feu qu'elle monte jusque dans l'espace, là où brillent les étoiles !"
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
    // L'âge des métaux et l'Antiquité
    'deco-ziggourat': {
      nom: "La ziggourat d'Ur", epoque: 3, image: 'deco/ziggourat', deco: true,
      texte: "À Ur, en Mésopotamie (aujourd'hui l'Irak), on a bâti il y a environ 4 100 ans une ziggourat : une montagne de briques en escaliers, avec un temple tout en haut.",
      faits: ["Elle est faite de millions de briques de terre, séchées au soleil ou cuites au four.", "Trois grands escaliers se rejoignaient pour monter jusqu'au sommet."]
    },
    'deco-pyramide': {
      nom: "La grande pyramide", epoque: 3, image: 'deco/pyramide', deco: true,
      texte: "En Égypte, la grande pyramide de Khéops a été construite il y a environ 4 500 ans, avec plus de deux millions de blocs de pierre.",
      faits: ["Elle mesurait 146 mètres de haut : pendant près de 4 000 ans, ce fut la plus haute construction du monde !", "Les ouvriers tiraient les blocs sur des traîneaux en bois, en mouillant le sable pour qu'ils glissent mieux."]
    },
    'deco-parthenon': {
      nom: "Le Parthénon", epoque: 3, image: 'deco/parthenon', deco: true,
      texte: "À Athènes, en Grèce, le Parthénon est un temple de marbre blanc construit il y a environ 2 450 ans, en haut d'une colline appelée l'Acropole.",
      faits: ["Il est entouré de 46 grandes colonnes.", "Autrefois, ses sculptures étaient peintes de couleurs vives !"]
    },
    'deco-phare': {
      nom: "Le phare d'Alexandrie", epoque: 3, image: 'deco/phare', deco: true,
      texte: "Le phare d'Alexandrie, en Égypte, a été construit il y a environ 2 300 ans. Un grand feu brûlait tout en haut pour guider les bateaux la nuit.",
      faits: ["Il mesurait plus de 100 mètres de haut.", "C'était l'une des sept merveilles du monde. Des tremblements de terre l'ont fait tomber, et des plongeurs ont retrouvé ses pierres au fond de la mer."]
    },
    'deco-sphinx': {
      nom: "Le grand Sphinx", epoque: 3, image: 'deco/sphinx', deco: true,
      texte: "À côté des pyramides, le grand Sphinx de Gizeh est un lion couché avec une tête d'homme, taillé dans la roche il y a environ 4 500 ans.",
      faits: ["Il mesure 73 mètres de long et 20 mètres de haut.", "Pendant des siècles, le sable l'a recouvert jusqu'aux épaules !"]
    },
    'deco-obelisque': {
      nom: "Un obélisque", epoque: 3, image: 'deco/obelisque', deco: true,
      texte: "Un obélisque est une grande pierre taillée en pointe, d'un seul morceau. Les Égyptiens les dressaient devant leurs temples.",
      faits: ["Ils sont couverts de hiéroglyphes, l'écriture des anciens Égyptiens.", "L'obélisque de la place de la Concorde, à Paris, vient de Louxor, en Égypte : il a plus de 3 000 ans !"]
    },
    'deco-char-solaire': {
      nom: "Le char du soleil", epoque: 3, image: 'deco/char-solaire', deco: true,
      texte: "Au Danemark, on a trouvé un petit cheval de bronze qui tire un grand disque doré : le char solaire de Trundholm, vieux d'environ 3 400 ans.",
      faits: ["D'un côté le disque est doré, comme le soleil du jour ; de l'autre il est sombre, comme le soleil de la nuit.", "Il a été trouvé en 1902 par un paysan qui labourait son champ."]
    },
    'deco-aurige': {
      nom: "L'Aurige de Delphes", epoque: 3, image: 'deco/aurige', deco: true,
      texte: "L'Aurige de Delphes est une statue de bronze d'environ 2 500 ans : un jeune conducteur de char, debout, qui tient encore les rênes.",
      faits: ["Ses yeux sont faits de pierre et de verre : ils ont l'air vivants !", "Il a été retrouvé en Grèce en 1896, enterré sous des pierres."]
    },
    'deco-vase-vix': {
      nom: "Le vase de Vix", epoque: 3, image: 'deco/vase-vix', deco: true,
      texte: "En Bourgogne, dans la tombe d'une princesse celte, on a trouvé un vase de bronze géant : le vase de Vix, vieux d'environ 2 500 ans.",
      faits: ["Il mesure 1,64 mètre de haut et pèse plus de 200 kilos.", "Il peut contenir 1 100 litres : de quoi remplir sept baignoires !"]
    },
    'deco-lamassu': {
      nom: "Le lamassu", epoque: 3, image: 'deco/lamassu', deco: true,
      texte: "En Assyrie (aujourd'hui l'Irak), de grands taureaux ailés à tête d'homme, les lamassus, gardaient les portes des palais, il y a environ 2 700 ans.",
      faits: ["Ils ont cinq pattes : de face on en voit deux, de côté on en voit quatre.", "On peut en voir au musée du Louvre, à Paris."]
    },
    'deco-porte-ishtar': {
      nom: "La porte d'Ishtar", epoque: 3, image: 'deco/porte-ishtar', deco: true,
      texte: "À Babylone, il y a environ 2 600 ans, on entrait dans la ville par la porte d'Ishtar, couverte de briques bleues brillantes et d'animaux en relief.",
      faits: ["On y voit des lions, des taureaux et des dragons.", "On l'a remontée dans un musée de Berlin, en Allemagne."]
    },
    'deco-fontaine': {
      nom: "Une fontaine", epoque: 3, image: 'deco/fontaine', deco: true,
      texte: "Il y a environ 2 000 ans, les Romains ont construit des aqueducs pour amener l'eau des montagnes jusqu'aux fontaines des villes.",
      faits: ["Chacun venait y remplir ses cruches.", "Le pont du Gard, en France, est un morceau d'aqueduc romain : l'eau coulait tout en haut !"]
    },
    // Le Moyen Âge
    'deco-notre-dame': {
      nom: 'Notre-Dame de Paris', epoque: 4, image: 'deco/notre-dame', deco: true,
      texte: "À Paris, la cathédrale Notre-Dame a été commencée en 1163. Il a fallu presque 200 ans pour la finir !",
      faits: ["Sa grande rosace est un vitrail rond, comme une fleur de verre de toutes les couleurs.", "Ses deux tours mesurent 69 mètres de haut : on y monte par 387 marches.", "En 2019, son toit a brûlé. Des centaines d'artisans l'ont réparée, et elle a rouvert en 2024."]
    },
    'deco-mont-saint-michel': {
      nom: 'Le Mont-Saint-Michel', epoque: 4, image: 'deco/mont-saint-michel', deco: true,
      texte: "En Normandie, une abbaye a été bâtie tout en haut d'un rocher, il y a plus de 1 000 ans. Autour, les maisons du village grimpent sur la pente.",
      faits: ["Quand la mer monte, le rocher devient une île !", "La marée y va très vite : on dit qu'elle arrive à la vitesse d'un cheval au galop.", "Les pierres de l'abbaye venaient des îles voisines : on les apportait en bateau, puis on les hissait tout en haut avec des cordes."]
    },
    'deco-tour-pise': {
      nom: 'La tour de Pise', epoque: 4, image: 'deco/tour-pise', deco: true,
      texte: "En Italie, la tour de Pise est le clocher de la cathédrale. On a commencé à la construire en 1173, et elle s'est mise à pencher pendant les travaux !",
      faits: ["Le sol en dessous est mou : d'un côté, la tour s'est enfoncée.", "Il a fallu environ 200 ans pour la finir.", "Aujourd'hui, des ingénieurs l'ont redressée un tout petit peu pour qu'elle ne tombe pas."]
    },
    'deco-angkor': {
      nom: 'Angkor Vat', epoque: 4, image: 'deco/angkor', deco: true,
      texte: "Au Cambodge, il y a environ 900 ans, on a bâti Angkor Vat, un immense temple en pierre avec cinq tours en forme de bouton de fleur de lotus.",
      faits: ["C'est le plus grand monument religieux du monde.", "Ses murs sont couverts de sculptures : des danseuses, des éléphants, des histoires.", "Il est entouré d'un grand fossé rempli d'eau, comme un lac carré."]
    },
    'deco-moulin-vent': {
      nom: 'Un moulin à vent', epoque: 4, image: 'deco/moulin-vent', deco: true,
      texte: "Les moulins à vent sont arrivés en Europe il y a environ 850 ans. Là où il n'y avait pas de rivière, c'est le vent qui faisait tourner la meule.",
      faits: ["Dans ce moulin sur pivot, toute la cabane tourne autour d'un gros poteau pour faire face au vent.", "Le meunier tendait des toiles sur les ailes, comme des voiles de bateau."]
    },
    'deco-pigeonnier': {
      nom: 'Un pigeonnier', epoque: 4, image: 'deco/pigeonnier', deco: true,
      texte: "Un pigeonnier est une tour ronde où vivent des centaines de pigeons. Chaque petit trou dans le mur est un nid.",
      faits: ["Les pigeons donnaient des œufs et de la viande.", "Leurs crottes étaient un très bon engrais pour faire pousser les champs !"]
    },
    'deco-gargouille': {
      nom: 'Une gargouille', epoque: 4, image: 'deco/gargouille', deco: true,
      texte: "Une gargouille est une gouttière sculptée en forme de monstre. Quand il pleut, l'eau du toit sort par sa bouche, loin des murs.",
      faits: ["Le mot vient de « gargouiller », le bruit de l'eau dans la gorge.", "Sur les cathédrales, il y en a des dizaines : des dragons, des chiens, des lions, et même des singes !"]
    },
    'deco-astrolabe': {
      nom: "L'astrolabe", epoque: 4, image: 'deco/astrolabe', deco: true,
      texte: "L'astrolabe est un instrument en métal pour lire le ciel : il aide à trouver l'heure et le chemin en regardant le soleil et les étoiles.",
      faits: ["Il a été perfectionné par les savants du monde arabe, puis il est arrivé en Europe il y a environ 1 000 ans.", "Les marins s'en servaient pour savoir où ils étaient sur la mer."]
    },
    'deco-licorne': {
      nom: 'La Dame à la licorne', epoque: 4, image: 'deco/licorne', deco: true,
      texte: "La Dame à la licorne, ce sont six grandes tapisseries tissées vers l'an 1500. On y voit une dame, un lion et une licorne, sur un fond rouge couvert de fleurs.",
      faits: ["Cinq tapisseries parlent des cinq sens : le toucher, le goût, l'odorat, l'ouïe et la vue.", "On peut les voir au musée de Cluny, à Paris.", "Il y a aussi des lapins, des chiens et des oiseaux cachés dans les fleurs !"]
    },
    'deco-echecs-lewis': {
      nom: 'Les échecs de Lewis', epoque: 4, image: 'deco/echecs-lewis', deco: true,
      texte: "En 1831, sur l'île de Lewis, en Écosse, on a trouvé dans le sable 78 pièces d'échecs sculptées il y a environ 850 ans, en ivoire de morse.",
      faits: ["Le roi et la reine sont assis sur leur trône, l'air un peu inquiet.", "Certains soldats mordent leur bouclier, pour faire peur !"]
    },
    'deco-moai': {
      nom: 'Un moaï', epoque: 4, image: 'deco/moai', deco: true,
      texte: "Sur l'île de Pâques, au milieu de l'océan Pacifique, on a sculpté près de 1 000 grandes statues de pierre, les moaïs, il y a 500 à 800 ans.",
      faits: ["Ils sont taillés dans la pierre d'un ancien volcan.", "Pour les déplacer, on les faisait « marcher » debout en les balançant avec des cordes."]
    },
    'deco-pont-avignon': {
      nom: "Le pont d'Avignon", epoque: 4, image: 'deco/pont-avignon', deco: true,
      texte: "Le pont Saint-Bénézet, à Avignon, a été construit il y a environ 850 ans. Il traversait tout le Rhône avec 22 arches.",
      faits: ["Les crues du Rhône ont emporté ses arches, l'une après l'autre : il n'en reste que quatre.", "C'est lui qu'on chante dans « Sur le pont d'Avignon, on y danse, on y danse » !"]
    },
    // L'âge de la vapeur
    'deco-tour-eiffel': {
      nom: 'La tour Eiffel', epoque: 5, image: 'deco/tour-eiffel', deco: true,
      texte: "À Paris, la tour Eiffel a été construite en 1889 pour une grande fête, l'Exposition universelle. Elle est toute en fer !",
      faits: ["Elle mesure plus de 300 mètres : pendant 40 ans, ce fut la plus haute construction du monde.", "Elle est faite de 18 000 pièces de fer, tenues par des millions de petits clous de fer, les rivets.", "On la repeint à la main tous les sept ans environ."]
    },
    'deco-big-ben': {
      nom: 'Big Ben', epoque: 5, image: 'deco/big-ben', deco: true,
      texte: "À Londres, la grande tour de l'horloge, qu'on appelle Big Ben, a été finie en 1859. Big Ben, c'est en vrai le nom de sa très grosse cloche !",
      faits: ["La cloche pèse plus de 13 tonnes, autant que deux éléphants.", "Chaque cadran de l'horloge mesure 7 mètres de large : plus qu'une girafe est haute !"]
    },
    'deco-statue-liberte': {
      nom: 'La statue de la Liberté', epoque: 5, image: 'deco/statue-liberte', deco: true,
      texte: "La statue de la Liberté a été construite en France, puis envoyée en bateau à New York, en Amérique, en 1886. Elle accueille les bateaux qui arrivent.",
      faits: ["Elle est en cuivre : au début, elle était couleur orange brillant, puis elle est devenue verte avec le temps.", "Elle est arrivée en 350 morceaux, rangés dans plus de 200 caisses !", "Sa charpente intérieure en fer a été imaginée par Gustave Eiffel, celui de la tour."]
    },
    'deco-palais-cristal': {
      nom: 'Le palais de cristal', epoque: 5, image: 'deco/palais-cristal', deco: true,
      texte: "À Londres, en 1851, on a construit en quelques mois un immense palais de verre et de fer pour montrer les inventions du monde entier.",
      faits: ["Il avait près de 300 000 vitres, toutes de la même taille, fabriquées en usine.", "Il était si grand qu'on a pu y laisser de grands arbres du parc, à l'intérieur !"]
    },
    'deco-montgolfiere': {
      nom: 'La montgolfière', epoque: 5, image: 'deco/montgolfiere', deco: true,
      texte: "En 1783, en France, les frères Montgolfier ont fait voler un grand ballon d'air chaud. Peu après, des humains sont montés dedans : ce sont les premiers à avoir volé dans le ciel !",
      faits: ["Pour un des premiers essais, on a envoyé un mouton, un canard et un coq. Ils sont revenus en pleine forme !", "Le ballon monte parce que l'air chaud est plus léger que l'air froid."]
    },
    'deco-fardier': {
      nom: 'Le fardier de Cugnot', epoque: 5, image: 'deco/fardier', deco: true,
      texte: "En 1769, en France, Joseph Cugnot a construit un grand chariot à trois roues qui avançait tout seul grâce à la vapeur : le tout premier véhicule à moteur !",
      faits: ["Il avançait à peu près à la vitesse d'une personne qui marche.", "On raconte qu'il a renversé un mur pendant un essai : c'était peut-être le premier accident de voiture !", "On peut encore le voir à Paris, au musée des Arts et Métiers."]
    },
    'deco-rocket': {
      nom: 'La Fusée de Stephenson', epoque: 5, image: 'deco/rocket', deco: true,
      texte: "En 1829, en Angleterre, une course de locomotives a été gagnée par celle de George et Robert Stephenson. Son nom ? « Rocket », c'est-à-dire « la Fusée » !",
      faits: ["Elle allait presque à 50 kilomètres à l'heure, plus vite qu'un cheval au galop.", "Elle était jaune et noire, avec une grande cheminée blanche."]
    },
    'deco-kiosque': {
      nom: 'Le kiosque à musique', epoque: 5, image: 'deco/kiosque', deco: true,
      texte: "Le dimanche, dans les parcs des villes, des musiciens jouaient sous un kiosque rond au toit de fer, et tout le monde venait les écouter.",
      faits: ["Le toit renvoie le son vers les gens, comme un grand chapeau.", "Il y en a encore dans beaucoup de jardins de France."]
    },
    'deco-lampadaire': {
      nom: 'Un réverbère à gaz', epoque: 5, image: 'deco/lampadaire', deco: true,
      texte: "Au temps de la vapeur, les rues des villes s'éclairent la nuit avec des réverbères à gaz. Plus besoin de marcher dans le noir !",
      faits: ["Chaque soir, l'allumeur de réverbères passait avec une longue perche pour les allumer un par un.", "Le matin, il repassait pour les éteindre."]
    },
    'deco-fontaine-wallace': {
      nom: 'Une fontaine Wallace', epoque: 5, image: 'deco/fontaine-wallace', deco: true,
      texte: "En 1872, un Anglais généreux, Richard Wallace, a offert à Paris des fontaines vertes où tout le monde pouvait boire de l'eau gratuitement.",
      faits: ["Quatre statues de femmes portent le petit toit.", "Il y en a encore plus de cent à Paris, et l'eau coule toujours !"]
    },
    'deco-velocipede': {
      nom: 'Le grand-bi', epoque: 5, image: 'deco/velocipede', deco: true,
      texte: "Vers 1870, on roulait sur un drôle de vélo : le grand-bi, avec une roue immense devant et une toute petite derrière.",
      faits: ["Les pédales étaient fixées directement sur la grande roue : plus elle était grande, plus on allait vite.", "Pour monter dessus, il fallait presque grimper !"]
    },
    'deco-carrousel': {
      nom: 'Le carrousel', epoque: 5, image: 'deco/carrousel', deco: true,
      texte: "Au temps de la vapeur, dans les fêtes foraines, des manèges de chevaux de bois tournaient grâce à une petite machine à vapeur.",
      faits: ["Les chevaux montaient et descendaient, comme s'ils galopaient.", "Un orgue jouait de la musique pendant que le manège tournait."]
    },
    // L'électricité
    'deco-neuschwanstein': {
      nom: 'Le château de Neuschwanstein', epoque: 6, image: 'deco/neuschwanstein', deco: true,
      texte: "En Allemagne, le roi Louis II a fait construire, à partir de 1869, un château de conte de fées, perché sur un rocher dans la montagne.",
      faits: ["Il avait déjà l'électricité et même un téléphone : c'était tout nouveau !", "Il a inspiré le château de la Belle au bois dormant des dessins animés."]
    },
    'deco-empire-state': {
      nom: "L'Empire State Building", epoque: 6, image: 'deco/empire-state', deco: true,
      texte: "À New York, en 1931, on a construit un gratte-ciel de 102 étages en un peu plus d'un an seulement !",
      faits: ["Grâce aux ascenseurs électriques, on monte tout en haut en moins d'une minute.", "Pendant 40 ans, ce fut le plus haut immeuble du monde."]
    },
    'deco-golden-gate': {
      nom: 'Le pont du Golden Gate', epoque: 6, image: 'deco/golden-gate', deco: true,
      texte: "À San Francisco, en Amérique, un immense pont suspendu enjambe l'entrée de la baie depuis 1937. Il est tout orange !",
      faits: ["Ses deux tours sont aussi hautes qu'un immeuble de 70 étages.", "Ses gros câbles sont faits de milliers de petits fils d'acier tressés ensemble.", "On le repeint sans arrêt pour que la mer ne le fasse pas rouiller."]
    },
    'deco-sagrada': {
      nom: 'La Sagrada Família', epoque: 6, image: 'deco/sagrada', deco: true,
      texte: "À Barcelone, en Espagne, on construit depuis 1882 une immense église aux tours en forme de châteaux de sable, imaginée par l'architecte Antoni Gaudí.",
      faits: ["Plus de 140 ans après, elle n'est toujours pas tout à fait finie !", "Gaudí s'inspirait des arbres, des coquillages et des os pour dessiner ses colonnes."]
    },
    'deco-grande-roue': {
      nom: 'La grande roue', epoque: 6, image: 'deco/grande-roue', deco: true,
      texte: "En 1893, à Chicago, en Amérique, l'ingénieur George Ferris a construit une roue géante avec des cabines : de là-haut, on voyait toute la ville !",
      faits: ["Chaque cabine était grande comme un petit autobus.", "Aujourd'hui, on trouve des grandes roues dans les fêtes foraines du monde entier."]
    },
    'deco-bleriot': {
      nom: "L'avion de Blériot", epoque: 6, image: 'deco/bleriot', deco: true,
      texte: "En 1909, Louis Blériot a traversé la mer entre la France et l'Angleterre avec ce petit avion en bois et en toile.",
      faits: ["Il n'avait même pas de boussole : il a suivi un bateau sur la mer.", "Le voyage a duré un peu plus d'une demi-heure."]
    },
    'deco-ford-t': {
      nom: 'La Ford T', epoque: 6, image: 'deco/ford-t', deco: true,
      texte: "En 1908, en Amérique, Henry Ford a lancé la Ford T, une voiture simple et solide que beaucoup de familles ont pu acheter.",
      faits: ["On la fabriquait à la chaîne : chaque ouvrier ajoutait toujours la même pièce, et ça allait très vite.", "On en a fabriqué plus de 15 millions !"]
    },
    'deco-cinematographe': {
      nom: 'Le cinématographe', epoque: 6, image: 'deco/cinematographe', deco: true,
      texte: "En 1895, à Paris, les frères Lumière ont montré pour la première fois des images qui bougent sur un grand écran : c'est le début du cinéma !",
      faits: ["On tournait une manivelle pour faire défiler le film.", "Dans un de leurs premiers films, un train arrive en gare : certains spectateurs ont eu peur qu'il sorte de l'écran !"]
    },
    'deco-metro': {
      nom: 'Une entrée de métro', epoque: 6, image: 'deco/metro', deco: true,
      texte: "En 1900, à Paris, le métro électrique a ouvert : des trains qui roulent sous la ville ! Ses entrées vertes ressemblent à des plantes.",
      faits: ["Elles ont été dessinées par l'architecte Hector Guimard.", "Leurs lampes ressemblent à des fleurs qui penchent."]
    },
    'deco-zeppelin': {
      nom: 'Le dirigeable', epoque: 6, image: 'deco/zeppelin', deco: true,
      texte: "Vers 1900, en Allemagne, le comte Zeppelin a construit d'immenses ballons en forme de cigare, avec des moteurs, qu'on pouvait diriger dans le ciel.",
      faits: ["On les attachait à un grand mât pour les faire descendre.", "Certains emmenaient des voyageurs d'un continent à l'autre."]
    },
    'deco-cabine': {
      nom: 'Une cabine téléphonique', epoque: 6, image: 'deco/cabine', deco: true,
      texte: "Avant que tout le monde ait un téléphone à la maison, on allait téléphoner dans une petite cabine, dans la rue.",
      faits: ["Les célèbres cabines rouges de Londres datent de 1926.", "Il fallait mettre une pièce pour pouvoir appeler."]
    },
    'deco-colonne-morris': {
      nom: 'Une colonne Morris', epoque: 6, image: 'deco/colonne-morris', deco: true,
      texte: "À Paris, dans les rues, de grandes colonnes vertes portent les affiches des spectacles : le cirque, le théâtre, le cinéma.",
      faits: ["On les appelle colonnes Morris, du nom de l'imprimeur qui les a installées vers 1868.", "Il y en a encore des centaines à Paris."]
    },
    // Le monde moderne
    'deco-atomium': {
      nom: "L'Atomium", epoque: 7, image: 'deco/atomium', deco: true,
      texte: "À Bruxelles, en Belgique, on a construit en 1958 l'Atomium : neuf grosses boules de métal, comme un tout petit grain de fer agrandi des milliards de fois !",
      faits: ["On peut monter dans les boules par des escaliers et un ascenseur.", "Depuis la boule du haut, on voit toute la ville."]
    },
    'deco-opera-sydney': {
      nom: "L'opéra de Sydney", epoque: 7, image: 'deco/opera-sydney', deco: true,
      texte: "À Sydney, en Australie, l'opéra ouvert en 1973 ressemble à de grandes voiles blanches posées au bord de la mer.",
      faits: ["Ses toits sont couverts de plus d'un million de petits carreaux blancs.", "Il a été imaginé par l'architecte danois Jørn Utzon."]
    },
    'deco-pyramide-louvre': {
      nom: 'La pyramide du Louvre', epoque: 7, image: 'deco/pyramide-louvre', deco: true,
      texte: "À Paris, en 1989, on a construit une pyramide de verre devant le musée du Louvre, pour faire entrer la lumière dans le musée.",
      faits: ["Elle a été imaginée par l'architecte Ieoh Ming Pei.", "Le Louvre garde des trésors de toutes les époques, même de l'Égypte ancienne !"]
    },
    'deco-burj-khalifa': {
      nom: 'Le Burj Khalifa', epoque: 7, image: 'deco/burj-khalifa', deco: true,
      texte: "À Dubaï, depuis 2010, le Burj Khalifa est le plus haut immeuble du monde : plus de 800 mètres de haut !",
      faits: ["Il a plus de 160 étages.", "Tout en haut, on est parfois au-dessus des nuages."]
    },
    'deco-spoutnik': {
      nom: 'Spoutnik', epoque: 7, image: 'deco/spoutnik', deco: true,
      texte: "En 1957, Spoutnik a été le tout premier satellite envoyé autour de la Terre : une petite boule de métal avec quatre longues antennes.",
      faits: ["Il faisait bip, bip, et on pouvait l'écouter à la radio.", "Il était à peine plus gros qu'un ballon de plage."]
    },
    'deco-module-lunaire': {
      nom: 'Le module lunaire', epoque: 7, image: 'deco/module-lunaire', deco: true,
      texte: "En 1969, ce drôle de petit vaisseau doré s'est posé sur la Lune avec deux astronautes à bord.",
      faits: ["Il avait quatre pattes pour se poser doucement sur la poussière de la Lune.", "Les traces de pas des astronautes y sont encore : il n'y a pas de vent sur la Lune pour les effacer."]
    },
    'deco-concorde': {
      nom: 'Le Concorde', epoque: 7, image: 'deco/concorde', deco: true,
      texte: "À partir de 1976, le Concorde a emmené des voyageurs deux fois plus vite que le bruit : il traversait l'océan en trois heures et demie.",
      faits: ["Son long nez pointu se baissait pour que les pilotes voient bien la piste en atterrissant.", "La France et l'Angleterre l'ont construit ensemble."]
    },
    'deco-tgv': {
      nom: 'Le TGV', epoque: 7, image: 'deco/tgv', deco: true,
      texte: "En 1981, en France, le TGV, un train électrique à grande vitesse, a commencé à rouler à 260 kilomètres à l'heure !",
      faits: ["En 2007, un TGV a même battu un record : plus de 570 kilomètres à l'heure.", "Son nez est arrondi pour bien glisser dans l'air."]
    },
    'deco-borne-arcade': {
      nom: "Une borne d'arcade", epoque: 7, image: 'deco/borne-arcade', deco: true,
      texte: "Vers 1972, les premiers jeux vidéo sont arrivés dans les cafés : on jouait debout, devant une grande borne.",
      faits: ["Un des tout premiers s'appelait Pong : une petite balle qu'on se renvoie, comme au ping-pong.", "Il fallait glisser une pièce pour jouer une partie."]
    },
    'deco-rubik': {
      nom: 'Le cube de Rubik', epoque: 7, image: 'deco/rubik', deco: true,
      texte: "En 1974, en Hongrie, Ernő Rubik a inventé un cube aux faces de couleur qu'on tourne dans tous les sens.",
      faits: ["Le but : remettre chaque face d'une seule couleur.", "Il y a tellement de façons de le mélanger qu'on ne pourrait jamais toutes les essayer."]
    },
    'deco-fontaine-stravinsky': {
      nom: 'La fontaine Stravinsky', epoque: 7, image: 'deco/fontaine-stravinsky', deco: true,
      texte: "À Paris, en 1983, les artistes Niki de Saint Phalle et Jean Tinguely ont rempli une fontaine de sculptures rigolotes qui bougent et crachent de l'eau.",
      faits: ["On y voit une grande bouche rouge, un serpent et une clé de sol.", "Elle porte le nom d'Igor Stravinsky, un musicien."]
    },
    'deco-velos': {
      nom: 'Des vélos en libre-service', epoque: 7, image: 'deco/velos', deco: true,
      texte: "Depuis 2005, dans beaucoup de villes, on peut prendre un vélo dans la rue, faire son trajet, puis le reposer plus loin.",
      faits: ["Un vélo ne fait ni fumée ni bruit.", "La ville de Lyon, en France, a été une des premières à en avoir beaucoup."]
    },
    'villes-modernes': {
      nom: 'Le monde moderne', epoque: 7, scene: 'scenes/ville-moderne',
      texte: "Dans le monde moderne, les villes montent vers le ciel : des tours de verre, des supermarchés, des bureaux pleins d'ordinateurs, et sur les toits, des panneaux solaires.",
      faits: ["Les grandes tours ont des ascenseurs très rapides.", "Dans un supermarché, on trouve des fruits venus du monde entier.", "Aujourd'hui, presque chaque famille a un petit ordinateur dans la poche : le téléphone !"]
    },
    'villes-electriques': {
      nom: "Les villes de l'électricité", epoque: 6, scene: 'scenes/ville-electrique',
      texte: "Avec l'électricité, les villes changent encore : des poteaux et des fils, des lampadaires dans les rues, des voitures sur les routes, et des immeubles avec des ascenseurs.",
      faits: ["Le soir, les rues éclairées ont l'air de briller comme en plein jour.", "Les premiers ascenseurs électriques ont permis de construire des immeubles bien plus hauts.", "Dans les maisons, on a pu avoir de la lumière en tournant un simple bouton."]
    },
    'villes-vapeur': {
      nom: 'Les villes de la vapeur', epoque: 5, scene: 'scenes/vapeur-ville',
      texte: "Avec la vapeur, les villes grandissent très vite : des usines, des maisons en briques, des gares, et des rues éclairées le soir par des réverbères.",
      faits: ["Les briques se fabriquent en grande quantité dans des fours chauffés au charbon : on construit vite, et solide.", "Beaucoup de gens viennent de la campagne pour travailler dans les usines des villes.", "Grâce au train, on reçoit des lettres et des marchandises venues de très loin."]
    },
    'villes-medievales': {
      nom: 'Les villes du Moyen Âge', epoque: 4, scene: 'scenes/moyen-age',
      texte: "Au Moyen Âge, les villes grandissent : des maisons à colombages serrées les unes contre les autres, des artisans dans chaque rue, et un marché sur la place.",
      faits: ["Les colombages, ce sont les poutres de bois qu'on voit sur le mur ; entre elles, on remplit avec du torchis ou des briques.", "Pour gagner de la place, les étages dépassaient au-dessus de la rue.", "Chaque métier avait souvent sa rue : la rue des boulangers, la rue des forgerons…"]
    },
    'premieres-villes': {
      nom: 'Les premières villes', epoque: 3, scene: 'scenes/metaux',
      texte: "Avec les métaux, le village grandit : des maisons en pierre aux toits de tuiles, des artisans, un marché. Petit à petit, il devient une ville.",
      faits: ["Les maisons en pierre durent bien plus longtemps que les maisons en terre et en paille.", "Les tuiles en terre cuite protègent bien de la pluie et du feu.", "Dans les premières villes, chacun avait son métier : forgeron, potier, marchand, scribe…"]
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
      zone: 'pre', cout: 40, prixNiveau: 40, largeur: 130, taille: 1, grandit: { 2: 1.5, 3: 1.85 },
      travail: { metier: 'bucheron', aller: 'foret', porte: 'bois', duree: 4, produit: 'pieces', qte: { 1: 5, 2: 10 }, avec: { bronze: 14, fer: 18 } }
    },
    tente: {
      evolue: [{ vers: 'hutte-peaux', cout: 30, decouverte: 'abri' }, { vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }, { vers: 'maison-pierre', cout: 120 }, { vers: 'maison-colombages', cout: 170 }, { vers: 'maison-briques', cout: 220 }, { vers: 'maison-ville', cout: 260 }, { vers: 'immeuble-moderne', cout: 320 }],
      resume: "Une petite maison pour 2 personnes.", page: 'cueilleurs',
      explication: "Une tente en peaux tendues sur des bâtons. Deux personnes y dorment à l'abri du vent. Plus il y a de maisons, plus de familles viennent vivre au village.",
      nom: 'Une tente', sprite: '01-pierre/tente', epoque: 1, jusqua: 1,
      zone: 'pre', cout: 10, bois: 2, lits: 2, largeur: 200, taille: 2
    },
    'hutte-branches': {
      evolue: [{ vers: 'hutte-peaux', cout: 30, decouverte: 'abri' }, { vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }, { vers: 'maison-pierre', cout: 110 }, { vers: 'maison-colombages', cout: 160 }, { vers: 'maison-briques', cout: 210 }, { vers: 'maison-ville', cout: 250 }, { vers: 'immeuble-moderne', cout: 310 }],
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
      zone: 'grotte', cout: 35, bois: 2, largeur: 130, taille: 1, grandit: { 2: 1.5, 3: 1.85 },
      travail: { metier: 'tailleur', aller: 'grotte', porte: 'silex', duree: 4, produit: 'pieces', qte: { 1: 7, 2: 12 } }
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
      travail: { metier: 'chasseur', aller: 'gibier', porte: 'viande', duree: 6, produit: 'nourriture', qte: 3 }
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
      evolue: [{ vers: 'maison-torchis', cout: 70, decouverte: 'agriculture' }, { vers: 'maison-pierre', cout: 100 }, { vers: 'maison-colombages', cout: 150 }, { vers: 'maison-briques', cout: 200 }, { vers: 'maison-ville', cout: 240 }, { vers: 'immeuble-moderne', cout: 300 }],
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
      evolue: [{ vers: 'maison-longue', cout: 80, decouverte: 'grenier' }, { vers: 'maison-cour', cout: 220, decouverte: 'monnaie' }, { vers: 'maison-colombages', cout: 140 }, { vers: 'maison-briques', cout: 190 }, { vers: 'maison-ville', cout: 230 }, { vers: 'immeuble-moderne', cout: 290 }],
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
      travail: { metier: 'paysan', aller: null, porte: 'ble', duree: 8, produit: 'nourriture', qte: 5, avec: { fer: 8 } }
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
      evolue: [{ vers: 'maison-cour', cout: 140, decouverte: 'monnaie' }, { vers: 'maison-colombages', cout: 120 }, { vers: 'maison-briques', cout: 170 }, { vers: 'maison-ville', cout: 210 }, { vers: 'immeuble-moderne', cout: 270 }],
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
      zone: 'pre', cout: 110, bois: 2, largeur: 210, taille: 2, grandit: { 2: 1.15, 3: 1.35 },
      travail: { metier: 'potier', aller: 'riviere', porte: 'argile', livre: 'pot', duree: 4, produit: 'pieces', qte: 18, avec: { roue: 24 } }
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
      nom: "Le grand menhir brisé", sprite: 'deco/menhir-brise', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 120, bois: 3, largeur: 220, taille: 2, deco: true, unique: true
    },
    'gavrinis': {
      resume: "Une pierre couverte de spirales gravées.", page: 'deco-gavrinis',
      nom: "La pierre gravée de Gavrinis", sprite: 'deco/gavrinis', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 80, bois: 2, largeur: 95, taille: 1, deco: true, unique: true
    },
    'cromlech': {
      resume: "Un petit cercle de pierres dressées.", page: 'deco-cromlech',
      nom: "Un cromlech", sprite: 'deco/cromlech', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 60, bois: 2, largeur: 150, taille: 1, deco: true
    },
    'ain-ghazal': {
      resume: "Une grande statue en plâtre aux grands yeux.", page: 'deco-ain-ghazal',
      nom: "La statue d'Aïn Ghazal", sprite: 'deco/ain-ghazal', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 90, bois: 2, largeur: 70, taille: 1, deco: true, unique: true
    },
    'skara-brae': {
      resume: "Une maison en pierre, même les meubles !", page: 'deco-skara-brae',
      nom: "La maison de Skara Brae", sprite: 'deco/skara-brae', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 130, bois: 3, largeur: 200, taille: 2, deco: true, unique: true
    },
    'menhir': {
      resume: "Une grande pierre dressée.", page: 'deco-menhir',
      nom: "Un menhir", sprite: 'deco/menhir', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 40, bois: 2, largeur: 80, taille: 1, deco: true
    },
    'statue-menhir': {
      resume: "Une pierre dressée sculptée comme une personne.", page: 'deco-statue-menhir',
      nom: "La Dame de Saint-Sernin", sprite: 'deco/statue-menhir', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 70, bois: 2, largeur: 85, taille: 1, deco: true, unique: true
    },
    'dolmen': {
      resume: "Une grande table de pierre.", page: 'deco-dolmen',
      nom: "Un dolmen", sprite: 'deco/dolmen', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 100, bois: 3, largeur: 140, taille: 1, deco: true
    },
    'alignements': {
      resume: "Une merveille : des menhirs en longues rangées.", page: 'deco-alignements',
      nom: "Les alignements de Carnac", sprite: 'deco/alignements', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 100, bois: 4, largeur: 240, taille: 2, deco: true, merveille: true, unique: true
    },
    'cairn': {
      resume: "Une merveille : un grand monument de pierres sèches.", page: 'deco-cairn',
      nom: "Le cairn de Barnenez", sprite: 'deco/cairn', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 130, bois: 5, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'stonehenge': {
      resume: "Une merveille : le grand cercle de pierres d'Angleterre.", page: 'deco-stonehenge',
      nom: "Stonehenge", sprite: 'deco/stonehenge', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 200, bois: 6, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'gobekli-tepe': {
      resume: "Une merveille : des piliers sculptés d'animaux.", page: 'deco-gobekli-tepe',
      nom: "Göbekli Tepe", sprite: 'deco/gobekli-tepe', epoque: 2, jusqua: 2,
      zone: 'pre', cout: 160, bois: 5, largeur: 240, taille: 2, deco: true, merveille: true, unique: true
    },
    // 3. L'âge des métaux et l'Antiquité
    'maison-pierre': {
      evolue: [{ vers: 'maison-cour', cout: 130, decouverte: 'monnaie' }, { vers: 'maison-colombages', cout: 110 }, { vers: 'maison-briques', cout: 160 }, { vers: 'maison-ville', cout: 200 }, { vers: 'immeuble-moderne', cout: 260 }],
      resume: "Une maison en pierre au toit de tuiles, pour 5 personnes.", page: 'premieres-villes',
      explication: "Une maison en pierre. Ses murs épais gardent la fraîcheur l'été et la chaleur l'hiver, et son toit de tuiles en terre cuite ne laisse pas passer la pluie.",
      vignettes: [{ img: 'maison-pierre', texte: "On empile les pierres pour les murs, puis on pose les tuiles sur le toit." }],
      nom: 'Une maison en pierre', sprite: '03-metaux/maison-pierre', epoque: 3, jusqua: 9,
      zone: 'pre', cout: 160, bois: 4, lits: 5, largeur: 210, taille: 2
    },
    'maison-cour': {
      evolue: [{ vers: 'maison-etages', cout: 200, decouverte: 'horloge' }, { vers: 'immeuble', cout: 300, decouverte: 'train' }, { vers: 'grand-immeuble', cout: 480, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 300 }, { vers: 'tour', cout: 700, decouverte: 'ordinateur' }],
      resume: "Une grande maison autour d'une cour, pour 8 personnes.", page: 'premieres-villes',
      explication: "Une maison à cour. Les pièces entourent une petite cour avec un olivier : toute la famille y vit, et on y travaille à l'ombre.",
      nom: 'Une maison à cour', sprite: '03-metaux/maison-cour', epoque: 3, jusqua: 9, debloque: 'monnaie',
      zone: 'pre', cout: 280, bois: 5, lits: 8, largeur: 250, taille: 2
    },
    'atelier-charron': {
      resume: "Le charron y fabrique des roues et des charrettes.",
      explication: "L'atelier du charron. Il taille les rayons et le cercle de la roue dans le bois, puis il monte les roues sur des charrettes.",
      vignettes: [{ img: 'charron', texte: "Le charron assemble les rayons de la roue, puis il la pose sur la charrette." }],
      nom: "L'atelier du charron", sprite: '03-metaux/atelier-charron', epoque: 3, jusqua: 9, debloque: 'roue',
      zone: 'pre', cout: 140, bois: 3, largeur: 200, taille: 2, grandit: { 2: 1.12, 3: 1.3 },
      travail: { metier: 'charron', aller: null, duree: 5, produit: 'pieces', qte: 22 }
    },
    forge: {
      resume: "Le forgeron y fait des outils en bronze.",
      explication: "La forge. Le forgeron va chercher du minerai dans les collines, le fait fondre dans le four très chaud, puis verse le métal dans des moules pour faire des outils en bronze.",
      vignettes: [{ img: 'forge', texte: "Le forgeron verse le bronze fondu dans un moule de pierre." }],
      nom: 'La forge', sprite: '03-metaux/forge', epoque: 3, jusqua: 9, debloque: 'bronze',
      zone: 'pre', cout: 170, bois: 3, largeur: 170, taille: 1, grandit: { 2: 1.2, 3: 1.4 },
      travail: { metier: 'forgeron', aller: 'grotte', porte: 'minerai', livre: 'outil', duree: 5, produit: 'pieces', qte: 28 }
    },
    'maison-scribes': {
      resume: "Le scribe y écrit les comptes du village : il a des idées 💡.",
      explication: "La maison des scribes. Le scribe compte les sacs de blé, les moutons et les jarres, et il les écrit sur des tablettes d'argile. On n'oublie plus rien, et on a de nouvelles idées.",
      vignettes: [{ img: 'scribe', texte: "Le scribe appuie son roseau dans l'argile molle : il écrit combien il y a de sacs de blé." }],
      nom: 'La maison des scribes', sprite: '03-metaux/maison-scribes', epoque: 3, jusqua: 9, debloque: 'ecriture',
      zone: 'pre', cout: 130, bois: 3, largeur: 175, taille: 1, grandit: { 2: 1.2, 3: 1.4 },
      travail: { metier: 'scribe', aller: null, duree: 14, produit: 'idees', qte: 3 }
    },
    marche: {
      resume: "Au marché, on achète et on vend avec des pièces.",
      explication: "Le marché. Les marchands y vendent des fruits, du tissu, des pots et des outils. Avec la monnaie, plus besoin d'échanger un mouton contre un sac de blé.",
      vignettes: [{ img: 'marche', texte: "La marchande pèse les fruits sur sa balance, et on la paie avec des pièces." }],
      nom: 'Le marché', sprite: '03-metaux/marche', epoque: 3, jusqua: 9, debloque: 'monnaie',
      zone: 'pre', cout: 220, bois: 3, largeur: 230, taille: 2, grandit: { 2: 1.12, 3: 1.3 },
      travail: { metier: 'marchand', aller: null, duree: 6, produit: 'pieces', qte: 34 }
    },
    port: {
      resume: "Le port : les marins partent pêcher en mer à la voile. On y range des amphores : la réserve grandit.",
      explication: "Le port, au bord de la mer. Les bateaux à voile partent pêcher et commercer au loin. Dans l'entrepôt, on garde la nourriture dans des amphores.",
      vignettes: [{ img: 'port', texte: "Le bateau à voile rentre au port, chargé de poissons et d'amphores." }],
      nom: 'Le port', sprite: '03-metaux/port', epoque: 3, jusqua: 9, debloque: 'voile',
      zone: 'plage', cout: 120, bois: 3, largeur: 190, taille: 1, grandit: { 2: 1.2, 3: 1.4 },
      travail: { metier: 'marin', aller: 'plage', porte: 'poisson', duree: 6, produit: 'nourriture', qte: 7 }
    },
    // décorations et merveilles de l'âge des métaux (ADR-023, ADR-024)
    'fontaine': {
      resume: "Une fontaine où l'on vient chercher l'eau.", page: 'deco-fontaine',
      nom: "Une fontaine", sprite: 'deco/fontaine', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 90, bois: 2, largeur: 105, taille: 1, deco: true
    },
    'obelisque': {
      resume: "Une grande pierre taillée en pointe.", page: 'deco-obelisque',
      nom: "Un obélisque", sprite: 'deco/obelisque', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 120, bois: 2, largeur: 62, taille: 1, deco: true
    },
    'char-solaire': {
      resume: "Un cheval de bronze qui tire le soleil.", page: 'deco-char-solaire',
      nom: "Le char du soleil", sprite: 'deco/char-solaire', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 140, bois: 2, largeur: 110, taille: 1, deco: true, unique: true
    },
    'aurige': {
      resume: "Une statue de bronze qui tient des rênes.", page: 'deco-aurige',
      nom: "L'Aurige de Delphes", sprite: 'deco/aurige', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 150, bois: 2, largeur: 70, taille: 1, deco: true, unique: true
    },
    'vase-vix': {
      resume: "Un vase de bronze géant.", page: 'deco-vase-vix',
      nom: "Le vase de Vix", sprite: 'deco/vase-vix', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 170, bois: 2, largeur: 85, taille: 1, deco: true, unique: true
    },
    'lamassu': {
      resume: "Un taureau ailé qui garde les portes.", page: 'deco-lamassu',
      nom: "Le lamassu", sprite: 'deco/lamassu', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 200, bois: 3, largeur: 115, taille: 1, deco: true, unique: true
    },
    'porte-ishtar': {
      resume: "Une porte de briques bleues, avec des lions.", page: 'deco-porte-ishtar',
      nom: "La porte d'Ishtar", sprite: 'deco/porte-ishtar', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 240, bois: 4, largeur: 190, taille: 2, deco: true, unique: true
    },
    'sphinx': {
      resume: "Un lion couché à tête d'homme.", page: 'deco-sphinx',
      nom: "Le grand Sphinx", sprite: 'deco/sphinx', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 280, bois: 4, largeur: 210, taille: 2, deco: true, unique: true
    },
    'ziggourat': {
      resume: "Une merveille : une montagne de briques en escaliers.", page: 'deco-ziggourat',
      nom: "La ziggourat d'Ur", sprite: 'deco/ziggourat', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 220, bois: 5, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'pyramide': {
      resume: "Une merveille : la grande pyramide d'Égypte.", page: 'deco-pyramide',
      nom: "La grande pyramide", sprite: 'deco/pyramide', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 260, bois: 6, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'parthenon': {
      resume: "Une merveille : un temple grec en marbre blanc.", page: 'deco-parthenon',
      nom: "Le Parthénon", sprite: 'deco/parthenon', epoque: 3, jusqua: 3,
      zone: 'pre', cout: 300, bois: 6, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'phare': {
      resume: "Une merveille : un grand phare au bord de la mer.", page: 'deco-phare',
      nom: "Le phare d'Alexandrie", sprite: 'deco/phare', epoque: 3, jusqua: 3,
      zone: 'plage', cout: 340, bois: 6, largeur: 150, taille: 1, deco: true, merveille: true, unique: true
    },
    // 4. Le Moyen Âge
    'maison-colombages': {
      evolue: [{ vers: 'maison-etages', cout: 220, decouverte: 'horloge' }, { vers: 'maison-briques', cout: 150 }, { vers: 'maison-ville', cout: 190 }, { vers: 'immeuble', cout: 340, decouverte: 'train' }, { vers: 'grand-immeuble', cout: 520, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 280 }, { vers: 'tour', cout: 720, decouverte: 'ordinateur' }],
      resume: "Une maison à colombages, pour 7 personnes.", page: 'villes-medievales',
      explication: "Une maison à colombages. On monte d'abord une charpente de grosses poutres, puis on remplit les trous avec du torchis. À l'étage, on dort au chaud sous le toit.",
      vignettes: [{ img: 'colombages', texte: "Les charpentiers montent les poutres, puis on remplit les murs de torchis." }],
      nom: 'Une maison à colombages', sprite: '04-moyen-age/maison-colombages', epoque: 4, jusqua: 9,
      zone: 'pre', cout: 240, bois: 4, lits: 7, largeur: 195, taille: 2
    },
    'maison-etages': {
      resume: "Une grande maison de ville à trois étages, pour 10 personnes.", page: 'villes-medievales',
      explication: "Une maison de ville à étages. Pour gagner de la place, on construit en hauteur, et chaque étage dépasse un peu au-dessus de la rue.",
      evolue: [{ vers: 'immeuble', cout: 280, decouverte: 'train' }, { vers: 'grand-immeuble', cout: 480, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 260 }, { vers: 'tour', cout: 680, decouverte: 'ordinateur' }],
      nom: 'Une maison à étages', sprite: '04-moyen-age/maison-etages', epoque: 4, jusqua: 9, debloque: 'horloge',
      zone: 'pre', cout: 380, bois: 5, lits: 10, largeur: 205, taille: 2
    },
    moulin: {
      resume: "Au bord de la rivière, l'eau fait tourner la roue et la meule : on fait la farine. On y range des sacs : la réserve grandit.",
      explication: "Le moulin à eau. Le courant de la rivière fait tourner la grande roue, la roue fait tourner la meule, et la meule écrase le blé. Le meunier va chercher le blé aux champs et rapporte de la farine.",
      vignettes: [{ img: 'moulin', texte: "La rivière fait tourner la grande roue, et le meunier remplit les sacs de farine." }],
      nom: 'Le moulin à eau', sprite: '04-moyen-age/moulin', epoque: 4, jusqua: 9, debloque: 'moulin',
      zone: 'rive', cout: 190, bois: 4, largeur: 215, taille: 2, grandit: { 2: 1.12, 3: 1.3 },
      travail: { metier: 'moulinier', aller: 'champ', porte: 'ble', livre: 'farine', duree: 6, produit: 'nourriture', qte: 10, avec: { vapeur: 14 } }
    },
    boulangerie: {
      resume: "La boulangère cuit le pain dans le grand four.",
      explication: "La boulangerie. La boulangère pétrit la farine avec de l'eau et du levain, puis elle cuit les pains dans le grand four en pierre, chauffé au bois.",
      vignettes: [{ img: 'boulangerie', texte: "La boulangère enfourne les pains avec sa grande pelle en bois." }],
      nom: 'La boulangerie', sprite: '04-moyen-age/boulangerie', epoque: 4, jusqua: 9, debloque: 'moulin',
      zone: 'pre', cout: 160, bois: 3, largeur: 185, taille: 1, grandit: { 2: 1.15, 3: 1.32 },
      travail: { metier: 'boulanger', aller: null, duree: 6, produit: 'nourriture', qte: 8 }
    },
    marechal: {
      resume: "Le maréchal-ferrant forge le fer : des fers à cheval, des clous, des outils.",
      explication: "La forge du maréchal-ferrant. Il va chercher du minerai de fer dans les collines, le chauffe jusqu'à ce qu'il soit rouge, puis le tape sur l'enclume : des fers à cheval, des clous, des socs de charrue.",
      vignettes: [{ img: 'marechal', texte: "Le maréchal-ferrant tape le fer rouge sur l'enclume pour faire un fer à cheval." }],
      nom: 'La forge du maréchal-ferrant', sprite: '04-moyen-age/marechal', epoque: 4, jusqua: 9, debloque: 'fer',
      zone: 'pre', cout: 240, bois: 3, largeur: 210, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'marechal', aller: 'grotte', porte: 'minerai', livre: 'outil', duree: 5, produit: 'pieces', qte: 40 }
    },
    'tour-horloge': {
      resume: "L'horloger y fait marcher la grande horloge qui sonne les heures.",
      explication: "La tour de l'horloge. Tout en haut, la cloche sonne les heures pour toute la ville. L'horloger remonte les poids, graisse les roues dentées et fabrique de nouvelles horloges.",
      vignettes: [{ img: 'horloger', texte: "L'horloger ajuste les roues dentées de l'horloge." }],
      nom: "La tour de l'horloge", sprite: '04-moyen-age/tour-horloge', epoque: 4, jusqua: 9, debloque: 'horloge',
      zone: 'pre', cout: 280, bois: 4, largeur: 115, taille: 1, grandit: { 2: 1.15, 3: 1.35 },
      travail: { metier: 'horloger', aller: null, duree: 6, produit: 'pieces', qte: 46 }
    },
    imprimerie: {
      resume: "L'imprimeur y imprime des livres : il a des idées 💡.",
      explication: "L'imprimerie. L'imprimeur range des petites lettres en métal pour faire une page, met de l'encre, puis serre la presse : la page est imprimée. Les livres font voyager les idées.",
      vignettes: [{ img: 'imprimeur', texte: "L'imprimeur tire la barre de la presse : la page sort, toute imprimée." }],
      nom: "L'imprimerie", sprite: '04-moyen-age/imprimerie', epoque: 4, jusqua: 9, debloque: 'imprimerie',
      zone: 'pre', cout: 260, bois: 3, largeur: 195, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'imprimeur', aller: null, duree: 12, produit: 'idees', qte: 4 }
    },
    // décorations et merveilles du Moyen Âge (ADR-023, ADR-024)
    'moulin-vent': {
      resume: "Un moulin que le vent fait tourner.", page: 'deco-moulin-vent',
      nom: 'Un moulin à vent', sprite: 'deco/moulin-vent', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 130, bois: 3, largeur: 120, taille: 1, deco: true
    },
    'pigeonnier': {
      resume: "Une tour ronde pleine de pigeons.", page: 'deco-pigeonnier',
      nom: 'Un pigeonnier', sprite: 'deco/pigeonnier', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 140, bois: 2, largeur: 95, taille: 1, deco: true
    },
    'gargouille': {
      resume: "Un petit monstre de pierre qui crache l'eau de pluie.", page: 'deco-gargouille',
      nom: 'Une gargouille', sprite: 'deco/gargouille', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 150, bois: 2, largeur: 70, taille: 1, deco: true, unique: true
    },
    'astrolabe': {
      resume: "Un instrument en métal pour lire le ciel.", page: 'deco-astrolabe',
      nom: "L'astrolabe", sprite: 'deco/astrolabe', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 170, bois: 2, largeur: 80, taille: 1, deco: true, unique: true
    },
    'licorne': {
      resume: "Une grande tapisserie avec une licorne.", page: 'deco-licorne',
      nom: 'La Dame à la licorne', sprite: 'deco/licorne', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 190, bois: 2, largeur: 105, taille: 1, deco: true, unique: true
    },
    'echecs-lewis': {
      resume: "Un roi et une reine des échecs, en ivoire.", page: 'deco-echecs-lewis',
      nom: 'Les échecs de Lewis', sprite: 'deco/echecs-lewis', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 210, bois: 2, largeur: 100, taille: 1, deco: true, unique: true
    },
    'moai': {
      resume: "Une grande statue de pierre de l'île de Pâques.", page: 'deco-moai',
      nom: 'Un moaï', sprite: 'deco/moai', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 250, bois: 3, largeur: 75, taille: 1, deco: true, unique: true
    },
    'pont-avignon': {
      resume: "Le pont qui s'arrête au milieu, celui de la chanson.", page: 'deco-pont-avignon',
      nom: "Le pont d'Avignon", sprite: 'deco/pont-avignon', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 300, bois: 4, largeur: 230, taille: 2, deco: true, unique: true
    },
    'notre-dame': {
      resume: "Une merveille : la grande cathédrale de Paris.", page: 'deco-notre-dame',
      nom: 'Notre-Dame de Paris', sprite: 'deco/notre-dame', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 340, bois: 6, largeur: 250, taille: 2, deco: true, merveille: true, unique: true
    },
    'tour-pise': {
      resume: "Une merveille : la tour qui penche.", page: 'deco-tour-pise',
      nom: 'La tour de Pise', sprite: 'deco/tour-pise', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 360, bois: 6, largeur: 105, taille: 1, deco: true, merveille: true, unique: true
    },
    'mont-saint-michel': {
      resume: "Une merveille : une abbaye sur un rocher, au bord de la mer.", page: 'deco-mont-saint-michel',
      nom: 'Le Mont-Saint-Michel', sprite: 'deco/mont-saint-michel', epoque: 4, jusqua: 4,
      zone: 'plage', cout: 380, bois: 6, largeur: 200, taille: 1, deco: true, merveille: true, unique: true
    },
    'angkor': {
      resume: "Une merveille : le grand temple aux tours en bouton de lotus.", page: 'deco-angkor',
      nom: 'Angkor Vat', sprite: 'deco/angkor', epoque: 4, jusqua: 4,
      zone: 'pre', cout: 420, bois: 6, largeur: 255, taille: 2, deco: true, merveille: true, unique: true
    },
    // 5. L'âge de la vapeur
    'maison-briques': {
      evolue: [{ vers: 'maison-ville', cout: 180 }, { vers: 'immeuble', cout: 320, decouverte: 'train' }, { vers: 'grand-immeuble', cout: 480, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 250 }, { vers: 'tour', cout: 660, decouverte: 'ordinateur' }],
      resume: "Une maison en briques, pour 9 personnes.", page: 'villes-vapeur',
      explication: "Une maison en briques. Les briques sont cuites par milliers dans de grands fours : on construit vite et solide. Les cheminées fument doucement, chaque famille a son poêle.",
      nom: 'Une maison en briques', sprite: '05-vapeur/maison-briques', epoque: 5, jusqua: 9,
      zone: 'pre', cout: 320, bois: 5, lits: 9, largeur: 200, taille: 2
    },
    immeuble: {
      evolue: [{ vers: 'grand-immeuble', cout: 420, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 240 }, { vers: 'tour', cout: 620, decouverte: 'ordinateur' }],
      resume: "Un grand immeuble de ville, pour 14 personnes.", page: 'villes-vapeur',
      explication: "Un immeuble. Avec le train, beaucoup de gens viennent vivre en ville : on construit de grandes maisons à quatre étages, avec un appartement pour chaque famille.",
      nom: 'Un immeuble', sprite: '05-vapeur/immeuble', epoque: 5, jusqua: 9, debloque: 'train',
      zone: 'pre', cout: 500, bois: 6, lits: 14, largeur: 200, taille: 2
    },
    'atelier-inventeur': {
      resume: "L'inventrice y bricole de nouvelles machines : elle a des idées 💡.",
      explication: "L'atelier de l'inventrice. Des roues dentées, des tuyaux de cuivre, une petite chaudière : elle essaie, elle se trompe, elle recommence, et un jour la machine marche !",
      vignettes: [{ img: 'inventrice', texte: "L'inventrice serre un dernier boulon : sa nouvelle machine va-t-elle marcher ?" }],
      nom: "L'atelier de l'inventrice", sprite: '05-vapeur/atelier-inventeur', epoque: 5, jusqua: 9,
      zone: 'pre', cout: 300, bois: 3, largeur: 180, taille: 1, grandit: { 2: 1.15, 3: 1.32 },
      travail: { metier: 'inventeur', aller: null, duree: 12, produit: 'idees', qte: 5 }
    },
    mine: {
      resume: "Le mineur creuse sous la colline pour trouver du charbon.",
      explication: "La mine de charbon, près des rochers. La grande roue fait descendre le mineur sous la terre ; il remonte des wagonnets pleins de charbon, qu'on vend pour chauffer les maisons et les machines.",
      vignettes: [{ img: 'mine', texte: "Le mineur pousse son wagonnet plein de charbon sur les petits rails." }],
      nom: 'La mine de charbon', sprite: '05-vapeur/mine', epoque: 5, jusqua: 9, debloque: 'charbon',
      zone: 'colline', cout: 300, bois: 4, largeur: 180, taille: 1, grandit: { 2: 1.15, 3: 1.32 },
      travail: { metier: 'mineur', aller: null, duree: 5, produit: 'pieces', qte: 54 }
    },
    usine: {
      resume: "Dans l'usine, la machine à vapeur fait tourner les métiers à tisser.",
      explication: "L'usine. Une grande machine à vapeur fait tourner des dizaines de métiers à tisser en même temps : on fabrique du tissu de toutes les couleurs, bien plus vite qu'à la main.",
      vignettes: [{ img: 'usine', texte: "L'ouvrière surveille les fils de couleur sur le grand métier à tisser." }],
      nom: "L'usine", sprite: '05-vapeur/usine', epoque: 5, jusqua: 9, debloque: 'vapeur',
      zone: 'pre', cout: 400, bois: 5, largeur: 215, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'ouvriere', aller: null, duree: 6, produit: 'pieces', qte: 66 }
    },
    caserne: {
      resume: "Les pompiers et leur pompe à vapeur : ils éteignent les incendies.",
      explication: "La caserne des pompiers. Quand un feu éclate, les pompiers sortent la pompe à vapeur : elle envoie l'eau très fort et très haut, jusqu'au toit des maisons.",
      vignettes: [{ img: 'pompiers', texte: "Les pompiers arrosent la maison avec la pompe à vapeur : le feu s'éteint !" }],
      nom: 'La caserne des pompiers', sprite: '05-vapeur/caserne', epoque: 5, jusqua: 9, debloque: 'vapeur',
      zone: 'pre', cout: 180, bois: 3, largeur: 175, taille: 1, unique: true, effet: 'pompiers'
    },
    gare: {
      resume: "La gare : le train arrive avec des voyageurs et des marchandises.",
      explication: "La gare. Le train sort du tunnel en sifflant, s'arrête au quai, et repart. Le chef de gare vend les billets et donne le signal du départ.",
      vignettes: [{ img: 'gare', texte: "Le chef de gare siffle : le train va partir !" }],
      nom: 'La gare', sprite: '05-vapeur/gare', epoque: 5, jusqua: 9, debloque: 'train',
      zone: 'pre', cout: 440, bois: 5, largeur: 220, taille: 2, unique: true, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'cheminot', aller: null, duree: 6, produit: 'pieces', qte: 76 }
    },
    'port-vapeur': {
      resume: "Le port des bateaux à vapeur : on pêche loin en mer. On y range des caisses : la réserve grandit.",
      explication: "Le port à vapeur. Les bateaux à vapeur partent pêcher en mer, même sans vent, et rapportent beaucoup de poissons. Dans l'entrepôt, on garde des caisses et des tonneaux de nourriture.",
      vignettes: [{ img: 'port-vapeur', texte: "Le bateau à vapeur rentre au port, ses grandes roues tournent dans l'eau." }],
      nom: 'Le port à vapeur', sprite: '05-vapeur/port-vapeur', epoque: 5, jusqua: 9, debloque: 'bateau',
      zone: 'plage', cout: 340, bois: 4, largeur: 200, taille: 1, grandit: { 2: 1.15, 3: 1.3 },
      travail: { metier: 'matelot', aller: 'plage', porte: 'poisson', duree: 6, produit: 'nourriture', qte: 13 }
    },
    // décorations et merveilles de la vapeur (ADR-023, ADR-024)
    'montgolfiere': {
      resume: "Le premier ballon qui a emporté des humains dans le ciel.", page: 'deco-montgolfiere',
      nom: 'La montgolfière', sprite: 'deco/montgolfiere', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 200, bois: 2, largeur: 105, taille: 1, deco: true, unique: true
    },
    'fardier': {
      resume: "Le tout premier véhicule qui avance tout seul.", page: 'deco-fardier',
      nom: 'Le fardier de Cugnot', sprite: 'deco/fardier', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 220, bois: 2, largeur: 120, taille: 1, deco: true, unique: true
    },
    'rocket': {
      resume: "Une locomotive qui s'appelait « la Fusée » !", page: 'deco-rocket',
      nom: 'La Fusée de Stephenson', sprite: 'deco/rocket', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 260, bois: 3, largeur: 125, taille: 1, deco: true, unique: true
    },
    'kiosque': {
      resume: "Un kiosque rond où jouent les musiciens.", page: 'deco-kiosque',
      nom: 'Le kiosque à musique', sprite: 'deco/kiosque', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 240, bois: 3, largeur: 140, taille: 1, deco: true, unique: true
    },
    'lampadaire': {
      resume: "Un réverbère pour éclairer la rue le soir.", page: 'deco-lampadaire',
      nom: 'Un réverbère', sprite: 'deco/lampadaire', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 120, bois: 1, largeur: 45, taille: 1, deco: true
    },
    'fontaine-wallace': {
      resume: "Une fontaine verte où tout le monde peut boire.", page: 'deco-fontaine-wallace',
      nom: 'Une fontaine Wallace', sprite: 'deco/fontaine-wallace', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 160, bois: 2, largeur: 60, taille: 1, deco: true
    },
    'velocipede': {
      resume: "Un drôle de vélo à la roue géante.", page: 'deco-velocipede',
      nom: 'Le grand-bi', sprite: 'deco/velocipede', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 180, bois: 2, largeur: 80, taille: 1, deco: true, unique: true
    },
    'carrousel': {
      resume: "Un manège de chevaux de bois.", page: 'deco-carrousel',
      nom: 'Le carrousel', sprite: 'deco/carrousel', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 320, bois: 4, largeur: 190, taille: 2, deco: true, unique: true
    },
    'big-ben': {
      resume: "Une merveille : la grande tour de l'horloge de Londres.", page: 'deco-big-ben',
      nom: 'Big Ben', sprite: 'deco/big-ben', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 440, bois: 6, largeur: 100, taille: 1, deco: true, merveille: true, unique: true
    },
    'statue-liberte': {
      resume: "Une merveille : la grande statue verte qui accueille les bateaux.", page: 'deco-statue-liberte',
      nom: 'La statue de la Liberté', sprite: 'deco/statue-liberte', epoque: 5, jusqua: 5,
      zone: 'plage', cout: 480, bois: 6, largeur: 130, taille: 1, deco: true, merveille: true, unique: true
    },
    'palais-cristal': {
      resume: "Une merveille : un immense palais de verre.", page: 'deco-palais-cristal',
      nom: 'Le palais de cristal', sprite: 'deco/palais-cristal', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 520, bois: 6, largeur: 255, taille: 2, deco: true, merveille: true, unique: true
    },
    'tour-eiffel': {
      resume: "Une merveille : la grande tour de fer de Paris.", page: 'deco-tour-eiffel',
      nom: 'La tour Eiffel', sprite: 'deco/tour-eiffel', epoque: 5, jusqua: 5,
      zone: 'pre', cout: 560, bois: 6, largeur: 175, taille: 2, deco: true, merveille: true, unique: true
    },
    // 6. L'électricité
    'maison-ville': {
      evolue: [{ vers: 'grand-immeuble', cout: 420, decouverte: 'electricite' }, { vers: 'immeuble-moderne', cout: 220 }, { vers: 'tour', cout: 600, decouverte: 'ordinateur' }],
      resume: "Une maison de ville à balcons, pour 11 personnes.", page: 'villes-electriques',
      explication: "Une maison de ville. Derrière les petits balcons en fer, chaque famille a son appartement, et bientôt la lumière électrique dans toutes les pièces.",
      nom: 'Une maison de ville', sprite: '06-electricite/maison-ville', epoque: 6, jusqua: 9,
      zone: 'pre', cout: 400, bois: 5, lits: 11, largeur: 200, taille: 2
    },
    'grand-immeuble': {
      evolue: [{ vers: 'immeuble-moderne', cout: 200 }, { vers: 'tour', cout: 520, decouverte: 'ordinateur' }],
      resume: "Un grand immeuble avec un ascenseur, pour 20 personnes.", page: 'villes-electriques',
      explication: "Un grand immeuble de six étages. Pas besoin de monter tout l'escalier : un ascenseur électrique emmène les habitants jusqu'en haut !",
      nom: 'Un grand immeuble', sprite: '06-electricite/grand-immeuble', epoque: 6, jusqua: 9, debloque: 'electricite',
      zone: 'pre', cout: 680, bois: 7, lits: 20, largeur: 205, taille: 2
    },
    laboratoire: {
      resume: "La chercheuse y fait des expériences : elle a des idées 💡.",
      explication: "Le laboratoire. Des fils, des bobines de cuivre et des ampoules partout : la chercheuse essaie, mesure, note tout dans son carnet, et trouve de nouvelles idées.",
      vignettes: [{ img: 'laboratoire', texte: "La chercheuse regarde briller sa nouvelle ampoule." }],
      nom: 'Le laboratoire', sprite: '06-electricite/laboratoire', epoque: 6, jusqua: 9,
      zone: 'pre', cout: 380, bois: 3, largeur: 180, taille: 1, grandit: { 2: 1.15, 3: 1.32 },
      travail: { metier: 'chercheur', aller: null, duree: 12, produit: 'idees', qte: 6 }
    },
    centrale: {
      resume: "La centrale fabrique l'électricité : des fils l'emportent jusqu'au village.",
      explication: "La centrale électrique. Une machine fait tourner une énorme roue de cuivre, la dynamo, qui fabrique l'électricité. Des poteaux et des fils l'emportent jusqu'aux maisons.",
      vignettes: [{ img: 'centrale', texte: "L'électricien surveille la grande roue de cuivre qui tourne." }],
      nom: 'La centrale électrique', sprite: '06-electricite/centrale', epoque: 6, jusqua: 9, debloque: 'electricite',
      zone: 'pre', cout: 480, bois: 5, largeur: 215, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'electricien', aller: null, duree: 6, produit: 'pieces', qte: 84 }
    },
    'central-telephone': {
      resume: "La standardiste relie les téléphones avec des fils.",
      explication: "Le central téléphonique. Quand quelqu'un appelle, une petite lampe s'allume : la standardiste branche un fil pour le relier à la personne qu'il veut appeler.",
      vignettes: [{ img: 'standardiste', texte: "La standardiste branche les fils : allô, je vous passe votre maman !" }],
      nom: 'Le central téléphonique', sprite: '06-electricite/central-telephone', epoque: 6, jusqua: 9, debloque: 'telephone',
      zone: 'pre', cout: 460, bois: 4, largeur: 175, taille: 1, grandit: { 2: 1.15, 3: 1.3 },
      travail: { metier: 'standardiste', aller: null, duree: 6, produit: 'pieces', qte: 80 }
    },
    garage: {
      resume: "Le mécanicien répare les voitures et leur donne de l'essence.",
      explication: "Le garage. Le mécanicien répare les moteurs, gonfle les pneus et remplit les réservoirs à la pompe : les voitures repartent sur la route.",
      vignettes: [{ img: 'garage', texte: "Le mécanicien répare le moteur de la petite voiture rouge." }],
      nom: 'Le garage', sprite: '06-electricite/garage', epoque: 6, jusqua: 9, debloque: 'voiture',
      zone: 'pre', cout: 500, bois: 4, largeur: 185, taille: 1, grandit: { 2: 1.15, 3: 1.3 },
      travail: { metier: 'mecanicien', aller: null, duree: 6, produit: 'pieces', qte: 90 }
    },
    ferme: {
      resume: "Le fermier laboure avec son tracteur. Le grand silo garde le grain : la réserve grandit.",
      explication: "La ferme et son tracteur. Avec un moteur, le tracteur tire la charrue bien plus vite que les chevaux. Dans le grand silo, on garde le grain au sec pour tout l'hiver.",
      vignettes: [{ img: 'ferme', texte: "Le fermier laboure le champ avec son petit tracteur." }],
      nom: 'La ferme au tracteur', sprite: '06-electricite/ferme', epoque: 6, jusqua: 9, debloque: 'voiture',
      zone: 'pre', cout: 420, bois: 4, largeur: 215, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'fermier', aller: null, duree: 6, produit: 'nourriture', qte: 16 }
    },
    aerodrome: {
      resume: "L'aviatrice décolle avec son petit avion.",
      explication: "L'aérodrome. Un grand hangar pour ranger l'avion, une manche à air pour savoir d'où vient le vent, et une piste d'herbe pour décoller et atterrir.",
      vignettes: [{ img: 'aerodrome', texte: "L'aviatrice décolle : à bientôt, là-haut dans le ciel !" }],
      nom: "L'aérodrome", sprite: '06-electricite/aerodrome', epoque: 6, jusqua: 9, debloque: 'avion',
      zone: 'pre', cout: 560, bois: 5, largeur: 220, taille: 2, unique: true, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'aviatrice', aller: null, duree: 7, produit: 'pieces', qte: 110 }
    },
    // décorations et merveilles de l'électricité (ADR-023, ADR-024)
    'grande-roue': {
      resume: "Une roue géante avec des cabines.", page: 'deco-grande-roue',
      nom: 'La grande roue', sprite: 'deco/grande-roue', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 360, bois: 4, largeur: 175, taille: 2, deco: true, unique: true
    },
    bleriot: {
      resume: "Le petit avion qui a traversé la mer.", page: 'deco-bleriot',
      nom: "L'avion de Blériot", sprite: 'deco/bleriot', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 260, bois: 3, largeur: 130, taille: 1, deco: true, unique: true
    },
    'ford-t': {
      resume: "Une voiture pour toute la famille.", page: 'deco-ford-t',
      nom: 'La Ford T', sprite: 'deco/ford-t', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 240, bois: 2, largeur: 110, taille: 1, deco: true, unique: true
    },
    cinematographe: {
      resume: "La caméra des frères Lumière.", page: 'deco-cinematographe',
      nom: 'Le cinématographe', sprite: 'deco/cinematographe', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 200, bois: 2, largeur: 75, taille: 1, deco: true, unique: true
    },
    metro: {
      resume: "Une entrée de métro verte comme une plante.", page: 'deco-metro',
      nom: 'Une entrée de métro', sprite: 'deco/metro', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 280, bois: 3, largeur: 120, taille: 1, deco: true, unique: true
    },
    zeppelin: {
      resume: "Un grand ballon en forme de cigare.", page: 'deco-zeppelin',
      nom: 'Le dirigeable', sprite: 'deco/zeppelin', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 320, bois: 3, largeur: 160, taille: 1, deco: true, unique: true
    },
    cabine: {
      resume: "Une cabine pour téléphoner dans la rue.", page: 'deco-cabine',
      nom: 'Une cabine téléphonique', sprite: 'deco/cabine', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 140, bois: 1, largeur: 48, taille: 1, deco: true
    },
    'colonne-morris': {
      resume: "Une colonne pour les affiches des spectacles.", page: 'deco-colonne-morris',
      nom: 'Une colonne Morris', sprite: 'deco/colonne-morris', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 150, bois: 1, largeur: 50, taille: 1, deco: true
    },
    neuschwanstein: {
      resume: "Une merveille : un château de conte de fées.", page: 'deco-neuschwanstein',
      nom: 'Le château de Neuschwanstein', sprite: 'deco/neuschwanstein', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 600, bois: 6, largeur: 240, taille: 2, deco: true, merveille: true, unique: true
    },
    'empire-state': {
      resume: "Une merveille : le grand gratte-ciel de New York.", page: 'deco-empire-state',
      nom: "L'Empire State Building", sprite: 'deco/empire-state', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 640, bois: 6, largeur: 95, taille: 1, deco: true, merveille: true, unique: true
    },
    'golden-gate': {
      resume: "Une merveille : un immense pont orange.", page: 'deco-golden-gate',
      nom: 'Le pont du Golden Gate', sprite: 'deco/golden-gate', epoque: 6, jusqua: 6,
      zone: 'plage', cout: 680, bois: 6, largeur: 170, taille: 1, deco: true, merveille: true, unique: true
    },
    sagrada: {
      resume: "Une merveille : une église aux tours de sable.", page: 'deco-sagrada',
      nom: 'La Sagrada Família', sprite: 'deco/sagrada', epoque: 6, jusqua: 6,
      zone: 'pre', cout: 720, bois: 6, largeur: 230, taille: 2, deco: true, merveille: true, unique: true
    },
    // 7. Le monde moderne
    'immeuble-moderne': {
      evolue: [{ vers: 'tour', cout: 480, decouverte: 'ordinateur' }],
      resume: "Un immeuble moderne à balcons, pour 26 personnes.", page: 'villes-modernes',
      explication: "Un immeuble moderne. Il est construit en béton, avec de grandes fenêtres : chaque famille a son appartement et son petit balcon plein de fleurs.",
      nom: 'Un immeuble moderne', sprite: '07-moderne/immeuble-moderne', epoque: 7, jusqua: 9,
      zone: 'pre', cout: 820, bois: 6, lits: 26, largeur: 205, taille: 2
    },
    tour: {
      resume: "Une grande tour de verre, pour 40 personnes.", page: 'villes-modernes',
      explication: "Une tour d'habitation. Elle monte très haut pour loger beaucoup de familles sans prendre de place, et sur son toit, il y a même un jardin !",
      nom: 'Une tour', sprite: '07-moderne/tour', epoque: 7, jusqua: 9, debloque: 'ordinateur',
      zone: 'pre', cout: 1300, bois: 8, lits: 40, largeur: 200, taille: 2
    },
    supermarche: {
      resume: "Le supermarché vend de tout à manger. Ses grands frigos gardent la nourriture : la réserve grandit.",
      explication: "Le supermarché. Des fruits, des légumes, du pain, du lait : tout est rangé dans les rayons, et les grands frigos gardent la nourriture bien au frais.",
      vignettes: [{ img: 'supermarche', texte: "Le caissier passe les courses : bip, bip !" }],
      nom: 'Le supermarché', sprite: '07-moderne/supermarche', epoque: 7, jusqua: 9,
      zone: 'pre', cout: 520, bois: 5, largeur: 215, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'caissier', aller: null, duree: 6, produit: 'nourriture', qte: 18 }
    },
    'centre-recherche': {
      resume: "Les ingénieurs y inventent des machines : ils ont des idées 💡.",
      explication: "Le centre de recherche. Les ingénieurs y dessinent, calculent et fabriquent des robots et des machines toutes neuves.",
      vignettes: [{ img: 'centre-recherche', texte: "L'ingénieur essaie son petit robot." }],
      nom: 'Le centre de recherche', sprite: '07-moderne/centre-recherche', epoque: 7, jusqua: 9,
      zone: 'pre', cout: 460, bois: 4, largeur: 195, taille: 1, grandit: { 2: 1.15, 3: 1.3 },
      travail: { metier: 'ingenieur', aller: null, duree: 12, produit: 'idees', qte: 8 }
    },
    bureau: {
      resume: "L'informaticienne travaille sur ses ordinateurs.",
      explication: "Le bureau. Derrière les grandes fenêtres, des ordinateurs : on y écrit, on y calcule, on y prépare des cartes et des dessins.",
      vignettes: [{ img: 'bureau', texte: "L'informaticienne tape très vite sur son clavier." }],
      nom: 'Le bureau', sprite: '07-moderne/bureau', epoque: 7, jusqua: 9, debloque: 'ordinateur',
      zone: 'pre', cout: 620, bois: 5, largeur: 185, taille: 1, grandit: { 2: 1.15, 3: 1.3 },
      travail: { metier: 'informaticien', aller: null, duree: 6, produit: 'pieces', qte: 100 }
    },
    'parc-solaire': {
      resume: "Les panneaux attrapent la lumière du soleil et fabriquent l'électricité, sans fumée.",
      explication: "Le parc solaire. Des rangées de panneaux tournés vers le soleil fabriquent l'électricité. Le technicien les nettoie et vérifie que tout marche.",
      vignettes: [{ img: 'parc-solaire', texte: "Le technicien nettoie les panneaux pour qu'ils brillent." }],
      nom: 'Le parc solaire', sprite: '07-moderne/parc-solaire', epoque: 7, jusqua: 9, debloque: 'solaire',
      zone: 'pre', cout: 680, bois: 5, largeur: 220, taille: 2, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'technicien', aller: null, duree: 6, produit: 'pieces', qte: 110 }
    },
    observatoire: {
      resume: "L'astronome regarde les étoiles et parle aux satellites : elle a des idées 💡.",
      explication: "L'observatoire. Sous la grande coupole, un télescope regarde les étoiles et les planètes ; à côté, une antenne écoute les satellites.",
      vignettes: [{ img: 'observatoire', texte: "L'astronome regarde la Lune dans son télescope." }],
      nom: "L'observatoire", sprite: '07-moderne/observatoire', epoque: 7, jusqua: 9, debloque: 'satellite',
      zone: 'pre', cout: 720, bois: 5, largeur: 215, taille: 2, unique: true, grandit: { 2: 1.1, 3: 1.25 },
      travail: { metier: 'astronome', aller: null, duree: 12, produit: 'idees', qte: 11 }
    },
    // le pas de tir : la découverte de la fusée lance son chantier, sur le terrain gardé pour lui à l'arrivée du monde moderne
    'pas-de-tir': {
      resume: "Le pas de tir : c'est d'ici que la fusée décolle.", page: 'fusee',
      explication: "Le pas de tir. Une grande tour de métal tient la fusée bien droite. Quand tout est prêt, la tour s'écarte, et la fusée s'envole dans un grand nuage de feu et de fumée !",
      vignettes: [{ img: 'pas-de-tir', texte: "Le technicien vérifie la fusée avant le grand départ." }],
      nom: 'Le pas de tir', sprite: '07-moderne/pas-de-tir', epoque: 7, jusqua: 9,
      zone: 'tir', cout: null, bois: 10, largeur: 215, taille: 2, automatique: true, unique: true
    },
    // décorations et merveilles du monde moderne (ADR-023, ADR-024)
    spoutnik: {
      resume: "Le tout premier satellite.", page: 'deco-spoutnik',
      nom: 'Spoutnik', sprite: 'deco/spoutnik', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 300, bois: 2, largeur: 90, taille: 1, deco: true, unique: true
    },
    'module-lunaire': {
      resume: "Le petit vaisseau qui s'est posé sur la Lune.", page: 'deco-module-lunaire',
      nom: 'Le module lunaire', sprite: 'deco/module-lunaire', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 420, bois: 3, largeur: 125, taille: 1, deco: true, unique: true
    },
    concorde: {
      resume: "L'avion plus rapide que le bruit.", page: 'deco-concorde',
      nom: 'Le Concorde', sprite: 'deco/concorde', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 400, bois: 3, largeur: 160, taille: 1, deco: true, unique: true
    },
    tgv: {
      resume: "Le train à grande vitesse.", page: 'deco-tgv',
      nom: 'Le TGV', sprite: 'deco/tgv', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 380, bois: 3, largeur: 150, taille: 1, deco: true, unique: true
    },
    'borne-arcade': {
      resume: "Un des premiers jeux vidéo.", page: 'deco-borne-arcade',
      nom: "Une borne d'arcade", sprite: 'deco/borne-arcade', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 240, bois: 2, largeur: 60, taille: 1, deco: true, unique: true
    },
    rubik: {
      resume: "Le cube de toutes les couleurs.", page: 'deco-rubik',
      nom: 'Le cube de Rubik', sprite: 'deco/rubik', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 260, bois: 2, largeur: 80, taille: 1, deco: true, unique: true
    },
    'fontaine-stravinsky': {
      resume: "Une fontaine pleine de sculptures rigolotes.", page: 'deco-fontaine-stravinsky',
      nom: 'La fontaine Stravinsky', sprite: 'deco/fontaine-stravinsky', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 460, bois: 3, largeur: 160, taille: 1, deco: true, unique: true
    },
    velos: {
      resume: "Des vélos à prendre et à reposer.", page: 'deco-velos',
      nom: 'Des vélos en libre-service', sprite: 'deco/velos', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 160, bois: 1, largeur: 85, taille: 1, deco: true
    },
    atomium: {
      resume: "Une merveille : neuf grosses boules de métal.", page: 'deco-atomium',
      nom: "L'Atomium", sprite: 'deco/atomium', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 760, bois: 6, largeur: 170, taille: 2, deco: true, merveille: true, unique: true
    },
    'opera-sydney': {
      resume: "Une merveille : un opéra en forme de voiles.", page: 'deco-opera-sydney',
      nom: "L'opéra de Sydney", sprite: 'deco/opera-sydney', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 800, bois: 6, largeur: 190, taille: 2, deco: true, merveille: true, unique: true
    },
    'pyramide-louvre': {
      resume: "Une merveille : une pyramide de verre.", page: 'deco-pyramide-louvre',
      nom: 'La pyramide du Louvre', sprite: 'deco/pyramide-louvre', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 840, bois: 6, largeur: 200, taille: 2, deco: true, merveille: true, unique: true
    },
    'burj-khalifa': {
      resume: "Une merveille : le plus haut immeuble du monde.", page: 'deco-burj-khalifa',
      nom: 'Le Burj Khalifa', sprite: 'deco/burj-khalifa', epoque: 7, jusqua: 7,
      zone: 'pre', cout: 880, bois: 7, largeur: 90, taille: 1, deco: true, merveille: true, unique: true
    },
    // le pont de pierre remplace la passerelle emportée par la crue (le petit problème du Moyen Âge, epoques.md)
    'pont-pierre': {
      resume: "Un pont en arches de pierre : la rivière ne peut plus l'emporter.", page: 'pont',
      explication: "Le pont de pierre. Ses arches sont faites de pierres taillées qui se poussent les unes contre les autres : il résiste aux crues, et les charrettes passent dessus.",
      nom: 'Le pont de pierre', sprite: 'eau/pont-pierre', epoque: 4, jusqua: 9,
      zone: 'gue', cout: null, bois: 6, largeur: 230, taille: 1, automatique: true
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
    2: { sage: 'sage-assis', paysan: 'paysan-faucille', porteur: 'paysan-faucille', berger: 'berger-agneau', potier: 'potiere', meunier: 'meuniere' },
    3: { sage: 'sage-assis', bucheron: 'e3-bucheron', paysan: 'e3-faucille', porteur: 'e3-faucille', berger: 'berger-agneau', potier: 'e3-tour-potier', meunier: 'meuniere',
      forgeron: 'e3-forgeron', scribe: 'e3-scribe', marchand: 'e3-marchande', marin: 'e3-marin', charron: 'e3-charron' },
    4: { sage: 'sage-assis', bucheron: 'e4-bucheron', paysan: 'e4-faucille', porteur: 'e4-faucille', berger: 'berger-agneau', potier: 'e3-tour-potier', meunier: 'meuniere', moulinier: 'e4-meunier',
      forgeron: 'e4-marechal', marechal: 'e4-marechal', scribe: 'e3-scribe', marchand: 'e4-marchande', marin: 'e3-marin', charron: 'e3-charron',
      boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e4-imprimeur' },
    5: { sage: 'sage-assis', bucheron: 'e5-bucheron', paysan: 'e5-faucille', porteur: 'e5-faucille', berger: 'berger-agneau', potier: 'e3-tour-potier', meunier: 'meuniere', moulinier: 'e4-meunier',
      forgeron: 'e4-marechal', marechal: 'e4-marechal', scribe: 'e3-scribe', marchand: 'e4-marchande', marin: 'e5-matelot', matelot: 'e5-matelot', charron: 'e3-charron',
      boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e4-imprimeur',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', pompier: 'e5-pompier' },
    6: { sage: 'sage-assis', bucheron: 'e6-bucheron', paysan: 'e6-fermier', porteur: 'e6-fermier', fermier: 'e6-fermier', berger: 'berger-agneau', potier: 'e3-tour-potier', meunier: 'meuniere', moulinier: 'e4-meunier',
      forgeron: 'e4-marechal', marechal: 'e4-marechal', scribe: 'e3-scribe', marchand: 'e6-citadine', marin: 'e5-matelot', matelot: 'e5-matelot', charron: 'e3-charron',
      boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e4-imprimeur',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', pompier: 'e5-pompier',
      electricien: 'e6-electricien', standardiste: 'e6-standardiste', aviatrice: 'e6-aviatrice', mecanicien: 'e6-mecanicien', chercheur: 'e6-chercheuse' },
    7: { sage: 'sage-assis', bucheron: 'e7-bucheron', paysan: 'e6-fermier', porteur: 'e6-fermier', fermier: 'e6-fermier', berger: 'berger-agneau', potier: 'e3-tour-potier', meunier: 'meuniere', moulinier: 'e4-meunier',
      forgeron: 'e4-marechal', marechal: 'e4-marechal', scribe: 'e3-scribe', marchand: 'e6-citadine', marin: 'e5-matelot', matelot: 'e5-matelot', charron: 'e3-charron',
      boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e4-imprimeur',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', pompier: 'e5-pompier',
      electricien: 'e6-electricien', standardiste: 'e6-standardiste', aviatrice: 'e6-aviatrice', mecanicien: 'e6-mecanicien', chercheur: 'e6-chercheuse',
      informaticien: 'e7-informaticienne', caissier: 'e7-caissier', ingenieur: 'e7-ingenieur', technicien: 'e7-technicien', astronome: 'e7-astronome' }
  };

  // Ce qu'on porte dans les bras, selon l'époque (h : homme, f : femme)
  var porteurs = {
    1: { bois: { h: 'e1-bois-h', f: 'e1-bois-f' }, viande: 'e1-viande', lapin: 'e1-lapin', poisson: 'e1-poisson', silex: 'e1-silex' },
    2: { bois: { h: 'e2-bois-h', f: 'e2-bois-f' }, ble: { h: 'e2-ble-h', f: 'e2-ble-f' }, argile: { h: 'e2-argile-h', f: 'e2-argile-f' }, poisson: 'e2-poisson' },
    3: { bois: { h: 'e3-bois-h', f: 'e3-bois-f' }, ble: { h: 'e3-ble-h', f: 'e3-ble-f' }, argile: { h: 'e3-argile-h', f: 'e3-argile-f' }, poisson: 'e3-poisson', minerai: 'e3-minerai' },
    4: { bois: { h: 'e4-bois-h', f: 'e4-bois-f' }, ble: { h: 'e4-ble-h', f: 'e4-ble-f' }, argile: { h: 'e4-argile-h', f: 'e4-argile-f' }, poisson: 'e4-poisson', minerai: 'e4-minerai' },
    5: { bois: { h: 'e5-bois-h', f: 'e5-bois-f' }, ble: { h: 'e5-ble-h', f: 'e5-ble-f' }, argile: { h: 'e5-argile-h', f: 'e5-argile-f' }, poisson: 'e5-poisson', minerai: 'e5-minerai' },
    6: { bois: { h: 'e6-bois-h', f: 'e6-bois-f' }, ble: { h: 'e6-ble-h', f: 'e6-ble-f' }, argile: { h: 'e6-argile-h', f: 'e6-argile-f' }, poisson: 'e6-poisson', minerai: 'e6-minerai' },
    7: { bois: { h: 'e7-bois-h', f: 'e7-bois-f' }, ble: { h: 'e7-ble-h', f: 'e7-ble-f' }, argile: { h: 'e7-argile-h', f: 'e7-argile-f' }, poisson: 'e7-poisson', minerai: 'e7-minerai' }
  };
  var femmes = ['cueilleuse', 'porteuse-jarre', 'e3-paysanne', 'e3-marchande', 'e4-paysanne', 'e4-boulangere', 'e5-ouvriere', 'e5-matelot', 'e5-inventrice', 'e6-standardiste', 'e6-aviatrice', 'e6-chercheuse', 'e6-citadine', 'e7-informaticienne', 'e7-astronaute', 'e7-astronome', 'e7-citadine'];

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
    },
    3: {
      sage: 'sage', bucheron: 'e3-paysan', cueilleur: 'e3-paysanne', tailleur: 'e3-forgeron',
      chasseur: 'e3-paysan', pecheur: 'e3-marin', peintre: 'e3-marchande',
      paysan: 'e3-paysanne', berger: 'e3-paysan', porteur: 'e3-paysan', potier: 'e3-marchande', meunier: 'e3-paysanne',
      forgeron: 'e3-forgeron', scribe: 'e3-scribe', marchand: 'e3-marchande', marin: 'e3-marin', charron: 'e3-charron',
      adulte: ['e3-paysan', 'e3-paysanne', 'e3-charron', 'e3-marchande'], enfant: 'e3-enfant'
    },
    4: {
      sage: 'sage', bucheron: 'e4-paysan', cueilleur: 'e4-paysanne', tailleur: 'e4-marechal',
      chasseur: 'e4-paysan', pecheur: 'e4-paysan', peintre: 'e4-paysanne',
      paysan: 'e4-paysan', berger: 'e4-paysan', porteur: 'e4-paysan', potier: 'e4-paysanne', meunier: 'e4-paysanne', moulinier: 'e4-meunier',
      forgeron: 'e4-marechal', scribe: 'e4-imprimeur', marchand: 'e4-boulangere', marin: 'e4-paysan', charron: 'e4-marechal',
      marechal: 'e4-marechal', boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e4-imprimeur',
      adulte: ['e4-paysan', 'e4-paysanne', 'e4-meunier', 'e4-boulangere', 'e4-imprimeur'], enfant: 'e4-enfant'
    },
    5: {
      // les vieux métiers prennent plusieurs tenues de la vapeur, pour que tout le monde ne se ressemble pas
      sage: 'sage', bucheron: ['e5-paysan', 'e5-mineur'], cueilleur: ['e5-ouvriere', 'e5-paysan', 'e5-matelot', 'e5-inventrice'], tailleur: 'e5-mineur',
      chasseur: 'e5-paysan', pecheur: ['e5-matelot', 'e5-paysan'], peintre: 'e5-inventrice',
      paysan: ['e5-paysan', 'e5-ouvriere'], berger: 'e5-paysan', porteur: 'e5-paysan', potier: ['e5-ouvriere', 'e5-inventrice'], meunier: ['e5-ouvriere', 'e5-paysan'], moulinier: 'e4-meunier',
      forgeron: 'e5-mineur', scribe: 'e5-inventrice', marchand: ['e5-ouvriere', 'e5-cheminot'], marin: 'e5-matelot', charron: ['e5-mineur', 'e5-paysan'],
      marechal: 'e4-marechal', boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e5-inventrice',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', matelot: 'e5-matelot', pompier: 'e5-pompier',
      adulte: ['e5-paysan', 'e5-ouvriere', 'e5-cheminot', 'e5-matelot', 'e5-inventrice', 'e5-mineur'], enfant: 'e5-enfant'
    },
    6: {
      // une seule tenue quand le métier a sa pose de travail (sinon on change de visage en se mettant au travail)
      sage: 'sage', bucheron: 'e6-fermier', cueilleur: ['e6-citadine', 'e6-standardiste', 'e6-chercheuse'], tailleur: 'e6-mecanicien',
      chasseur: 'e5-paysan', pecheur: ['e5-matelot', 'e6-electricien'], peintre: 'e6-citadine',
      paysan: 'e6-fermier', berger: 'e5-paysan', porteur: 'e6-fermier', potier: ['e6-citadine', 'e6-chercheuse'], meunier: ['e6-citadine', 'e6-standardiste'], moulinier: 'e4-meunier',
      forgeron: 'e6-mecanicien', scribe: 'e6-standardiste', marchand: 'e6-citadine', marin: 'e5-matelot', charron: ['e6-mecanicien', 'e6-electricien'],
      marechal: 'e4-marechal', boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e6-chercheuse',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', matelot: 'e5-matelot', pompier: 'e5-pompier',
      electricien: 'e6-electricien', standardiste: 'e6-standardiste', aviatrice: 'e6-aviatrice', mecanicien: 'e6-mecanicien', fermier: 'e6-fermier', chercheur: 'e6-chercheuse',
      adulte: ['e6-electricien', 'e6-standardiste', 'e6-mecanicien', 'e6-chercheuse', 'e6-citadine', 'e6-aviatrice', 'e6-fermier'], enfant: 'e6-enfant'
    },
    7: {
      // une seule tenue quand le métier a sa pose de travail (sinon on change de visage en se mettant au travail)
      sage: 'sage', bucheron: 'e7-technicien', cueilleur: ['e7-citadine', 'e7-astronaute', 'e6-standardiste'], tailleur: 'e6-mecanicien',
      chasseur: 'e5-paysan', pecheur: ['e5-matelot', 'e7-caissier'], peintre: 'e7-citadine',
      paysan: 'e6-fermier', berger: 'e5-paysan', porteur: 'e6-fermier', potier: ['e7-citadine', 'e6-chercheuse'], meunier: ['e7-citadine', 'e7-astronaute'], moulinier: 'e4-meunier',
      forgeron: 'e6-mecanicien', scribe: 'e7-informaticienne', marchand: 'e7-caissier', marin: 'e5-matelot', charron: ['e6-mecanicien', 'e6-electricien'],
      marechal: 'e4-marechal', boulanger: 'e4-boulangere', horloger: 'e4-horloger', imprimeur: 'e6-chercheuse',
      mineur: 'e5-mineur', ouvriere: 'e5-ouvriere', cheminot: 'e5-cheminot', inventeur: 'e5-inventrice', matelot: 'e5-matelot', pompier: 'e5-pompier',
      electricien: 'e6-electricien', standardiste: 'e6-standardiste', aviatrice: 'e6-aviatrice', mecanicien: 'e6-mecanicien', fermier: 'e6-fermier', chercheur: 'e6-chercheuse',
      informaticien: 'e7-informaticienne', caissier: 'e7-caissier', ingenieur: 'e7-ingenieur', technicien: 'e7-technicien', astronome: 'e7-astronome',
      adulte: ['e7-informaticienne', 'e7-caissier', 'e7-astronaute', 'e7-technicien', 'e7-ingenieur', 'e7-citadine', 'e6-electricien', 'e6-aviatrice'], enfant: 'e7-enfant'
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
    forgeron: ['Je fais fondre le bronze !', 'Ding, ding, ding !'],
    scribe: ['J\'écris les comptes du village.', 'Douze sacs de blé…'],
    marchand: ['Des fruits ! De beaux pots !', 'Ça fait trois pièces.'],
    marin: ['Hissez la voile !', 'Le vent nous pousse !'],
    charron: ['Encore un rayon à la roue.', 'Voilà une belle charrette !'],
    marechal: ['Je ferre le cheval !', "Tac, tac, sur l'enclume !"],
    boulanger: ['Le pain est tout chaud !', 'Ça sent bon le pain !'],
    moulinier: ['La roue tourne !', 'Encore un sac de farine !'],
    horloger: ['Tic, tac, tic, tac…', 'Bientôt midi !'],
    imprimeur: ["J'imprime un livre !", 'Encore une page !'],
    mineur: ['Je descends à la mine !', 'Encore un wagonnet de charbon !'],
    ouvriere: ['La machine tourne !', 'Du tissu tout neuf !'],
    cheminot: ['En voiture !', 'Le train arrive !'],
    inventeur: ["J'ai une idée de machine !", 'Encore un petit boulon…'],
    matelot: ['En avant, toute !', "La roue tourne dans l'eau !"],
    pompier: ['Au feu, les pompiers !', 'Plus vite, la pompe !'],
    electricien: ['Je pose les fils électriques !', 'Attention, la grande roue tourne vite !'],
    standardiste: ['Allô ? Je vous passe la boulangère !', 'Ne quittez pas !'],
    aviatrice: ['Je vais voler au-dessus des nuages !', "Contact ! L'hélice tourne !"],
    mecanicien: ['Je répare le moteur !', 'Un petit coup de clé, et voilà !'],
    fermier: ['Mon tracteur laboure tout seul !', 'Le silo est plein de grain !'],
    chercheur: ["J'ai une nouvelle idée !", 'Regarde comme elle brille !'],
    informaticien: ["J'écris un programme pour l'ordinateur !", 'Encore une ligne, et ça marche !'],
    caissier: ['Bip ! Et une pomme, une !', 'Bonne journée !'],
    ingenieur: ['Mon robot sait marcher !', "Je calcule le chemin de la fusée !"],
    technicien: ['Les panneaux brillent au soleil !', "L'éolienne tourne avec le vent !"],
    astronome: ['Je vois les cratères de la Lune !', 'Voilà le satellite qui passe !'],
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
    sentier: ['nature/touffe', 'Un sentier', "À force de passer toujours au même endroit, les habitants ont usé l'herbe. Plus tard, on en fera de vraies routes !"],
    cheval: ['faune/cheval', 'Un cheval', "Au Moyen Âge, les chevaux tirent les charrettes et les charrues. Le maréchal-ferrant leur met des fers aux sabots pour ne pas les abîmer."],
    gueEmporte: ['nature/galets', 'Le gué', "La crue a emporté la passerelle en bois : on traverse de nouveau en marchant sur les pierres. Il faudrait un pont de pierre !"],
    rails: ['05-vapeur/train', 'Le chemin de fer', "Les rails en fer vont de la gare jusqu'au tunnel, sous la colline. De l'autre côté, il y a d'autres villes : le train y emporte des voyageurs et des marchandises."],
    tunnel: ['05-vapeur/tunnel', 'Le tunnel', "Pour ne pas grimper la colline, on a creusé un tunnel dessous. Le train y entre en sifflant et ressort de l'autre côté."],
    train: ['05-vapeur/train', 'Le train', "La locomotive brûle du charbon pour faire bouillir l'eau. La vapeur pousse les roues, et le train file sur les rails en lâchant de petits nuages blancs."],
    incendie: ['05-vapeur/caserne', 'Une maison en feu', "Une étincelle de la cheminée a mis le feu au toit ! Tout le monde est sorti à temps. Il faudrait des pompiers pour l'éteindre."],
    poteau: ['06-electricite/poteau', 'Les poteaux et les fils', "Les fils emportent l'électricité de la centrale jusqu'aux maisons, et la voix du téléphone d'une maison à l'autre. On ne touche jamais un fil électrique !"],
    lampe: ['06-electricite/lampadaire', 'Un lampadaire électrique', "Une ampoule tout en haut : le soir, elle éclaire la rue bien mieux qu'une bougie ou un bec de gaz."],
    voiture: ['06-electricite/voiture-rouge', 'Une voiture', "Un petit moteur fait tourner les roues : plus besoin de cheval ! Sur la route goudronnée, la voiture roule sans secousses."],
    avion: ['06-electricite/avion', "L'avion", "L'aviatrice fait un tour au-dessus de la vallée. L'hélice tourne très vite et tire l'avion dans le ciel."],
    eolienne: ['niveaux/parc-solaire-3', 'Une éolienne', "Le vent fait tourner ses grandes pales, et l'éolienne fabrique de l'électricité, sans fumée."],
    panneau: ['07-moderne/panneau', 'Un panneau solaire', "Il attrape la lumière du soleil et la change en électricité. Même par temps gris, il travaille un peu !"],
    satellite: ['07-moderne/satellite', 'Un satellite', "Très haut, dans l'espace, il tourne autour de la Terre. Le soir, on le voit passer comme une petite étoile qui avance."],
    fusee: ['07-moderne/fusee', 'La fusée', "Elle est dressée sur le pas de tir, prête à partir. Quand on allume ses moteurs, elle monte jusque dans l'espace !"],
    airSale: ['07-moderne/parc-solaire', "L'air est sale", "Les cheminées des usines, la centrale à charbon et les voitures font de la fumée : l'air de la ville est devenu tout gris. Avec le soleil et le vent, on peut faire l'électricité sans fumée."],
    goudron: ['nature/galets', 'Une route goudronnée', "Pour les voitures, on recouvre les routes de goudron : c'est lisse, et la poussière ne vole plus."],
    route: ['nature/galets', 'Une route', "Avec la roue, les chemins les plus usés sont devenus des routes de terre et de pierres : les charrettes y roulent sans s'enfoncer."]
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
      pretEpoque: {
        2: "Prêt pour le néolithique ? Les premiers paysans vont planter du blé, élever des moutons et faire des pots. L'île va s'agrandir !",
        3: "Prêt pour l'âge des métaux ? On va inventer la roue, faire fondre le bronze et écrire. Le village va devenir une ville, et l'île va encore s'agrandir !",
        4: "Prêt pour le Moyen Âge ? On va bâtir des moulins, forger le fer et construire un pont de pierre. La ville va encore grandir, et l'île aussi !",
        5: "Prêt pour l'âge de la vapeur ? On va creuser le charbon, inventer des machines et faire rouler des trains. L'île va grandir vers le nord !",
        6: "Prêt pour l'électricité ? On va allumer des ampoules, téléphoner de loin, rouler en voiture et voler en avion. La ville va briller !",
        7: "Prêt pour le monde moderne ? On va inventer l'ordinateur, attraper la lumière du soleil, envoyer un satellite… et construire une fusée !"
      },
      epoque3: "Bienvenue à l'âge des métaux ! Construis des maisons en pierre, et regarde dans les découvertes : la roue, le bronze, l'écriture, la monnaie et la voile t'attendent.",
      maisonsPierre: 'Touche une vieille maison pour la transformer en maison en pierre.',
      metauxArrive: "Nouveau : l'âge des métaux est arrivé ! Quand tu veux, touche le bouton doré en haut pour continuer l'histoire.",
      hacheBronze: "Avec des haches en bronze, le bûcheron coupe bien plus de bois !",
      tourPotier: "Avec le tour du potier, une roue qui tourne, la potière fait bien plus de pots !",
      routes: "Avec la roue, les chemins les plus usés deviennent des routes de pierre !",
      faim3: "Il n'y avait pas assez à manger ce soir ! Construis un champ de blé, un enclos ou un port.",
      epoque4: "Bienvenue au Moyen Âge ! Construis des maisons à colombages, et regarde dans les découvertes : le moulin à eau, le fer, le pont de pierre, l'horloge et l'imprimerie t'attendent.",
      maisonsColombages: 'Touche une vieille maison pour la transformer en maison à colombages.',
      moyenAgeArrive: "Nouveau : le Moyen Âge est arrivé ! Quand tu veux, touche le bouton doré en haut pour continuer l'histoire.",
      crue: "Oh non ! Il a beaucoup plu : la rivière a grossi et a emporté la passerelle en bois ! Il faudrait un pont plus solide. Regarde dans les découvertes !",
      gueSansPont: "La rivière a emporté la passerelle : il faut de nouveau traverser à gué. Découvre le pont de pierre !",
      pontPierre: "Les habitants construisent un pont de pierre. Celui-là, la rivière ne pourra pas l'emporter !",
      pontFini: "Le pont de pierre est fini ! On traverse la rivière sans se mouiller, même quand elle grossit.",
      outilsFer: "Avec le fer, le paysan laboure avec une charrue solide et le bûcheron coupe avec une hache en fer : ils travaillent bien mieux !",
      faim4: "Il n'y avait pas assez à manger ce soir ! Construis un champ de blé, un moulin, une boulangerie ou un port.",
      epoque5: "Bienvenue à l'âge de la vapeur ! L'île a grandi vers le nord. Construis des maisons en briques et l'atelier de l'inventrice, et regarde dans les découvertes : le charbon, la machine à vapeur, le train et le bateau à vapeur t'attendent.",
      maisonsBriques: 'Touche une vieille maison pour la transformer en maison en briques.',
      vapeurArrive: "Nouveau : l'âge de la vapeur est arrivé ! Quand tu veux, touche le bouton doré en haut pour continuer l'histoire.",
      incendie: "Oh non ! Une étincelle de cheminée a mis le feu à une maison ! Tout le monde est sorti à temps. Il faudrait des pompiers : avec la machine à vapeur, on pourra construire une caserne et sa pompe à vapeur !",
      incendieEncore: "La maison brûle toujours, et personne ne peut y dormir. Découvre la machine à vapeur, puis construis la caserne des pompiers !",
      caserne: "La caserne est prête ! Les pompiers sortent la pompe à vapeur et courent vers la maison en feu !",
      eteint: "Bravo les pompiers ! Le feu est éteint, et la famille peut rentrer chez elle. Avec la caserne, la ville est protégée.",
      rails: "Le chemin de fer est posé ! Regarde : le train sort du tunnel et s'arrête à la gare.",
      moulinVapeur: "Avec la machine à vapeur, le moulin tourne même quand la rivière est basse : le meunier fait bien plus de farine !",
      faim5: "Il n'y avait pas assez à manger ce soir ! Construis un champ de blé, un moulin, une boulangerie ou un port à vapeur.",
      epoque6: "Bienvenue au temps de l'électricité ! La forêt a un peu reculé pour laisser de la place à la ville. Construis des maisons de ville et le laboratoire, et regarde dans les découvertes : l'électricité, l'ampoule, le téléphone, la voiture et l'avion t'attendent.",
      maisonsVille: 'Touche une vieille maison pour la transformer en maison de ville.',
      electriciteArrive: "Nouveau : le temps de l'électricité est arrivé ! Quand tu veux, touche le bouton doré en haut pour continuer l'histoire.",
      nuitNoire: "Oh ! La ville est devenue si grande que, le soir, les rues sont toutes noires. Le feu de camp et les becs de gaz n'éclairent plus assez : on avance à tâtons, et le travail s'arrête ! Il faudrait une lumière bien plus forte…",
      nuitNoireEncore: "Encore une nuit noire ! Fais la découverte de l'électricité, puis celle de l'ampoule.",
      lumiere: "L'ampoule ! Des lampadaires électriques s'allument dans les rues : le soir, on y voit clair, et le travail continue !",
      lignes: "La centrale est prête ! Des poteaux et des fils emportent l'électricité jusqu'au village.",
      lignesTel: "Le central téléphonique est prêt ! De nouveaux fils relient la ville : on peut se parler de loin.",
      voitures: "Des voitures roulent dans la ville ! Les routes les plus usées sont maintenant goudronnées.",
      avion: "L'aérodrome est prêt ! Regarde le petit avion décoller au-dessus de la vallée !",
      epoque7: "Bienvenue dans le monde moderne ! Au bord de l'île, un grand terrain est gardé pour plus tard : c'est là qu'on construira la fusée. Construis un supermarché, un centre de recherche et des immeubles modernes, et regarde dans les découvertes.",
      maisonsModernes: 'Touche une vieille maison pour la transformer en immeuble moderne.',
      modernArrive: "Nouveau : le monde moderne est arrivé ! Quand tu veux, touche le bouton doré en haut pour continuer l'histoire.",
      airSale: "Oh ! Avec toutes ces cheminées et ces voitures, l'air de la ville est devenu tout gris. Kof, kof ! Plus personne n'a envie de venir habiter ici. Il faudrait fabriquer l'électricité sans fumée…",
      airSaleEncore: "L'air est toujours tout gris ! Regarde dans les découvertes : l'énergie solaire.",
      airPur: "Le soleil et le vent ! Des panneaux solaires et des éoliennes fabriquent l'électricité sans fumée, et la vieille centrale ne fume plus. Regarde : le ciel redevient tout bleu !",
      satellite: "Un satellite tourne maintenant autour de la Terre ! Le soir, regarde bien le ciel : on le voit passer comme une petite étoile.",
      pasDeTir: "La fusée ! Les habitants construisent le pas de tir au bord de l'île. Quand il sera prêt, la fusée sera dressée dessus.",
      fuseePrete: "La fusée est prête ! Touche le gros bouton pour la faire décoller !",
      fuseeNouvelle: "Une nouvelle fusée est prête sur le pas de tir ! Tu peux la faire décoller quand tu veux.",
      fuseePartie: "Et voilà, la fusée file vers les étoiles ! Une autre sera bientôt prête sur le pas de tir.",
      compteRebours: ['Trois !', 'Deux !', 'Un !', 'Décollage !'],
      faim7: "Il n'y avait pas assez à manger ce soir ! Construis un supermarché, une ferme au tracteur ou un champ de blé.",
      faim6: "Il n'y avait pas assez à manger ce soir ! Construis un champ de blé, un moulin, un port à vapeur ou une ferme au tracteur.",
      merveilles: 'Les merveilles ! De grands monuments qui se construisent en trois étapes. Choisis-en une !',
      merveilleEtape: 'Une étape de la merveille est finie ! Ouvre les merveilles pour lancer la suivante.',
      merveilleFinie: 'Bravo ! Ta merveille est terminée ! Tout le village fait la fête !',

      iphone: "Sur iPhone : touche Partager, puis « Sur l'écran d'accueil » pour jouer en plein écran.",
      cocorico: 'Cocorico ! Le soleil se lève, tout le monde au travail !',
      chantier: 'Regarde : les habitants vont chercher du bois pour construire !',
      maison: 'Une nouvelle maison ! Une famille va bientôt arriver.',
      bulle: 'Touche les bulles pour ramasser les pièces, la nourriture et les idées !',
      flecheVerte: 'Regarde la flèche verte : touche ce bâtiment et améliore-le pour gagner plus de pièces !',
      arrivee: "Quelqu'un arrive dans la vallée !",
      nuitFeu: 'La nuit tombe. Autour du feu, on a chaud et on y voit clair : le travail continue !',
      nuitSansFeu: 'Il fait nuit et tout le monde dort… Construis un feu de camp près du village !',
      nuit1: 'La nuit tombe ! Brrr, il fait froid et tout noir : tout le monde va dormir. Il faudrait découvrir le feu…',
      nuit2: 'Encore la nuit… Avec le feu, on pourrait continuer à travailler. Regarde dans les découvertes !',
      reveil: 'Tout le monde dort… Quand tu veux, appuie sur le coq pour faire lever le soleil !',
      idee: "Tu as assez d'idées ! Touche l'ampoule pour faire une découverte.",
      construire: "Tu as des pièces : choisis une construction en bas de l'écran !",
      finEpoque: {
        1: "Tu as fait toutes les découvertes de l'âge de pierre ! Ton village est prêt à changer d'époque. Quand tu veux, touche le bouton doré en haut.",
        2: "Tu as fait toutes les découvertes du néolithique ! Ton village est prêt pour l'âge des métaux. Quand tu veux, touche le bouton doré en haut.",
        3: "Tu as fait toutes les découvertes de l'âge des métaux ! Ta ville est prête pour le Moyen Âge. Quand tu veux, touche le bouton doré en haut.",
        4: "Tu as fait toutes les découvertes du Moyen Âge ! Ta ville est prête pour l'âge de la vapeur. Quand tu veux, touche le bouton doré en haut.",
        5: "Tu as fait toutes les découvertes de l'âge de la vapeur ! Ta ville est prête pour l'électricité. Quand tu veux, touche le bouton doré en haut.",
        6: "Tu as fait toutes les découvertes de l'électricité ! Ta ville est prête pour le monde moderne. Quand tu veux, touche le bouton doré en haut."
      },
      amelioration: "Les habitants vont chercher du bois pour améliorer le bâtiment. Ensuite, une personne de plus y travaillera !",
      outilsBois: 'Avec les outils de pierre, le bûcheron peut maintenant couper les arbres !',
      plusDeChasse: "Avec l'élevage, plus besoin d'aller chasser : la viande vient de l'enclos !",
      embellir: "Embellis ton village avec les monuments de l'époque ! Chacun raconte une vraie histoire.",
      dejaConstruit: 'Tu l\'as déjà ! Il n\'en existe qu\'un seul.',
      finJeu: "Bravo ! Ta fusée est partie vers les étoiles. Ta ville continue de vivre : tu peux encore la faire grandir et faire décoller d'autres fusées."
    },
    // L'histoire : une intro au début de la partie, un passage à la fin du néolithique (la tribu est devenue un village),
    // un passage à la fin de l'âge des métaux (le village est devenu une ville), un passage à la fin du Moyen Âge,
    // un passage à la fin de la vapeur (l'ancienne fin, sur le quai de la gare),
    // et la fin quand toutes les découvertes de la dernière époque sont faites (une ville de l'électricité).
    // Le jeu est en français ; l'anglais est prêt pour le jour où il sera traduit (langue de la page, <html lang>).
    histoire: {
      intro: {
        fr: { l1: 'Il y a très, très longtemps, une petite tribu arrive dans la vallée.', l2: 'Aide-la à grandir !', go: "C'est parti !" },
        en: { l1: 'A very, very long time ago, a small tribe arrives in the valley.', l2: 'Help it grow!', go: "Let's go!" }
      },
      village: {
        fr: { titre: 'Bravo !', l1: 'La petite tribu est devenue un vrai village de paysans !', l2: 'Ce soir, tout le monde fait la fête autour du feu, et rêve déjà de la suite du voyage.', go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'The little tribe has become a real farming village!', l2: 'Tonight everyone celebrates around the fire, already dreaming of the rest of the journey.', go: 'Continue' }
      },
      ville: {
        fr: { titre: 'Bravo !', l1: 'La petite tribu est devenue un village, puis une vraie petite ville !', l2: 'Ce soir, tout le monde fait la fête sur la place du marché, et regarde la lune en rêvant de la suite du voyage.', go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'The little tribe became a village, and now a real little town!', l2: 'Tonight everyone celebrates in the market square, looking at the moon and dreaming of the rest of the journey.', go: 'Continue' }
      },
      'moyen-age': {
        fr: { titre: 'Bravo !', l1: 'La petite tribu est devenue un village, puis une ville, et maintenant une belle ville du Moyen Âge !', l2: "Ce soir, tout le monde fait la fête sous les étoiles, et les enfants rêvent déjà d'aller un jour tout là-haut.", go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'The little tribe became a village, then a town, and now a beautiful medieval town!', l2: 'Tonight everyone celebrates under the stars, and the children already dream of going all the way up there one day.', go: 'Continue' }
      },
      vapeur: {
        fr: { titre: 'Bravo !', l1: "Du premier feu de camp jusqu'aux trains à vapeur, la petite tribu est devenue une grande ville pleine de machines !", l2: "Ce soir, sur le quai de la gare, les enfants regardent les étoiles et rêvent d'une machine encore plus forte : une fusée pour aller tout là-haut.", go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'From the very first campfire to steam trains, the little tribe has become a big town full of machines!', l2: 'Tonight, on the station platform, the children look at the stars and dream of an even stronger machine: a rocket to go all the way up there.', go: 'Continue' }
      },
      electricite: {
        fr: { titre: 'Bravo !', l1: "Du premier feu de camp jusqu'à l'ampoule, la petite tribu est devenue une grande ville pleine de lumières !", l2: "Ce soir, un petit avion passe au-dessus des toits, et les enfants rêvent d'aller encore plus haut : jusqu'aux étoiles, en fusée !", go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'From the very first campfire to the light bulb, the little tribe has become a big town full of lights!', l2: 'Tonight a little airplane flies over the rooftops, and the children dream of going even higher: all the way to the stars, in a rocket!', go: 'Continue' }
      },
      fin: {
        fr: { titre: 'Bravo !', l1: "Du tout premier feu de camp jusqu'à la fusée, la petite tribu est devenue une grande ville moderne !", l2: "Ce soir, sa fusée file vers les étoiles. Et dans la vallée, la vie continue, pleine de nouvelles idées.", go: 'Continuer' },
        en: { titre: 'Well done!', l1: 'From the very first campfire all the way to the rocket, the little tribe has become a big modern city!', l2: 'Tonight its rocket soars towards the stars. And down in the valley, life goes on, full of new ideas.', go: 'Continue' }
      },
      passer: { fr: 'Passer', en: 'Skip' },
      fini: { fr: 'Fini', en: 'Finished' }
    },
    prerequis: function (ids) {
      return "Il faut d'abord découvrir : " + ids.map(function (p) { return decouvertes[p].nom.toLowerCase(); }).join(' et ') + '.';
    }
  };

  return { epoques: epoques, decouvertes: decouvertes, pages: pages, batiments: batiments, allures: allures, poses: poses, porteurs: porteurs, femmes: femmes, textes: textes };
})();
if (typeof module !== 'undefined') module.exports = Donnees;

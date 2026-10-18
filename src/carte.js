// Carte de la vallée : coordonnées en pixels de l'image du plateau (2752 x 1536).
// Relevées sur assets/raw/plateau-vide.png (cf. kb/domains/tech/tech.md).
var Carte = (function () {
  return {
    largeur: 2752,
    hauteur: 1536,
    // cadrage affiché à l'écran (on coupe le fond beige inutile)
    cadre: { x: 90, y: 30, l: 2590, h: 1470 },

    // emplacements constructibles, par zone
    emplacements: {
      pre: [
        [1050, 644], [920, 716], [1180, 716], [1050, 788], [1310, 788],
        [920, 860], [1180, 860], [1440, 860], [790, 932], [1050, 932],
        [1310, 932], [1570, 932], [920, 1004], [1180, 1004], [1440, 1004]
      ],
      rive: [[1420, 640], [1640, 760], [1820, 900]],
      grotte: [[1610, 525], [1990, 640], [2140, 790]],
      plage: [[1130, 1150], [1480, 1150]]
    },

    // pré de départ : le camp de la tribu
    depart: {
      cercle: [1180, 860],
      'tas-bois': [920, 716],
      tentes: [[1050, 788], [1310, 788]]
    },

    // lieux de travail hors bâtiments
    points: {
      foret: [[862, 612], [1012, 594], [700, 740], [620, 880]],
      riviere: [[1480, 600], [1700, 730], [1880, 880]],
      baies: [[775, 712], [727, 869]],
      grotte: [[1760, 500]],
      plage: [[1250, 1170], [1550, 1160]]
    },

    // zone où les habitants flânent (prairie)
    prairie: [
      [1000, 585], [1150, 565], [1350, 525], [1587, 612], [1775, 712],
      [1900, 850], [1962, 981], [1800, 1055], [1550, 1060], [1300, 1075],
      [1050, 1095], [900, 1110], [720, 1040], [620, 960], [650, 870],
      [760, 770], [880, 660]
    ],

    // terrain constructible de l'autre rive, entre la rivière et les rochers
    riveDroite: [
      [1800, 570], [1960, 560], [2120, 620], [2230, 700], [2230, 790],
      [2180, 870], [2130, 930], [2080, 880], [2030, 790], [1960, 690], [1860, 620]
    ],

    // ligne centrale de la rivière, de l'amont vers l'aval
    riviere: [[1246, 250], [1296, 400], [1410, 500], [1610, 569], [1705, 600], [1805, 669], [1855, 700], [1950, 800], [2020, 900], [2090, 1000], [2120, 1050]],

    // le gué (puis la passerelle) pour passer sur la rive de la grotte
    gue: { gauche: [1540, 670], droite: [1720, 570], milieu: [1630, 620] },

    // d'où arrivent les nouveaux habitants
    arrivee: [900, 1110],

    // promenade du mammouth et des chèvres
    lisiere: [[760, 680], [900, 640], [1040, 610], [680, 820]]
  };
})();
if (typeof module !== 'undefined') module.exports = Carte;

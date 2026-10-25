---
title: Direction artistique et pipeline d'assets
domain: direction-artistique
type: doc
status: active
updated: 2026-10-18
---

# Direction artistique

Style et outil : cf. ADR-005 (diorama 3D low-poly cosy) et ADR-006 (Arcads, Nano Banana 2.1).

## Règles de cohérence
- **Toujours partir de l'image de référence** `assets/raw/ref-age-pierre.png` passée en référence à Arcads.
- Même angle isométrique (45° du dessus), même lumière chaude, mêmes formes arrondies.
- La vallée garde sa forme à toutes les époques : rivière en diagonale, forêt à gauche, colline à grotte à droite, plage en bas.
- Les objets du jeu sont générés en **planches** sur fond blanc pur, en grille aérée, sans sol sous les objets, puis découpés.
- Personnages : chibi à grosse tête, sourires, tenues propres à l'époque.

## Pipeline
1. Envoyer la référence à Arcads : `arcads_get_upload_url` puis PUT du PNG. Attention : un fichier temporaire ne sert qu'à **une seule** génération, il faut le renvoyer pour chaque appel.
2. Générer la planche (modèle `nano-banana-2-1`, 2K, 4:3 pour les objets, 16:9 pour les personnages).
3. Ranger l'image brute dans `assets/raw/`.
4. Découper : `python3 -I scripts/decoupe_planche.py <planche> <dossier> <noms séparés par des virgules> [CxL]`. Les noms suivent l'ordre de lecture (lignes puis colonnes). Avec la grille `CxL` (ex. `4x3`), les petits morceaux d'une case (éclats, fumée, ampoule) restent avec leur objet.
   Les vignettes (scènes avec fond, coins arrondis) se découpent à part : rectangle de chaque carte, rogné de 5 %, JPEG 420 px ; les coins arrondis sont refaits en CSS.
5. Vérifier sur le plateau vide (montage de test).

## Modèle de prompt pour une planche d'objets
> Game asset sprite sheet in exactly the same cozy low-poly 3D style, materials, colors and soft lighting as the reference image, same isometric camera angle (45 degrees from above). [ÉPOQUE] buildings and props, each one isolated, well separated from the others on a pure flat white background, no ground tile under them, no shadows touching each other, arranged in a clean 4 by 3 grid with lots of white space: 1 …, 2 …, … 12 …. Cute, chunky, readable at small size. No text, no labels, no numbers.

## Inventaire
| Fichier | Contenu |
|---|---|
| `assets/raw/ref-age-pierre.png` | Référence de style (vallée à l'âge de pierre) |
| `assets/raw/plateau-vide.png` | Ancien fond du jeu (avant la carte en tuiles, ADR-012), gardé comme référence de couleurs |
| `assets/raw/concept-antiquite.png`, `concept-vapeur.png`, `concept-moderne.png` | Concepts de la vallée aux époques 3, 5 et 7 |
| `assets/raw/style-aquarelle-rejete.png` | Style écarté (ADR-005) |
| `assets/raw/test-integration.jpg` | Sprites posés sur le plateau vide |
| `assets/sprites/01-pierre/` | tente, hutte-branches, hutte-peaux, feu, buisson-baies, sechoir-poissons, tas-bois, atelier-silex, peintures-rupestres, ratelier-lances, cercle-pierres, mammouth |
| `assets/sprites/02-neolithique/` | champ-ble, champ-pousses, maison-torchis, maison-longue, grenier, atelier-potier, enclos-moutons, chevre, meule, passerelle, puits, pirogue |
| `assets/sprites/nature/` | sapin-grand, sapin-moyen, sapin-petit, sapins-double, chene, arbre-clair, bouleau, buisson-rond, souche, tronc, souche-hache, pousse, grotte, rocher-mousse, rochers, pierres-plates, touffe, fleurs, roseaux, nenuphar, arbuste, champignons, galets, buisson-fleuri |
| `assets/sprites/habitants/` | porteur-bois, cueilleuse, enfant-pierre, chasseur, paysan, porteuse-jarre, berger, sage |
| `assets/sprites/poses/` (ADR-017) | tailleur, bucheron, cueilleuse, chasseur, pecheur, peintre, sage-assis, allume-feu, paysan-faucille, berger-agneau, potiere, meuniere |
| `assets/sprites/nuit/` (ADR-016) | feu-braises, feu-cendres, tete-adulte, tete-enfant, deux-tetes, tete-sage, coq, torche (pas encore utilisée) |
| `assets/sprites/vignettes/` (ADR-017, JPEG avec leur fond) | âge de pierre : sage, bois, baies, silex, chasse, peche, veillee, peinture ; néolithique : semer, moisson, enclos, poterie, meule, grenier, torchis, pirogue |
| `assets/raw/scenes/` (ADR-018) | 11 scènes 16:9 des grandes pages : cueilleurs, outils, feu, chasse, abri, peinture, agriculture, elevage, grenier, poterie, meule (générées une par une avec la planche de vignettes de l'époque en référence) |
| `assets/sprites/coupe/` (ADR-019) | tente, hutte-branches, hutte-peaux, maison-torchis, maison-longue en vue en coupe, couchages vides ; les places des couchages sont dans `COUCHAGES` (`src/jeu.js`) |
| `assets/sprites/poses/*-b.png` (ADR-020) | deuxième image de chaque pose de travail (planche `planche-poses-b.png`, retouche de la planche des poses) |
| `assets/sprites/porteurs/` (ADR-020) | e1-bois-h, e1-bois-f, e1-viande, e1-poisson, e1-silex, e2-bois-h, e2-bois-f, e2-ble-h, e2-ble-f, e2-argile-f, e2-argile-h, e2-poisson, e1-lapin (ADR-025) |
| `assets/sprites/niveaux/` (ADR-031) | niveaux 2 et 3 de buisson-baies, atelier-silex, ratelier-lances, sechoir-poissons, peintures-rupestres, tas-bois, cercle-pierres, champ-ble, enclos-moutons, grenier, atelier-potier, meule, pirogue (planches `planche-niveaux-pierre.png`, `planche-niveaux-neolithique.png` dont on a effacé les légendes, `planche-decorations-2.png`, `planche-cercles.png`) |
| `assets/sprites/niveaux/` (v0.13, ADR-038) | tas-bois, atelier-silex et atelier-potier aux niveaux 2 et 3 refaits pour qu'on voie nettement la différence (planche `planche-niveaux-ateliers.png`, avec les sprites de niveau 1 en référence) : deux tas et un billot, puis un abri à bois couvert d'écorce ; un muret contre le vent, puis une tente de peau avec râteliers ; un four, puis un grand four et des étagères. Ils s'affichent plus grands (`grandit` dans `data.js`) |
| `assets/sprites/deco/` (v0.11) | + homme-lion, bisons-argile, peinture-lions, peinture-cerfs, bruniquel, menhir-brise, gavrinis, cromlech, ain-ghazal, skara-brae (planches `planche-decorations-2.png` et `planche-cercles.png`) |
| `assets/sprites/faune/` (ADR-025) | lapin-assis, lapin-saut (planche `assets/raw/planche-lapins.png`) |
| `assets/sprites/eau/` | pont-bois (long pont de rondins), pirogue-a et pirogue-b (deux images de pagaie), pirogue-filet |
| `assets/voix/` | textes.json (phrases), mp3/ (voix), arcads-ids.txt ; les wav bruts ne sont pas versionnés |
| `assets/raw/planche-poses.png`, `planche-nuit.png`, `vignettes-pierre.png`, `vignettes-neolithique.png` | Planches brutes de la v0.6 |

## Animations en deux images
Pour obtenir la deuxième image d'une planche de poses, on donne la planche elle-même en référence et on demande « la même planche, mêmes personnages, même place dans la grille, à l'autre moment du geste ». En jeu, les deux images sont calées sur le milieu des pieds (calculé à l'image), pour ne pas sautiller.

## Points connus
- Le générateur ajoute parfois des légendes sous les objets (planche des niveaux du néolithique) : on les efface en blanc avant la découpe. Il a aussi tendance à mettre des linteaux façon Stonehenge sur tout cercle de pierres : le préciser (« NO lintels ») dans le prompt.
- Le sol gris-bleu clair que le générateur dessine sous les objets est converti en ombre brune transparente par `decoupe_planche.py`. Il reste de petites taches claires à l'intérieur de certaines ouvertures (tentes).
- Les sprites sont un peu plus clairs que le plateau : un léger assombrissement en jeu peut suffire.

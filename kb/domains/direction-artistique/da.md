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
4. Découper : `python3 -I scripts/decoupe_planche.py <planche> <dossier> <noms séparés par des virgules>`. Les noms suivent l'ordre de lecture (lignes puis colonnes).
5. Vérifier sur le plateau vide (montage de test).

## Modèle de prompt pour une planche d'objets
> Game asset sprite sheet in exactly the same cozy low-poly 3D style, materials, colors and soft lighting as the reference image, same isometric camera angle (45 degrees from above). [ÉPOQUE] buildings and props, each one isolated, well separated from the others on a pure flat white background, no ground tile under them, no shadows touching each other, arranged in a clean 4 by 3 grid with lots of white space: 1 …, 2 …, … 12 …. Cute, chunky, readable at small size. No text, no labels, no numbers.

## Inventaire
| Fichier | Contenu |
|---|---|
| `assets/raw/ref-age-pierre.png` | Référence de style (vallée à l'âge de pierre) |
| `assets/raw/plateau-vide.png` | La vallée vide : fond du jeu |
| `assets/raw/concept-antiquite.png`, `concept-vapeur.png`, `concept-moderne.png` | Concepts de la vallée aux époques 3, 5 et 7 |
| `assets/raw/style-aquarelle-rejete.png` | Style écarté (ADR-005) |
| `assets/raw/test-integration.jpg` | Sprites posés sur le plateau vide |
| `assets/sprites/01-pierre/` | tente, hutte-branches, hutte-peaux, feu, buisson-baies, sechoir-poissons, tas-bois, atelier-silex, peintures-rupestres, ratelier-lances, cercle-pierres, mammouth |
| `assets/sprites/02-neolithique/` | champ-ble, champ-pousses, maison-torchis, maison-longue, grenier, atelier-potier, enclos-moutons, chevre, meule, passerelle, puits, pirogue |
| `assets/sprites/habitants/` | porteur-bois, cueilleuse, enfant-pierre, chasseur, paysan, porteuse-jarre, berger, sage |

## Points connus
- Léger halo clair sous les objets (ombre douce de la planche). À corriger si ça se voit en jeu : regénérer avec « no cast shadow » ou durcir le seuil de détourage.
- Les sprites sont un peu plus clairs que le plateau : un léger assombrissement en jeu peut suffire.

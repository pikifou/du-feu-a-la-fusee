---
title: Tech (brouillon)
domain: tech
type: doc
status: draft
updated: 2026-10-18
---

# Tech

> **Statut : brouillon.** Proposition de Claude, à promouvoir en ADR quand Julien valide.

## Proposition : la même base que les deux autres jeux de Joshua
La Tour aux Aimants et Chasseur de Dragons tournent sur la même recette, éprouvée :
- HTML + canvas, JavaScript vanilla, aucun framework.
- `build.py` qui produit une page autonome (assets intégrés) et la version appli.
- PWA installable, hors ligne, service worker versionné.
- Hébergement GitHub Pages sur le compte pikifou (branche main, dossier `/docs`, activé à la main par Julien).

## Spécifique à ce jeu
- **Contenu piloté par les données** : époques, découvertes, prérequis et bâtiments dans un seul fichier de données lu par le jeu, construit à partir de `domains/contenu-historique/epoques.md`. Pas de liste en dur dans le code (anti-drift).
- **Rendu isométrique** : cf. « Le prototype » plus bas.
- **Monde vivant** (ADR-008, ADR-010) : chaque habitant est un petit agent avec une file de tâches (marcher vers, travailler, porter, livrer). Les chantiers et les bâtiments de production publient des besoins ; les habitants libres les prennent.
- **Temps** : la simulation tourne en temps réel tant que le jeu est ouvert ; les bulles plafonnent par bâtiment, pour que rien ne se perde pendant une pause.
- **Sauvegarde** : localStorage, une seule partie (clé `feu-fusee-v2`, environ 200 Ko avec le terrain).
- **Tests** : `node --test`, avec une simulation qui joue une partie entière pour vérifier que chaque époque est finissable en 10 à 15 minutes.

## Le prototype (v0.1, 18/10/2026)
- `src/data.js` : **source unique** des chiffres et des textes en jeu (coûts, temps, découvertes, textes avant / après). `kb/domains/contenu-historique/epoques.md` reste le document de conception du contenu ; en cas d'écart, c'est `data.js` qui dit ce qui est en jeu.
- `src/terrain.js` : la carte en tuiles (ADR-012). Grille isométrique 44 × 44 (losanges de 128 × 64), île générée de façon déterministe (forêt, rivière, gué, grotte, plage, mer), rayon de l'île par époque ; chemins A* qui préfèrent l'herbe usée ; usure et repousse de l'herbe (ADR-013).
- Rendu du sol : couleurs des tuiles dessinées en basse définition puis agrandies (les terrains se fondent), découpées net à la forme de l'île, côtés de l'île en couches de terre façon diorama ; calque des sentiers redessiné toutes les 1,5 s ; arbres, rochers et décor posés en sprites et triés en profondeur avec les bâtiments et les habitants.
- `src/monde.js` : la simulation, pure et sans DOM. Chaque habitant suit une file d'étapes (aller, travailler, couper, prendre, déposer, livrer, produire, dormir). Les bâtiments occupent 1 × 1 ou 2 × 2 tuiles, avec une tuile libre autour ; zones particulières : bord de l'eau, plage, abords de la grotte.
- `src/jeu.js` : rendu canvas, interface, voix (synthèse vocale du navigateur, en attendant la décision sur les voix), sons, sauvegarde localStorage.
- `build.py` : `dist/index.html` (page complète) et `dist/artifact.html` (version artefact), images intégrées en webp.
- Nuit (ADR-016) : `monde.cycle` = phase (jour 150 s, soir 25 s, nuit 45 s, aube 4 s) ; `reveiller()` passe directement à l'aube, `toutLeMondeDort()` dit quand montrer le coq ; `m.jour` compte les jours (pour ranimer le feu une fois par soir). Chaque habitant a `maison` (attribuée chaque seconde) et `dortChez` quand il dort.
- Poses (ADR-017) : `Donnees.poses[époque][métier]` ; l'étape « attendre » du travail porte la pose, dessinée au lieu de l'allure tant que l'habitant ne marche pas. Les vignettes vivent dans `Donnees.batiments[x].vignettes` (image + phrase).
- `build.py` garde les images converties en webp dans `.cache/webp.json` (non versionné) : une reconstruction passe de ~2 min à ~1 s.
- `tests/monde.test.js` : un joueur automatique joue des parties entières (rapide et lent), vérifie la fin des chantiers et la sauvegarde ; il appuie sur le coq dès que tout le monde dort. Un test dédié vérifie la séquence de nuit. `node --test tests/monde.test.js`.
- Adresse de test (page locale seulement, l'artefact ignore les paramètres) : `?x=8` accélère le temps, `?neuf` repart de zéro, `?test` saute l'intro.
- Artefact (miroir jouable) : https://claude.ai/artifact/34a6HNKDV74sB5XmyFX4wX
- Appli GitHub Pages : `python3 build.py --pwa docs` produit `docs/` (page, manifest plein écran paysage, service worker versionné, icônes). Dépôt https://github.com/pikifou/du-feu-a-la-fusee, Pages sur la branche main, dossier `/docs` (à activer à la main par Julien) ; adresse attendue https://pikifou.github.io/du-feu-a-la-fusee/
- Plein écran : bouton ⛶ en haut (Android : plein écran et verrouillage en paysage ; iPhone : pas d'API, il faut ajouter le jeu à l'écran d'accueil). En portrait sur téléphone, un écran demande de tourner l'appareil.

## Questions ouvertes
- [ ] Voix off : fichiers audio ou synthèse vocale du navigateur

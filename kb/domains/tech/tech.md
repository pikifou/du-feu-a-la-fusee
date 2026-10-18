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
- **Rendu isométrique** : le plateau est une image fixe ; les sprites sont triés par profondeur (y croissant) ; voir plus bas pour les emplacements.
- **Monde vivant** (ADR-008, ADR-010) : chaque habitant est un petit agent avec une file de tâches (marcher vers, travailler, porter, livrer). Les chantiers et les bâtiments de production publient des besoins ; les habitants libres les prennent.
- **Temps** : la simulation tourne en temps réel tant que le jeu est ouvert ; les bulles plafonnent par bâtiment, pour que rien ne se perde pendant une pause.
- **Sauvegarde** : localStorage, une seule partie.
- **Tests** : `node --test`, avec une simulation qui joue une partie entière pour vérifier que chaque époque est finissable en 10 à 15 minutes.

## Le prototype (v0.1, 18/10/2026)
- `src/data.js` : **source unique** des chiffres et des textes en jeu (coûts, temps, découvertes, textes avant / après). `kb/domains/contenu-historique/epoques.md` reste le document de conception du contenu ; en cas d'écart, c'est `data.js` qui dit ce qui est en jeu.
- `src/carte.js` : coordonnées de la vallée (pré, autre rive, rivière, gué, points de travail), en pixels de `assets/raw/plateau-vide.png`.
- `src/monde.js` : la simulation, pure et sans DOM. Chaque habitant suit une file d'étapes (aller, travailler, prendre, déposer, livrer, produire). Dans le pré, les emplacements sont calculés librement selon la taille des bâtiments ; ailleurs ils sont fixes.
- `src/jeu.js` : rendu canvas, interface, voix (synthèse vocale du navigateur, en attendant la décision sur les voix), sons, sauvegarde localStorage.
- `build.py` : `dist/index.html` (page complète) et `dist/artifact.html` (version artefact), images intégrées en webp.
- `tests/monde.test.js` : un joueur automatique joue des parties entières (rapide et lent), vérifie la fin des chantiers et la sauvegarde. `node --test tests/monde.test.js`.
- Adresse de test (page locale seulement, l'artefact ignore les paramètres) : `?x=8` accélère le temps, `?neuf` repart de zéro, `?test` saute l'intro.
- Artefact (miroir jouable) : https://claude.ai/artifact/34a6HNKDV74sB5XmyFX4wX

## Questions ouvertes
- [ ] Voix off : fichiers audio ou synthèse vocale du navigateur

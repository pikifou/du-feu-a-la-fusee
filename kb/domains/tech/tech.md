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
- **Rendu isométrique** : le plateau est une image fixe ; les sprites sont posés sur des emplacements prédéfinis de la prairie, triés par profondeur (y croissant).
- **Croissance automatique** (ADR-004) : un petit planificateur choisit l'emplacement libre suivant et anime l'apparition (pop, fumée, habitant qui sort).
- **Temps** : production calculée à partir de l'horloge réelle, avec plafond (grenier), pour que rien ne se perde pendant une pause.
- **Sauvegarde** : localStorage, une seule partie.
- **Tests** : `node --test`, avec une simulation qui joue une partie entière pour vérifier que chaque époque est finissable en 10 à 15 minutes.

## Questions ouvertes
- [ ] Tablette en paysage ou téléphone en portrait (cf. GD)
- [ ] Voix off : fichiers audio ou synthèse vocale du navigateur

---
title: État courant
domain: canon
type: doc
status: active
updated: 2026-10-18
---

# Où on en est (18/10/2026)

**Phase** : préproduction.

## Fait
- Intention posée (`canon/vision.md`) et 14 décisions consignées (`canon/decisions.md`).
- Direction artistique choisie : diorama 3D cosy (ADR-005).
- Concepts de la même vallée à 4 époques (pierre, antiquité, vapeur, moderne) : la continuité tient.
- Plateau vide généré (la vallée sans rien) : base du jeu.
- 32 sprites détourés : 12 de l'âge de pierre, 12 du néolithique, 8 habitants.
- Test d'intégration des sprites sur le plateau concluant (`assets/raw/test-integration.jpg`).

- **v0.4** : cycle jour / nuit (ADR-011) : sans feu tout le monde dort, la lumière du feu permet de continuer à travailler ; le mammouth vit sur l'autre rive (plus dans les arbres) et les chasseurs vont le chasser ; l'autre rive ne devient constructible qu'au néolithique, quand le mammouth est parti.
- **v0.3** : bouton plein écran, écran « tourne ton téléphone », appli installable pour GitHub Pages (`docs/`, poussé).
- **v0.2 (retour de Julien : « caméra super loin, icônes immenses »)** : caméra rapprochée sur le village, glisser pour se déplacer, pincer pour zoomer ; interface réduite d'environ un tiers ; images en plus haute définition ; halo blanc sous les sprites remplacé par une ombre douce.
- **Prototype jouable v0.1** (époques 1 et 2) publié en artefact : habitants qui travaillent et construisent, chantiers, bulles à récolter, 10 découvertes avec voix, changement d'époque avec rénovation automatique des huttes et passerelle (cf. `domains/tech/tech.md`).

## En cours
- Game design en brouillon : proposition de Claude, pas encore validée par Julien (`domains/game-design/gd.md`).

## En cours (18/10, fin d'après-midi)
- Refonte du terrain en tuiles (ADR-012), sentiers émergents (ADR-013), habitants plus petits (ADR-014).

## Prochaine étape
- Test du prototype avec Joshua sur tablette.
- Valider les questions ouvertes restantes du GD (titre, voix off).

## Mesures (joueur automatique)
- Âge de pierre ~6 min, néolithique ~5 min, même pour un joueur qui ne récolte que toutes les 20 s : le rythme est donné par les idées du sage. La cible du GD est 10 à 15 min par époque : à juger avec Joshua.
- Une partie complète finit vers 45 habitants et 27 bâtiments.

## Points connus
- Code poussé sur https://github.com/pikifou/du-feu-a-la-fusee (push possible depuis Claude). Pages s'active à la main (branche main, dossier /docs) : l'API Pages est bloquée par le proxy.
- Pas encore de Frise du temps ni de Musée, pas de petits problèmes, pas de déplacement des bâtiments posés (prévus au GD).
- Les pièces s'accumulent vite en fin d'époque : à rééquilibrer après le test.

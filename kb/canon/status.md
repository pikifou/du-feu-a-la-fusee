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
- Intention posée (`canon/vision.md`) et 22 décisions consignées (`canon/decisions.md`).
- Direction artistique choisie : diorama 3D cosy (ADR-005).
- Concepts de la même vallée à 4 époques (pierre, antiquité, vapeur, moderne) : la continuité tient.
- Plateau vide généré (la vallée sans rien) : base du jeu.
- 11 scènes illustrées pour les grandes pages ; 5 maisons en coupe ; 12 poses en deuxième image ; 12 porteurs.
- Sprites détourés : 12 de l'âge de pierre, 12 du néolithique, 8 habitants, 24 éléments de nature, 12 poses de travail, 8 éléments de nuit ; 16 vignettes illustrées pour les fiches.
- Test d'intégration des sprites sur le plateau concluant (`assets/raw/test-integration.jpg`).

- **v0.8** : nombre de bâtiments possédés en bas à droite de chaque carte du bandeau ; voix de narratrice enregistrée pour les 182 phrases du jeu (ADR-022) ; améliorations payantes (ADR-021) ; une vraie passerelle en bois sur le gué ; au néolithique, des pirogues vont et viennent sur la rivière et la mer ; les fenêtres s'ouvrent toujours en haut ; message de fin de démo dans les découvertes.
- **v0.7** : deux niveaux d'explication (ADR-018) : la fiche courte (une phrase, les chiffres, un bouton « En savoir plus ») et la grande page illustrée (une scène en grand, avant / maintenant, 3 « Le savais-tu ? », ce que ça permet de construire avec les vignettes) ; découvrir une technologie ouvre sa grande page, qu'on peut relire depuis la liste des découvertes ou depuis la fiche courte. La nuit, les maisons s'ouvrent en coupe et on voit les dormeurs couchés dedans, éclairés par le foyer (ADR-019). Habitants plus vivants (ADR-020) : petites phrases dans des bulles, gestes de travail en deux images, objets portés dans les bras (bois, viande, poisson, silex, blé, argile).
- **v0.6** : la nuit en séquence (ADR-016) : à la tombée du jour, on se rassemble au feu (le premier arrivé le ranime), on veille et on travaille dans sa lumière, puis tout le monde rentre dormir dans sa maison et les feux s'éteignent (braises puis cendres) ; quand tout le village dort, un coq « Réveil ! » fait lever le soleil. On voit qui fait quoi (ADR-017) : chaque habitant a sa maison, les dormeurs sont couchés devant leur porte, la tête qui dépasse de la couverture ; au travail, chacun est en plein geste (tailleur, bûcheron, pêcheur, sage assis, paysan à la faucille, berger, potière, meunière…) ; la fiche d'un bâtiment montre une ou deux vignettes illustrées de l'activité, lues à voix haute quand on les touche.
- **v0.5** : la grande refonte. Île en tuiles qui s'agrandit au néolithique (ADR-012) ; forêt d'arbres que les bûcherons abattent (la forêt recule, des souches restent) ; l'herbe s'use en sentiers puis en chemins de terre, et les habitants préfèrent les chemins tracés (ADR-013) ; habitants bien plus petits que les huttes et un espace libre autour de chaque bâtiment (ADR-014) ; fiche d'explication lue à voix haute pour chaque bâtiment, et aussi pour les arbres, la grotte, le mammouth, le gué et les sentiers (ADR-015) ; zone constructible en surbrillance.
- **v0.4** : cycle jour / nuit (ADR-011) : sans feu tout le monde dort, la lumière du feu permet de continuer à travailler ; le mammouth vit sur l'autre rive (plus dans les arbres) et les chasseurs vont le chasser ; l'autre rive ne devient constructible qu'au néolithique, quand le mammouth est parti.
- **v0.3** : bouton plein écran, écran « tourne ton téléphone », appli installable pour GitHub Pages (`docs/`, poussé).
- **v0.2 (retour de Julien : « caméra super loin, icônes immenses »)** : caméra rapprochée sur le village, glisser pour se déplacer, pincer pour zoomer ; interface réduite d'environ un tiers ; images en plus haute définition ; halo blanc sous les sprites remplacé par une ombre douce.
- **Prototype jouable v0.1** (époques 1 et 2) publié en artefact : habitants qui travaillent et construisent, chantiers, bulles à récolter, 10 découvertes avec voix, changement d'époque avec rénovation automatique des huttes et passerelle (cf. `domains/tech/tech.md`).

## En cours
- Game design en brouillon : proposition de Claude, pas encore validée par Julien (`domains/game-design/gd.md`).

## Prochaine étape
- Choisir avec Julien d'autres façons de dépenser (cf. journal, propositions de Claude) et régler les prix des améliorations.
- Faire relire par Julien les « Le savais-tu ? » (proposition de Claude, dans `src/data.js`).
- Valider le rôle du mammouth (autre rive, chassé, part au néolithique) : proposition de Claude, pas encore validée.
- Test du prototype avec Joshua sur tablette.
- Valider les questions ouvertes restantes du GD (titre, voix off).

## Mesures (joueur automatique)
- v0.6, joueur qui appuie sur le coq dès que tout le monde dort : âge de pierre ~9 min, néolithique ~8 min (même pour un joueur qui ne récolte que toutes les 20 s). Le rythme est donné par les idées du sage et par les nuits. La cible du GD est 10 à 15 min par époque : à juger avec Joshua.
- Une partie complète finit vers 55 habitants et 35 bâtiments ; ~110 tuiles de sentiers.

## Points connus
- Code poussé sur https://github.com/pikifou/du-feu-a-la-fusee (push possible depuis Claude). Pages s'active à la main (branche main, dossier /docs) : l'API Pages est bloquée par le proxy.
- Pas encore de Frise du temps ni de Musée, pas de petits problèmes, pas de déplacement des bâtiments posés (prévus au GD).
- Les pièces s'accumulent vite en fin d'époque : à rééquilibrer après le test.

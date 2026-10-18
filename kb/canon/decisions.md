---
title: Journal des décisions (ADR)
domain: canon
type: decision-log
status: active
updated: 2026-10-18
---

# Décisions

Append-only. Une décision n'est jamais réécrite : si elle change, une nouvelle ADR la remplace et l'ancienne passe en « Remplacée par ADR-XXX ».

---

## ADR-001 : la vraie histoire, de l'âge de pierre au monde moderne
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : le jeu suit l'ordre historique réel des découvertes et va de l'âge de pierre au monde moderne. Les prérequis sont les vrais (pas de roue sans outils, pas de train sans vapeur ni fer).
- **Contexte** : le but est que Joshua comprenne et « visite » l'histoire.
- **Alternatives écartées** : liberté façon Civilization (histoire alternative, on peut avoir l'écriture avant l'agriculture).

## ADR-002 : le développement, pas la politique
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : le jeu parle du développement (techniques, vie quotidienne, ville qui grandit) et laisse la politique de côté.
- **Contexte** : Julien : « C'est bien de parler du développement sans parler de la politique. »
- **Alternatives écartées** : montrer l'évolution des formes de pouvoir (chef, roi, vote), proposée par Claude au premier échange.

## ADR-003 : un SimCity technologique simplifié et cosy
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : genre city builder léger : production de richesse simplifiée, boucles d'attente courtes pour récolter de l'argent avec le temps, peu de menaces.
- **Contexte** : la référence citée par Julien est SimCity (récolte avec le temps qui passe), « mais pas trop longues ».
- **Alternatives écartées** : un 4X façon Civilization (carte, empires, combats).

## ADR-004 : la ville évolue toute seule et grandit
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : la ville pousse d'elle-même sous les yeux du joueur ; le spectacle de la croissance fait partie du plaisir.
- **Contexte** : demande de Julien au moment du choix du visuel.
- **Conséquence** : le rôle exact de Joshua dans la construction (poser ou non les bâtiments) reste à arbitrer (cf. `domains/game-design/gd.md`, questions ouvertes).

## ADR-005 : direction artistique en diorama 3D low-poly cosy
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : une tuile de vallée flottante vue en isométrique, low-poly arrondi, couleurs pastel chaudes, lumière de fin d'après-midi, façon Townscaper / Islanders. Image de référence : `assets/raw/ref-age-pierre.png`.
- **Contexte** : deux styles testés en parallèle ; Julien a préféré le diorama.
- **Alternatives écartées** : aquarelle livre d'images (`assets/raw/style-aquarelle-rejete.png`).

## ADR-006 : génération des visuels avec Arcads
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : les images sont générées avec Arcads (modèle Nano Banana 2.1), en partant de l'image de référence pour garder le style.
- **Contexte** : outil demandé par Julien.

## ADR-007 : documentation en KB incrémentale (canon, ADR, journal)
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : le projet est documenté dans `kb/` selon la méthode KB incrémentale : canon curé, ADR à chaud, journal de sessions, réconciliation sur demande.
- **Contexte** : Julien : le jeu « a quand même un peu d'ampleur », il faut poser le GD et les décisions dans des fichiers pour pouvoir travailler.

## ADR-008 : Joshua pose les bâtiments, la ville fait le reste
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : Joshua place lui-même les bâtiments sur des emplacements de la vallée. La ville ajoute seule tout le reste : chemins, habitants, détails, et elle améliore d'elle-même ce qui existe. Précise ADR-004 sans la remplacer.
- **Contexte** : il fallait concilier la ville qui pousse toute seule (ADR-004) et le plaisir SimCity de construire (ADR-003).
- **Alternatives écartées** : A, il commande et la ville place (recommandation initiale de Claude) ; C, ville entièrement autonome.

## ADR-009 : tablette en paysage
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : le support principal est la tablette tenue en paysage. Toute la mise en page part de là.
- **Alternatives écartées** : téléphone en portrait (format des deux autres jeux de Joshua).

## ADR-010 : un petit monde vivant, façon The Settlers
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : les habitants travaillent, transportent, construisent et s'affairent sous les yeux du joueur. Chaque production et chaque chantier se voient : on doit avoir l'impression d'un monde qui s'agite et avance tout seul.
- **Contexte** : Julien : « un petit monde qui vit un peu comme Settlers […] le plaisir qu'on a quand on regarde un Anno, un SimCity. Le monde devient vivant. C'est cosy, c'est mignon, et on est content de voir les choses avancer. »
- **Conséquence** : la production n'est pas un simple minuteur sur un bâtiment, c'est un trajet d'habitant (aller chercher, travailler, rapporter). Précise ADR-004 et ADR-008.

## ADR-011 : un cycle jour / nuit qui montre à quoi sert le feu
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : le jeu alterne le jour et la nuit. La nuit, il fait noir et froid : sans feu, les habitants rentrent dormir et tout s'arrête ; dans la lumière d'un feu de camp, on se réchauffe et le travail continue.
- **Contexte** : demande de Julien, pour illustrer l'intérêt du feu.
- **Réglage du prototype** : 150 s de jour, 60 s de nuit (cf. `src/monde.js`).

## ADR-012 : une carte en tuiles qui s'agrandit
- **Date** : 2026-10-18
- **Statut** : acceptée. Remplace le plateau fixe d'ADR-005 pour le terrain de jeu (le style diorama 3D cosy des sprites est conservé).
- **Décision** : le terrain est une grille isométrique de tuiles (herbe, forêt, eau, sable, roche). On peut construire presque partout où il y a de l'herbe libre. Les arbres sont des objets que les bûcherons abattent : la forêt recule et libère de la place. La carte s'agrandit à chaque époque.
- **Contexte** : Julien : « on est assez vite limité » ; « la B permet de vraiment mieux comprendre ce qui se passe et comment on fait évoluer les choses ».
- **Alternatives écartées** : A, un plus grand plateau dessiné d'un seul bloc (recommandation de Claude).

## ADR-013 : les chemins naissent des pas des habitants ; les routes sont une technologie
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : l'herbe s'use là où les habitants passent souvent : herbe drue, herbe tassée, sentier, chemin de terre. Les habitants préfèrent les chemins déjà tracés, si bien que le réseau de sentiers émerge tout seul. Les vraies routes arrivent plus tard, comme découverte, et permettront les chevaux, les charrettes et le transport des marchandises.
- **Contexte** : Julien : « au fur et à mesure qu'ils marchent, [les gens] allaient créer des routes […] les routes, c'est quelque chose qui viendrait plus tard dans les technologies ».

## ADR-014 : des habitants plus petits que les maisons
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : les habitants sont nettement plus petits que les huttes et ont plus d'espace autour d'eux, pour qu'on imagine qu'ils entrent dans les maisons.
- **Contexte** : Julien : « les bonhommes font la même taille que les huttes ».

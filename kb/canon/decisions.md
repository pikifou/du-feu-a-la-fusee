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

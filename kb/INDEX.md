---
title: Index / Manifeste
domain: canon
type: doc
status: active
updated: 2026-10-18
---

# Knowledge Base : manifeste

Source de vérité du jeu **« Civilization simplifié » pour Joshua** (titre de travail proposé : *Du Feu à la Fusée*, non validé). Tout Claude (Project, agent, session de code) lit ce fichier en premier pour savoir où trouver quoi.

## Règle d'or
Cette base est la **source unique de vérité**. Claude en est un *consommateur*, jamais la source. Rien d'important ne vit uniquement dans une conversation : ça finit ici.

## Ordre de lecture
1. `INDEX.md` (ce fichier)
2. `PROCESS.md`
3. `canon/status.md`
4. `canon/decisions.md`
5. Le domaine concerné par la tâche

## Arborescence
- `PROCESS.md` : comment la base se met à jour (à lire avant de contribuer)
- `canon/` : transverse, lu par tous les domaines
  - `vision.md` : intention du jeu, dans les mots de Julien
  - `glossaire.md` : vocabulaire commun
  - `decisions.md` : journal append-only des arbitrages (ADR)
  - `status.md` : la seule page qui dit où on en est
- `domains/`
  - `game-design/` : boucle, ressources, progression, écrans
  - `contenu-historique/` : époques, découvertes, prérequis, textes voix off
  - `direction-artistique/` : style, pipeline de génération, inventaire des assets
  - `tech/` : moteur, build, distribution
- `journal/` : captures de session brutes, en attente de réconciliation
- `_sources/` : matière externe à extraire, jamais du canon
- `_templates/` : formats de capture et de métadonnées

Hors KB, à la racine du dépôt : `assets/` (images), `scripts/` (outils), plus tard le code du jeu.

## Phase actuelle : préproduction
Intention et direction artistique posées, game design en brouillon (proposition de Claude à valider point par point), premiers assets des époques 1 et 2 générés. Prochain jalon : un prototype jouable des époques 1 et 2.

## Domaines
| Domaine | Périmètre | Lit dans le canon |
|---|---|---|
| game-design | Boucle de jeu, ressources, rythme, écrans, UX enfant | vision, decisions, glossaire |
| contenu-historique | Époques, découvertes, chaîne de prérequis, voix off | vision, decisions (ADR-001, ADR-002) |
| direction-artistique | Style, prompts, planches, sprites, cohérence visuelle | decisions (ADR-005, ADR-006) |
| tech | Stack, moteur, build, PWA, tests | decisions, status |

---
title: Processus de mise à jour
domain: canon
type: doc
status: active
updated: 2026-10-18
---

# Comment la base se met à jour

Une KB ne meurt pas d'un manque de structure : elle meurt de la friction de mise à jour. Ce process est conçu pour que **capturer soit quasi gratuit** et que **nettoyer soit rare**.

## Deux cadences à ne pas mélanger

### 1. Capture : constante, append-only, brute
À la fin de chaque session de travail avec Claude :
> « Résume cette session au format capture (voir `_templates/_capture-session.md`). »

Le bloc s'ajoute dans `journal/AAAA-MM-session-XX.md`. On ne touche PAS au canon. Objectif : ne rien perdre, vite.

### 2. Réconciliation : rare, délibérée, curée
À un jalon (fin de prototype, environ une fois par semaine, ou quand le journal s'épaissit) :
> « Lis `journal/` depuis la dernière réconciliation et le canon. Propose-moi un diff : quoi mettre à jour dans vision/status, quelles décisions promouvoir, quoi archiver. »

Claude propose, **Julien valide** item par item, le canon bouge. Les entrées de journal réconciliées passent en `status: archived`.

## Exception : les décisions se capturent à chaud
Une décision = haute valeur, faible volume. Dès qu'un arbitrage est pris par Julien, il s'ajoute tout de suite dans `canon/decisions.md` (format ADR). Une proposition de Claude n'est pas une décision tant que Julien ne l'a pas validée.

## Règle anti-drift
Un fait ou une décision vit à UN seul endroit. Les domaines *référencent* le canon (« cf. ADR-003 »), ils ne le copient pas. Le code consomme la KB (ex. la liste des découvertes est lue depuis un fichier de données unique), il ne la duplique pas.

## Statuts dans les domaines
- `draft` : proposition, pas encore validée par Julien
- `active` : validé, sert de référence
- `stable` : validé et testé avec Joshua

## Matière source (`_sources/`)
Documents qui *nourrissent* la KB sans en faire partie. Dépôt en `_sources/<nom>.md` avec `type: source` et `status: to-extract`. Le contenu n'est jamais copié dans canon ou domains : la réconciliation en extrait les apprentissages. Cycle : `to-extract` → `extracted` → `archived`.

---
title: Convention de métadonnées
domain: canon
type: template
status: active
updated: 2026-10-18
---

# Bloc de métadonnées (front-matter)

Chaque fichier .md commence par :

```
---
title: <titre lisible>
domain: canon | <nom-de-domaine>
type: doc | journal | decision-log | source | template | instructions
status: draft | active | stable | to-extract | extracted | archived
updated: AAAA-MM-JJ
---
```

Pourquoi : nommage + métadonnées stables = chunking/retrieval propre quand un agent indexera la base plus tard.

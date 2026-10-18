---
title: Game design (brouillon)
domain: game-design
type: doc
status: draft
updated: 2026-10-18
---

# Game design

> **Statut : brouillon.** Proposition de Claude construite sur les décisions de Julien (ADR-001 à ADR-005). Chaque section passe en `active` quand Julien l'a validée. Les décisions elles-mêmes vivent dans `canon/decisions.md`, ce fichier ne fait que les appliquer.

## Piliers (rappel, cf. canon)
- La vraie histoire, de la pierre au moderne (ADR-001).
- Le développement, sans politique (ADR-002).
- City builder cosy, attentes courtes, peu de menaces (ADR-003).
- La ville pousse toute seule (ADR-004).

## Le monde vivant (ADR-010)
Le cœur du plaisir, façon The Settlers : on regarde son petit monde s'affairer.
- **Produire = un trajet visible.** Le pêcheur va à la rivière, pêche, rapporte le poisson au séchoir ; c'est seulement là que la bulle 🪙 apparaît.
- **Construire = un chantier visible.** Le bâtiment posé par Joshua devient un chantier ; des habitants vont chercher du bois au tas, l'apportent, tapent dessus ; le bâtiment sort de terre.
- **La vie autour.** Les enfants courent, les habitants libres se rassemblent près du feu, le mammouth broute à la lisière, les nouveaux arrivants entrent dans la vallée à pied.
- **Les époques se voient sur les gens.** Au passage au néolithique, les habitants changent de tenue et de métier.

## Le fantasme du joueur
« J'ai fait grandir mon village, de la grotte jusqu'à la fusée. » Une seule vallée que Joshua voit se transformer : le gué devient passerelle, puis pont de pierre, puis pont suspendu. L'histoire se lit dans le paysage.

## Ressources (3 compteurs, que des icônes)
| Icône | Ressource | Rôle |
|---|---|---|
| 👥 | Habitants | Arrivent quand il y a des maisons et à manger ; font tourner les bâtiments |
| 🪙 | Pièces | Produites par les bâtiments avec le temps ; servent à faire grandir la ville |
| 💡 | Idées | Produites par les penseurs (le sage, puis l'école, puis le labo) ; servent aux découvertes |

Nombres petits (des dizaines, pas des milliers) : Joshua sait compter, il doit pouvoir lire ses compteurs seul.

## Boucle principale
1. Les bâtiments produisent : une bulle 🪙 ou 💡 apparaît au-dessus.
2. Joshua tape les bulles pour récolter.
3. Il dépense ses pièces pour poser un bâtiment sur un emplacement de son choix (ADR-008).
4. La ville fait le reste d'elle-même : chemins, habitants, fumée, détails, améliorations (ADR-004, ADR-008).
5. Quand il a assez d'idées : **une découverte**. Nouveaux bâtiments, les anciens peuvent s'améliorer.
6. Quand toutes les découvertes d'une époque sont faites : **changement d'époque**, grand moment de transformation de la vallée.

## Le rôle de Joshua dans la construction
Tranché par ADR-008 : **Joshua pose, la ville fait le reste.** Ce qui suit est la proposition d'application, à valider.

**Ce que fait Joshua**
- Il choisit un bâtiment dans un bandeau d'icônes (seulement ceux débloqués et payables).
- Les emplacements libres de la prairie s'allument ; il tape celui qu'il veut, ou glisse le bâtiment dessus.
- Il peut déplacer un bâtiment déjà posé, gratuitement (appui long puis glisser).

**Ce que fait la ville toute seule**
- Elle trace les chemins entre les bâtiments.
- Elle fait sortir les habitants et les fait vaquer (porter du bois, cueillir, aller au champ).
- Elle ajoute les petits détails autour (tas de bois, jarres, fleurs, moutons).
- Elle améliore d'elle-même ce qui existe quand une découverte le permet (la hutte devient maison en torchis), avec une petite animation.

**Garde-fous pour un enfant de 6 ans**
- Pas de mauvais placement possible : seuls les emplacements valides s'allument.
- Certains bâtiments ont leur coin naturel (la pirogue sur la rive, le puits près des maisons, l'atelier de silex près de la grotte) : seuls ces emplacements-là s'allument pour eux.
- Rien ne se démolit, rien ne se perd.

## Les découvertes : le moment pédagogique
- Une grosse carte illustrée, avec ce qu'il faut pour la débloquer (💡 + les découvertes prérequises en icônes).
- Une scène courte en voix off, construite en **avant / après** : « Avant, on avait froid la nuit. Grâce au feu, on peut se chauffer et cuire la viande. »
- Le contenu (liste, prérequis, problèmes résolus) vit dans `domains/contenu-historique/epoques.md`.

## Le Musée du village
Chaque découverte rejoint un album de cartes que Joshua collectionne et peut réécouter. C'est le récapitulatif de ce qu'il a appris.

## La frise du temps
Un curseur en bas de l'écran : il le glisse et revoit sa vallée à chaque époque passée, en accéléré. C'est le « visiter l'histoire » de la vision. Il peut aussi taper un habitant pour l'entendre raconter sa journée à cette époque.

## Les petits problèmes (peu de menaces, ADR-003)
Des événements doux propres à chaque époque (un hiver froid, une crue, un incendie, une nuit noire). Ils mettent un bâtiment en pause, **sans rien détruire**. Ils sont résolus par une découverte, ce qui en fait une leçon : « voilà pourquoi on a inventé la digue ».

## Rythme et attentes
- Récoltes de 30 s à 2 min.
- Un grenier qui plafonne : si Joshua s'en va, rien n'est perdu, la récolte l'attend.
- Aucun accélérateur payant, aucune monnaie premium (cf. vision).
- Cible : 10 à 15 minutes par époque (à vérifier en test).

## Accessibilité (CP)
- Zéro texte nécessaire : voix, icônes, images.
- Gros boutons, une seule action par geste (taper).
- Pas d'échec, pas de game over.

## Écrans (première liste)
1. La vallée (écran principal) avec les 3 compteurs et le bouton découvertes
2. L'arbre des découvertes de l'époque en cours
3. La scène de découverte (avant / après)
4. Le Musée
5. La frise du temps

## Questions ouvertes
- [x] Rôle de Joshua dans la construction : B, il pose et la ville fait le reste (ADR-008)
- [x] Support principal : tablette en paysage (ADR-009)
- [ ] Titre : *Du Feu à la Fusée* (proposition) ?
- [ ] Nombre d'époques : 7 proposées, à valider.
- [ ] Les voix off : enregistrées par Julien, ou synthèse vocale ?
- [ ] La guerre : pas de politique (ADR-002), mais faut-il évoquer murs et défense, ou rien du tout ?

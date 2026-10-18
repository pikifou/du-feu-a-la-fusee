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
3. Il dépense ses pièces pour faire grandir le village.
4. La ville pousse d'elle-même : une maison apparaît, de la fumée, un habitant sort (ADR-004).
5. Quand il a assez d'idées : **une découverte**. Nouveaux bâtiments, les anciens peuvent s'améliorer.
6. Quand toutes les découvertes d'une époque sont faites : **changement d'époque**, grand moment de transformation de la vallée.

## Le rôle de Joshua dans la construction (À ARBITRER)
La ville pousse seule (ADR-004), mais il faut que Joshua ait la main sur quelque chose. Trois options :
- **A. Il commande, la ville place** : il choisit quoi construire (« une maison », « un champ »), le village le pose tout seul au bon endroit. Simple, toujours joli.
- **B. Il pose, la ville améliore** : il place les bâtiments sur des emplacements ; la ville ajoute seule les détails, les habitants, les chemins, et améliore ce qui existe.
- **C. Entièrement autonome** : la ville grandit seule selon les découvertes ; Joshua ne fait que récolter et découvrir.

Recommandation de Claude : **A**, qui garde le plaisir de choisir sans la frustration de mal placer à 6 ans.

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
- [ ] Rôle de Joshua dans la construction : A, B ou C ?
- [ ] Support principal : tablette en paysage ou téléphone en portrait ?
- [ ] Titre : *Du Feu à la Fusée* (proposition) ?
- [ ] Nombre d'époques : 7 proposées, à valider.
- [ ] Les voix off : enregistrées par Julien, ou synthèse vocale ?
- [ ] La guerre : pas de politique (ADR-002), mais faut-il évoquer murs et défense, ou rien du tout ?

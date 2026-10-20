---
title: Game design (brouillon)
domain: game-design
type: doc
status: draft
updated: 2026-10-20
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

## Ressources (4 compteurs, que des icônes)
| Icône | Ressource | Rôle |
|---|---|---|
| 👥 | Habitants | Arrivent quand il y a des maisons et à manger ; font tourner les bâtiments |
| 🪙 | Pièces | Produites par le bois, le silex, les pots ; servent à construire et à améliorer |
| 🍖 | Nourriture | Baies, chasse, pêche, puis blé, lait, farine ; chacun en mange au repas du soir (ADR-032) |
| 💡 | Idées | Produites par les penseurs (le sage, puis l'école, puis le labo) ; servent aux découvertes |

Nombres petits (des dizaines, pas des milliers) : Joshua sait compter, il doit pouvoir lire ses compteurs seul.

## Boucle principale
1. Les bâtiments produisent : une bulle 🪙 ou 💡 apparaît au-dessus.
2. À l'âge de pierre, Joshua tape les bulles pour récolter ; dès le néolithique, chacun rapporte lui-même sa production à la place du village (ADR-029).
3. Il dépense ses pièces pour poser un bâtiment sur un emplacement de son choix (ADR-008).
4. La ville fait le reste d'elle-même : chemins, habitants, fumée, détails, améliorations (ADR-004, ADR-008).
5. Quand il a assez d'idées : **une découverte**. Nouveaux bâtiments, les anciens peuvent s'améliorer.
6. Quand toutes les découvertes d'une époque sont faites, un bouton doré « Vers le néolithique ! » apparaît : Joshua change d'époque quand il le veut (ADR-027). Rien ne s'améliore tout seul (ADR-028).

## Le terrain (ADR-012, ADR-013)
- Une île en tuiles : prairie, forêt, rivière avec un gué, grotte sur l'autre rive, plage et mer. Elle s'agrandit à chaque époque.
- La forêt recule là où le bûcheron travaille : on gagne de la place en défrichant.
- Les habitants usent l'herbe là où ils passent : herbe tassée, sentier, chemin de terre. Un réseau de sentiers apparaît tout seul. Les vraies routes viendront plus tard comme découverte (chevaux, charrettes, marchandises).

## La journée et la nuit (ADR-011, ADR-016)
- Le jour dure environ 2 min 30. Au soir, ceux qui ont un feu s'y rassemblent : le premier adulte arrivé le ranime, les enfants jouent autour, et on peut encore travailler dans la lumière.
- Puis vient la nuit : chacun rentre dans sa maison et s'endort, les feux s'éteignent (braises, puis cendres). Sans maison, on dort dehors.
- Quand tout le village dort, un coq « Réveil ! » apparaît : Joshua le touche et le soleil se lève. S'il ne fait rien, le jour revient tout seul au bout d'environ 45 s.

## Qui fait quoi, et où (ADR-017)
- Chaque habitant a sa maison (la plus proche qui a de la place). La nuit, on voit les dormeurs devant leur porte, la tête qui dépasse de la couverture (un parent et un enfant partagent la même).
- Au travail, chacun est montré en plein geste à son poste, avec une pose qui dit ce qu'il fabrique.
- La fiche d'un bâtiment montre une ou deux vignettes illustrées de l'activité ; toucher une vignette la lit à voix haute.

## Deux niveaux d'explication (ADR-018)
- **La fiche courte** : on touche un bâtiment (sur la carte ou dans le bandeau de construction) ; une phrase de résumé, les chiffres, et un bouton « 📖 En savoir plus ».
- **La grande page** : une scène illustrée en grand, l'avant / maintenant, trois « Le savais-tu ? » et ce que ça permet de construire, avec les vignettes ; tout se lit à voix haute en touchant.
- **Découvrir** une technologie, c'est toucher sa carte : sa grande page s'ouvre, avec « Nouvelle découverte ! ». On la relit ensuite depuis la liste des découvertes (📖 Relire) ou depuis la fiche courte.
- Les bâtiments du tout début (cercle des anciens, tas de bois, baies, tentes) ont leur page « Les chasseurs-cueilleurs » ; la pirogue a la sienne.

## Des habitants vivants (ADR-019, ADR-020)
- La nuit, les maisons occupées s'ouvrent en coupe : on voit les dormeurs dans leurs couchages, autour du foyer.
- De temps en temps, quelqu'un dit une petite phrase selon ce qu'il fait (au travail, en portant, à la veillée, en allant se coucher, au réveil).
- Les gestes de travail alternent deux images ; ce qu'on rapporte se porte dans les bras.

## La chasse (ADR-025)
- Des lapins sautillent près de la forêt ; il en réapparaît un toutes les 20 à 40 s le jour (au plus 5 à l'âge de pierre, 3 au néolithique). Trois mammouths broutent sur l'autre rive.
- Le chasseur du râtelier part loin dans la forêt (ADR-033) : il marche jusqu'à la lisière, s'efface entre les arbres un moment, puis revient avec sa prise dans les bras. S'il y a un lapin, il le suit : le lapin détale vers la forêt et disparaît le premier. Une fois sur cinq environ, c'est une grande chasse au mammouth, sur l'autre rive : elle rapporte trois fois plus, prend deux fois plus de temps, et le mammouth ne revient jamais.
- Après la découverte de l'élevage, le râtelier n'a plus de chasseur (une aide l'explique). Les chiffres sont une proposition de Claude.

## Manger (ADR-032)
- Au début du soir, chaque habitant mange 3 parts. S'il n'y en a pas assez, une aide le dit et ceux qui ont faim le disent dans leurs bulles.
- Une famille n'arrive que s'il y a de quoi nourrir tout le monde ce soir, nouveau venu compris ; sinon les maisons restent vides (une aide l'explique). Exception, pour éviter le cercle vicieux : quelqu'un vient quand même si un bâtiment de nourriture attend un travailleur.
- Les enfants grandissent (environ 4 min) et deviennent des travailleurs.
- Au départ : un buisson de baies tenu par la cueilleuse, 20 parts. Chiffres proposés par Claude.

## Les prix (ADR-026)
- Tout est environ trois fois plus cher qu'en v0.10 : tente 15, hutte de branches 25, buisson 15, feu 20, atelier de silex, râtelier et séchoir 30, grotte peinte 40, hutte en peaux 45 ; au néolithique, champ 40, maison en torchis 45, enclos 50, meule 55, grenier et potier 60, maison longue 90. On démarre avec 20 pièces.
- Le bois rapporte 4, le silex 5, les pots 6. Les découvertes coûtent environ 1,5 fois plus d'idées.
- Mesure (joueur automatique) : âge de pierre ~10 min, néolithique ~13 à 17 min. Chiffres proposés par Claude, à régler en test.

## Embellir : décorations (ADR-023)
- Onglet ✨ du bandeau. Uniquement des monuments réels de l'époque, avec leur grande page (vraie histoire, 2 « Le savais-tu ? »).
- Âge de pierre : les chevaux de Chauvet (45), le taureau de Lascaux (55), les bisons d'Altamira (55), les mains de Gargas (35), les lions de Chauvet (55), les cerfs de Lascaux (50), l'homme-lion (60), les bisons d'argile du Tuc d'Audoubert (50, près de la grotte).
- Néolithique : menhir (30, plusieurs possibles), cromlech (45, plusieurs possibles), dolmen (70, plusieurs possibles), Dame de Saint-Sernin (50), pierre gravée de Gavrinis (60), statue d'Aïn Ghazal (65), grand menhir brisé de Locmariaquer (80), maison de Skara Brae (90).

## Les merveilles (ADR-030)
- Bouton 🏛 en haut de l'écran : la fenêtre des merveilles de l'époque, chacune avec ses trois pastilles d'étapes et son bouton « Commencer » puis « Étape 2 », « Étape 3 ».
- Chaque étape est payée à part (prix par étape) et bâtie par les habitants ; le monument sort de terre par tiers, dans ses échafaudages. À la troisième : confettis, « Hourra ! » et sa grande page « Merveille terminée ! ».
- Âge de pierre : les cercles de Bruniquel (40 par étape, près de la grotte), la hutte en os de mammouth (50). Néolithique : alignements de Carnac (70), cairn de Barnenez (90), Göbekli Tepe (110), Stonehenge (150).
- Les peintures et les merveilles sont uniques. Aucun bonus de jeu : elles embellissent et elles racontent (ADR-024).
- Au changement d'époque, les monuments posés restent ; ceux de l'époque passée ne se construisent plus (ADR-024).

## Améliorer (ADR-021, ADR-031)
- Dans la fiche courte d'un bâtiment : « ⬆ Niveau 2 : un travailleur de plus · 🪙 prix » ou « ⬆ Transformer en … ».
- Bâtiments qui produisent : niveaux 1 à 3 ; chaque niveau ajoute un travailleur et change l'image du bâtiment (deux buissons puis trois, deux séchoirs, un abri sur le tas de bois…). Prix = 2 puis 4 fois le prix du bâtiment (cercle des anciens : 120 puis 240 ; tas de bois : 40 puis 80).
- Maisons, toujours à la main : tente (50) ou hutte de branches (40) vers hutte en peaux après « Les huttes en peaux » ; au néolithique, tente, hutte de branches (60) ou hutte en peaux (50) vers maison en torchis (4 places) après « L'agriculture » ; maison en torchis vers maison longue (80, 6 places) après « Le grenier ».

## Comprendre ce qu'on voit (ADR-015)
Toucher un bâtiment, un arbre, la grotte, le mammouth, le gué ou un sentier ouvre une petite fiche lue à voix haute : à quoi ça sert, qui y travaille, ce que ça change. Choisir un bâtiment à construire montre la même fiche.

## Le rôle de Joshua dans la construction
Tranché par ADR-008 : **Joshua pose, la ville fait le reste.** Ce qui suit est la proposition d'application, à valider.

**Ce que fait Joshua**
- Il choisit un bâtiment dans un bandeau d'icônes (seulement ceux débloqués et payables).
- La zone où l'on peut construire s'allume en jaune clair ; il touche l'endroit voulu.
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
- Depuis la v0.7, le moment pédagogique est la grande page (ADR-018), cf. plus haut.
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

## Caméra
Vue rapprochée par défaut sur le village (on doit lire les habitants et leurs gestes) ; glisser pour se promener dans la vallée, pincer pour zoomer ou dézoomer jusqu'à la vue d'ensemble. Retour de Julien sur la v0.1 : la vue d'ensemble seule rendait le jeu illisible.

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
- [x] Les voix off : voix de narratrice générée avec Arcads (ADR-022)
- [ ] La guerre : pas de politique (ADR-002), mais faut-il évoquer murs et défense, ou rien du tout ?

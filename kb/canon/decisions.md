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

## ADR-015 : chaque bâtiment explique à quoi il sert
- **Date** : 2026-10-18
- **Statut** : acceptée
- **Décision** : chaque bâtiment a une courte explication, lue à voix haute : à quoi il sert, qui y travaille, ce que ça change pour le village. On l'entend en choisissant le bâtiment et en touchant un bâtiment déjà construit.
- **Contexte** : Julien : « il faudrait expliquer à quoi ils servent et ce qu'ils font. Le but, c'est quand même d'être éducatif sur le sujet. »

## ADR-016 : la nuit se joue en séquence, et c'est le joueur qui fait lever le soleil
- **Date** : 2026-10-18
- **Statut** : acceptée. Précise ADR-011.
- **Décision** : à la tombée de la nuit, sans feu, tout le monde va se coucher. Avec un feu de camp, on veille un moment : on se réchauffe et on peut encore travailler dans la lumière. Puis tout le monde va dormir, et les feux s'éteignent. Quand le village dort, un bouton « Réveil » permet de faire lever le soleil, pour que la nuit ne traîne pas.
- **Contexte** : Julien : « le cycle de la nuit est un petit peu long […] on appuie sur un bouton pour dire c'est le réveil, ça lance le soleil ».

## ADR-017 : on voit qui fait quoi, et où
- **Date** : 2026-10-18
- **Statut** : acceptée. Précise ADR-010 et ADR-015.
- **Décision** : (1) quand un habitant travaille à son poste, on le voit en plein geste (le tailleur qui frappe le silex, le pêcheur avec son harpon…) ; (2) la fiche d'un bâtiment montre une vignette illustrée de l'activité, avec l'explication ; (3) chaque habitant a sa maison : il y rentre dormir, et on voit sa tête qui dépasse de la couverture.
- **Contexte** : Julien : « qu'on puisse voir le bonhomme qui s'occupe des silex, qu'on comprenne un peu ce qu'il construit et à quoi ça sert » ; « que les bonhommes soient liés à l'endroit où ils sont, genre dans la hutte ». Images générées avec Arcads (ADR-006).

## ADR-018 : deux niveaux d'explication, la fiche courte et la grande page illustrée
- **Date** : 2026-10-18
- **Statut** : acceptée. Précise ADR-015 et ADR-017.
- **Décision** : (1) toucher un bâtiment ou une carte du bandeau de construction ouvre une fiche courte, un vrai résumé ; un bouton y ouvre la grande page. (2) La grande page est un pop-up en grand, avec une image de mise en scène (pour le feu : les villageois autour du feu, la nourriture, les bêtes sauvages autour) et des explications qui instruisent vraiment. (3) Découvrir une technologie, c'est toucher sa carte : ce qu'on gagne, c'est sa grande page qui s'ouvre. (4) La grande page se rouvre ensuite depuis la fiche courte.
- **Contexte** : Julien : « on mélange encore trop les 2. C'est trop court pour de l'instructif et un poil trop long pour un résumé. »

## ADR-019 : les dormeurs sont dans leur maison, vue en coupe
- **Date** : 2026-10-18
- **Statut** : acceptée. Précise ADR-017 (point 3).
- **Décision** : les habitants qui dorment sont montrés à l'intérieur de leur maison, grâce à une vue en coupe (plan de coupe) ; à défaut, la maison peut être rendue transparente par-dessus les dormeurs.
- **Contexte** : Julien, sur la v0.6 où les dormeurs étaient couchés devant la porte : « faudrait les mettre dans la hutte, et pour ça faire un plan de coupe ».

## ADR-020 : des habitants plus vivants (bulles, gestes, objets dans les bras)
- **Date** : 2026-10-18
- **Statut** : acceptée. Précise ADR-010 et ADR-017.
- **Décision** : (1) les habitants disent de temps en temps une petite phrase dans une bulle, avec une police ronde et grasse façon jeu mobile (type Clash Royale) ; (2) les gestes de travail sont animés en deux images (ex. le bûcheron qui lève puis abat sa hache) ; (3) ce qu'on transporte se porte dans les bras (le bûcheron et ses bûches), plutôt qu'au-dessus de la tête, même si cela demande plus d'images de personnages.
- **Contexte** : Julien, sur la v0.6 : « des petites bulles pour les gens qui parlent », « des animations (genre pour le bûcheron en 2 frames) », « les personnages qui portent dans les mains plutôt qu'au-dessus de leurs têtes ».

## ADR-021 : des améliorations payantes pour dépenser ses pièces
- **Date** : 2026-10-18
- **Statut** : acceptée sur le principe (Julien : « ce serait peut-être bien de mettre en upgrade »). Le détail chiffré est une proposition de Claude, à régler en test.
- **Décision** : les bâtiments s'améliorent contre des pièces : les maisons s'agrandissent sur place (tente ou hutte de branches vers hutte en peaux, maison en torchis vers maison longue) et les bâtiments qui produisent montent de niveau (jusqu'au niveau 3, +1 par récolte à chaque niveau). L'amélioration est un petit chantier visible ; des étoiles sous le bâtiment montrent son niveau.
- **Contexte** : retour de Julien sur la v0.7 : trop d'argent, peu de place, rien à dépenser à part les bâtiments ; « une économie trop vertueuse ».

## ADR-022 : les voix sont enregistrées, voix de narratrice
- **Date** : 2026-10-18
- **Statut** : acceptée. Tranche la question ouverte des voix off (GD).
- **Décision** : toutes les phrases dites à voix haute sont générées avec Arcads, voix de femme narrative (Margaux, « Narrative & Story »), et intégrées au jeu. La synthèse du navigateur ne reste qu'en secours pour une phrase absente.
- **Contexte** : Julien : « utilise Arcads pour générer les voix avec une voix de femme narrative ».

## ADR-023 : des décorations et des merveilles d'époque, historiquement vraies
- **Date** : 2026-10-19
- **Statut** : acceptée. Complète ADR-021 (dépenser ses pièces).
- **Décision** : on peut embellir le village avec des monuments et des décorations fidèles à l'époque et historiquement vrais, de prix variés, comme les merveilles de Civilization. Certains ont plusieurs variantes au choix (par exemple les peintures rupestres). Chacun a sa grande page qui raconte sa vraie histoire.
- **Contexte** : Julien : « des décorations, c'est une bonne idée, tant que c'est fidèle aux époques. Dans Civilization, il y avait les wonders […] Ou les peintures par exemple, on pourrait en avoir plusieurs au choix. »

## ADR-024 : les merveilles ne donnent pas de bonus ; elles restent d'une époque à l'autre
- **Date** : 2026-10-19
- **Statut** : acceptée. Précise ADR-023.
- **Décision** : (1) une merveille ou une décoration ne donne aucun bonus de jeu : elle embellit le village et raconte sa vraie histoire. (2) Au changement d'époque, les monuments déjà posés restent dans la vallée, mais ceux de l'époque précédente ne peuvent plus être construits.
- **Contexte** : Julien : « Non, pas de bonus quand on fait une merveille. OK pour le changement d'époque. »

## ADR-025 : on chasse les lapins et les mammouths ; plus de chasse après l'élevage
- **Date** : 2026-10-19
- **Statut** : acceptée. Tranche le rôle du mammouth (proposition de Claude jusque-là).
- **Décision** : (1) des lapins et des mammouths se promènent dans la vallée, et les chasseurs vont les chasser (on ne voit pas que de la cueillette). (2) Un mammouth chassé disparaît pour de bon. (3) Des lapins réapparaissent de temps en temps, pour qu'il y ait toujours de quoi chasser. (4) Une fois l'élevage découvert, on n'a plus besoin d'aller chasser : c'est la transition vers le néolithique.
- **Contexte** : Julien : « Le mammouth, une fois qu'on l'a tué, il n'est plus là. Autant faut faire spawner des lapins de temps en temps pour qu'ils aillent les manger. Comme ça, au moins, ça fait une transition. Quand après on fait de l'élevage, il n'y a plus besoin d'y aller. »

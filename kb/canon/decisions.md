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

## ADR-026 : une économie beaucoup plus lente
- **Date** : 2026-10-20
- **Statut** : acceptée. Les chiffres exacts sont une proposition de Claude, à régler en test.
- **Décision** : les prix montent fortement (ordre de grandeur donné par Julien : transformer une maison coûte environ 50 pièces). On doit attendre et choisir ; l'argent ne doit plus s'accumuler sans rien à payer en face.
- **Contexte** : Julien sur la v0.10 : « On a vraiment trop d'argent, il faut augmenter les échelles drastiquement. […] On a rien à payer en face donc il faut slow down. »

## ADR-027 : on change d'époque quand on veut, avec un bouton qui donne envie
- **Date** : 2026-10-20
- **Statut** : acceptée. Remplace le passage automatique.
- **Décision** : quand toutes les découvertes d'une époque sont faites, l'époque suivante ne démarre pas toute seule : un bouton motivant apparaît et c'est le joueur qui appuie quand il est prêt. En attendant, on peut continuer à poser, améliorer et finir ses merveilles.
- **Contexte** : Julien : « le passage de phase est automatique, ce qui est une mauvaise idée […] à l'âge de pierre ça passe automatiquement donc on ne peut ni poser, ni améliorer. Il faut un bouton motivant qui nous pousse à appuyer dessus. »

## ADR-028 : pas d'amélioration automatique au changement d'époque
- **Date** : 2026-10-20
- **Statut** : acceptée. Remplace le point « la ville améliore d'elle-même ce qui existe » d'ADR-008.
- **Décision** : au passage d'époque, les bâtiments restent tels quels ; c'est le joueur qui les améliore à la main (contre des pièces).
- **Contexte** : Julien : « il ne faut pas améliorer les bâtiments automatiquement au passage d'âge, il faut le faire à la main. »

## ADR-029 : la récolte devient automatique à la fin du nomadisme
- **Date** : 2026-10-20
- **Statut** : acceptée.
- **Décision** : à l'âge de pierre (chasseurs-cueilleurs nomades), on récolte à la main en touchant les bulles. Dès le néolithique, on se sédentarise : chaque travailleur rapporte lui-même sa production à la place du village, on le voit marcher, et le compte monte quand il arrive. Plus besoin de toucher partout.
- **Contexte** : Julien : « mon fils passe son temps à appuyer partout dès qu'on a 5 ou 6 bâtiments […] il faut justifier de manière diégétique le fait que les éléments soient récompensés automatiquement. Quand on termine le nomadisme, ça peut se justifier. » Option choisie parmi trois proposées (néolithique, grenier, découverte dédiée).

## ADR-030 : les merveilles sont de grands chantiers visibles
- **Date** : 2026-10-20
- **Statut** : acceptée. Précise ADR-023 et ADR-024.
- **Décision** : les merveilles ont leur propre bouton 🏛 en haut de l'écran. Une merveille se construit en 3 étapes payées une à une : on voit le monument grandir ; à la fin, une fête et sa grande page.
- **Contexte** : Julien : « Mon fils ni moi n'avons compris où est le système de merveille dont on avait parlé. » Les embellissements sont aussi « trop peu nombreux ou pas assez évidents ».

## ADR-031 : monter de niveau, c'est un travailleur de plus et un bâtiment qui change
- **Date** : 2026-10-20
- **Statut** : acceptée. Précise ADR-021.
- **Décision** : chaque niveau d'un bâtiment qui produit ajoute un travailleur (il faut donc plus d'habitants, donc plus de maisons et plus à manger) et change l'aspect du bâtiment.
- **Contexte** : Julien : « Les améliorations sont trop peu nombreuses ou pas assez intéressantes. » Réponse au choix proposé : « OK pour ouvrier. »

## ADR-032 : il faut nourrir les habitants
- **Date** : 2026-10-20
- **Statut** : acceptée sur le principe. Le détail (combien on mange, quand, ce qui se passe si on a faim) est une proposition de Claude.
- **Décision** : la nourriture devient une ressource : certains bâtiments la produisent (cueillette, chasse, pêche, puis champs et troupeaux), et les habitants la consomment. Sans assez à manger, le village ne grandit plus : construire des maisons partout ne sert à rien.
- **Contexte** : Julien : « il faut rajouter la gestion de la bouffe. Sinon tout est trop bordélique et il construit des maisons partout. »

## ADR-033 : les chasseurs partent au loin
- **Date** : 2026-10-20
- **Statut** : acceptée. Précise ADR-025.
- **Décision** : on voit les chasseurs s'éloigner et disparaître un peu au loin pour chercher les animaux, puis revenir avec leur prise.
- **Contexte** : Julien : « il faudrait qu'on voit que les chasseurs s'éloignent et disparaissent un peu au loin pour chercher les animaux. »

## ADR-034 : on garde les voix enregistrées ; les nouvelles phrases passent en voix de synthèse
- **Date** : 2026-10-20
- **Statut** : acceptée. Précise ADR-022.
- **Décision** : on ne génère plus de voix pour l'instant. Les phrases déjà enregistrées restent dans le jeu ; toute phrase nouvelle ou modifiée est lue par la voix de synthèse du navigateur. On enregistrera en lot quand le jeu sera stabilisé.
- **Contexte** : Julien : « quand on ajuste le jeu, on change les voix. Et si certaines phrases disparaissent, j'ai fait des générations pour rien, donc on les générera plus tard par batch quand on aura stabilisé le jeu. »

## ADR-035 : une économie qui croît d'époque en époque
- **Date** : 2026-10-20
- **Statut** : acceptée. Précise ADR-026.
- **Décision** : (1) l'économie grandit naturellement : l'âge de pierre est moins riche que le néolithique, et les prix suivent ce sens ; un bâtiment plus avancé coûte plus cher (une maison avancée plus qu'une hutte de branches). (2) Les prix suivent l'augmentation de la production, plutôt qu'un même coefficient pour tout. (3) Un bâtiment identique coûte toujours le même prix, quel que soit le nombre déjà construit. (4) D'une époque à l'autre, les coûts peuvent être très différents.
- **Contexte** : Julien, sur la v0.11 : « ce qu'il faut aussi avoir c'est une économie qui croît naturellement » ; « un nouveau bâtiment identique n'a aucune raison de coûter plus cher ».
- **Alternatives écartées** : le prix qui monte à chaque exemplaire (proposition de Claude).

## ADR-036 : la nourriture se stocke dans une réserve limitée
- **Date** : 2026-10-20
- **Statut** : acceptée sur le principe. Les chiffres sont à proposer par Claude.
- **Décision** : la réserve de nourriture a un maximum, lié aux moyens de conserver ; au-delà, ce qui arrive est perdu. Les bâtiments de stockage agrandissent la réserve.
- **Contexte** : Julien : « il n'y a rien qui empêche d'avoir trop de bouffe » ; « Je suis d'accord avec le max de bouffe (qui est lié au stockage), très bonne idée. »

## ADR-037 : plus de pièces, des gains petits et réguliers, moins de nourriture au début
- **Date** : 2026-10-25
- **Statut** : acceptée. Précise ADR-029 et ADR-035 ; les chiffres sont une proposition de Claude.
- **Décision** : (1) on gagne un peu plus de pièces par minute. (2) Quand le gain est automatique (néolithique), il arrive en petites quantités régulières plutôt qu'en gros paquets (pas de « +24 » après une longue attente). (3) Au début du jeu, la nourriture prend moins de place : il y a trop de nourriture et pas assez de pièces pour construire.
- **Contexte** : Julien, sur la v0.12 : « Il faudrait avoir un peu plus de pièces par minute. Et faire progresser les pièces quand c'est gain automatique (pas attendre le +24 mais en faire des plus petits plus réguliers) » ; « On a beaucoup de choses autour de la bouffe au début […] on a beaucoup trop de bouffe et pas assez de pièces pour faire. »

## ADR-038 : on voit ce qu'on améliore, et le jeu pousse à améliorer ce qui produit
- **Date** : 2026-10-25
- **Statut** : acceptée. Précise ADR-021 et ADR-031.
- **Décision** : (1) ce qu'on améliore a un visuel nettement différent. (2) Le jeu encourage à améliorer les bâtiments qui produisent, pour que Joshua sache quoi faire pour gagner plus de pièces.
- **Contexte** : Julien : « avoir des visuels différents pour les trucs qu'on améliore » ; « encourage à améliorer les éléments qui produisent pour que mon fils sache quoi faire pour gagner plus d'argent ».

## ADR-039 : pas de voix ElevenLabs, quelques bruitages
- **Date** : 2026-11-18
- **Statut** : acceptée.
- **Décision** : les phrases ajoutées depuis l'âge des métaux ne sont pas enregistrées avec ElevenLabs ; elles restent lues par la voix du navigateur. Quelques bruitages enregistrés pour les moments forts (`assets/sons/`, joués par `son('<nom>')`, sinon les petites notes) : le décollage de la fusée, un bâtiment fini, une découverte.
- **Contexte** : Julien : « j'ai pas envie que tu l'utilises pour générer les voix, parce que ça va me coûter cher, surtout si on veut faire du multilingue. Tu peux faire un peu de bruitage avec, mais t'enflamme pas plus que ça. »

## ADR-040 : une flèche et un petit cadeau pour moderniser la ville
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : le jeu pousse à moderniser les bâtiments d'une époque passée par une flèche à part (dorée, pas la flèche verte des niveaux) et par un petit cadeau quand la modernisation est finie. Rien ne se modernise tout seul (ADR-028 tient toujours).
- **Contexte** : Julien, après une partie de Joshua : « Dans sa sauvegarde actuelle, on trouve des bâtiments du néolithique et des bâtiments de maintenant. Du coup, il faudrait réussir à homogénéiser un peu la mise à jour des villes. » Entre trois façons proposées (les vieux bâtiments rapportent moins, une flèche et un cadeau, une part de la ville à moderniser pour changer d'époque) : « Oui, une flèche et un petit cadeau, c'est important, je pense. »
- **Écarté** : faire baisser ce que rapportent les vieux bâtiments ; exiger une part de ville modernisée pour changer d'époque.

## ADR-041 : les bâtiments qui produisent évoluent avec leur temps, et certains prennent plus de place
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : comme les maisons, les bâtiments qui produisent ont une suite d'une époque à l'autre, qu'on voit changer (on ne cueille plus le blé à la main, on ne garde plus trois moutons : on passe à l'industrie). Certains bâtiments modernes demandent plus de place. Les souches des arbres coupés ne doivent plus gâcher la place.
- **Contexte** : Julien : « certains éléments devraient s'améliorer avec le temps, l'agriculture et l'élevage » ; « pas juste avec des étoiles, mais qu'on voie aussi la différence à travers le temps » ; « les outils, il faut que ça devienne des usines » ; « si on veut améliorer l'élevage, il faut qu'on remplace par un grand endroit » ; « quand on coupe les arbres, ça laisse les troncs, ce qui fait que c'est quand même pas fou en termes d'usage de l'espace ». Les suites précises sont une proposition de Claude : ADR-043.

## ADR-042 : des monuments plus grands, des véhicules dans la perspective, les images avec Arcads
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : (1) certains bâtiments, d'abord les monuments, sont nettement plus grands que les autres. (2) Les véhicules ont une vue pour chaque direction de la perspective (le train ne roule plus en travers de ses rails). (3) Les nouvelles images se font avec Arcads.
- **Contexte** : Julien : « en termes d'échelle, on peut se permettre d'avoir certains bâtiments qui soient un peu plus grands par rapport aux autres, par exemple les monuments » ; « il faudrait rendre [les véhicules] avec les différentes vues pour qu'ils puissent aller à 90° […] le train qui est perpendiculaire à la direction qu'il prend » ; « Tu peux générer tout ça avec Arcads. »

## ADR-043 : les suites des bâtiments, la flèche dorée et le cadeau, tels que Claude les a réglés
- **Date** : 2026-11-21
- **Statut** : à confirmer
- **Décision** : (1) Chaque bâtiment qui produit garde ce qu'il produit et prend la forme la plus récente qu'on peut bâtir : buisson de baies, champ de blé, champs labourés (nouveau, Moyen Âge, 3 x 3 cases), ferme au tracteur ; râtelier des chasseurs, enclos à moutons, étable (nouvelle, Moyen Âge, 3 x 3), ferme laitière (nouvelle, électricité, 3 x 3) ; tas de bois, scierie (nouvelle, Moyen Âge, 2 x 2) ; atelier de silex, forge, maréchal-ferrant, usine ; atelier du potier, usine ; séchoir à poissons et pirogue, port, port à vapeur ; meule, boulangerie, supermarché ; atelier du charron, garage ; mine, centrale, parc solaire ; central téléphonique, bureau ; maison des scribes, imprimerie ; atelier de l'inventrice, laboratoire, centre de recherche. Le niveau (les étoiles) est gardé. (2) Moderniser coûte 60 % du prix du nouveau bâtiment ; quand c'est fini, un cadeau rouge saute au-dessus : il rend la moitié du prix et donne 2 idées. Les maisons qui passent à une époque plus récente ont aussi la flèche dorée et le cadeau. (3) La flèche dorée est ronde avec deux chevrons ; on en montre 4 au plus à la fois, d'abord sur ce qui produit et le plus ancien. (4) Un bâtiment qui produit ne se bâtit plus quand sa forme d'une époque plus récente peut se bâtir (le tas de bois disparaît du bandeau quand la scierie arrive). (5) Si la forme moderne n'a pas la place, on peut encore monter de niveau, et la fiche dit qu'il faut plus de place autour. (6) Chaque matin, les souches s'en vont (une sur cinq reste). (7) Les monuments de l'âge des métaux au monde moderne sont 30 % plus grands à l'image, sur la même place ; la ferme au tracteur 25 %. Les passer sur plus de cases les empêchait de tenir dans une grande ville.
- **Contexte** : ADR-040 à 042. Proposition de Claude faite pendant que Julien était occupé (« avance en autonomie »).
- **Écarté** : des monuments sur 3 x 3 cases (une grande ville de l'électricité ne pouvait plus bâtir les monuments du monde moderne).

## ADR-044 : de vraies routes, qui naissent toutes seules dès les Romains et changent avec le temps
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : à partir de l'âge des métaux (l'époque romaine), une découverte fait apparaître de vraies routes dans la ville. Elles naissent toutes seules (l'enfant ne les trace pas) et changent d'aspect d'une époque à l'autre. Le jeu peut les ajuster lui-même.
- **Contexte** : Julien : « je me demandais si on ne pouvait pas faire évoluer les sols de la ville également […] quelques routes qui commencent dès l'époque romaine (ça pourrait être une recherche qu'on fait) et qui évoluent également avec le temps. Ça demanderait pas mal de boulot pour être propre mais ça ne me dérange pas. » Entre des routes qui naissent seules, tracées par l'enfant, ou les deux : « A, elles naissent toutes seules. En plus ça permet de faire des ajustements automatiques s'il le faut. »
- **Écarté** : un outil pour tracer les routes au doigt ; le mélange des deux.

## ADR-045 : agrandir la ville, et la réarranger un peu au passage d'une époque si ça aide
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : la carte s'agrandit encore après la vapeur (elle touche aujourd'hui les bords de sa grille). Au passage d'une époque, le jeu peut légèrement modifier la grille : mieux aligner quelques bâtiments, faire un peu de place, réajuster un peu la grille, si ça aide beaucoup le code. Les parties en cours doivent garder leur ville.
- **Contexte** : Julien : « on ne peut pas agrandir la ville ? » ; « ça ne me choquerait pas s'il faut légèrement modifier la grille quand on passe d'un âge à l'autre. Par exemple, s'il faut un peu mieux aligner quelques bâtiments, ou faire un peu de place, ou réajuster un tout petit peu la grille, ça peut être fait si jamais ça aide beaucoup le code. »

## ADR-046 : les routes naissent des sentiers et sont redressées ; matière générée, routes larges
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : dans le bac à sable (tour 47), Julien choisit le réseau « mélange » (le jeu trace les routes en passant de préférence là où les habitants marchent), le dessin « matière » (des matières générées, découpées à la forme des routes par le code) et des routes larges. Précise ADR-044.
- **Contexte** : Julien, après avoir essayé le bac à sable sur la ville de Joshua : « ce que je préfère, c'est mélange, matière, large ».
- **Écarté** : les sentiers usés seuls ; le réseau tracé sans tenir compte des sentiers ; les pièces de route générées ; les routes étroites.

## ADR-047 : le sol autour des bâtiments change aussi avec les époques
- **Date** : 2026-11-21
- **Statut** : décidée par Julien
- **Décision** : les bâtiments ne sont plus posés sur de l'herbe à toutes les époques. Chez les Romains, encore de l'herbe presque partout ; au Moyen Âge, de la boue autour des bâtiments, de même à la vapeur ; à partir de l'électricité, des trottoirs et des sols de ville autour des bâtiments.
- **Contexte** : Julien : « il faut changer un petit peu les sols aussi. C'est-à-dire que les bâtiments n'ont pas forcément de l'herbe partout. Autant, je pense que, sur la période romaine, on en avait encore un peu partout. J'ai l'impression que, vers le Moyen Âge, il devrait y avoir un peu plus de boue. Pareil pour la vapeur. Après l'électricité, on commence à avoir des routes et des trottoirs […] Je trouve ça sympa, les routes, mais du coup, je pense qu'il faut aussi mettre le reste à jour. »

## ADR-048 : une ville vivante par son mobilier et ses lieux
- **Date** : 2026-11-21
- **Statut** : décidée par Julien ; corrigée le 2026-11-22 (ADR-049)
- **Décision** : ce qui fait « ville », c'est aussi le détail : des réverbères, des bancs, des places, de petits lieux qui apparaissent et montrent la structure de la ville qui s'améliore, des pâtés de maisons. Les villes doivent avoir l'air vivantes. Le sol de la zone d'un seul tenant (tour 47 v2) est rejeté tel qu'il était dessiné : gris, plat, de gros carrés, des bâtiments qui ne s'y posent pas.
- **Correction** : la première rédaction disait que Julien rejetait les sols de ville eux-mêmes, et le tour 48 les a retirés. C'était une erreur de lecture : Julien demandait de les améliorer, pas de les enlever (ADR-049).
- **Contexte** : Julien, devant le bac à sable (tour 47, zone de ville d'un seul tenant) : « là, c'est du gloubiboulga dégueulasse. Les sols et les bâtiments ne sont pas intégrés les uns avec les autres. Et quand je te parlais d'avoir des choses qui fassent un peu plus ville, c'était d'avoir des réverbères […] pour que ça ait l'air d'être des pâtés de maison. Je pense, par exemple, dans les villes, que tu puisses avoir des places, des bancs, des petits lieux comme ça qui émergent et qui permettent de voir vraiment la structure de la ville s'améliorer. […] à part des grosses textures dégueulasses au sol, t'as pas fait grand-chose d'autre. Je m'attendais à avoir un peu plus de détails dans les villes qui donnent l'impression qu'elles sont vivantes. »
- **Écarté** : la boue et le gravier en taches douces ; la zone de ville pavée d'un seul tenant, grise et plate.

## ADR-049 : dans les villes, chaque maison est posée sur un vrai sol de ville
- **Date** : 2026-11-22
- **Statut** : décidée par Julien
- **Décision** : dans une ville, le sol n'est pas de l'herbe. On doit comprendre sur quoi chaque maison est posée : elle est sur une parcelle, dans un pâté de maisons, avec des trottoirs le long des rues. La référence est un vieux SimCity (SimCity 2000) : en vue isométrique, un sol de ville qui ressemble à quelque chose. Le sol change avec l'époque ; au Moyen Âge il peut être en terre, mais une terre soignée, pas une terre plate et moche. Les huttes gardent leur sol transparent sur l'herbe. Le mobilier et les places du tour 48 restent. Pousser la qualité, ne jamais retirer la fonction.
- **Contexte** : Julien, devant le tour 48 (sols retirés) : « je t'ai pas dit que le problème, c'était les textures. Je t'ai dit qu'il fallait habiller les villes pour que ce soit plus mignon. Genre, pour moi, quand t'es dans une ville moderne, au sol, c'est du pavement. C'est pas de l'herbe. […] le système était un peu too much et te faisait un truc qui était vraiment gris, plat […] le pavement au sol, ça fait des espèces de gros carrés. C'est pas comme ça, le sol. Il y a des trottoirs […] Quand tu foules une maison, elle est sur un paté de maison. Elle est pas sur rien. Donc, autant quand t'es sur une hutte, tu fais ça avec de la transparence au sol, je comprends, mais là, ce qu'il faut, c'est qu'on comprenne sur quoi elle est posée, la maison. Pour moi, on est capable de faire comme un SimCity 2000 […] Là, tu m'as fait un gros roll back, en fait. Je te demande de pousser la qualité. T'as décidé d'enlever la feature. »
- **Écarté** : l'herbe sous les maisons de ville (tour 48) ; les grandes dalles qui font de gros carrés ; un sol gris et plat d'un seul tenant.

## ADR-050 : quand la ville grandit, les champs et l'élevage partent hors de la ville et deviennent de grandes exploitations
- **Date** : 2026-11-22
- **Statut** : décidée par Julien ; précisée le 2026-11-22 (ADR-051)
- **Décision** : l'agriculture et l'élevage ne restent pas tels quels dans la ville. Au début, les champs grandissent. Puis, quand la ville prend de la taille, il y a un bouleversement : le blé est déplacé hors de la ville, en un seul endroit, un vrai grand champ ; les moutons ne sont plus parqués dans la ville, ils partent un peu à l'extérieur, dans quelque chose de plus industriel (avec des abattoirs). On doit voir les espaces changer avec le temps. Prolonge ADR-041 : la suite des bâtiments ne suffit pas, c'est leur place qui change.
- **Contexte** : Julien, devant la ville de Joshua au monde moderne (tour 49) : « Quand je t'avais parlé d'évoluer à travers le temps, c'est que, typiquement, pour moi, l'élevage, il faut que ça devienne autre chose en évoluant. Tu peux pas avoir trois moutons qui sont parqués dans un endroit comme ça. Maintenant, ça marche plus comme ça. Idem pour l'agriculture. Peut-être qu'en fait, ce qu'il faudrait, c'est qu'au début, tu aies des champs qui deviennent de plus en plus grands, et qu'après, on les fasse sortir de la ville. Ou, je sais pas, quand la ville augmente de taille, qu'il y ait des bouleversements qui se fassent. C'est-à-dire, par exemple, que tout le blé est automatiquement bougé à l'extérieur de la ville, à un endroit, et c'est un vrai champ, un grand champ. Pareil pour les moutons : ils ne sont plus à l'intérieur de la ville. Ils sont emmenés un petit peu à l'extérieur, avec des abattoirs, quelque chose d'un peu plus industriel, en fait. Comme ça, on verrait vraiment la façon dont les espaces changent avec le temps. »
- **À préciser** : le moment du bouleversement (un changement d'époque, une taille de ville), ce que voit et fait l'enfant pendant ce moment, où est « l'extérieur » sur la carte actuelle (ADR-045, agrandir la carte), ce que deviennent les cases libérées dans la ville.

## ADR-051 : le grand déménagement des fermes au passage à la vapeur, sur une carte plus grande, avec des bâtiments plus grands
- **Date** : 2026-11-22
- **Statut** : décidée par Julien
- **Décision** : (1) Le bouleversement d'ADR-050 a lieu au passage à l'âge de la vapeur. Une petite scène montre les champs et les enclos de la ville partir vers un grand champ et une grande ferme d'élevage hors de la ville. Les cases libérées dans la ville redeviennent de la place pour la ville. (2) Il se fait avec l'agrandissement de la carte (ADR-045) : une campagne autour de la ville, où vont les grandes exploitations. (3) Pas d'abattoir visible : une grande exploitation d'élevage (grands bâtiments, silos, camions). (4) Les bâtiments deviennent plus grands, maintenant que la carte a la place.
- **Contexte** : Claude proposait ces trois réponses aux questions d'ADR-050 (le moment, l'endroit, les abattoirs). Julien : « OK pour ces 3 là. Fais tout ce qu'il faut, dont l'augmentation de la taille de la map et l'augmentation de la taille des bâtiments. »
- **Écarté** : un déclencheur à un nombre d'habitants ; des abattoirs visibles dans un jeu pour les 6 à 10 ans.

## ADR-052 : la campagne, les grandes exploitations et les monuments, tels que Claude les a réglés
- **Date** : 2026-11-22
- **Statut** : à confirmer ; points 2 et 3 corrigés par ADR-053 (6 x 6 cases, composées à l'échelle du jeu)
- **Décision** : ce que Claude a réglé seul pour faire ADR-051. (1) La grille passe de 44 x 44 à 64 x 64 cases ; l'ancienne carte est au milieu, identique. À la vapeur, une campagne (des prés et quelques bois, sans collines de roche) s'ouvre tout autour de l'île ; elle grandit encore à l'électricité et au monde moderne. La mer du sud ne grandit pas. (2) Au passage à la vapeur, tous les buissons de baies, champs de blé, champs labourés, enclos et étables de la ville partent : un seul « grand champ » et une seule « grande ferme d'élevage », de 4 x 4 cases chacun, posés sur la campagne, à au moins trois cases de tout bâtiment de la ville, au plus près de la ville mais dans un pré dégagé plutôt qu'une clairière. Ils ont assez de postes pour tous ceux qui travaillaient dans les anciennes fermes (4, 6 ou 8 selon le niveau) et gardent leur réserve. Un chantier pas fini est remboursé. Les fermes de la ville ne se bâtissent plus ; on peut bâtir d'autres grandes exploitations, seulement à la campagne. (3) À l'électricité, le grand champ devient la ferme au tracteur et la grande ferme d'élevage devient la ferme laitière, aussi en 4 x 4, sur place (flèche dorée et cadeau). (4) La scène : la caméra glisse vers les anciennes fermes, un nuage sur chacune, les moutons partent à pied vers la nouvelle ferme, puis la caméra glisse jusqu'aux grandes exploitations, avec deux phrases lues. Une partie déjà à la vapeur ou plus tard la vit à son retour. (5) Les monuments de l'âge des métaux au monde moderne (sauf ceux de la plage) prennent une case de plus de côté et sont dessinés d'autant plus grands ; ceux déjà bâtis grandissent sur place quand ils ont la place autour d'eux. (6) Quand l'île grandit, le chemin de fer est prolongé jusqu'au nouveau bord, pour que le tunnel ne reste pas au milieu des prés.
- **Contexte** : ADR-050, ADR-051. Julien : « Fais tout ce qu'il faut, dont l'augmentation de la taille de la map et l'augmentation de la taille des bâtiments. » Claude a compris « la taille des bâtiments » comme : les grandes exploitations et les monuments prennent plus de place, ce que la petite carte empêchait (ADR-043, point 7). Les maisons gardent leur taille.
- **Écarté** : déplacer les fermes une par une ; laisser des fermes en ville après la vapeur.

## ADR-053 : des ombres qui suivent la forme des bâtiments, un sol qui garde ses nuances, des exploitations à l'échelle du jeu
- **Date** : 2026-11-22
- **Statut** : décidée par Julien
- **Décision** : (1) L'ombre douce et ronde posée sous chaque bâtiment (tour 50) ne marche pas pour les gros bâtiments ni pour le Golden Gate : une ombre doit correspondre à ce qu'il y a au-dessus. (2) Le sol garde son minimum de matière : les taches d'herbe plus ou moins verte et de terre, qui viennent de façon douce, font la différence entre les endroits très verts et ceux qui le sont moins. Ne pas les remplacer par un système de cases tout ou rien, sans transition. (3) Les grandes exploitations restent à l'échelle du jeu : les vaches ne deviennent pas des miniatures. Une exploitation n'est pas une case vue de plus loin (« un zoom out de la case ») : elle prend beaucoup plus de cases, c'est l'intérêt d'agrandir le monde. Elle doit aussi mieux s'intégrer au sol.
- **Contexte** : Julien, devant le tour 51 : « je suis pas forcément hyper fan des ombres. T'as juste fait une espèce de gros truc en dessous, flou, ce qui va pour certains bâtiments, mais pas du tout pour d'autres. Dès qu'il s'agit d'un gros bâtiment, tu vas avoir une espèce d'ombre ronde qui ne correspond pas du tout à ce qu'il y a dessus […] le Golden Gate ne fonctionne pas du tout. » ; « les taches qui étaient au sol amenaient un petit peu de variété. Ce qu'il faudrait, c'est garder cette espèce de minimum de matière pour pouvoir faire la différence entre les endroits qui sont verts, très verts, et ceux qui le sont un peu moins. Parce que là, en te limitant juste au système de cases, il n'y a aucune transition entre les deux […] C'est ce que j'aimais dans la terre : c'est que c'est quelque chose qui venait de manière un peu smooth. Là, t'as complètement enlevé cette partie-là et remplacé par un système binaire. » ; « L'élevage ne s'intègre pas bien et, en plus, t'as complètement changé l'échelle. […] les vaches, elles sont devenues miniatures. L'idée, c'est qu'en fait, on fait pas juste un zoom out de la case. On fait quelque chose qui prend beaucoup plus de cases. C'est l'intérêt d'agrandir le monde. »
- **Corrige** : ADR-052, points 2 et 3 (les exploitations sur 4 x 4 cases, en une seule image) ; le tour 48, qui enlevait les taches d'usure quand la ville est aménagée.
- **Écarté** : l'ombre ronde et floue sous tous les bâtiments ; une exploitation en une seule image réduite.

## ADR-054 : au changement d'âge, les bâtiments dépassés ne se construisent plus, et le jeu dit pourquoi ils ont disparu
- **Date** : 2026-11-22
- **Statut** : décidée par Julien
- **Décision** : quand on change d'âge, on ne garde pas toute la palette des bâtiments devenus obsolètes : l'atelier de silex, l'atelier des chasseurs et les autres bâtiments dépassés ne se posent plus. Les monuments, eux, restent (ADR-024). Au changement d'âge, le jeu montre les bâtiments qui n'existent plus et explique pourquoi ils ont disparu.
- **Contexte** : Julien : « là, je peux mettre plein de bâtiments différents qui vont de la hutte à la version moderne. Normalement, quand on change d'âge, on n'est pas censé garder toute la palette des bâtiments qui sont devenus obsolètes. Je prends le cas de l'atelier de silex ou des choses comme ça. On ne va pas continuer à les poser. Idem pour l'atelier des chasseurs, qui devrait disparaître. Pour moi, autant les monuments, on les garde. Autant qu'on passe un changement d'âge, on pourrait montrer qu'il y a des bâtiments qui n'existent plus et expliquer pourquoi ils ont disparu. »

## ADR-055 : quels bâtiments disparaissent, à quel âge, et comment le jeu le dit, tels que Claude les a réglés
- **Date** : 2026-11-22
- **Statut** : à confirmer
- **Décision** : pour faire ADR-054. (1) Un bâtiment dépassé ne se construit plus dès l'époque de ce qui le remplace, même avant la découverte qui débloque ce remplaçant (ainsi, au Moyen Âge, le champ de blé ne se bâtit plus, même avant le fer). La liste, avec la phrase qui dit pourquoi, est `DISPARUS` dans `src/data.js` : par exemple l'atelier de silex disparaît à l'âge des métaux (le bronze), le râtelier des chasseurs au néolithique (l'élevage), les huttes au néolithique, le feu de camp et la tour de l'horloge à l'électricité, le marché, le moulin et la boulangerie au monde moderne (le supermarché). (2) Restent jusqu'au bout : la scierie, l'usine, la caserne, la gare, le port à vapeur, le garage, l'aérodrome, les fermes de la campagne. (3) Ceux déjà bâtis restent dans la ville ; la flèche dorée les modernise. Les monuments restent (ADR-024). (4) Au passage d'âge, après la scène de la nouvelle époque (et après le déménagement des fermes à la vapeur), une fenêtre « Ce qui ne se construit plus » montre chaque bâtiment qui disparaît, avec son image barrée d'une croix et sa raison ; toucher une carte lit sa raison à voix haute. Elle ne montre que ce que le joueur pouvait déjà bâtir. (5) À chaque époque, il reste toujours une maison et de quoi nourrir le village une fois les découvertes faites (vérifié par un test). Au début du néolithique, comme avant, il faut découvrir l'agriculture pour bâtir une maison.
- **Contexte** : ADR-054. Avant, au monde moderne, une trentaine de bâtiments dépassés se construisaient encore, et le râtelier des chasseurs revenait après la vapeur (un défaut corrigé au passage).

## ADR-056 : le Golden Gate part de la plage et sort de l'écran ; publier pour que Joshua y joue
- **Date** : 2026-11-22
- **Statut** : décidée par Julien
- **Décision** : (1) Le Golden Gate n'est pas un pont posé au milieu de nulle part : on en voit le début, et le pont sort de l'écran ; on comprend que c'est un ouvrage géant qui relie l'île à autre chose. (2) Le travail de la branche `villes-qui-evoluent` (tours 46 à 54) est publié pour que Joshua puisse y jouer.
- **Contexte** : Julien, après le tour 53 : « Grosso modo, ça va. Après, je veux bien que tu me refasses le Golden Gate. C'est un peu particulier, un pont : toi, tu le mets au milieu de nulle part. Mais en fait, pour moi, il faudrait le début du pont. Il y a un bout du pont qui sort de l'écran, et c'est tout. Faut qu'on comprenne que c'est un truc géantiste qui les relie à autre chose. Sinon, je veux bien que tu pousses tout ça pour que Joshua puisse y jouer. »

## ADR-057 : ce que Claude a réglé seul pour publier
- **Date** : 2026-11-22
- **Statut** : à confirmer
- **Décision** : (1) Dans le vrai jeu, les routes, les sols de ville (parcelles, trottoirs), le mobilier et les places arrivent avec la découverte de la roue (l'âge des métaux, ADR-044), réglés comme dans le bac à sable (mélange, matière, larges ; parcelles ; ombres projetées). Avant, ils n'existaient que dans le bac à sable. (2) Le Golden Gate part vers le large, à l'opposé du centre du village (vers la mer s'il y en a de ce côté), et la route y arrive tout droit, dans son axe, par les deux cases de derrière, qui sont dégagées (pierres, souches) ; elle entre sur le tablier. Le bout de plage peint sous la rampe est retiré : c'est la vraie plage du jeu qui est dessous (demandes de Julien : « Fais-le tourner à 90° vers la gauche pour qu'il soit dans l'alignement de la route », puis le raccord entouré en rouge). (3) Avant de remettre une partie de l'ancienne carte sur la nouvelle, le jeu en garde une copie intacte dans le navigateur (clé `feu-fusee-v2-carte-44`), pour pouvoir la retrouver en cas de souci.
- **Contexte** : ADR-056. Sans le point 1, Joshua n'aurait vu ni les routes ni les parcelles que Julien a validées.


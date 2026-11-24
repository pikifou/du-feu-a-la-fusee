---
title: L'accueil et les villes (plan court)
domain: game-design
type: doc
status: validé par Julien le 2026-11-23, fait (pas encore publié)
updated: 2026-11-23
---

# L'accueil et les villes

Décision : ADR-063. Ce plan dit comment on la fait ; ce qui n'est pas dans l'ADR est une proposition de Claude, marquée *(Claude)*.

## Pourquoi
Le jeu lance directement dans la partie, et il n'y a qu'une partie. Julien veut un accueil et pouvoir refaire une autre ville, sans perdre la sienne. Petit chantier : rien ne change dans l'histoire, les époques ni les découvertes.

## Ce que voit l'enfant
```
┌──────────────────────────────────────────────────────┐
│  [ la peinture du début : la tribu autour du feu ]   │
│               Ma Petite Civilisation                 │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐   ┌────────────┐  │
│  │ photo  │ │ photo  │ │ photo  │   │     ✚      │  │
│  │Ville A │ │Ville B │ │Ville C │   │  Nouvelle  │  │
│  │Vapeur  │ │Néolith.│ │Pierre  │   │   ville    │  │
│  │ 3 h 20 │ │ 45 min │ │ 5 min  │   └────────────┘  │
│  └────────┘ └────────┘ └────────┘                    │
└──────────────────────────────────────────────────────┘
```
- Chaque ville : sa photo, son nom (« Ville A », « Ville B »…), l'âge où elle en est, le temps passé dessus. On la touche, elle continue.
- « Nouvelle ville » commence une ville neuve (avec l'arrivée de la tribu, comme aujourd'hui). La fois d'après, elle est à côté des autres.
- À cinq villes : « Nouvelle ville » est grisé, avec le message « Tu as déjà 5 villes. Jette-en une pour en commencer une nouvelle. » et chaque ville a un bouton 🗑️. *(Claude)* Le 🗑️ demande « Sûr ? » avant de jeter, comme « Recommencer » aujourd'hui.
- *(Claude)* La photo est la dernière de la frise du temps ; une ville qui n'en a pas encore montre la grande image de son âge (celle de l'annonce de l'âge).
- *(Claude)* Le nom d'une nouvelle ville prend la première lettre libre (si la Ville B a été jetée, la suivante s'appelle Ville B).
- *(Claude)* Le temps passé : le temps où la ville est ouverte à l'écran (pas quand le jeu est caché ou en pause Ludiworld), arrondi à la minute. Pour une ville d'avant cette version, on part du temps de jeu qu'elle a déjà compté.
- *(Claude)* Dans le menu ⚙️, « Recommencer la partie » devient « 🏠 Accueil ». Le menu a trois boutons de son : Voix, Musique, Bruitages.
- *(Claude)* Le titre est écrit en HTML sur la peinture, dans la police du jeu : aucune image à générer.

## Ce qui ne change pas
- Le jeu marche toujours ouvert seul, sans Ludiworld.
- La partie en cours (celle de Joshua) devient la Ville A, intacte, avec ses photos.
- L'adresse du jeu reste `du-feu-a-la-fusee`.

## Comment *(Claude)*
- Chaque ville garde sa sauvegarde à part dans le navigateur ; une petite liste dit quelles villes existent, leur nom, leur âge et leur temps.
- Ludiworld garde une copie des cinq villes dans le compte du parent, comme il garde aujourd'hui la partie.
- Mesuré le 23/11/2026 (parties enregistrées des tours 30 et 47, carte de 64 x 64) : une grande ville pèse de 59 000 à 87 000 caractères en sauvegarde légère ; cinq ne tiennent pas dans la limite d'une sauvegarde Ludiworld (250 000 caractères, `MAX_SAVE` du kit). Compressée (deflate, puis base64), une grande ville pèse de 10 000 à 19 000 caractères : les cinq tiennent largement. Sur l'appareil, une ville gardée en entier pèse environ 530 000 caractères : cinq frôleraient la limite d'un iPad.
- Donc : les villes sont gardées compressées (dans le navigateur et dans la copie Ludiworld), sauf la ville en cours, gardée comme aujourd'hui. Si le navigateur ne sait pas compresser (très vieux appareil), Ludiworld ne garde que la ville en cours et la liste.
- Le nouveau nom passe dans la page et l'appli installée (ADR-062).
- Tests : une ville neuve, cinq villes, jeter une ville, la Ville A de Joshua reprise intacte, le temps qui avance. Parcours sur tablette et téléphone, dans Ludiworld et seul.

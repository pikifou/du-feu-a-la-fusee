---
title: Époques et découvertes (brouillon)
domain: contenu-historique
type: doc
status: draft
updated: 2026-10-18
---

# Époques et découvertes

> **Statut : brouillon.** Proposition de Claude. Ordre réel imposé par ADR-001, sans politique (ADR-002). Les faits historiques sont à vérifier avant de passer en `active`. Quand le code existera, ce tableau deviendra un fichier de données unique lu par le jeu (anti-drift).

Chaque découverte répond à un **problème** de la vie quotidienne : c'est le « avant / après » de la voix off.

## 1. Âge de pierre
| Découverte | Prérequis | Problème résolu (avant → après) | Ce qui pousse |
|---|---|---|---|
| Outils de pierre | (aucun) | On n'arrive pas à couper → on taille la pierre | Atelier de silex |
| Feu | (aucun) | Froid et nuit noire → chaleur, lumière, viande cuite | Feu de camp |
| Chasse | Outils | Peu à manger → des lances pour chasser | Râtelier de lances, séchoir |
| Abri en peaux | Chasse | Dormir dehors → des huttes chaudes | Tentes, huttes |
| Peinture | Feu | La grotte est sombre → on peint à la lumière du feu | Paroi peinte |

## 2. Néolithique (les premiers paysans)
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Agriculture | Outils, Abri | Il faut toujours marcher pour trouver à manger → on plante, on reste | Champs, maisons en torchis |
| Élevage | Chasse | La chasse est difficile → on garde des animaux | Enclos, chèvres |
| Grenier | Agriculture | Le blé pourrit ou se perd → on le garde au sec | Grenier sur pilotis |
| Poterie | Feu, Agriculture | Rien pour stocker l'eau et les graines → des pots en terre cuite | Atelier de potier |
| Meule | Agriculture | On ne peut pas manger le blé tel quel → farine et pain | Meule |

## 3. Âge des métaux et Antiquité
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Roue | Poterie | Porter à bras, c'est lourd → la charrette | Charrettes, chemins |
| Bronze | Feu, Poterie | La pierre casse → des outils en métal | Forge |
| Écriture | Grenier | On oublie combien on a de blé → on écrit les comptes | Maison des scribes |
| Monnaie | Écriture, Bronze | Échanger un mouton contre du blé, c'est compliqué → des pièces | Marché |
| Voile | Élevage (laine, tissage) | On ne va pas loin en pirogue → des bateaux à voile | Port |

Dans le jeu depuis le 16/11/2026 (branche `age-des-metaux`, cf. `journal/2026-11-session-03.md`) : les cinq découvertes ci-dessus, avec l'atelier du charron, la forge, la maison des scribes, le marché et le port ; la maison en pierre et la maison à cour. La roue change aussi les chemins les plus usés en routes de pierre.

Piste (ADR-013) : une découverte « Les routes » à cette époque, qui transforme les chemins de terre en routes empierrées et permet les charrettes et les chevaux.

## 4. Moyen Âge
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Moulin à eau | Roue, Meule | Moudre à la main, c'est long → la rivière travaille | Moulin |
| Fer | Bronze | Le bronze est rare → un métal plus courant | Forge à fer |
| Pont de pierre | Outils, Roue | Le pont de bois s'abîme → un pont solide | Pont en arche |
| Horloge | Fer | On ne sait pas l'heure → une horloge pour tout le village | Tour de l'horloge |
| Imprimerie | Écriture, Fer | Copier un livre à la main prend des mois → on imprime | Imprimerie, école |

Dans le jeu depuis le 16/11/2026 (branche `moyen-age`, cf. `journal/2026-11-session-04.md`) : les cinq découvertes ci-dessus, avec le moulin à eau (et la boulangerie), la forge du maréchal-ferrant, la tour de l'horloge, l'imprimerie ; la maison à colombages et la maison à étages ; le pont de pierre qui remplace la passerelle. Pas d'école (l'imprimerie suffit, proposition de Claude). Le fer fait aussi mieux travailler le bûcheron (hache en fer) et le paysan (charrue). Le petit problème du pont emporté est dans le jeu : une crue emporte la passerelle peu après l'arrivée au Moyen Âge, le pont de pierre la remplace.

## 5. La vapeur
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Charbon | Fer | Plus assez de bois → un nouveau combustible | Mine |
| Machine à vapeur | Fer, Charbon | Les bras et les chevaux ne suffisent plus → une machine | Usine |
| Train | Machine à vapeur, Roue | Les voyages durent des jours → le train | Gare, rails |
| Bateau à vapeur | Machine à vapeur, Voile | Sans vent, le bateau n'avance pas → la vapeur | Port à vapeur |

## 6. L'électricité
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Électricité | Machine à vapeur | (base de tout le reste) | Centrale |
| Ampoule | Électricité | Les bougies éclairent mal → la lumière partout | Lampadaires |
| Téléphone | Électricité | Pour parler, il faut se déplacer → on parle de loin | Poteaux téléphoniques |
| Voiture | Machine à vapeur, Roue | Le cheval est lent → la voiture | Routes, garage |
| Avion | Voiture | Les montagnes et la mer bloquent → on vole | Aérodrome |

## 7. Le monde moderne
| Découverte | Prérequis | Problème résolu | Ce qui pousse |
|---|---|---|---|
| Ordinateur | Électricité | Les calculs sont trop longs → une machine qui calcule | Bureau, labo |
| Énergie solaire | Électricité | Le charbon salit l'air → l'énergie du soleil et du vent | Panneaux, éolienne |
| Satellite | Ordinateur, Avion | On ne voit pas la Terre d'en haut → un œil dans l'espace | Observatoire |
| Fusée | Satellite | (fin du jeu) La fusée décolle | Pas de tir |

## Petits problèmes par époque (cf. GD)
| Époque | Problème | Résolu par |
|---|---|---|
| Pierre | Hiver froid | Feu |
| Néolithique | Blé mangé par les souris | Grenier |
| Métaux | Crue de la rivière | (digue, à ajouter ?) |
| Moyen Âge | Pont emporté | Pont de pierre (dans le jeu, session 04) |
| Vapeur | Incendie | (pompiers, à ajouter ?) |
| Électricité | Nuit noire en ville | Ampoule |
| Moderne | Air sale | Énergie solaire |

## À vérifier
- La roue de potier a précédé la roue de charrette : à confirmer avant d'en faire le prérequis.
- L'écriture née de la comptabilité des réserves : à confirmer et dater.
- Rythme : 4 à 5 découvertes par époque, soit environ 33 au total.

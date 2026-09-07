# Assistant mobilité dynamique — Corpus éditorial du jalon 1

**Objet** : matériau d'écriture pour le test « notification + interaction » sur les maquettes vivantes.
**Canal de référence** : WhatsApp. Chaque message est annoté d'une note de dégradation SMS.
**Décor** : réseau TADAO, corridor Liévin ↔ Lens. Personnage de référence : agent en horaires postés, prise de poste 6h00, départ habituel 5h15, ligne 12 puis correspondance.

> Ce document est un brouillon de travail destiné à être amendé. Les textes ne sont pas figés — ils sont écrits pour être discutés, coupés et réécrits avec votre binôme avant d'être injectés dans le simulateur.

---

## Partie 1 — Charte éditoriale (les invariants)

Ces règles sont considérées comme acquises à l'issue du FG2. Elles ne sont **pas** remises en test : elles s'appliquent à toutes les variantes. Elles sont rédigées pour être reprises telles quelles dans le cahier des charges.

| # | Règle | Origine |
|---|---|---|
| 1 | Toute proposition de trajet affiche une **heure d'arrivée à destination**. Sans exception. | Information reine, répétée sur 4 restitutions ; absente de tous les écrans testés |
| 2 | L'assistant se **déclare comme automatique dès le premier message** de la séquence, pas au troisième | « Oui, mais il faut le faire savoir » (unanime) |
| 3 | Chaque message porteur d'information trafic affiche une **mention de fraîcheur** (« mis à jour à 4h46 ») | Levier de crédibilité le moins coûteux ; panel à 50 % défiant |
| 4 | Une ligne n'est **jamais citée sans sa direction**, et porte sa couleur réseau quand le canal le permet | Remonté à plusieurs reprises |
| 5 | Un horaire de passage est **toujours accompagné du suivant** | Mécanisme de réassurance, confirmé par le test sur apps tierces |
| 6 | Aucun renvoi vers l'application TADAO, jamais | Le renvoi vers l'app IDFM dans le test Ally est un aveu d'échec du canal |
| 7 | Renvoi vers une carto tierce **uniquement pour le guidage piéton**, et seulement après autorisation donnée à l'inscription | Accepté par la majorité sous cette condition |
| 8 | Questions **fermées à réponse courte**, jamais de question ouverte | Les participants apprécient d'être guidés ; l'ouvert coûte du temps |
| 9 | Sobriété : un message = une idée. Pas d'exhaustivité. | « Beaucoup trop de choses » (rires assumés, FG2) ; 4 directions de RER dans le test Ally |
| 10 | Pour un abonné, la destination est **présumée connue** : on confirme, on ne demande pas | Voir note ci-dessous |

**Note sur la règle 10 — le pivot du dispositif.** Le test Ally a montré que qualifier une adresse en conversation est plus lent qu'un trip-planner. L'avantage du dispositif sur une app n'est donc ni le canal ni l'IA : c'est que **le contexte est déjà là**. Toute la séquence est écrite pour exploiter cet acquis. Le GPS devient un cas de repli, pas le mécanisme central.

---

## Partie 2 — Plan de variantes

### Les trois variables retenues

**Variable A — Formulation de l'arrivée**

| | Formulation |
|---|---|
| **A1** — absolu | `Arrivée à Lens Gare : 5h58` |
| **A2** — relatif | `+18 mn sur votre trajet habituel` |
| **A3** — réassurance quantifiée | `Vous serez à Lens Gare pour 5h58, soit 18 mn plus tard que d'habitude` |

**Variable B — Message de confirmation intermédiaire**

| | Contenu |
|---|---|
| **B1** — récapitulatif complet | 4 lignes : origine, destination, heure impérative, heure de départ |
| **B2** — confirmation d'une ligne | Une question fermée, un tap |
| **B3** — supprimé | On passe directement aux alternatives |

**Variable C — Niveau de prudence**

| | Posture |
|---|---|
| **C1** — affirmatif | L'assistant annonce, sans réserve |
| **C2** — réserve explicite | L'assistant signale que la situation peut évoluer |

### Comment les tester sans exploser la combinatoire

Le croisement complet donnerait 18 parcours. Inutilisable. Le plan proposé sépare ce qui doit être **vécu** de ce qui peut être **comparé**.

**B se teste en inter-sujets, dans le vécu.** On ne peut pas faire vivre deux fois la même séquence à quelqu'un sans effet d'apprentissage. Trois bras :

| Bras | Effectif cible | Variante vécue |
|---|---|---|
| Bras 1 | 5-6 participants | B1 · A3 · C1 |
| Bras 2 | 5-6 participants | B2 · A3 · C1 |
| Bras 3 | 5-6 participants | B3 · A3 · C1 |

A et C sont volontairement figés dans le vécu, pour que la seule différence entre bras soit B.

**A et C se testent en intra-sujet, au débriefing.** Après l'expérience vécue, on présente les formulations côte à côte sur cartes (ou dans le simulateur), et on fait arbitrer. C'est un choix forcé, plus discriminant qu'une question ouverte, et beaucoup moins coûteux en temps de séance.

**Ce qui se mesure dans le vécu, en plus du déclaratif :** délai avant ouverture, délai avant première réponse, taux de poursuite après l'invite, et — le plus important — **le verbatim exact de ce que le participant écrit spontanément**. Ce corpus entrant est le livrable qui alimentera le prompt du futur agent.

---

## Partie 3 — Les séquences

Cinq séquences, correspondant à cinq moments distincts. **S1 et S2 ne mobilisent pas les mêmes blocs fonctionnels** : en prévenance J-1, la notification se suffit à elle-même — le voyageur a le temps de se débrouiller seul. C'est un arbitrage à porter dans le cahier des charges.

Convention : `▸` = message assistant · `◂` = message voyageur · `〔…〕` = commentaire de conception.

---

### S0 — Onboarding conversationnel *(à l'inscription, hors perturbation)*

〔Objectif : créer l'historique de conversation avant la crise, établir le contrat du silence, et — techniquement — constituer l'opt-in et ouvrir la fenêtre de conversation WhatsApp. Cette séquence répond directement à votre note du FG2.〕

▸ **Message 1**
```
Bonjour, ici l'assistant TADAO 👋

Je suis un assistant automatique. Je surveille vos
lignes et je vous préviens uniquement en cas de
perturbation.

Le reste du temps, je reste silencieux : pas de
message de ma part = tout va bien.
```

▸ **Message 2**
```
Voici ce que vous m'avez indiqué :

🚌 Vos lignes : 12 et 41
📅 Du lundi au vendredi
🕐 Départ vers 5h15 · retour vers 14h00

Une erreur ? Répondez MODIFIER.
```

▸ **Message 3**
```
Deux commandes à retenir :

⏸ PAUSE — je me tais pendant vos congés
🛑 STOP — je ne vous écris plus du tout

Envie de tester ? Écrivez-moi quelque chose,
je vous réponds.
```

〔Le troisième message provoque volontairement un premier échange. C'est ce qui crée l'historique rassurant et, sur WhatsApp, ce qui ouvre la fenêtre de service de 24h.〕

**Dégradation SMS** : rien ne saute. Les trois messages tiennent en texte brut. PAUSE et STOP sont des mots-clés natifs du canal.

---

### S1 — Prévenance J-1 *(travaux annoncés, la veille à 18h30)*

▸
```
🔧 TADAO Alerte — travaux demain sur votre ligne
Assistant automatique TADAO · info du 14/09, 18h27

La ligne 12 sera déviée demain mardi de 5h00 à
9h00 (travaux avenue Raoul Briquet).
Les arrêts Halle Tetelin et La Cornu ne seront
pas desservis.

Pour votre départ de 5h15 :
〔bloc VARIABLE A〕

Je peux vous préparer une alternative maintenant,
ou vous rappeler demain 30 mn avant votre départ.

👉 Répondez MAINTENANT ou DEMAIN
```

〔Le choix final n'est pas une politesse : le FG2 indique qu'une prévenance la veille annule le besoin de plan détaillé — le voyageur construit lui-même sa solution. Cette question mesure directement cette hypothèse. Le taux de réponse « DEMAIN » est un indicateur en soi.〕

**Dégradation SMS** : l'émoji de tête saute, la mise en gras saute. Le message dépasse 160 caractères → concaténation multi-SMS. À vérifier sur le rendu réel : un SMS long s'affiche en un seul bloc chez la plupart des opérateurs, mais pas partout.

---

### S2 — Perturbation impromptue, avant le départ *(séquence principale, 4h48)*

C'est la séquence qui porte le test des trois variables.

#### S2.1 — L'alerte

▸
```
⚠️ TADAO Alerte — perturbation sur votre ligne
Assistant automatique TADAO · mis à jour à 4h46

La ligne 12 est interrompue entre Liévin Centre
et Lens Gare (véhicule immobilisé).
Les lignes 14, 22 et 25 sont également ralenties.

Pour votre départ de 5h15 :
〔bloc VARIABLE A〕

Je vous trouve une autre solution ?
👉 Répondez OUI
```

**Bloc VARIABLE A — les trois versions à insérer**

- **A1** — `Arrivée estimée à Lens Gare : 6h05`
- **A2** — `Environ 25 mn de retard sur votre trajet habituel`
- **A3** — `Vous serez à Lens Gare vers 6h05, soit 25 mn plus tard que d'habitude`

〔Le corridor est calibré pour que ce soit inconfortable : prise de poste à 6h00, arrivée annoncée à 6h05. L'enjeu est réel, et c'est ce qui rend le test des formulations discriminant.〕

#### S2.2 — La confirmation *(bloc VARIABLE B)*

◂ `OUI`

**B1 — récapitulatif complet**
▸
```
Très bien. Je récapitule :

📍 Départ : votre domicile, à Liévin
🏁 Arrivée : Lens Gare
🕕 Vous devez y être pour 6h00
🚪 Départ prévu vers 5h15

C'est bien cela ?
👉 OUI / NON
```

**B2 — confirmation d'une ligne**
▸
```
Vous partez de chez vous pour Lens Gare,
pour 6h00 ?

👉 OUI / NON, autre trajet
```

**B3 — supprimé**
On enchaîne directement sur S2.3.

〔Rappel : le récapitulatif remplissait deux fonctions dans le FG2 — prouver la compréhension, et sélectionner une alternative. Dans le trajet habituel, la première fonction disparaît presque entièrement. C'est l'hypothèse que ce bras teste.〕

#### S2.3 — Les alternatives

▸
```
Voici 2 solutions, de la plus rapide à la plus
lente :

━━━━━━━━━━━━━━━━━━
1️⃣  Arrivée 5h58 — vous êtes à l'heure
🚶 6 mn de marche
🚌 Bus 15 → Liévin Centre, puis B3 → Lens Gare
🔄 1 changement

━━━━━━━━━━━━━━━━━━
2️⃣  Arrivée 6h12 — 12 mn après votre prise de poste
🚌 Ligne 41 → Lens Behal, à votre arrêt habituel
🚶 9 mn de marche à l'arrivée
✅ Aucun changement

👉 Répondez 1 ou 2 pour le détail
```

〔Classement par heure d'arrivée, comme demandé. Les deux options matérialisent l'arbitrage remonté du FG2 : rapidité contre simplicité. Le libellé « vous êtes à l'heure » est une forme de A3 appliquée au niveau de l'option — à surveiller, c'est peut-être le vrai gagnant.〕

**Dégradation SMS** : les séparateurs et la numérotation en émoji sautent. À remplacer par `OPTION 1` / `OPTION 2` en majuscules. La hiérarchie visuelle est significativement dégradée — **c'est ici que le choix WhatsApp-first coûte le plus cher.**

#### S2.4 — Le détail

◂ `1`

▸
```
Option 1 — partez dans 9 minutes ⏱

🚶 Marchez 6 mn jusqu'à l'arrêt La Cornu
   📍 Itinéraire à pied : [lien]

🚌 Bus 15 · direction Liévin Centre
   Départ 5h21 (suivant : 5h36)

🔄 Changement à Liévin Centre

🚌 Ligne B3 · direction Lens Gare
   Départ 5h44 (suivant : 5h59)

🏁 Arrivée Lens Gare : 5h58

Info mise à jour à 4h51.
〔bloc VARIABLE C〕
```

**Bloc VARIABLE C**

- **C1** — `Bon trajet. Je vous préviens si la situation change.`
- **C2** — `La situation peut encore évoluer : je vous préviens en cas de changement, et pensez à vérifier l'affichage à l'arrêt.`

〔C'est l'arbitrage le plus intéressant du test, et le plus politique en interne : C2 protège l'opérateur, C1 sert le voyageur sous contrainte. Un opérateur de transport ira spontanément vers C2. Il faut que le test tranche, pas le juridique.〕

**Dégradation SMS** : le lien piéton reste cliquable (les clients SMS détectent les URL). Les émojis sautent, l'indentation saute. Message long, multi-SMS.

---

### S3 — Perturbation en cours de trajet *(le cas difficile)*

〔Séquence secondaire, mais c'est probablement le scénario le plus fréquent en réel. À faire vivre à une partie du panel seulement si le temps le permet.〕

▸ **Alerte**
```
⚠️ TADAO Alerte — perturbation en cours
Assistant automatique TADAO · mis à jour à 5h32

La ligne 41 est bloquée à hauteur de Lens Behal
(accident de circulation).

Si vous êtes à bord ou à l'arrêt, votre arrivée
est retardée d'environ 20 mn.

Je vous aide à contourner ?
👉 Répondez OUI
```

◂ `OUI`

▸
```
Où êtes-vous en ce moment ?

1️⃣  Encore à Lens Gare
2️⃣  Déjà dans le bus 41
3️⃣  Ailleurs — envoyez-moi votre position 📍

👉 Répondez 1, 2 ou 3
```

〔Le QCM est votre intuition du FG2, appliquée au trajet en cours. Pour un abonné, les positions probables sont déductibles de son itinéraire déclaré et de l'heure : le GPS n'est plus qu'une option 3. C'est ce qui distingue le dispositif d'un trip-planner.〕

**Dégradation SMS** : l'option 3 disparaît — **pas de partage de position en SMS**. Le repli est la saisie d'un nom d'arrêt. À reformuler pour le canal SMS : `3️⃣ Ailleurs — écrivez-moi le nom de l'arrêt le plus proche`.

---

### S4 — Reprise du trafic

▸
```
✅ TADAO Alerte — trafic rétabli
Assistant automatique TADAO · 6h34

La ligne 12 circule à nouveau normalement entre
Liévin Centre et Lens Gare.

Votre retour de 14h00 n'est pas concerné.
Bonne journée.
```

〔Séquence courte, mentionnée par un seul participant, mais c'est le pendant indispensable du contrat de silence posé en S0. Sans elle, le voyageur reste en alerte toute la journée.〕

---

## Partie 4 — Cartes de comparaison pour le débriefing

À présenter après l'expérience vécue, en choix forcé.

**Carte A — « Laquelle de ces trois phrases vous serait la plus utile à 4h48 ? »**
> A1 · Arrivée estimée à Lens Gare : 6h05
> A2 · Environ 25 mn de retard sur votre trajet habituel
> A3 · Vous serez à Lens Gare vers 6h05, soit 25 mn plus tard que d'habitude

*Relance :* et si vous n'aviez pas d'horaire impératif ce jour-là, votre réponse changerait-elle ?

**Carte C — « Lequel de ces deux messages vous mettrait le plus en confiance ? »**
> C1 · Bon trajet. Je vous préviens si la situation change.
> C2 · La situation peut encore évoluer : je vous préviens en cas de changement, et pensez à vérifier l'affichage à l'arrêt.

*Relance :* lequel donne le sentiment que l'assistant sait ce qu'il dit ?

**Carte vocabulaire — micro-test**
> « Départs en temps réel » vs. « Départs confirmés à l'instant » vs. « Départs à jour »

〔Votre question du test Ally sur le jargon opérateur. Coûte 90 secondes de séance.〕

---

## Partie 5 — Points à trancher avant de figer le corpus

1. **Le corridor.** Le décor ci-dessus est plausible mais inventé à partir des écrans du FG2. Il faut le remplacer par 2 ou 3 corridors TADAO réels, choisis sur les lignes que vos futurs bêta-testeurs empruntent effectivement. Sans cela, les participants décrocheront sur le fond.
2. **L'expéditeur.** Nom affiché et logo à valider avec la marque TADAO. En SMS, l'émetteur alphanumérique est limité à 11 caractères sans espace : `TADAOALERT` tient, `TADAO Alerte` non.
3. **Le lien piéton.** Deep-link Maps ou Citymapper ? À décider, et à tester en conditions réelles sur iOS et Android — le comportement diffère.
4. **La granularité du retard.** « 20 à 25 mn » (fourchette, honnête) ou « 22 mn » (précis, faussement rassurant) ? Question non abordée dans le FG2, et elle interagit fortement avec la variable C.
5. **Le message de non-pertinence.** Rien n'est écrit pour le cas où l'alerte ne concerne finalement pas le voyageur. C'est pourtant le risque n°1 identifié par les participants eux-mêmes. À écrire avant le test si vous voulez le mesurer.

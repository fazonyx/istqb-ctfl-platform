# Plateforme d'entrainement ISTQB CTFL v4.0

Plateforme web d'entrainement a la certification **ISTQB Certified Tester Foundation Level v4.0**, entierement en francais, fonctionnant en local sans serveur.

## Fonctionnalites

### Quiz
- **13 modes** : 4 examens blancs (A, B, C, D) + modes aleatoires + par chapitre + points faibles + questions ratees + examen realiste
- **186 questions** traduites en francais avec justifications detaillees par option (pour chaque reponse correcte ET incorrecte)
- Timer, navigation clavier, sauvegarde automatique dans le navigateur (localStorage)
- Suggestions de mini-quiz cibles par objectif d'apprentissage

### Progression
- Dashboard inspire des plateformes professionnelles (istqbprep)
- Banniere score, graphes d'evolution multi-scores (score global, examens, entrainements, inattention, lacunes)
- Carte thermique (heatmap) par objectif d'apprentissage, cliquable
- Analyse des erreurs : inattention vs lacunes, top 10 des questions ratees, objectifs a travailler
- Historique complet des tentatives avec rapports detailles
- Export / import JSON des donnees utilisateur

### Apprentissage (une page par chapitre)
- **Syllabus complet** du chapitre (traduit en francais, avec schemas, exemples, pieges d'examen)
- **Fiches de revision** condensees avec schemas SVG et methodes pas-a-pas
- **Flashcards** filtrees par chapitre (repetition espacee)
- **Tutos interactifs** : exercices guides etape par etape (EP, BVA, tables de decision, transitions d'etat, estimation, risques)
- **Mini-quiz** du chapitre
- **Aide-memoire** transversal avec formules, tableaux de reference, astuces d'examen

## Comment lancer le projet

### Methode 1 — Double-clic (le plus simple)
Double-cliquez sur `istqb_platform.html` dans l'explorateur de fichiers.

### Methode 2 — Depuis le terminal Windows
```bash
start "" "C:/Users/Fabien/Documents/perso/formations/ISTQB/istqb_platform.html"
```

### Methode 3 — Cloner depuis GitHub et ouvrir
```bash
git clone https://github.com/fazonyx/istqb-ctfl-platform.git
cd istqb-ctfl-platform
start istqb_platform.html    # Windows
open istqb_platform.html     # macOS
xdg-open istqb_platform.html # Linux
```

### Methode 4 — Avec un serveur local (si le double-clic pose probleme)
```bash
cd "C:/Users/Fabien/Documents/perso/formations/ISTQB"
npx serve -l 3456
```
Puis ouvrez : **http://localhost:3456/istqb_platform.html**

Aucune installation necessaire pour les methodes 1-3. La methode 4 necessite Node.js.

## Structure du projet

```
.
├── istqb_platform.html     # Page principale (accueil, quiz, progression, apprentissage)
├── chapitre[1-6].html      # 6 pages dediees par chapitre du syllabus
├── aide-memoire.html       # Reference rapide
├── css/
│   └── style.css           # Styles
└── js/
    ├── data.js             # Banque de questions, flashcards, tutos, constantes
    ├── shared.js           # Etat global, utilitaires
    ├── storage.js          # localStorage, export/import, historique
    ├── progression.js      # Dashboard progression
    ├── chapters.js         # Moteur flashcards, tutos
    └── quiz.js             # Moteur de quiz
```

## Technologies

HTML, CSS, JavaScript vanilla. Zero dependance externe. Tout tourne dans le navigateur.

## Avertissement

Outil d'entrainement personnel non officiel, base sur les **sample exams publics** mis a disposition par l'ISTQB. Les questions ont ete reformulees et traduites en francais. Ce projet n'est pas affilie ni approuve par l'ISTQB.

Pour les documents officiels : [ISTQB CTFL](https://www.istqb.org/certifications/certified-tester-foundation-level)

## Licence

Usage personnel uniquement. Les contenus derives du syllabus ISTQB restent sous le copyright de l'ISTQB.

# 📊 V.A.L.O.R. 2026
**Visualisation Automatisée de Lectures et d'Observations Régionales**

> L'outil de cartographie et de Business Intelligence territorial conçu par et pour l'ingénierie publique. 100% local, 100% sécurisé, zéro installation.
> *La donnée reste chez vous, l'expertise partout ailleurs.*

---

## 📖 Pourquoi V.A.L.O.R. ?

### Le Contexte & La Problématique
Pour piloter les politiques publiques, l'administration s'appuie massivement sur la donnée locale. Pourtant, les agents font face à une impasse : 
* Le recours à des solutions Cloud (SaaS) pose un risque réglementaire majeur (secret statistique).
* Les logiciels SIG experts sont lourds, complexes et nécessitent de longues validations DSI.
* Les licences propriétaires pèsent sur les budgets publics et créent une dépendance.

### La Solution
V.A.L.O.R. est une application métier souveraine qui offre le **circuit court de la donnée publique**. Elle permet de générer des diagnostics territoriaux complexes avec une garantie de confidentialité absolue et une autonomie totale pour l'agent.

---

## ✨ Fonctionnalités Clés & Architecture

### 🛡️ 1. Sécurité et Confidentialité (Souveraineté par l'Architecture)
* **Traitement 100% Local :** Les données CSV importées restent dans la mémoire vive (RAM) de votre navigateur. Aucun octet ne quitte votre ordinateur.
* **Isolation du Stockage :** Le panier et les préférences sont stockés dans la base IndexedDB locale, strictement protégée par le navigateur.
* **Bouton de Nettoyage :** Suppression instantanée de toute trace locale (panier, fichiers temporaires) pour respecter le droit à l'effacement.
* **Secret Statistique :** Rappel systématique des règles de diffusion (seuil des 5 unités) dès l'import.

### 🏛️ 2. Identité et Design Institutionnel
* **Framework DSFR :** Utilisation intégrale du Système de Design de l'État pour une ergonomie reconnue et accessible.
* **Palettes Officielles :** Intégration de 20+ palettes de couleurs DSFR (Vert Émeraude, Bleu Cumulus, etc.) pour des rendus conformes aux standards.
* **Bloc de Marque :** Personnalisation dynamique du logo institutionnel et des intitulés de direction.

### 🧠 3. Fonctionnalités Analytiques Profondes
* **Moteur de calcul sans code :** Valeurs brutes, Sommes, Moyennes, Ratios (A/B), Taux d'évolution, Parts (%), et éditeur de formules.
* **Maillage Territorial :** Changement d'échelle instantané entre National, Régional, Départemental, et projections Intercommunales (EPCI).
* **Visualisations :** Cartes choroplèthes (D3.js) et graphiques synchronisés (Barres, Courbes, Radar, Camembert via Chart.js).

### ✍️ 4. Flux de Travail et Édition
* **Le Panier (Snapshots) :** Permet de figer une analyse, de changer de fichier CSV, et de croiser plusieurs sources dans le même rapport.
* **Éditeur de Diapositives :** Création de pages de garde et de textes d'analyse avec un éditeur WYSIWYG intégré.
* **Exports Multiformats :** Génération de rapports PDF haute définition, export de données en CSV, et sauvegarde de projet en JSON.

---

## 🛠️ Déploiement et Configuration

### Méthodes de Lancement
1. **Windows (Recommandé) :** Double-clic sur `start.bat`. Utilise PowerShell pour créer un serveur local sécurisé.
2. **macOS / Linux :** Lancez la commande `python3 -m http.server 8000` dans le dossier racine.
3. **Réseau Local (Apache) :** Déploiement possible sur un serveur interne. Les données des utilisateurs restent cloisonnées sur leurs postes respectifs.

### Configuration via `config.ini`
Pré-paramétrez l'outil pour votre structure :
* `[General]` : Titre, date et crédits par défaut.
* `[Marianne]` : Lignes de direction personnalisées.
* `[Logo]` : Chemin du logo institutionnel par défaut.
* `[Fichiers]` : Chargement automatique du CSV de référence au démarrage.

### 📊 Pré-requis du fichier CSV
* **Séparateur :** `;` ou `,`
* **Colonne 1 :** Code INSEE (Territoire)
* **Colonnes 2+ :** Données numériques (Indicateurs)

---

## 🤝 Contribuer et Tester (Appel à la communauté)

V.A.L.O.R. est un commun numérique en plein développement. **Nous sommes à la recherche de nos premiers bêta-testeurs** (chargés d'études, data analysts territoriaux). Testez l'outil avec vos propres jeux de données (en toute sécurité) et faites vos retours via l'onglet **Issues**.

Toute contribution au code (Pull Requests) est la bienvenue !

---

## 📄 Licence
Ce projet est publié sous licence **EUPL 1.2** (European Union Public Licence). En tant que commun numérique, l'utilisation et la modification sont libres. Toutefois, cette licence "copyleft" garantit que **toute version modifiée de ce code source doit être partagée avec la communauté sous les mêmes conditions**, afin de mutualiser l'argent et l'effort publics.

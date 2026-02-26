📊 V.A.L.O.R. 2026
Visualisation Automatisée de Lectures et d'Observations Régionales
V.A.L.O.R. est une application métier de Business Intelligence (BI) souveraine, conçue pour les services de l'État et les collectivités territoriales. Elle permet de générer des diagnostics territoriaux complexes (cartographies, analyses statistiques, rapports éditoriaux) avec une garantie de confidentialité absolue.

🏛️ 1. Identité et Design Institutionnel
L'application est nativement conforme à la Charte Graphique de l'État :
    • Framework DSFR : Utilisation intégrale du Système de Design de l'État pour une ergonomie reconnue et accessible.
    • Palettes Officielles : Intégration de 20+ palettes de couleurs DSFR (Vert Émeraude, Bleu Cumulus, Orange Terre Battue, etc.) pour des rendus cartographiques et graphiques conformes aux standards de l'administration.
    • Bloc de Marque : Personnalisation dynamique du logo institutionnel et des intitulés de direction via l'interface ou le fichier de configuration.

🛡️ 2. Sécurité et Confidentialité (RGPD)
V.A.L.O.R. repose sur un paradigme de "Souveraineté par l'Architecture" :
    • Traitement Local (Client-Side) : Les données CSV importées restent dans la mémoire vive (RAM) de votre navigateur. Aucun transfert vers un serveur externe n'est effectué.
    • Isolation du Stockage : Le panier et les préférences sont stockés dans la base IndexedDB locale de l'utilisateur, protégée par le navigateur.
    • Bouton de Nettoyage de Sécurité : Une fonction dédiée permet de supprimer instantanément toute trace locale (panier, fichiers temporaires, réglages) pour respecter le droit à l'effacement.
    • Avertissement Secret Statistique : Rappel systématique des règles de diffusion (seuil des 5 unités) lors de l'import de données.

🧠 3. Fonctionnalités Analytiques Profondes
L'outil offre un moteur de calcul statistique avancé pilotable sans code :
    • Modes de Calcul : Valeurs brutes, Sommes, Moyennes, Ratios ($A/B$), Taux d'évolution et Parts (%).
    • Filtrage Dynamique : Exclusion de données aberrantes ou ciblage précis par seuils numériques.
    • Maillage Territorial : Changement d'échelle instantané entre National (Régions/Départements), Départemental (Communes) et projections Intercommunales (EPCI).
    • Visualisations : Cartes choroplèthes (D3.js) et graphiques synchronisés (Barres, Courbes, Radar, Camembert via Chart.js).

✍️ 4. Flux de Travail et Édition
V.A.L.O.R. transforme l'analyse en rapport prêt à diffuser :
    • Le Panier (Snapshots) : Permet de "figer" une analyse, de changer de fichier CSV, et d'ajouter une nouvelle analyse d'une source différente dans le même rapport.
    • Éditeur de Diapositives : Création de pages de garde et de textes d'analyse avec un éditeur WYSIWYG intégré.
    • Exportation Multiformat : Génération de rapports PDF haute définition, export des données agrégées en CSV pour Excel, et sauvegarde du projet en JSON.

🛠️ 5. Déploiement et Configuration
Méthodes de Lancement
    1. Windows (Recommandé) : Double-clic sur start.bat. Utilise PowerShell pour créer un serveur local sécurisé.
    2. macOS / Linux : Commande python3 -m http.server 8000 dans le dossier racine.
    3. Réseau Local (Apache) : Déploiement possible sur serveur interne pour un accès partagé via IP. Les données des utilisateurs restent cloisonnées sur leurs postes respectifs.
Personnalisation via config.ini
Le fichier config.ini permet de pré-paramétrer l'outil :
    • [General] : Titre, date et crédits par défaut.
    • [Marianne] : Lignes de direction personnalisées.
    • [Logo] : Chemin du logo institutionnel par défaut.
    • [Fichiers] : Chargement automatique du CSV de référence au démarrage.

📊 Pré-requis du fichier CSV
    • Séparateur : ; ou ,.
    • Colonne 1 : Code INSEE (Territoire).
    • Colonnes 2+ : Données numériques (Indicateurs).

V.A.L.O.R. 2026 — La donnée reste chez vous, l'expertise partout ailleurs.

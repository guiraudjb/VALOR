#!/bin/bash

# Configuration du port
PORT=8000
URL="http://localhost:$PORT"

echo "Démarrage de l'application V.A.L.O.R..."
echo "--------------------------------------------------"
echo "Serveur démarré sur : $URL"
echo "Dossier racine : $(pwd)"
echo "Appuyez sur [ENTRÉE] dans ce terminal pour arrêter le serveur."
echo "--------------------------------------------------"

# 1. Lancer le serveur HTTP en arrière-plan
# CORRECTIF BUG 1 : On appelle server.py au lieu du module natif défaillant
if command -v python3 &>/dev/null; then
    python3 server.py > /dev/null 2>&1 &
    SERVER_PID=$!
elif command -v python &>/dev/null; then
    python server.py > /dev/null 2>&1 &
    SERVER_PID=$!
else
    echo "Erreur : Python n'est pas installé sur ce système."
    exit 1
fi
# Attendre une petite seconde pour que le serveur soit bien en écoute
sleep 1

# 2. Ouvrir le navigateur par défaut selon le système d'exploitation
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    # Commande pour macOS
    open "$URL"
elif [ "$OS" = "Linux" ]; then
    # Commande pour Linux
    xdg-open "$URL"
else
    echo "OS non reconnu. Veuillez ouvrir manuellement $URL dans votre navigateur."
fi

# 3. Maintenir le script ouvert (équivalent du "pause" sous Windows)
read -r -p ""

# 4. Nettoyage à la fermeture
echo "Arrêt du serveur V.A.L.O.R..."
kill $SERVER_PID
exit 0

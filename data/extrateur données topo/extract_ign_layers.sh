#!/bin/bash

# Vérification de l'argument
if [ -z "$1" ]; then
    echo "Usage: $0 <fichier_ign.gpkg>"
    exit 1
fi

INPUT_GPKG=$1
LAYERS=("commune" "departement" "region")

echo "--- Démarrage de l'extraction V.A.L.O.R. 2026 ---"

for LAYER in "${LAYERS[@]}"
do
    echo "Traitement de la couche : $LAYER..."

    # 1. Extraction et projection en GeoJSON (WGS84) via ogr2ogr
    # Cette étape garantit la compatibilité avec les standards du web
    ogr2ogr -f GeoJSON -t_srs EPSG:4326 "${LAYER}_temp.json" "$INPUT_GPKG" "$LAYER"

    # 2. Conversion en TopoJSON + Simplification via mapshaper
    # On applique une simplification plus forte sur les communes pour garder l'appli fluide
    if [ "$LAYER" == "commune" ]; then
        SIMPLIFY="10%"
    else
        SIMPLIFY="20%"
    fi

    mapshaper "${LAYER}_temp.json" \
        -simplify $SIMPLIFY \
        -o format=topojson "${LAYER}_2025.json"

    # 3. Suppression du fichier temporaire GeoJSON
    rm "${LAYER}_temp.json"

    echo "Fichier généré : ${LAYER}_2025.json"
done

echo "--- Traitement terminé avec succès ---"

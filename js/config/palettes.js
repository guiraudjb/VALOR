// js/config/palettes.js

// ==========================================
// 1. DÉFINITION DES LIBELLÉS
// ==========================================
export const PALETTE_LABELS = {
    // Palettes d'origine
    "sequentialDescending": "Séquentielle (Clair vers Foncé)",
    "sequentialAscending": "Séquentielle Inverse (Foncé vers Clair)",
    "divergentDescending": "Divergente (Vert-Jaune-Rouge)",
    "divergentAscending": "Divergente (Rouge-Jaune-Vert)",
    "categorical": "Catégorielle",

    // Couleurs Illustratives DSFR (Verts)
    "tilleulVerveineDescending": "Vert Tilleul-Verveine (Clair vers Foncé)",
    "tilleulVerveineAscending": "Vert Tilleul-Verveine (Foncé vers Clair)",
    "bourgeonDescending": "Vert Bourgeon (Clair vers Foncé)",
    "bourgeonAscending": "Vert Bourgeon (Foncé vers Clair)",
    "emeraudeDescending": "Vert Émeraude (Clair vers Foncé)",
    "emeraudeAscending": "Vert Émeraude (Foncé vers Clair)",
    "mentheDescending": "Vert Menthe (Clair vers Foncé)",
    "mentheAscending": "Vert Menthe (Foncé vers Clair)",
    "archipelDescending": "Vert Archipel (Clair vers Foncé)",
    "archipelAscending": "Vert Archipel (Foncé vers Clair)",

    // Couleurs Illustratives DSFR (Bleus et Violets)
    "ecumeDescending": "Bleu Écume (Clair vers Foncé)",
    "ecumeAscending": "Bleu Écume (Foncé vers Clair)",
    "cumulusDescending": "Bleu Cumulus (Clair vers Foncé)",
    "cumulusAscending": "Bleu Cumulus (Foncé vers Clair)",
    "glycineDescending": "Violet Glycine (Clair vers Foncé)",
    "glycineAscending": "Violet Glycine (Foncé vers Clair)",

    // Couleurs Illustratives DSFR (Roses, Rouges et Oranges)
    "macaronDescending": "Rose Macaron (Clair vers Foncé)",
    "macaronAscending": "Rose Macaron (Foncé vers Clair)",
    "tuileDescending": "Rose Tuile (Clair vers Foncé)",
    "tuileAscending": "Rose Tuile (Foncé vers Clair)",
    "terreBattueDescending": "Orange Terre Battue (Clair vers Foncé)",
    "terreBattueAscending": "Orange Terre Battue (Foncé vers Clair)",

    // Couleurs Illustratives DSFR (Jaunes)
    "tournesolDescending": "Jaune Tournesol (Clair vers Foncé)",
    "tournesolAscending": "Jaune Tournesol (Foncé vers Clair)",
    "moutardeDescending": "Jaune Moutarde (Clair vers Foncé)",
    "moutardeAscending": "Jaune Moutarde (Foncé vers Clair)",

    // Couleurs Illustratives DSFR (Marrons et Beiges)
    "cafeCremeDescending": "Marron Café Crème (Clair vers Foncé)",
    "cafeCremeAscending": "Marron Café Crème (Foncé vers Clair)",
    "caramelDescending": "Marron Caramel (Clair vers Foncé)",
    "caramelAscending": "Marron Caramel (Foncé vers Clair)",
    "operaDescending": "Marron Opéra (Clair vers Foncé)",
    "operaAscending": "Marron Opéra (Foncé vers Clair)",
    "grisGaletDescending": "Beige Gris Galet (Clair vers Foncé)",
    "grisGaletAscending": "Beige Gris Galet (Foncé vers Clair)"
};

// ==========================================
// 2. DÉFINITION DES GRADIENTS CSS (Légende)
// Utilisation des teintes DSFR (975 vers Main)
// ==========================================
export const PALETTE_GRADIENTS = {
    // Palettes d'origine
    "sequentialDescending": "linear-gradient(to right, #e3e3fd, #000091)",
    "sequentialAscending": "linear-gradient(to right, #000091, #e3e3fd)",
    "divergentDescending": "linear-gradient(to right, #298641, #EFB900, #E91719)",
    "divergentAscending": "linear-gradient(to right, #E91719, #EFB900, #298641)",
    "categorical": "linear-gradient(to right, #5C68E5, #82B5F2, #29598F, #31A7AE, #81EEF5, #B478F1, #CFB1F5, #CECECE)",

    // Verts
    "tilleulVerveineDescending": "linear-gradient(to right, #fef7da, #B7A73F)",
    "tilleulVerveineAscending": "linear-gradient(to right, #B7A73F, #fef7da)",
    "bourgeonDescending": "linear-gradient(to right, #e6feda, #68A532)",
    "bourgeonAscending": "linear-gradient(to right, #68A532, #e6feda)",
    "emeraudeDescending": "linear-gradient(to right, #e3fdeb, #00A95F)",
    "emeraudeAscending": "linear-gradient(to right, #00A95F, #e3fdeb)",
    "mentheDescending": "linear-gradient(to right, #dffdf7, #009081)",
    "mentheAscending": "linear-gradient(to right, #009081, #dffdf7)",
    "archipelDescending": "linear-gradient(to right, #e5fbfd, #009099)",
    "archipelAscending": "linear-gradient(to right, #009099, #e5fbfd)",

    // Bleus et Violets
    "ecumeDescending": "linear-gradient(to right, #f4f6fe, #465F9D)",
    "ecumeAscending": "linear-gradient(to right, #465F9D, #f4f6fe)",
    "cumulusDescending": "linear-gradient(to right, #f3f6fe, #417DC4)",
    "cumulusAscending": "linear-gradient(to right, #417DC4, #f3f6fe)",
    "glycineDescending": "linear-gradient(to right, #fef3fd, #A558A0)",
    "glycineAscending": "linear-gradient(to right, #A558A0, #fef3fd)",

    // Roses, Rouges et Oranges
    "macaronDescending": "linear-gradient(to right, #fef4f2, #E18B76)",
    "macaronAscending": "linear-gradient(to right, #E18B76, #fef4f2)",
    "tuileDescending": "linear-gradient(to right, #fef4f3, #CE614A)",
    "tuileAscending": "linear-gradient(to right, #CE614A, #fef4f3)",
    "terreBattueDescending": "linear-gradient(to right, #fef4f2, #E4794A)",
    "terreBattueAscending": "linear-gradient(to right, #E4794A, #fef4f2)",

    // Jaunes
    "tournesolDescending": "linear-gradient(to right, #fef6e3, #C8AA39)",
    "tournesolAscending": "linear-gradient(to right, #C8AA39, #fef6e3)",
    "moutardeDescending": "linear-gradient(to right, #fef5e8, #C3992A)",
    "moutardeAscending": "linear-gradient(to right, #C3992A, #fef5e8)",

    // Marrons et Beiges
    "cafeCremeDescending": "linear-gradient(to right, #fbf6ed, #D1B781)",
    "cafeCremeAscending": "linear-gradient(to right, #D1B781, #fbf6ed)",
    "caramelDescending": "linear-gradient(to right, #fbf5f2, #C08C65)",
    "caramelAscending": "linear-gradient(to right, #C08C65, #fbf5f2)",
    "operaDescending": "linear-gradient(to right, #fbf5f2, #BD987A)",
    "operaAscending": "linear-gradient(to right, #BD987A, #fbf5f2)",
    "grisGaletDescending": "linear-gradient(to right, #f9f8f6, #AEA397)",
    "grisGaletAscending": "linear-gradient(to right, #AEA397, #f9f8f6)"
};

// ==========================================
// 3. DÉFINITION DES INTERPOLATEURS D3 (Carte)
// ==========================================
export const PALETTE_SCALES = {
    // Palettes d'origine
    "sequentialDescending": window.d3.interpolateRgb("#e3e3fd", "#000091"),
    "sequentialAscending": window.d3.interpolateRgb("#000091", "#e3e3fd"),
    "divergentDescending": window.d3.interpolateRgbBasis(["#298641", "#EFB900", "#E91719"]),
    "divergentAscending": window.d3.interpolateRgbBasis(["#E91719", "#EFB900", "#298641"]),
    "categorical": window.d3.interpolateRgbBasis(["#5C68E5", "#82B5F2", "#29598F", "#31A7AE", "#81EEF5", "#B478F1", "#CFB1F5", "#CECECE"]),

    // Verts
    "tilleulVerveineDescending": window.d3.interpolateRgb("#fef7da", "#B7A73F"),
    "tilleulVerveineAscending": window.d3.interpolateRgb("#B7A73F", "#fef7da"),
    "bourgeonDescending": window.d3.interpolateRgb("#e6feda", "#68A532"),
    "bourgeonAscending": window.d3.interpolateRgb("#68A532", "#e6feda"),
    "emeraudeDescending": window.d3.interpolateRgb("#e3fdeb", "#00A95F"),
    "emeraudeAscending": window.d3.interpolateRgb("#00A95F", "#e3fdeb"),
    "mentheDescending": window.d3.interpolateRgb("#dffdf7", "#009081"),
    "mentheAscending": window.d3.interpolateRgb("#009081", "#dffdf7"),
    "archipelDescending": window.d3.interpolateRgb("#e5fbfd", "#009099"),
    "archipelAscending": window.d3.interpolateRgb("#009099", "#e5fbfd"),

    // Bleus et Violets
    "ecumeDescending": window.d3.interpolateRgb("#f4f6fe", "#465F9D"),
    "ecumeAscending": window.d3.interpolateRgb("#465F9D", "#f4f6fe"),
    "cumulusDescending": window.d3.interpolateRgb("#f3f6fe", "#417DC4"),
    "cumulusAscending": window.d3.interpolateRgb("#417DC4", "#f3f6fe"),
    "glycineDescending": window.d3.interpolateRgb("#fef3fd", "#A558A0"),
    "glycineAscending": window.d3.interpolateRgb("#A558A0", "#fef3fd"),

    // Roses, Rouges et Oranges
    "macaronDescending": window.d3.interpolateRgb("#fef4f2", "#E18B76"),
    "macaronAscending": window.d3.interpolateRgb("#E18B76", "#fef4f2"),
    "tuileDescending": window.d3.interpolateRgb("#fef4f3", "#CE614A"),
    "tuileAscending": window.d3.interpolateRgb("#CE614A", "#fef4f3"),
    "terreBattueDescending": window.d3.interpolateRgb("#fef4f2", "#E4794A"),
    "terreBattueAscending": window.d3.interpolateRgb("#E4794A", "#fef4f2"),

    // Jaunes
    "tournesolDescending": window.d3.interpolateRgb("#fef6e3", "#C8AA39"),
    "tournesolAscending": window.d3.interpolateRgb("#C8AA39", "#fef6e3"),
    "moutardeDescending": window.d3.interpolateRgb("#fef5e8", "#C3992A"),
    "moutardeAscending": window.d3.interpolateRgb("#C3992A", "#fef5e8"),

    // Marrons et Beiges
    "cafeCremeDescending": window.d3.interpolateRgb("#fbf6ed", "#D1B781"),
    "cafeCremeAscending": window.d3.interpolateRgb("#D1B781", "#fbf6ed"),
    "caramelDescending": window.d3.interpolateRgb("#fbf5f2", "#C08C65"),
    "caramelAscending": window.d3.interpolateRgb("#C08C65", "#fbf5f2"),
    "operaDescending": window.d3.interpolateRgb("#fbf5f2", "#BD987A"),
    "operaAscending": window.d3.interpolateRgb("#BD987A", "#fbf5f2"),
    "grisGaletDescending": window.d3.interpolateRgb("#f9f8f6", "#AEA397"),
    "grisGaletAscending": window.d3.interpolateRgb("#AEA397", "#f9f8f6")
};

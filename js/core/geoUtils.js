// 1. La fonction pour lire les codes (que nous venons de corriger)
export function getCodeFromFeature(feature, granularity) {
  const p = feature.properties;
  if (granularity === "com")
    return (
      p.INSEE_COM || p.CODE_COM || p.com || p.codgeo || p.code_insee || p.id
    );
  if (granularity === "dep")
    return p.INSEE_DEP || p.CODE_DEP || p.dep || p.code || p.code_insee || p.id;
  return p.INSEE_REG || p.CODE_REG || p.reg || p.code || p.code_insee || p.id;
}

// 2. La fonction pour lire les cartes (celle qui a été effacée par erreur)
export function getGeoFeatures(fileData, preferredName) {
  if (!fileData) return { features: [] };
  if (fileData.type === "FeatureCollection") return fileData;
  if (fileData.type === "Topology") {
    let key = preferredName;
    if (!fileData.objects[key]) {
      const keys = Object.keys(fileData.objects);
      key = keys.find((k) => k.includes("com")) || keys[0];
    }
    return window.topojson.feature(fileData, fileData.objects[key]);
  }
  return { features: [] };
}

export function getFeaturesForPage(pageData, granularity, appState) {
  let primaryGeoJSON;
  if (granularity === "reg")
    primaryGeoJSON = getGeoFeatures(appState.geoData.reg, "a_reg2021");
  else if (granularity === "com")
    primaryGeoJSON = getGeoFeatures(appState.geoData.com, "a_com2022");
  else primaryGeoJSON = getGeoFeatures(appState.geoData.dep, "a_dep2021");

  if (!primaryGeoJSON || !primaryGeoJSON.features) return [];

  let features = primaryGeoJSON.features;
  if (pageData.focus) {
    // 1. Filtrage par Région
    if (pageData.focus.type === "region") {
      features = features.filter((f) => {
        // CORRECTION : Si la carte est régionale, on lit le code direct. Sinon on cherche le parent.
        const r =
          granularity === "reg"
            ? getCodeFromFeature(f, "reg")
            : f.properties.reg ||
              f.properties.INSEE_REG ||
              f.properties.code_insee_de_la_region;
        return r == pageData.focus.code;
      });
    }
    // 2. Filtrage par Délégation
    else if (pageData.focus.type === "delegation") {
      const depList = pageData.focus.list;
      features = features.filter((f) => {
        let depCode;
        // CORRECTION : Si carte départementale, code direct. Sinon (communes), on cherche le parent avec sécu DROM.
        if (granularity === "dep") {
          depCode = getCodeFromFeature(f, "dep");
        } else {
          const comCode = getCodeFromFeature(f, "com") || "";
          depCode =
            f.properties.dep ||
            f.properties.code_insee_du_departement ||
            (appState.refData.comToDep
              ? appState.refData.comToDep.get(comCode)
              : null) ||
            (comCode.startsWith("97")
              ? comCode.substring(0, 3)
              : comCode.substring(0, 2));
        }
        return depList.includes(depCode);
      });
    }
    // 3. Filtrage par Département
    else if (pageData.focus.type === "department") {
      features = features.filter((f) => {
        let depCode;
        if (granularity === "dep") {
          depCode = getCodeFromFeature(f, "dep");
        } else {
          const comCode = getCodeFromFeature(f, "com") || "";
          depCode =
            f.properties.dep ||
            f.properties.code_insee_du_departement ||
            (appState.refData.comToDep
              ? appState.refData.comToDep.get(comCode)
              : null) ||
            (comCode.startsWith("97")
              ? comCode.substring(0, 3)
              : comCode.substring(0, 2));
        }
        return depCode == pageData.focus.code;
      });
    }
    // 4. Filtrage par EPCI
    else if (pageData.focus.type === "epci") {
      const comList = pageData.focus.list || [];
      features = features.filter((f) => {
        const comCode = getCodeFromFeature(f, "com");
        return comList.includes(comCode);
      });
    }
  }
  return features;
}

export function getGranularityLabel(g) {
  if (g === "reg") return "Régions";
  if (g === "com") return "Communes";
  return "Départements";
}

// AJOUT : Fonction centralisée pour déduire le département depuis une commune
export function getDepFromCom(comCode, appState) {
  if (!comCode) return null;
  const strCode = String(comCode).trim();
  // Utilise le référentiel en priorité, sinon applique la règle métier INSEE
  return (
    appState.refData.comToDep?.get(strCode) ||
    (strCode.startsWith("97")
      ? strCode.substring(0, 3)
      : strCode.substring(0, 2))
  );
}

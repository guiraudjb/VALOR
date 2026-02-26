export function getCodeFromFeature(feature, granularity) {
    const p = feature.properties;
    if (granularity === 'com') return p.INSEE_COM || p.CODE_COM || p.com || p.codgeo || p.id;
    if (granularity === 'dep') return p.INSEE_DEP || p.CODE_DEP || p.dep || p.code || p.id;
    return p.INSEE_REG || p.CODE_REG || p.reg || p.code || p.id;
}

export function getGeoFeatures(fileData, preferredName) {
    if (!fileData) return { features: [] };
    if (fileData.type === 'FeatureCollection') return fileData;
    if (fileData.type === 'Topology') {
        let key = preferredName;
        if (!fileData.objects[key]) { 
            const keys = Object.keys(fileData.objects); 
            key = keys.find(k => k.includes('com')) || keys[0]; 
        }
        return window.topojson.feature(fileData, fileData.objects[key]);
    }
    return { features: [] };
}

export function getFeaturesForPage(pageData, granularity, appState) {
    let primaryGeoJSON;
    if (granularity === 'reg') primaryGeoJSON = getGeoFeatures(appState.geoData.reg, 'a_reg2021');
    else if (granularity === 'com') primaryGeoJSON = getGeoFeatures(appState.geoData.com, 'a_com2022');
    else primaryGeoJSON = getGeoFeatures(appState.geoData.dep, 'a_dep2021');
    
    if (!primaryGeoJSON || !primaryGeoJSON.features) return [];
    
    let features = primaryGeoJSON.features;
    if (pageData.focus) {
        if (pageData.focus.type === 'region') {
            features = features.filter(f => { const r = f.properties.reg || f.properties.INSEE_REG; return r == pageData.focus.code; });
        }
        else if (pageData.focus.type === 'delegation') {
            const depList = pageData.focus.list;
            features = features.filter(f => {
                const depCode = f.properties.dep || f.properties.INSEE_DEP || (getCodeFromFeature(f, 'com') || "").substring(0,2);
                return depList.includes(depCode);
            });
        } 
		else if (pageData.focus.type === 'department') {
            features = features.filter(f => {
                const comCode = getCodeFromFeature(f, 'com');
                // On utilise le référentiel fiable en priorité, et on garde le substring en ultime secours
                const depCode = f.properties.dep || (appState.refData.comToDep.get(comCode)) || (comCode || "").substring(0,2);
                return depCode == pageData.focus.code;
            });
        }
        else if (pageData.focus.type === 'epci') {
            const comList = pageData.focus.list || [];
            features = features.filter(f => {
                const comCode = getCodeFromFeature(f, 'com');
                return comList.includes(comCode);
            });
        }
    }
    return features;
}

export function getGranularityLabel(g) { 
    if(g==='reg') return "Régions"; 
    if(g==='com') return "Communes"; 
    return "Départements"; 
}

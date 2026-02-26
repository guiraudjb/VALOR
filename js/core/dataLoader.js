import { appState } from './state.js';
import { PATHS } from '../config/constants.js';
import { getGeoFeatures } from './geoUtils.js';
import { buildDefaultStructure } from '../features/reportGenerator.js';
import { populateEpciRegSelect, updateMetricControls, updateMainBrand } from '../ui/viewUpdater.js'; // <--- AJOUT DE updateMainBrand

export function initRefData() {
    if(!appState.geoData.dep) return;
    const deps = getGeoFeatures(appState.geoData.dep, 'a_dep2021').features;
    deps.forEach(f => {
        const code = f.properties.dep || f.properties.code;
        const reg = f.properties.reg;
        if(code && reg) appState.refData.depToReg.set(code, reg);
    });
}

export function processCommunesRef(csvText) {
    window.Papa.parse(csvText, { 
        header: true, delimiter: ",", skipEmptyLines: true, dynamicTyping: false, 
        complete: (res) => {
            if (res.data) res.data.forEach(row => { 
                // Stockage du nom de la commune
                if (row.COM && row.NCC) {
                    appState.refData.communes.set(row.COM.trim(), row.NCC.trim());
                }
                // NOUVEAU : Jonction exacte Commune -> Département
                if (row.COM && row.DEP) {
                    appState.refData.comToDep.set(row.COM.trim(), row.DEP.trim());
                }
            });
        }
    });
}

export function processEpciRef(csvText) {
    const lines = csvText.split(/\r?\n/);
    const startIndex = lines.findIndex(l => l.includes('CODGEO') || l.includes('"CODGEO"'));
    const validCsv = startIndex >= 0 ? lines.slice(startIndex).join('\n') : csvText;

    window.Papa.parse(validCsv, { 
        header: true, skipEmptyLines: true, dynamicTyping: false,
        complete: (res) => {
            if (res.data) appState.refData.epciList = res.data.filter(r => r.CODGEO && r.EPCI);
            populateEpciRegSelect();
        }
    });
}

export function processCSV(fileOrText) {
    window.Papa.parse(fileOrText, { 
        header: true, skipEmptyLines: true, 
        complete: (res) => {
            if (!res.data || res.meta.fields.length < 2) {
                alert("Format CSV invalide ou vide. 2 colonnes minimum requises."); return;
            }
            const codeField = res.meta.fields[0];
            const metricFields = res.meta.fields.slice(1); 
            
            if (res.data.length > 0) {
                const firstCode = res.data[0][codeField].toString().trim();
                appState.sourceGranularity = (firstCode.length >= 4) ? 'com' : 'dep';
                
                const granSel = document.getElementById('select-granularity');
                if (granSel) granSel.value = appState.sourceGranularity;
                
                appState.availableMetrics = metricFields;
                appState.calcMode = 'simple';
                appState.selectedMetrics = [metricFields[0]]; 
                
                appState.userData = res.data.map(row => {
                    const parsedRow = { code: row[codeField].toString().trim() };
                    metricFields.forEach(metric => {
                        let rawVal = row[metric] !== undefined ? row[metric].toString() : "0";
                        parsedRow[metric] = parseFloat(rawVal.replace(/\s/g, '').replace(',', '.')) || 0;
                    });
                    return parsedRow;
                });
                
                updateMetricControls();
                buildDefaultStructure();
            }
        }
    });
}

// Fonction pour décoder le format .ini
function parseINI(data) {
    const result = {};
    let currentSection = '';
    data.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) return;
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.substring(1, line.length - 1);
            result[currentSection] = {};
        } else {
            const idx = line.indexOf('=');
            if (idx > -1) {
                const key = line.substring(0, idx).trim();
                const val = line.substring(idx + 1).trim();
                if (currentSection) result[currentSection][key] = val;
                else result[key] = val;
            }
        }
    });
    return result;
}

// Fonction pour appliquer les valeurs du .ini à l'interface
function applyConfig(iniText) {
    if (!iniText) return;
    const conf = parseINI(iniText);
    
    if (conf.General) {
        if (conf.General.titre) document.getElementById('input-titre').value = conf.General.titre;
        if (conf.General.date) document.getElementById('input-date').value = conf.General.date;
        if (conf.General.source) document.getElementById('input-footer-left').value = conf.General.source;
        if (conf.General.credit) document.getElementById('input-footer-right').value = conf.General.credit;
    }
    if (conf.Marianne) {
        if (conf.Marianne.ligne1) document.getElementById('input-brand-1').value = conf.Marianne.ligne1;
        if (conf.Marianne.ligne2) document.getElementById('input-brand-2').value = conf.Marianne.ligne2;
        updateMainBrand(); // Actualise immédiatement l'affichage en haut à gauche
    }
    if (conf.Carte && conf.Carte.taille_etiquettes) {
        appState.defaultLabelSize = parseInt(conf.Carte.taille_etiquettes);
    }
    if (conf.Logo && conf.Logo.chemin) {
        appState.globalLogo = conf.Logo.chemin;
    }
    if (conf.Fichiers && conf.Fichiers.csv_defaut) {
        PATHS.csv = conf.Fichiers.csv_defaut;
    }
}



export async function loadInitialData() {
    try {
        // ÉTAPE 1 : On charge tout SAUF le fichier CSV métier
        const [reg, dep, com, communesCsvText, epciCsvText, iniText] = await Promise.all([
            window.d3.json(PATHS.reg), 
            window.d3.json(PATHS.dep), 
            window.d3.json(PATHS.com),
            window.d3.text(PATHS.communesRef).catch(() => null),
            window.d3.text(PATHS.epciRef).catch(() => null),
            window.d3.text(PATHS.config).catch(() => null)
        ]);
        
        appState.geoData = { reg, dep, com };
        initRefData();
        
        // Application de la configuration (qui va mettre à jour PATHS.csv si besoin)
        if (iniText) applyConfig(iniText); 
        
        if (communesCsvText) processCommunesRef(communesCsvText);
        if (epciCsvText) processEpciRef(epciCsvText);
        
        // ÉTAPE 2 : Maintenant qu'on a le bon chemin, on charge le CSV métier
        const userCsvText = await window.d3.text(PATHS.csv).catch(() => null);
        
        if (userCsvText) processCSV(userCsvText);
        else buildDefaultStructure(); // Si aucun CSV n'est trouvé, on génère quand même la structure
        
    } catch (error) { 
        console.error(error); 
    }
}

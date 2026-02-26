import { appState } from '../core/state.js';
import { DEP_NAMES, REG_NAMES, REGIONS_LIST } from '../config/constants.js';
import { generateReport } from './reportGenerator.js';
import { updatePagesListUI } from '../ui/viewUpdater.js';
import { PALETTE_LABELS } from '../config/palettes.js';

// --------------------------------------------------------
// 1. OUVERTURE DE LA MODALE ET INITIALISATION
// --------------------------------------------------------
export function openChartModal() {
	populateChartPalettes(); 
	document.getElementById('chart-select-palette').value = 'categorical';
    if (appState.availableMetrics.length === 0) {
        alert("Veuillez d'abord charger un fichier CSV pour pouvoir créer un graphique.");
        return;
    }
    
    // Réinitialisation du formulaire
    document.getElementById('chart-slide-id').value = '';
    document.getElementById('chart-slide-title').value = '';
    document.getElementById('chart-select-scale').value = 'france';
    document.getElementById('chart-select-type').value = 'bar';
    document.getElementById('chart-opt-horizontal').checked = false;
    document.getElementById('chart-opt-mean').checked = false;
	document.getElementById('chart-opt-trend').checked = false;
	document.getElementById('chart-opt-moving').checked = false;
	document.getElementById('chart-opt-outliers').checked = false;
    
    populateChartMetrics();
    handleScaleChange();
    
    const modal = document.getElementById('modal-chart-slide');
    modal.classList.add('fr-modal--opened');
    modal.showModal();
}

// --------------------------------------------------------
// 2. GESTION DES CHANGEMENTS DE PÉRIMÈTRES (CASCADES)
// --------------------------------------------------------
// --------------------------------------------------------
// 2. GESTION DES CHANGEMENTS DE PÉRIMÈTRES (CASCADES)
// --------------------------------------------------------
export function handleScaleChange() {
    const scale = document.getElementById('chart-select-scale').value;
    const wrapperEntity = document.getElementById('wrapper-chart-entity');
    const labelEntity = document.getElementById('label-chart-entity');
    const selectEntity = document.getElementById('chart-select-entity');
    const epciFilters = document.getElementById('chart-epci-filters');
    const wrapperCom = document.getElementById('wrapper-chart-com'); // NOUVEAU
    
    wrapperEntity.style.display = 'none';
    epciFilters.style.display = 'none';
    if (wrapperCom) wrapperCom.style.display = 'none';
    selectEntity.innerHTML = '';
    
    if (scale === 'reg_by_dep' || scale === 'reg_multi') {
        labelEntity.textContent = 'Région cible';
        wrapperEntity.style.display = 'block';
        REGIONS_LIST.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.code; opt.textContent = r.label;
            selectEntity.appendChild(opt);
        });
    } else if (scale === 'del_by_dep' || scale === 'del_multi'){
        labelEntity.textContent = 'Délégation cible';
        wrapperEntity.style.display = 'block';
        appState.customDelegations.forEach((del, index) => {
            const opt = document.createElement('option');
            opt.value = index; opt.textContent = del.label;
            selectEntity.appendChild(opt);
        });
    } else if (scale === 'dep_by_com' || scale === 'dep_multi') {
        labelEntity.textContent = 'Département cible';
        wrapperEntity.style.display = 'block';
        Object.keys(DEP_NAMES).sort().forEach(k => {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = `${k} - ${DEP_NAMES[k]}`;
            selectEntity.appendChild(opt);
        });
    } else if (scale === 'epci_by_com' || scale === 'epci_multi') {
        epciFilters.style.display = 'block';
        labelEntity.textContent = 'Sélectionnez un EPCI';
        wrapperEntity.style.display = 'block';
        populateChartEpciReg();
    } else if (scale === 'com_multi') {
        if (wrapperCom) wrapperCom.style.display = 'block';
        populateCommuneDatalist();
    }
}

// Nouvelle fonction pour charger intelligemment les communes dans la datalist
let communeDatalistPopulated = false;
export function populateCommuneDatalist() {
    if (communeDatalistPopulated) return;
    const datalist = document.getElementById('chart-datalist-com');
    if (!datalist) return;
    
    // On ne charge dans la liste que les communes qui sont présentes dans le jeu de données importé par l'utilisateur (CSV)
    const codesInUserData = new Set(appState.userData.map(d => d.code));
    const fragment = document.createDocumentFragment();
    
    appState.refData.communes.forEach((nom, code) => {
        if (codesInUserData.has(code)) {
            const opt = document.createElement('option');
            opt.value = code; // Le code INSEE
            opt.textContent = `${code} - ${nom}`;
            fragment.appendChild(opt);
        }
    });
    
    datalist.appendChild(fragment);
    communeDatalistPopulated = true;
}

function populateChartPalettes() {
    const select = document.getElementById('chart-select-palette');
    if (select && select.options.length === 0) {
        for (const [key, label] of Object.entries(PALETTE_LABELS)) {
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = label;
            select.appendChild(opt);
        }
    }
}


export function populateChartEpciReg() {
    const sel = document.getElementById('chart-select-epci-reg');
    sel.innerHTML = '<option value="">-- Filtrer par région --</option>';
    const regs = [...new Set(appState.refData.epciList.map(r => r.REG))].filter(Boolean);
    regs.sort().forEach(r => { 
        const opt = document.createElement('option'); 
        opt.value = r; opt.innerText = REG_NAMES[r] ? `${r} - ${REG_NAMES[r]}` : r; 
        sel.appendChild(opt); 
    });
    document.getElementById('chart-select-epci-dep').innerHTML = '<option value="">-- Filtrer par département --</option>';
    document.getElementById('chart-select-entity').innerHTML = '<option value="">-- Choisir un EPCI --</option>';
}

export function populateChartEpciDep() {
    const reg = document.getElementById('chart-select-epci-reg').value; 
    const sel = document.getElementById('chart-select-epci-dep');
    sel.innerHTML = '<option value="">-- Filtrer par département --</option>'; 
    document.getElementById('chart-select-entity').innerHTML = '<option value="">-- Choisir un EPCI --</option>';
    if (!reg) return;
    const deps = [...new Set(appState.refData.epciList.filter(r => r.REG === reg).map(r => r.DEP))].filter(Boolean);
    deps.sort().forEach(d => { 
        const opt = document.createElement('option'); 
        opt.value = d; opt.innerText = DEP_NAMES[d] ? `${d} - ${DEP_NAMES[d]}` : d; 
        sel.appendChild(opt); 
    });
}

export function populateChartEpciId() {
    const dep = document.getElementById('chart-select-epci-dep').value; 
    const sel = document.getElementById('chart-select-entity');
    sel.innerHTML = '<option value="">-- Choisir un EPCI --</option>'; 
    if (!dep) return;
    const epcis = new Map();
    appState.refData.epciList.filter(r => r.DEP === dep).forEach(r => { 
        if (r.EPCI && r.LIBEPCI) epcis.set(r.EPCI, r.LIBEPCI); 
    });
    Array.from(epcis.keys()).sort().forEach(id => { 
        const opt = document.createElement('option'); 
        opt.value = id; opt.innerText = epcis.get(id); 
        sel.appendChild(opt); 
    });
}

// --------------------------------------------------------
// 3. GESTION DES MÉTRIQUES (VALEURS)
// --------------------------------------------------------
function populateChartMetrics() {
    const container = document.getElementById('chart-metric-checkboxes');
    container.innerHTML = '';
    
    // On ajoute "_computed" pour permettre de grapher le Résultat dynamique (ex: un Taux d'évolution)
    const allOptions = ['_computed', ...appState.availableMetrics];
    
    allOptions.forEach((metric, index) => {
        const div = document.createElement('div'); 
        div.className = `fr-checkbox-group fr-checkbox-group--sm`;
        
        const input = document.createElement('input'); 
        input.type = 'checkbox'; 
        input.id = `chart-metric-${index}`; 
        input.value = metric; 
        input.name = 'chart-metric-selection';
        
        // Par défaut, on coche le résultat calculé
        if (metric === '_computed') input.checked = true;

        input.addEventListener('change', checkPieWarning);

        const label = document.createElement('label'); 
        label.className = 'fr-label'; 
        label.htmlFor = `chart-metric-${index}`; 
        
        if (metric === '_computed') {
            label.innerText = `📊 Résultat du calcul en cours (${appState.calcMode})`;
            label.style.color = '#000091';
            label.style.fontWeight = 'bold';
        } else {
            label.innerText = metric;
        }
        
        div.appendChild(input); 
        div.appendChild(label);
        container.appendChild(div);
    });
    checkPieWarning();
}

export function checkPieWarning() {
    const type = document.getElementById('chart-select-type').value;
    const warning = document.getElementById('chart-pie-warning');
    const checkedCount = document.querySelectorAll('input[name="chart-metric-selection"]:checked').length;
    
    if (type === 'pie' && checkedCount > 1) warning.style.display = 'block';
    else warning.style.display = 'none';
}

// --------------------------------------------------------
// 4. SAUVEGARDE ET GÉNÉRATION
// --------------------------------------------------------
export function saveChartSlide() {
    const idStr = document.getElementById('chart-slide-id').value;
    let title = document.getElementById('chart-slide-title').value.trim();
    const scale = document.getElementById('chart-select-scale').value;
    const type = document.getElementById('chart-select-type').value;
    
    let entity = document.getElementById('chart-select-entity').value;
    if (scale === 'com_multi') {
        // L'utilisateur peut taper "75056" ou "75056 - Paris", on ne garde que le code
        entity = document.getElementById('chart-input-com').value.split(' ')[0].trim();
    }
    
    // NOUVEAU : On récupère l'état de toutes les cases
    const isHorizontal = document.getElementById('chart-opt-horizontal').checked;
    const showMean = document.getElementById('chart-opt-mean').checked;
    const showTrend = document.getElementById('chart-opt-trend').checked;
    const showMoving = document.getElementById('chart-opt-moving').checked;
    const showOutliers = document.getElementById('chart-opt-outliers').checked;

    let finalId;
    const palette = document.getElementById('chart-select-palette').value;
    const selectedMetrics = Array.from(document.querySelectorAll('input[name="chart-metric-selection"]:checked')).map(cb => cb.value);
    
    if (selectedMetrics.length === 0) { alert("Veuillez sélectionner au moins une valeur."); return; }
    if (scale !== 'france' && !entity) { alert("Veuillez sélectionner une entité cible."); return; }

    // --- GÉNÉRATION AUTOMATIQUE DU TITRE ---
    if (!title) {
        // On détermine le libellé de la métrique
        const metricLabel = selectedMetrics.length === 1 ?
            (selectedMetrics[0] === '_computed' ? 'Résultat' : selectedMetrics[0]) : 
            (scale.endsWith('_multi') ? 'Analyse multicritères' : 'Comparaison multiple');

        // On construit le titre selon l'échelle
        if (scale === 'france' || scale === 'france_multi') {
            title = `France entière - ${metricLabel}`;
        } else if (scale === 'com_multi') {
            // Récupération du nom de la commune via le dictionnaire de référence
            const comName = appState.refData.communes.get(entity) || entity;
            title = `${comName} - ${metricLabel}`;
        } else if (scale.startsWith('epci')) {
            const epciName = document.querySelector('#chart-select-entity option:checked')?.textContent || entity;
            title = `EPCI ${epciName} - ${metricLabel}`;
        } else {
            // Pour Région, Département et Délégation (modes normaux et multi)
            const entityName = document.querySelector('#chart-select-entity option:checked')?.textContent || entity;
            title = `${entityName} - ${metricLabel}`;
        }
    }
    
    let focus = null;
    let gran = 'dep';

    // -- Modes classiques (Comparaison) --
    if (scale === 'reg_by_dep') { focus = { type: 'region', code: entity }; }
    else if (scale === 'del_by_dep') { 
        const delegation = appState.customDelegations[parseInt(entity)];
        if (delegation) focus = { type: 'delegation', list: delegation.depCodes };
    }
    else if (scale === 'dep_by_com') { focus = { type: 'department', code: entity }; gran = 'com'; }
    else if (scale === 'epci_by_com') { 
        const communes = appState.refData.epciList.filter(r => r.EPCI === entity).map(r => r.CODGEO); 
        focus = { type: 'epci', code: entity, list: communes }; gran = 'com'; 
    }
    
    // -- NOUVEAUX MODES MULTIVALEURS --
    else if (scale === 'france_multi') { gran = 'dep'; focus = null; } // On agrège tous les départements
    else if (scale === 'reg_multi') { gran = 'reg'; focus = { type: 'region', code: entity }; }
    else if (scale === 'dep_multi') { gran = 'dep'; focus = { type: 'department', code: entity }; }
    else if (scale === 'epci_multi') { 
        const communes = appState.refData.epciList.filter(r => r.EPCI === entity).map(r => r.CODGEO); 
        focus = { type: 'epci', code: entity, list: communes }; gran = 'com'; 
    }
    else if (scale === 'del_multi') {  // <--- CORRECTION AJOUTÉE ICI !
        gran = 'dep';
        const delegation = appState.customDelegations[parseInt(entity)];
        if (delegation) focus = { type: 'delegation', list: delegation.depCodes };
    }
    else if (scale === 'com_multi') { 
        gran = 'com'; 
        // Astuce : on utilise le filtre EPCI (qui cherche dans une liste) pour cibler 1 seule commune
        focus = { type: 'epci', code: entity, list: [entity] }; 
    }
    
    // NOUVEAU : On sauvegarde les options dans la config
    const chartConfig = { 
        scale, entity, type, metrics: selectedMetrics, horizontal: isHorizontal, palette,
        showMeanLine: showMean, showTrendline: showTrend, showMovingAvg: showMoving, highlightOutliers: showOutliers
    };

    if (idStr) {
        finalId = parseInt(idStr);
        const pageIndex = appState.pages.findIndex(p => p.id === finalId);
        if (pageIndex !== -1) {
            appState.pages[pageIndex].title = title;
            appState.pages[pageIndex].focus = focus;
            appState.pages[pageIndex].granularity = gran;
            appState.pages[pageIndex].chartConfig = chartConfig;
        }
    } else {
        finalId = Date.now();
        appState.pages.push({ id: finalId, type: 'chart', title, focus, granularity: gran, chartConfig, visible: true, showTable: true, richTable: false });
    }

    const modal = document.getElementById('modal-chart-slide');
    modal.classList.remove('fr-modal--opened'); modal.close();
    updatePagesListUI(); generateReport();
    setTimeout(() => { if (window.scrollToPage) { window.scrollToPage(finalId); } }, 150);
}
// Attaché à Window pour les boutons "Éditer" de la liste (générés en HTML)
window.editChartSlide = (id) => {
    const page = appState.pages.find(p => p.id === id);
    if (!page || page.type !== 'chart') return;
    
    document.getElementById('chart-slide-id').value = id;
    document.getElementById('chart-slide-title').value = page.title;
    document.getElementById('chart-select-scale').value = page.chartConfig.scale;
    document.getElementById('chart-select-type').value = page.chartConfig.type;
    document.getElementById('chart-opt-horizontal').checked = page.chartConfig.horizontal;
    document.getElementById('chart-select-palette').value = page.chartConfig.palette || 'categorical';
    document.getElementById('chart-opt-mean').checked = page.chartConfig.showMeanLine || false;
	document.getElementById('chart-opt-trend').checked = page.chartConfig.showTrendline || false;
	document.getElementById('chart-opt-moving').checked = page.chartConfig.showMovingAvg || false;
	document.getElementById('chart-opt-outliers').checked = page.chartConfig.highlightOutliers || false;
    
    handleScaleChange();
    
    // Léger délai pour laisser le DOM construire les listes dynamiques (régions, EPCI...)
    setTimeout(() => {
        document.getElementById('chart-select-entity').value = page.chartConfig.entity;
        populateChartMetrics();
        
        document.querySelectorAll('input[name="chart-metric-selection"]').forEach(cb => {
            cb.checked = page.chartConfig.metrics.includes(cb.value);
        });
        
        checkPieWarning();
        const modal = document.getElementById('modal-chart-slide');
        modal.classList.add('fr-modal--opened');
        modal.showModal();
    }, 50);
};

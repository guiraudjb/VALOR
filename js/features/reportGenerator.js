import { appState } from '../core/state.js';
import { escapeHtml, formatValue } from '../core/utils.js';
import { getCodeFromFeature, getFeaturesForPage, getGranularityLabel,getDepFromCom } from '../core/geoUtils.js';
import { updatePagesListUI } from '../ui/viewUpdater.js';
import { setupScrollTracking } from '../ui/domEvents.js';
import { drawD3Map } from '../render/mapRenderer.js';
import { REGIONS_LIST, DEP_NAMES, REG_NAMES } from '../config/constants.js';
import { PALETTE_SCALES } from '../config/palettes.js';

export function getBrandHtml(config) {
    const b1 = config.brand1 || '';
    const b2 = config.brand2 || '';
    if (!b1 && !b2) return '';
    const br = (b1 && b2) ? '<br>' : '';
    return `
        <div class="fr-header__brand" style="margin: 0; border: none !important; background: transparent !important; box-shadow: none !important;">
            <div class="fr-header__brand-top" style="border: none !important; background: transparent !important;">
                <div class="fr-header__logo" style="margin: 0; border: none !important;">
                    <p class="fr-logo" style="margin: 0; text-align: left; border: none !important; font-size: 1.05rem; background: transparent !important; line-height: 1.1;">
                        ${b1}${br}${b2}
                    </p>
                </div>
            </div>
        </div>`;
}

export function getStableHeaderHtml(config, brandHtml, customSubtitle = null, customMainTitle = null) {
    const rightLogoHtml = config.globalLogo
        ? `<img src="${config.globalLogo}" style="height: 80px; max-height: 80px; object-fit: contain; margin-left: 15px;" alt="Logo partenaire">`
        : '';
    
    // On utilise le titre personnalisé de la page s'il existe, sinon le titre global
    const displayTitle = customMainTitle || config.titre;

    return `
    <div class="page-header" style="margin-bottom: 8px; width: 100%; border: none; background: transparent;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; border: none;">
            <div style="display: flex; align-items: flex-end; gap: 1.5rem; flex: 1; min-width: 0; border: none;">
                <div style="flex-shrink: 0; border: none; background: transparent;">${brandHtml}</div>
                <div style="display: flex; align-items: center; gap: 8px; margin: 0; padding-bottom: 2px;">
                    <h1 class="page-title" style="margin: 0; white-space: nowrap; font-size: 2.2rem; color: #161616; overflow: hidden; text-overflow: ellipsis; text-align: left; border: none;">
                        <span class="editable-report-title" contenteditable="true" title="Cliquez pour modifier ce titre (uniquement pour cette diapo)" style="padding: 2px 8px; border-radius: 4px; transition: background-color 0.2s; outline: none; border-bottom: 1px dashed transparent;">${displayTitle}</span>
                    </h1>
                    <span class="fr-icon-edit-line edit-report-icon-trigger" aria-hidden="true" style="color: #161616; cursor: pointer; font-size: 1.5rem;" title="Modifier le titre"></span>
                </div>
            </div>
            <div style="display: flex; flex-direction: row; align-items: flex-end; justify-content: flex-end; margin-left: 2rem; flex-shrink: 0; border: none;">
                <div class="page-subtitle" style="text-align: right; white-space: nowrap; font-size: 1.1rem; color: #666; border: none; line-height: 1; padding-bottom: 8px;">
                    ${customSubtitle || config.date}
                </div>
                ${rightLogoHtml}
            </div>
        </div>
        <div class="header-line" style="height: 4px; background: #000091; width: 100%; margin-top: 4px; border: none;"></div>
    </div>`;
}

export function getCurrentConfig() {
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };
    const getCheck = (id, def) => { const el = document.getElementById(id); return el ? el.checked : def; };
    const reportMode = getVal('select-report-mode', 'mode-nat-reg');
    const selectedGranularity = getVal('select-granularity', 'dep');
    const finalGranularity = (reportMode === 'mode-dep-com' || reportMode === 'mode-epci') ? 'com' : selectedGranularity;

    return {
        titre: escapeHtml(getVal('input-titre', '')),
        date: escapeHtml(getVal('input-date', '')),
        brand1: escapeHtml(getVal('input-brand-1', '')),
        brand2: escapeHtml(getVal('input-brand-2', '')),
        palette: getVal('select-palette', 'sequentialDescending'),
        granularity: finalGranularity,
        footerLeft: escapeHtml(getVal('input-footer-left', '')),
        footerRight: escapeHtml(getVal('input-footer-right', '')),
        showSubtotal: getCheck('check-show-subtotal', true),
        calcMode: appState.calcMode,
        selectedMetrics: [...appState.selectedMetrics],
        shareBase: appState.shareBase,
        globalLogo: appState.globalLogo
    };
}

export function getAggregatedDataMap(targetGranularity, page, config) {
    const dataMap = new Map();
    const checkAgreg = document.getElementById('check-auto-agreg');
    const shouldAggregate = checkAgreg ? checkAgreg.checked : true;

    const initOrGetObj = (code) => {
        if (!dataMap.has(code)) {
            let obj = {};
            appState.availableMetrics.forEach(m => obj[m] = 0);
            dataMap.set(code, obj);
        }
        return dataMap.get(code);
    };
    appState.userData.forEach(d => {
        let targetCode = d.code;
			if (shouldAggregate && appState.sourceGranularity !== targetGranularity) {
				if (appState.sourceGranularity === 'com' && targetGranularity === 'dep') {
					targetCode = appState.refData.comToDep?.get(d.code) || (d.code.startsWith('97') ? d.code.substring(0, 3) : d.code.substring(0, 2));
				}
				else if (appState.sourceGranularity === 'dep' && targetGranularity === 'reg') {
					targetCode = appState.refData.depToReg.get(d.code);
				}
				else if (appState.sourceGranularity === 'com' && targetGranularity === 'reg') {
					// NOUVEAU : Prise en compte sécurisée des DROM pour remonter l'arbre Commune -> Département -> Région
					//const depCode = appState.refData.comToDep?.get(d.code) || (d.code.startsWith('97') ? d.code.substring(0, 3) : d.code.substring(0, 2));
					const depCode = getDepFromCom(d.code, appState);
					targetCode = appState.refData.depToReg.get(depCode);
				}
			}
        if (targetCode) {
            const currentObj = initOrGetObj(targetCode);
            // CORRECTION: On agrège toujours toutes les métriques disponibles pour garantir le fonctionnement des graphiques
            appState.availableMetrics.forEach(m => currentObj[m] += (d[m] || 0));
        }
    });

    let refSum = 0;
    let validCount = 0;
    const m1 = config.selectedMetrics[0];
    const m2 = config.selectedMetrics.length > 1 ? config.selectedMetrics[1] : null;
    let codesInView = null;
    
    if (config.shareBase === 'view' && page && page.type !== 'free') {
        const features = getFeaturesForPage(page, targetGranularity, appState);
        codesInView = new Set(features.map(f => String(getCodeFromFeature(f, targetGranularity)).trim()));
    }
    
    if (m1) {
        dataMap.forEach((obj, code) => {
            if (obj[m1] !== undefined) {
                if (!codesInView || codesInView.has(String(code).trim())) {
                    refSum += obj[m1]; validCount++;
                }
            }
        });
    }
    
    const refAvg = validCount > 0 ? refSum / validCount : 0;
    dataMap.forEach((obj, code) => {
        let val = undefined;
        if (config.selectedMetrics.length > 0) {
            const mode = config.calcMode;
            if (['simple', 'top10', 'flop10'].includes(mode)) val = obj[m1];
            else if (mode === 'sum') val = config.selectedMetrics.reduce((s, m) => s + (obj[m] || 0), 0);
            else if (mode === 'avg') val = config.selectedMetrics.reduce((s, m) => s + (obj[m] || 0), 0) / config.selectedMetrics.length;
            else if (mode === 'dev_abs') val = (obj[m1] || 0) - refAvg;
            else if (mode === 'dev_pct') val = refAvg ? (((obj[m1] || 0) - refAvg) / Math.abs(refAvg)) * 100 : 0;
            else if (mode === 'share') val = refSum ? ((obj[m1] || 0) / refSum) * 100 : 0;
            else if (mode === 'ratio') val = (m1 && m2 && obj[m2]) ? (obj[m1] / obj[m2]) : 0;
            else if (mode === 'growth') val = (m1 && m2 && obj[m1]) ? ((obj[m2] - obj[m1]) / obj[m1]) * 100 : 0;
        }
        obj._computed = val;
        obj._inSelection = true;
        
        if (appState.dataFilter && appState.dataFilter.active && appState.dataFilter.operator !== 'none') {
            const fop = appState.dataFilter.operator;
            const fv1 = appState.dataFilter.value1;
            const fv2 = appState.dataFilter.value2;
            const filterMetric = appState.dataFilter.metric || '_computed';
            const valToTest = (filterMetric === '_computed') ? val : obj[filterMetric];

            let keep = true;

            if (valToTest === undefined || isNaN(valToTest)) {
                keep = false;
            } else if (fop === 'gt') {
                keep = valToTest > fv1;
            } else if (fop === 'lt') {
                keep = valToTest < fv1;
            } else if (fop === 'eq') {
                keep = valToTest === fv1;
            } else if (fop === 'between') {
                keep = valToTest >= Math.min(fv1, fv2) && valToTest <= Math.max(fv1, fv2);
            }

            if (!keep) obj._inSelection = false;
        }
    });

    if (['top10', 'flop10'].includes(config.calcMode)) {
        let entries = Array.from(dataMap.entries()).filter(e => e[1]._computed !== undefined);
        if (config.shareBase === 'view' && codesInView) {
            entries = entries.filter(e => codesInView.has(String(e[0]).trim()));
        }

        entries.sort((a, b) => b[1]._computed - a[1]._computed);
        dataMap.forEach(obj => obj._inSelection = false);
        if (config.calcMode === 'top10') {
            entries.slice(0, 10).forEach(e => e[1]._inSelection = true);
        } else {
            entries.slice(-10).forEach(e => e[1]._inSelection = true);
        }
    }
    return dataMap;
}

export function buildDefaultStructure() {
    const savedFreePages = appState.pages.filter(p => p.type === 'free');
    // --- ETAPE 1 : SAUVEGARDER LES PAGES VERROUILLÉES ---
    // On garde de côté toutes les pages qui ont un snapshot (cadenas fermé)
    const lockedPages = appState.pages.filter(p => p.snapshotData);
    
    let newAutoPages = [];
    let idCounter = 1;
    const selectMode = document.getElementById('select-report-mode');
    const reportMode = selectMode ? selectMode.value : 'mode-nat-reg';
    const defLabelSize = appState.defaultLabelSize || ((reportMode === 'mode-dep-com' || reportMode === 'mode-epci') ? 10 : 12);
    const createMapPage = (title, focus, gran) => ({
        id: idCounter++, type: 'map', title: title, focus: focus, granularity: gran,
        visible: true, showMap: true, showLabels: (focus !== null), labelSize: defLabelSize, showTable: true,
        richLabels: false, richTable: false
    });
    if (reportMode === 'mode-nat-reg') {
        newAutoPages.push(createMapPage("France Entière", null, 'dep'));
        REGIONS_LIST.forEach(reg => newAutoPages.push(createMapPage(reg.label, { type: 'region', code: reg.code }, 'dep')));
    } else if (reportMode === 'mode-nat-del') {
        newAutoPages.push(createMapPage("France Entière", null, 'dep'));
        appState.customDelegations.forEach(del => newAutoPages.push(createMapPage(del.label, { type: 'delegation', list: del.depCodes }, 'dep')));
    } else if (reportMode === 'mode-dep-com') {
        const selectDept = document.getElementById('select-dept-target');
        const selectedDept = selectDept ? selectDept.value : "01";
        const deptName = DEP_NAMES[selectedDept] || selectedDept;
        newAutoPages.push(createMapPage(`Département : ${deptName}`, { type: 'department', code: selectedDept }, 'com'));
    } else if (reportMode === 'mode-epci') {
        const selectEpci = document.getElementById('select-epci-id');
        const selectedEpci = selectEpci ? selectEpci.value : "";
        if (selectedEpci) {
            const epciName = selectEpci.options[selectEpci.selectedIndex].text;
            const communes = appState.refData.epciList.filter(r => r.EPCI === selectedEpci).map(r => r.CODGEO);
            newAutoPages.push(createMapPage(`EPCI : ${epciName}`, { type: 'epci', code: selectedEpci, list: communes }, 'com'));
        }
    }
    appState.pages = [...newAutoPages,...lockedPages, ...savedFreePages.map(p => ({ ...p, visible: p.visible !== undefined ? p.visible : true }))];
    // --- ETAPE 2 : RÉINJECTER LES PAGES VERROUILLÉES ---
    // On ajoute les anciennes pages verrouillées au début (ou à la fin) de la nouvelle liste
 
    
    updatePagesListUI(); generateReport();
}

export function renderPageItem(page, config, dataMap, container) {
    const brandHtml = getBrandHtml(config);
    
    // 1. Rendu des diapositives libres
    if (page.type === 'free') {
        const pageEl = document.createElement('div');
        pageEl.className = 'page';
        pageEl.setAttribute('data-page-id', page.id);

const header = `<div style="position: absolute; top: 10mm; left: 15mm; right: 15mm; z-index: 10;">${getStableHeaderHtml(config, brandHtml, null, page.mainTitle)}</div>`;
        const footer = `<div class="page-footer" style="position: relative; z-index: 10;"><span>${config.footerLeft}</span><span>${config.footerRight}</span></div>`;

        pageEl.innerHTML = window.DOMPurify.sanitize(
            `${header}<div class="free-slide-content" style="padding-top: 130px; flex: 1; margin-bottom: 10px;">${page.content}</div>${footer}`,
            { 
                ADD_TAGS: ['img'], 
                // CORRECTION : On autorise contenteditable et les data-attributes pour l'édition des titres
                ADD_ATTR: ['style', 'contenteditable', 'data-page-id', 'data-target-id', 'title'] 
            }
        );
        container.appendChild(pageEl);
        return;
    }


    const granularity = page.granularity || config.granularity;
    if (page.type !== 'chart' && page.showMap !== false) {
    // 2. Rendu des cartes géographiques
    if (page.showMap !== false) {
        const mapPageEl = document.createElement('div');
        mapPageEl.className = 'page';
        mapPageEl.setAttribute('data-page-id', page.id);

        const uid = `map-${page.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        mapPageEl.innerHTML = `
            ${getStableHeaderHtml(config, brandHtml, null, page.mainTitle)}
            <div class="report-layout">
                <div class="sidebar-legend">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <div class="view-name" style="margin: 0; padding: 0;">
                            <span class="editable-slide-title" data-page-id="${page.id}" contenteditable="true" title="Cliquez pour modifier le titre" style="padding: 2px 8px; border-radius: 4px; transition: background-color 0.2s; outline: none; border-bottom: 1px dashed transparent;">${escapeHtml(page.title)}</span>
                        </div>
                        <span class="fr-icon-edit-line edit-icon-trigger" data-target-id="${page.id}" aria-hidden="true" style="color: #000091; cursor: pointer; font-size: 1.2rem;" title="Modifier le titre"></span>
                    </div>
                    <div id="legend-${uid}" class="gradient-wrapper" style="margin-top:20px; height:20px; width:100%; border:1px solid #ccc;"></div>
      
                    <div id="subtotal-${uid}" class="kpi-subtotal" style="display:none"><div class="kpi-label">TOTAL VUE</div><div class="kpi-value">-</div></div>
                    <p style="font-size:0.8rem; margin-top:10px; color:#666;">Niveau : ${getGranularityLabel(granularity)}</p>
                </div>
                <div class="main-content"><div class="map-container" id="${uid}"></div></div>
            </div>
        
            <div class="page-footer"><span>${config.footerLeft}</span><span>${config.footerRight}</span></div>`;

        container.appendChild(mapPageEl);

        setTimeout(() => { drawD3Map(page, config, dataMap, uid, `legend-${uid}`, `subtotal-${uid}`, granularity); }, 10);
    }
}

if (page.type === 'chart') {
        const chartPageEl = document.createElement('div');
        chartPageEl.className = 'page';
        chartPageEl.setAttribute('data-page-id', page.id);
        
        //new
const isMultiScale = page.chartConfig.scale.endsWith('_multi');
        let safeX, safeY, safeNames, numColors;

        if (!isMultiScale) {
            // --- LOGIQUE EXISTANTE (Comparaison de territoires : 1 à N métriques) ---
            const xLabels = [];
            const ySeries = page.chartConfig.metrics.map(() => []);
            
            const features = getFeaturesForPage(page, granularity, appState);
            const filtered = features.filter(f => {
                const c = getCodeFromFeature(f, granularity);
                const d = dataMap.get(c); return d && d._inSelection;
            }).sort((a, b) => {
                const ca = getCodeFromFeature(a, granularity) || "";
                const cb = getCodeFromFeature(b, granularity) || "";
                return ca.toString().localeCompare(cb.toString());
            });

				filtered.forEach(f => {
                const code = getCodeFromFeature(f, granularity);
                const d = dataMap.get(code);
                let name = code;
                
                // NOUVEAU : Intégration de nom_officiel pour le référentiel 2025/2026
                if (granularity === 'com') name = appState.refData.communes.get(code) || f.properties.nom_officiel || f.properties.nom || code;
                else if (granularity === 'dep') name = DEP_NAMES[code] || f.properties.nom_officiel || code;
                else name = REG_NAMES[code] || f.properties.nom_officiel || code;
                
                xLabels.push(`${code} - ${name}`);
                
                page.chartConfig.metrics.forEach((m, idx) => {
                    const val = m === '_computed' ? d._computed : d[m];
                    ySeries[idx].push(val || 0);
                });
            });

            safeX = escapeHtml(JSON.stringify(xLabels));
            safeY = escapeHtml(JSON.stringify(ySeries));
            safeNames = escapeHtml(JSON.stringify(page.chartConfig.metrics.map(m => m === '_computed' ? 'Résultat' : m)));
            numColors = page.chartConfig.type === 'pie' ? xLabels.length : page.chartConfig.metrics.length;

        } else {
            // --- NOUVELLE LOGIQUE (Analyse d'un territoire unique : Multivaleurs) ---
            const features = getFeaturesForPage(page, granularity, appState);
            const filtered = features.filter(f => {
                const c = getCodeFromFeature(f, granularity);
                const d = dataMap.get(c); return d && d._inSelection;
            });

            // 1. Agréger les données pour l'entité (Somme ou Moyenne selon les cas)
            let aggregatedValues = Array(page.chartConfig.metrics.length).fill(0);
            if (filtered.length > 0) {
                const count = filtered.length;
                page.chartConfig.metrics.forEach((m, idx) => {
                    let sum = 0;
                    filtered.forEach(f => {
                        const c = getCodeFromFeature(f, granularity);
                        const d = dataMap.get(c);
                        const val = m === '_computed' ? d._computed : d[m];
                        sum += (val || 0);
                    });
                    // Si on agrège un EPCI ou la France avec un ratio/moyenne, on lisse les données
                    if (count > 1 && ['avg', 'ratio', 'share', 'growth'].includes(config.calcMode)) {
                        aggregatedValues[idx] = sum / count;
                    } else {
                        aggregatedValues[idx] = sum;
                    }
                });
            }

            // 2. Récupérer le nom de l'entité ciblée
            let entityName = "France entière";
            if (page.chartConfig.scale === 'reg_multi') entityName = REG_NAMES[page.chartConfig.entity] || page.chartConfig.entity;
            else if (page.chartConfig.scale === 'dep_multi') entityName = DEP_NAMES[page.chartConfig.entity] || page.chartConfig.entity;
            else if (page.chartConfig.scale === 'epci_multi') {
                const epciObj = appState.refData.epciList.find(r => r.EPCI === page.chartConfig.entity);
                entityName = epciObj ? epciObj.LIBEPCI : page.chartConfig.entity;
            }
            else if (page.chartConfig.scale === 'com_multi') entityName = appState.refData.communes.get(page.chartConfig.entity) || page.chartConfig.entity;

            else if (page.chartConfig.scale === 'del_multi') {
                const delegation = appState.customDelegations[parseInt(page.chartConfig.entity)];
                entityName = delegation ? delegation.label : page.chartConfig.entity;
            }
            
            // 3. Construction des axes selon le type de graphique
			if (page.chartConfig.type === 'pie' || page.chartConfig.type === 'line' || page.chartConfig.type === 'radar') {
                // Pour Camembert / Courbe / Radar : 1 seule série (l'entité), et N points/axes (les métriques)
                const xLabels = page.chartConfig.metrics.map(m => m === '_computed' ? 'Résultat' : m);
                safeX = escapeHtml(JSON.stringify(xLabels));
                safeY = escapeHtml(JSON.stringify([aggregatedValues]));
                safeNames = escapeHtml(JSON.stringify([entityName]));
            } else {
                // Pour Barres : N séries (les métriques) contenant 1 seule valeur, empilées sur 1 label X (l'entité)
                // Cela permet d'avoir une légende détaillée et une couleur distincte par métrique
                const ySeries = aggregatedValues.map(val => [val]);
                const names = page.chartConfig.metrics.map(m => m === '_computed' ? 'Résultat' : m);
                
                safeX = escapeHtml(JSON.stringify([entityName]));
                safeY = escapeHtml(JSON.stringify(ySeries));
                safeNames = escapeHtml(JSON.stringify(names));
            }
            numColors = page.chartConfig.metrics.length;
        }

        const tag = `${page.chartConfig.type}-chart`; 
        const paletteKey = page.chartConfig.palette || 'categorical';
        const interpolator = PALETTE_SCALES[paletteKey] || PALETTE_SCALES['categorical'];
        const colorsArr = [];
        for (let i = 0; i < numColors; i++) {
            const t = numColors > 1 ? (i / (numColors - 1)) : 0.8; 
            colorsArr.push(interpolator(t));
        }
        const safeColors = escapeHtml(JSON.stringify(colorsArr));
        // NOUVEAU : On prépare les attributs
        const optMean = page.chartConfig.showMeanLine ? 'true' : 'false';
        const optTrend = page.chartConfig.showTrendline ? 'true' : 'false';
        const optMoving = page.chartConfig.showMovingAvg ? 'true' : 'false';
        const optOutliers = page.chartConfig.highlightOutliers ? 'true' : 'false';

        // NOUVEAU : On injecte tout dans la balise
        const chartHtml = `<${tag} x='${safeX}' y='${safeY}' name='${safeNames}' horizontal='${page.chartConfig.horizontal}' colors='${safeColors}' mean='${optMean}' trend='${optTrend}' moving='${optMoving}' outliers='${optOutliers}'></${tag}>`;
        
        chartPageEl.innerHTML = window.DOMPurify.sanitize(`
            ${getStableHeaderHtml(config, brandHtml, null, page.mainTitle)}
            <div class="report-layout" style="display:block; padding:20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                    <h3 style="color:#000091; margin: 0; font-size: 1.5rem;">
                        <span class="editable-slide-title" data-page-id="${page.id}" contenteditable="true" title="Cliquez pour modifier le titre" style="padding: 2px 8px; border-radius: 4px; transition: background-color 0.2s; outline: none; border-bottom: 1px dashed transparent;">${escapeHtml(page.title)}</span>
                    </h3>
                    <span class="fr-icon-edit-line edit-icon-trigger" data-target-id="${page.id}" aria-hidden="true" style="color: #000091; cursor: pointer; font-size: 1.2rem;" title="Modifier le titre"></span>
                </div>
                <div style="width:100%; height:600px; margin-top:20px;">
                    ${chartHtml}
                </div>
            </div>
            <div class="page-footer"><span>${config.footerLeft}</span><span>${config.footerRight}</span></div>
        `, { 
            ADD_TAGS: ['bar-chart', 'pie-chart', 'line-chart', 'radar-chart'], 
            // NOUVEAU : On autorise les nouveaux attributs dans DOMPurify
			ADD_ATTR: ['x', 'y', 'name', 'horizontal', 'colors', 'mean', 'trend', 'moving', 'outliers', 'contenteditable', 'data-page-id', 'data-target-id', 'title']
        });
        
        container.appendChild(chartPageEl);
        
    }



    // 3. Rendu des tableaux de données
    if (page.showTable) {
        const features = getFeaturesForPage(page, granularity, appState);
        if (features.length > 0) {
            generateTablePages(page, features, dataMap, config, granularity).forEach(tp => container.appendChild(tp));
        }
    }
}

export function generateTablePages(page, features, dataMap, config, granularity) {
    const pages = [];
    const filtered = features.filter(f => {
        const c = getCodeFromFeature(f, granularity); const d = dataMap.get(c); return d && d._inSelection;
    });
    const sorted = [...filtered].sort((a, b) => {
        const ca = getCodeFromFeature(a, granularity) || ""; const cb = getCodeFromFeature(b, granularity) || "";
        return ca.toString().localeCompare(cb.toString());
    });
    const MAX_ROWS = 26;
    const totalPages = Math.ceil(sorted.length / MAX_ROWS) || 1;
    

    for (let i = 0; i < sorted.length; i += MAX_ROWS) {
        const chunk = sorted.slice(i, i + MAX_ROWS);
        const pageNum = (i / MAX_ROWS) + 1;
        const pageEl = document.createElement('div'); pageEl.className = 'page';
        const brandHtml = getBrandHtml(config);
        
		let headersHTML = `<th style="width:80px">Code</th>`;
        if (granularity === 'com') headersHTML += `<th>Commune</th><th>Département</th>`;
        else if (granularity === 'dep') headersHTML += `<th>Département</th><th>Région</th>`;
        else headersHTML += `<th>Région</th>`;
        
        // NOUVEAU : Création des en-têtes selon le type de diapositive
        if (page.type === 'chart' && page.chartConfig && page.chartConfig.metrics) {
            // Pour un GRAPHIQUE : Une colonne par métrique sélectionnée
            page.chartConfig.metrics.forEach(m => {
                const label = m === '_computed' ? `Résultat (${appState.calcMode})` : escapeHtml(m);
                headersHTML += `<th style="text-align:right; color:#000091;">${label}</th>`;
            });
        } else {
            // Pour une CARTE : Colonne(s) simple(s) et colonne finale Résultat
            if (page.richTable && !['simple', 'top10', 'flop10'].includes(config.calcMode)) {
                config.selectedMetrics.forEach(m => {
                    headersHTML += `<th style="text-align:right">${escapeHtml(m)}</th>`;
                });
            }
            headersHTML += `<th style="text-align:right; color:#000091;">Résultat</th>`;
        }
        
        const rows = chunk.map(f => {
            const code = getCodeFromFeature(f, granularity);
            const d = dataMap.get(code);

            let name = code;
            let parent = "-";

			if (granularity === 'com') {
                // NOUVEAU : nom_officiel et protection DROM (startsWith 97)
                name = appState.refData.communes.get(code) || f.properties.nom_officiel || f.properties.libelle || f.properties.nom || code;
                //const depCode = appState.refData.comToDep?.get(code) || (code.startsWith('97') ? code.substring(0, 3) : (code || "").substring(0, 2));
                const depCode = getDepFromCom(d.code, appState);
                parent = DEP_NAMES[depCode] || depCode;
            } else if (granularity === 'dep') {
                name = DEP_NAMES[code] || f.properties.nom_officiel || f.properties.libelle || f.properties.nom || code;
                // NOUVEAU : Lecture du nouveau code_insee_de_la_region
                const regCode = f.properties.reg || f.properties.code_insee_de_la_region || (appState.refData.depToReg ? appState.refData.depToReg.get(code) : null);
                parent = REG_NAMES[regCode] || "-";
            } else if (granularity === 'reg') {
                name = REG_NAMES[code] || f.properties.nom_officiel || f.properties.libelle || f.properties.nom || code;
            }

            let rowHtml = `<tr><td>${code}</td><td>${escapeHtml(name)}</td>`;
            if (granularity !== 'reg') {
                rowHtml += `<td>${escapeHtml(parent)}</td>`;
            }

// NOUVEAU : Remplissage des colonnes selon le type de diapositive
            if (page.type === 'chart' && page.chartConfig && page.chartConfig.metrics) {
                // Mode Graphique : on itère sur les métriques spécifiques à ce graphique
                page.chartConfig.metrics.forEach(m => {
                    const val = m === '_computed' ? d._computed : d[m];
                    const formatMode = m === '_computed' ? config.calcMode : 'simple';
                    const metricVal = val !== undefined ? formatValue(val, formatMode) : '-';
                    const style = m === '_computed' ? 'font-weight:bold; color:#000091;' : '';
                    rowHtml += `<td style="text-align:right; ${style}">${metricVal}</td>`;
                });
            } else {

                // Mode Carte : affichage classique
                if (page.richTable && !['simple', 'top10', 'flop10'].includes(config.calcMode)) {
                    config.selectedMetrics.forEach(m => {
                        const metricVal = d[m] !== undefined ? formatValue(d[m], 'simple') : '-';
                        rowHtml += `<td style="text-align:right">${metricVal}</td>`;
                    });
                }
            
                
                rowHtml += `<td style="text-align:right; font-weight:bold; color:#000091;">${formatValue(d._computed, config.calcMode)}</td>`;
            }
            
            rowHtml += `</tr>`;
            return rowHtml;
        }).join('');

        pageEl.innerHTML = `
        <style>.data-table td, .data-table th { padding: 4px 8px !important; font-size: 0.85rem; }</style>
        ${getStableHeaderHtml(config, brandHtml, `${config.date} - Page ${pageNum}/${totalPages}`)}
        <div class="report-layout" style="display:block; overflow:hidden;">
            <div class="table-page-content"><table class="data-table"><thead><tr>${headersHTML}</tr></thead><tbody>${rows}</tbody></table></div>
        </div>
        <div class="page-footer"><span>${config.footerLeft}</span><span>Page ${pageNum}/${totalPages}</span><span>${config.footerRight}</span></div>`;
        pages.push(pageEl);
    }
    return pages;
}

export function generateReport() {
    const container = document.getElementById('report-container');
    if (!container) return;
    
    const existingCharts = container.querySelectorAll('bar-chart, pie-chart, line-chart, radar-chart');
    existingCharts.forEach(chartEl => {
        if (chartEl.disconnectedCallback) chartEl.disconnectedCallback();
    });
    
    container.innerHTML = '';
    
    // On récupère la configuration globale (actuelle)
    const currentConfig = getCurrentConfig(); 

    appState.pages.forEach(page => {
        if (!page.visible) return;
        
        let dataMap;
        let slideConfig = currentConfig;

        // --- NOUVELLE LOGIQUE DE CHOIX DES DONNÉES ---
        if (page.type === 'free') {
            dataMap = new Map();
        } else if (page.snapshotData) {
            // Si la page a été importée du panier, on restaure ses données figées
            dataMap = new Map(page.snapshotData);
            // On restaure aussi sa configuration (titre, mode de calcul, couleurs...)
            slideConfig = page.snapshotConfig || currentConfig;
        } else {
            // Sinon (diapo normale), on calcule en direct avec le CSV actuel
            dataMap = getAggregatedDataMap(page.granularity || currentConfig.granularity, page, currentConfig);
        }
        // ----------------------------------------------

        renderPageItem(page, slideConfig, dataMap, container);
    });
    
    setTimeout(setupScrollTracking, 100);
}

// --- FONCTION DE VERROUILLAGE ---

window.togglePageLock = (index) => {
    const page = appState.pages[index];
    if (!page) return;

    // Si la page est déjà figée, on la libère
    if (page.snapshotData) {
        if (confirm("Voulez-vous déverrouiller cette diapositive ?\nElle sera recalculée avec les données actuelles (CSV actif) et risque de changer.")) {
            delete page.snapshotData;
            delete page.snapshotConfig;
            // On force le rafraîchissement
            updatePagesListUI();
            generateReport();
        }
    } 
    // Sinon, on la fige (Snapshot)
    else {
        // 1. On récupère la configuration actuelle globale
        const currentConfig = getCurrentConfig();
        
        // 2. On calcule les données exactes telles qu'elles sont affichées maintenant
        const granularity = page.granularity || currentConfig.granularity;
        const dataMap = getAggregatedDataMap(granularity, page, currentConfig);
        
        // 3. On stocke le tout DANS la page
        page.snapshotData = Array.from(dataMap.entries()); // Conversion Map -> Array pour stockage
        page.snapshotConfig = JSON.parse(JSON.stringify(currentConfig)); // Copie profonde de la config
        
        // 4. Mise à jour de l'interface
        updatePagesListUI();
        generateReport();
    }
};

window.duplicatePage = (index) => {
    // 1. On crée une copie profonde de la page
    const sourcePage = appState.pages[index];
    // Astuce JSON pour cloner l'objet sans garder les références
    const newPage = JSON.parse(JSON.stringify(sourcePage));

    // 2. On modifie la copie pour qu'elle soit "neuve" et "vivante"
    newPage.id = Date.now(); // Nouvel ID unique
    newPage.title = sourcePage.title + " (Copie)";
    
    // IMPORTANT : On retire le snapshot pour que la copie lise les données en direct (CSV actif)
    delete newPage.snapshotData;
    delete newPage.snapshotConfig;

    // 3. On insère la copie juste après l'originale
    appState.pages.splice(index + 1, 0, newPage);

    // 4. On rafraîchit
    updatePagesListUI();
    generateReport();
};

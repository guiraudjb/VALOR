// --- CONFIGURATION ---
const PATHS = {
    csv: './data/test.csv',
    reg: './data/a-reg2021.json',
    dep: './data/a-dep2021.json',
    com: './data/a-com2022-topo-2154.json',
    communesRef: './data/v_commune_2025.csv'
};

const ROWS_PER_PAGE = 40;

const REG_NAMES = {
    "11": "ILE-DE-FRANCE", "24": "CENTRE-VAL DE LOIRE", "27": "BOURGOGNE-FRANCHE-COMTE",
    "28": "NORMANDIE", "32": "HAUTS-DE-FRANCE", "44": "GRAND EST", "52": "PAYS DE LA LOIRE",
    "53": "BRETAGNE", "75": "NOUVELLE-AQUITAINE", "76": "OCCITANIE", "84": "AUVERGNE-RHONE-ALPES",
    "93": "PROVENCE-ALPES-COTE D'AZUR", "94": "CORSE", "01": "GUADELOUPE", "02": "MARTINIQUE",
    "03": "GUYANE", "04": "LA REUNION", "06": "MAYOTTE"
};

const DEP_NAMES = { 
    "01":"AIN", "02":"AISNE", "03":"ALLIER", "04":"ALPES-DE-HAUTE-PROVENCE", "05":"HAUTES-ALPES", "06":"ALPES-MARITIMES", "07":"ARDECHE", "08":"ARDENNES", "09":"ARIEGE", "10":"AUBE", "11":"AUDE", "12":"AVEYRON", "13":"BOUCHES-DU-RHONE", "14":"CALVADOS", "15":"CANTAL", "16":"CHARENTE", "17":"CHARENTE-MARITIME", "18":"CHER", "19":"CORREZE", "2A":"CORSE-DU-SUD", "2B":"HAUTE-CORSE", "21":"COTE-D'OR", "22":"COTES-D'ARMOR", "23":"CREUSE", "24":"DORDOGNE", "25":"DOUBS", "26":"DROME", "27":"EURE", "28":"EURE-ET-LOIR", "29":"FINISTERE", "30":"GARD", "31":"HAUTE-GARONNE", "32":"GERS", "33":"GIRONDE", "34":"HERAULT", "35":"ILLE-ET-VILAINE", "36":"INDRE", "37":"INDRE-ET-LOIRE", "38":"ISERE", "39":"JURA", "40":"LANDES", "41":"LOIR-ET-CHER", "42":"LOIRE", "43":"HAUTE-LOIRE", "44":"LOIRE-ATLANTIQUE", "45":"LOIRET", "46":"LOT", "47":"LOT-ET-GARONNE", "48":"LOZERE", "49":"MAINE-ET-LOIRE", "50":"MANCHE", "51":"MARNE", "52":"HAUTE-MARNE", "53":"MAYENNE", "54":"MEURTHE-ET-MOSELLE", "55":"MEUSE", "56":"MORBIHAN", "57":"MOSELLE", "58":"NIEVRE", "59":"NORD", "60":"OISE", "61":"ORNE", "62":"PAS-DE-CALAIS", "63":"PUY-DE-DOME", "64":"PYRENEES-ATLANTIQUES", "65":"HAUTES-PYRENEES", "66":"PYRENEES-ORIENTALES", "67":"BAS-RHIN", "68":"HAUT-RHIN", "69":"RHONE", "70":"HAUTE-SAONE", "71":"SAONE-ET-LOIRE", "72":"SARTHE", "73":"SAVOIE", "74":"HAUTE-SAVOIE", "75":"PARIS", "76":"SEINE-MARITIME", "77":"SEINE-ET-MARNE", "78":"YVELINES", "79":"DEUX-SEVRES", "80":"SOMME", "81":"TARN", "82":"TARN-ET-GARONNE", "83":"VAR", "84":"VAUCLUSE", "85":"VENDEE", "86":"VIENNE", "87":"HAUTE-VIENNE", "88":"VOSGES", "89":"YONNE", "90":"TERRITOIRE DE BELFORT", "91":"ESSONNE", "92":"HAUTS-DE-SEINE", "93":"SEINE-SAINT-DENIS", "94":"VAL-DE-MARNE", "95":"VAL-D'OISE", "971":"GUADELOUPE", "972":"MARTINIQUE", "973":"GUYANE", "974":"LA REUNION", "976":"MAYOTTE"
};

const REGIONS_LIST = [
    { code: "11", label: "Île-de-France" }, 
    { code: "24", label: "Centre-Val de Loire" }, 
    { code: "27", label: "Bourgogne-Franche-Comté" }, 
    { code: "28", label: "Normandie" }, 
    { code: "32", label: "Hauts-de-France" }, 
    { code: "44", label: "Grand Est" }, 
    { code: "52", label: "Pays de la Loire" }, 
    { code: "53", label: "Bretagne" }, 
    { code: "75", label: "Nouvelle-Aquitaine" }, 
    { code: "76", label: "Occitanie" }, 
    { code: "84", label: "Auvergne-Rhône-Alpes" }, 
    { code: "93", label: "Provence-Alpes-Côte d'Azur" }, 
    { code: "94", label: "Corse" },
    { code: "01", label: "Guadeloupe" },
    { code: "02", label: "Martinique" },
    { code: "03", label: "Guyane" },
    { code: "04", label: "La Réunion" },
    { code: "06", label: "Mayotte" }
];

const DELEGATIONS = [
    { label: "Délégation Nord", depCodes: ["59", "62", "02", "60", "80", "14", "27", "50", "61", "76"] },
    { label: "Délégation Ouest", depCodes: ["22", "29", "35", "56", "44", "49", "53", "72", "85", "18", "28", "36", "37", "41", "45"] },
    { label: "Délégation Est", depCodes: ["08", "10", "51", "52", "54", "55", "57", "88", "67", "68", "21", "25", "39", "58", "70", "71", "89", "90"] },
    { label: "Délégation Sud-Est", depCodes: ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74", "04", "05", "06", "13", "83", "84", "2A", "2B", "971", "972", "973", "974", "976"] },
    { label: "Délégation Sud-Ouest", depCodes: ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87", "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"] },
    { label: "Délégation IDF", depCodes: ["75", "77", "78", "91", "92", "93", "94", "95"] }
];

const GEO_ABBR = [
    { full: "SAINT-", short: "St-" },
    { full: "SAINTE-", short: "Ste-" },
    { full: "SAINTS-", short: "Sts-" },
    { full: "NOTRE-DAME", short: "N.D." },
    { full: "MONTAGNE", short: "Mtgne" },
    { full: "ARRONDISSEMENT", short: "Arr." },
    { full: "DEPARTEMENT", short: "Dép." },
    { full: "REGION", short: "Rég." }
];

function getAbbreviatedName(name) {
    if (!name) return "";
    let abbrName = name.toUpperCase();
    GEO_ABBR.forEach(item => {
        abbrName = abbrName.replace(item.full, item.short);
    });
    if (abbrName.length > 20) {
        abbrName = abbrName.substring(0, 18) + ".";
    }
    return abbrName;
}

const PALETTE_GRADIENTS = {
    "sequentialDescending": "linear-gradient(to right, #e3e3fd , #000091)",
    "sequentialAscending": "linear-gradient(to right, #000091, #e3e3fd)",
    "divergentDescending": "linear-gradient(to right, #298641, #EFB900, #E91719)",
    "divergentAscending": "linear-gradient(to right, #E91719, #EFB900, #298641)",
    "categorical": "linear-gradient(to right, #5C68E5, #82B5F2, #29598F, #31A7AE, #81EEF5, #B478F1, #CFB1F5, #CECECE)"
};

const PALETTE_SCALES = {
    "sequentialDescending": d3.interpolateRgb("#e3e3fd", "#000091"),
    "sequentialAscending": d3.interpolateRgb("#000091", "#e3e3fd"),
    "divergentDescending": d3.interpolateRgbBasis(["#298641", "#EFB900", "#E91719"]),
    "divergentAscending": d3.interpolateRgbBasis(["#E91719", "#EFB900", "#298641"]),
    "categorical": d3.interpolateRgbBasis(["#5C68E5", "#82B5F2", "#29598F", "#31A7AE", "#81EEF5", "#B478F1", "#CFB1F5", "#CECECE"])
};

let appState = {
    geoData: {}, userData: [], sourceGranularity: 'dep', pages: [],
    refData: { communes: new Map(), depToReg: new Map() }
};

function escapeHtml(text) {
    if (!text) return text;
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.addEventListener('DOMContentLoaded', async () => {
    setupUIListeners();
    populateDeptSelect();
    try {
        const [reg, dep, com, userCsvText, communesCsvText] = await Promise.all([
            d3.json(PATHS.reg), d3.json(PATHS.dep), d3.json(PATHS.com),
            d3.text(PATHS.csv).catch(() => null), d3.text(PATHS.communesRef).catch(() => null)
        ]);
        appState.geoData = { reg, dep, com };
        initRefData();
        if (communesCsvText) processCommunesRef(communesCsvText);
        if (userCsvText) processCSV(userCsvText);
        else buildDefaultStructure(); 
    } catch (error) { console.error(error); }
});

function populateDeptSelect() {
    const sel = document.getElementById('select-dept-target');
    if (!sel) return;
    Object.keys(DEP_NAMES).sort().forEach(k => {
        const opt = document.createElement('option');
        opt.value = k; opt.innerText = `${k} - ${DEP_NAMES[k]}`;
        sel.appendChild(opt);
    });
}

function initRefData() {
    if(!appState.geoData.dep) return;
    const deps = getGeoFeatures(appState.geoData.dep, 'a_dep2021').features;
    deps.forEach(f => {
        const code = f.properties.dep || f.properties.code;
        const reg = f.properties.reg;
        if(code && reg) appState.refData.depToReg.set(code, reg);
    });
}

function processCommunesRef(csvText) {
    Papa.parse(csvText, { header: true, delimiter: ",", skipEmptyLines: true, dynamicTyping: false, 
        complete: (res) => {
            if (res.data) res.data.forEach(row => { if (row.COM && row.NCC) appState.refData.communes.set(row.COM.trim(), row.NCC.trim()); });
        }
    });
}

function processCSV(csvText) {
    Papa.parse(csvText, { header: true, skipEmptyLines: true, complete: (res) => {
        if (!res.data || res.meta.fields.length < 2) {
            alert("Format CSV invalide ou vide. 2 colonnes minimum requises (Code, Valeur).");
            return;
        }
        if (res.data && res.meta.fields.length >= 2) {
            const firstCode = res.data[0][res.meta.fields[0]].toString().trim();
            appState.sourceGranularity = (firstCode.length === 5) ? 'com' : 'dep';
            const granSel = document.getElementById('select-granularity');
            if(granSel) granSel.value = appState.sourceGranularity;
            appState.userData = res.data.map(row => ({
                code: row[res.meta.fields[0]].toString().trim(),
                val: parseFloat(row[res.meta.fields[1]].toString().replace(/\s/g, '').replace(',', '.')) || 0
            }));
            buildDefaultStructure();
        }
    }});
}

function getAggregatedDataMap(targetGranularity) {
    const dataMap = new Map();
    const checkAgreg = document.getElementById('check-auto-agreg');
    const shouldAggregate = checkAgreg ? checkAgreg.checked : true;
    if (!shouldAggregate || appState.sourceGranularity === targetGranularity) { appState.userData.forEach(d => dataMap.set(d.code, d.val)); return dataMap; }
    if (appState.sourceGranularity === 'com' && targetGranularity === 'dep') {
        appState.userData.forEach(d => {
            const depCode = d.code.startsWith('97') ? d.code.substring(0,3) : d.code.substring(0,2);
            const current = dataMap.get(depCode) || 0; dataMap.set(depCode, current + d.val);
        }); return dataMap;
    }
    if (appState.sourceGranularity === 'dep' && targetGranularity === 'reg') {
        appState.userData.forEach(d => {
            const regCode = appState.refData.depToReg.get(d.code); if (regCode) { const current = dataMap.get(regCode) || 0; dataMap.set(regCode, current + d.val); }
        }); return dataMap;
    }
    if (appState.sourceGranularity === 'com' && targetGranularity === 'reg') {
        appState.userData.forEach(d => {
            const depCode = d.code.startsWith('97') ? d.code.substring(0,3) : d.code.substring(0,2); const regCode = appState.refData.depToReg.get(depCode); if (regCode) { const current = dataMap.get(regCode) || 0; dataMap.set(regCode, current + d.val); }
        }); return dataMap;
    }
    return dataMap;
}

function buildDefaultStructure() {
    const savedFreePages = appState.pages.filter(p => p.type === 'free');
    let newAutoPages = [];
    let idCounter = 1;
    const selectMode = document.getElementById('select-report-mode');
    const reportMode = selectMode ? selectMode.value : 'mode-nat-reg';
    const defLabelSize = (reportMode === 'mode-dep-com') ? 10 : 12;

    const createMapPage = (title, focus, gran) => ({
        id: idCounter++, 
        type: 'map', 
        title: title, 
        focus: focus, 
        granularity: gran, 
        visible: true, 
        showLabels: (focus !== null), 
        labelSize: defLabelSize,
        showTable: true 
    });

    if (reportMode === 'mode-nat-reg') {
        newAutoPages.push(createMapPage("France Entière", null, 'dep'));
        REGIONS_LIST.forEach(reg => { newAutoPages.push(createMapPage(reg.label, { type: 'region', code: reg.code }, 'dep')); });
    } else if (reportMode === 'mode-nat-del') {
        newAutoPages.push(createMapPage("France Entière", null, 'dep'));
        DELEGATIONS.forEach(del => { newAutoPages.push(createMapPage(del.label, { type: 'delegation', list: del.depCodes }, 'dep')); });
    } else if (reportMode === 'mode-dep-com') {
        const selectDept = document.getElementById('select-dept-target');
        const selectedDept = selectDept ? selectDept.value : "01";
        const deptName = DEP_NAMES[selectedDept] || selectedDept;
        newAutoPages.push(createMapPage(`Département : ${deptName}`, { type: 'department', code: selectedDept }, 'com'));
    }
    const processedFreePages = savedFreePages.map(p => ({ ...p, visible: p.visible !== undefined ? p.visible : true }));
    appState.pages = [...newAutoPages, ...processedFreePages];
    updatePagesListUI();
    generateReport();
}

function generateReport() {
    const container = document.getElementById('report-container');
    if (!container) return; container.innerHTML = '';
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };
    const getCheck = (id, def) => { const el = document.getElementById(id); return el ? el.checked : def; };
    const reportMode = getVal('select-report-mode', 'mode-nat-reg');
    const selectedGranularity = getVal('select-granularity', 'dep');
    const finalGranularity = (reportMode === 'mode-dep-com') ? 'com' : selectedGranularity;
    
    const config = {
        titre: escapeHtml(getVal('input-titre', '')), 
        date: escapeHtml(getVal('input-date', '')), 
        palette: getVal('select-palette', 'sequentialDescending'),
        granularity: finalGranularity, footerLeft: escapeHtml(getVal('input-footer-left', '')), footerRight: escapeHtml(getVal('input-footer-right', '')),
        showMaps: getCheck('check-show-maps', true), 
        showTablesGlobal: getCheck('check-show-tables', true),
        showFree: getCheck('check-show-freepages', true), showSubtotal: getCheck('check-show-subtotal', true)
    };
    
    appState.pages.forEach(page => {
        if (!page.visible) return;
        
        if (page.type === 'free') {
            if (!config.showFree) return;
            const pageEl = document.createElement('div'); pageEl.className = 'page';
            pageEl.setAttribute('data-page-id', page.id);
            
            let logoHtml = '';
            if (page.logoData) {
                logoHtml = `<img src="${page.logoData}" class="slide-custom-logo" alt="Logo">`;
            }

            pageEl.innerHTML = `${logoHtml}<div class="free-slide-content">${page.content}</div>`;
            container.appendChild(pageEl); return;
        }

        const granularity = page.granularity || config.granularity;
        const dataMap = getAggregatedDataMap(granularity);
        
        if (config.showMaps) {
            const mapPageEl = document.createElement('div'); mapPageEl.className = 'page';
            mapPageEl.setAttribute('data-page-id', page.id);
            mapPageEl.innerHTML = `<div class="page-header"><div class="header-content"><h1 class="page-title">${config.titre}</h1><div class="page-subtitle">${config.date}</div></div><div class="header-line"></div></div><div class="report-layout"><div class="sidebar-legend"><div class="view-name">${page.title}</div><div id="legend-${page.id}" class="gradient-wrapper" style="margin-top:20px; height:20px; width:100%; border:1px solid #ccc;"></div><div id="subtotal-${page.id}" class="kpi-subtotal" style="display:none"><div class="kpi-label">TOTAL VUE</div><div class="kpi-value">-</div></div><p style="font-size:0.8rem; margin-top:10px; color:#666;">Niveau : ${getGranularityLabel(granularity)}</p></div><div class="main-content"><div class="map-container" id="map-${page.id}"></div></div></div><div class="page-footer"><span>${config.footerLeft}</span><span>${config.footerRight}</span></div>`;
            container.appendChild(mapPageEl);
            setTimeout(() => { drawD3Map(page, config, dataMap, `map-${page.id}`, `legend-${page.id}`, `subtotal-${page.id}`, granularity); }, 10);
        }

        if (config.showTablesGlobal && page.showTable) {
            const features = getFeaturesForPage(page, granularity);
            if (features.length > 0) {
                const tablePages = generateTablePages(page, features, dataMap, config, granularity);
                tablePages.forEach(tp => container.appendChild(tp));
            }
        }
    });

    setTimeout(setupScrollTracking, 100);
}

function drawD3Map(pageData, config, dataMap, mapId, legendId, subtotalId, granularity) {
    const container = document.getElementById(mapId); if(!container) return;
    const width = 1000; const height = 900;
    
    let featuresToDraw = getFeaturesForPage(pageData, granularity);
    if (!featuresToDraw || !featuresToDraw.length) { container.innerHTML = "Aucune donnée géographique."; return; }

    const localValues = featuresToDraw.map(f => {
        const code = getCodeFromFeature(f, granularity);
        return dataMap.get(code) || 0;
    });
    const localMin = localValues.length ? d3.min(localValues) : 0;
    const localMax = localValues.length ? d3.max(localValues) : 100;
    let viewTotal = localValues.reduce((acc, curr) => acc + curr, 0);

    if (config.showSubtotal) {
        const stEl = document.getElementById(subtotalId);
        if (stEl) { stEl.style.display = 'block'; stEl.querySelector('.kpi-value').innerText = viewTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 }); }
    }
    const interpolator = PALETTE_SCALES[config.palette] || PALETTE_SCALES["sequentialDescending"];
    const colorScale = d3.scaleSequential(interpolator).domain([localMin, localMax]);
    const legendDiv = document.getElementById(legendId);
    if(legendDiv) { 
        legendDiv.style.background = PALETTE_GRADIENTS[config.palette] || PALETTE_GRADIENTS["sequentialDescending"]; 
        legendDiv.innerHTML = `<span style="float:left">${localMin.toLocaleString()}</span><span style="float:right">${localMax.toLocaleString()}</span>`; 
    }

    const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");
    const projection = d3.geoIdentity().reflectY(true).fitSize([width, height], { type: "FeatureCollection", features: featuresToDraw });
    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");
    g.selectAll("path").data(featuresToDraw).enter().append("path").attr("d", path)
        .attr("fill", d => { const code = getCodeFromFeature(d, granularity); const val = dataMap.get(code); return val !== undefined ? colorScale(val) : "#f0f0f0"; })
        .attr("stroke", "white").attr("stroke-width", granularity === 'com' ? 0.1 : 0.5)
        .on("mouseover", function(event, d) {
            const code = getCodeFromFeature(d, granularity); const val = dataMap.get(code);
            let name = ""; if (granularity === 'com') name = appState.refData.communes.get(code) || d.properties.libelle || "Inconnu"; else name = (granularity === 'dep' ? DEP_NAMES[code] : REG_NAMES[code]) || d.properties.libelle;
            const safeName = escapeHtml(name || code);
            d3.select(this).attr("stroke", "orange").attr("stroke-width", 1.5).raise();
            d3.select("#d3-tooltip").style("display", "block").html(`<strong>${safeName}</strong> (${code})<br>Valeur: ${val !== undefined ? val.toLocaleString() : 'N/A'}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function(event, d) { d3.select(this).attr("stroke", "white").attr("stroke-width", granularity === 'com' ? 0.1 : 0.5); d3.select("#d3-tooltip").style("display", "none"); });

    if (granularity === 'com') {
        let depFeatures = getGeoFeatures(appState.geoData.dep, 'a_dep2021').features;
        if (pageData.focus && pageData.focus.type === 'region') depFeatures = depFeatures.filter(f => f.properties.reg === pageData.focus.code);
        else if (pageData.focus && pageData.focus.type === 'department') depFeatures = depFeatures.filter(f => (f.properties.dep || f.properties.code) == pageData.focus.code);
        g.append("g").selectAll("path").data(depFeatures).enter().append("path").attr("d", path).attr("fill", "none").attr("stroke", "#444").attr("stroke-width", "0.8px").style("pointer-events", "none");
    }

    if (pageData.showLabels) { 
        const labelNodes = [];
        const labelSize = pageData.labelSize || 8;
        const tempGroup = svg.append("g").style("opacity", 0);

        featuresToDraw.forEach(d => {
            const code = getCodeFromFeature(d, granularity);
            const val = dataMap.get(code);
            if (val === undefined) return;
            const centroid = path.centroid(d);
            if (isNaN(centroid[0]) || isNaN(centroid[1])) return;

            let rawName = "";
            if (granularity === 'com') rawName = appState.refData.communes.get(code) || d.properties.libelle || "";
            else rawName = (granularity === 'dep' ? DEP_NAMES[code] : REG_NAMES[code]) || d.properties.libelle || "";

            const abbrName = getAbbreviatedName(rawName);
            const valStr = val.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
            const labelText = `${abbrName} : ${valStr}`;

            const txt = tempGroup.append("text").style("font-size", labelSize + "px").style("font-weight", "bold").text(labelText);
            const bbox = txt.node().getBBox();
            
            labelNodes.push({
                fx: null, fy: null, x: centroid[0], y: centroid[1], targetX: centroid[0], targetY: centroid[1],
                width: bbox.width + 4, height: bbox.height + 2, text: labelText, code: code
            });
        });
        tempGroup.remove();

        const simulation = d3.forceSimulation(labelNodes)
            .force("charge", d3.forceManyBody().strength(-2))
            .force("collide", d3.forceCollide().radius(d => Math.max(d.width/2, d.height/2) * 1.1).iterations(2))
            .force("anchor", d3.forceX(d => d.targetX).strength(0.3))
            .force("anchorY", d3.forceY(d => d.targetY).strength(0.3))
            .stop();

        for (let i = 0; i < 120; ++i) simulation.tick();

        const labelsGroup = svg.append("g").style("pointer-events", "none");

        labelsGroup.selectAll(".label-link")
            .data(labelNodes.filter(d => {
                const dist = Math.sqrt(Math.pow(d.x - d.targetX, 2) + Math.pow(d.y - d.targetY, 2));
                return dist > (d.width / 2);
            }))
            .enter().append("line")
            .attr("class", "label-link")
            .attr("x1", d => d.targetX).attr("y1", d => d.targetY).attr("x2", d => d.x).attr("y2", d => d.y);

        const texts = labelsGroup.selectAll(".label-text-group")
            .data(labelNodes).enter().append("g").attr("transform", d => `translate(${d.x},${d.y})`);

        texts.append("text").attr("class", "label-text").attr("text-anchor", "middle").attr("dy", "0.35em")
            .style("font-size", labelSize + "px").style("stroke", "white").style("stroke-width", "3px").text(d => d.text);
        
        texts.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
            .style("font-size", labelSize + "px").style("font-weight", "bold").style("fill", "#000091").text(d => d.text);
    }
}

function generateTablePages(page, features, dataMap, config, granularity) {
    const pages = [];
    const sortedFeatures = [...features].sort((a,b) => { const ca = getCodeFromFeature(a, granularity) || ""; const cb = getCodeFromFeature(b, granularity) || ""; return ca.toString().localeCompare(cb.toString()); });
    const totalPages = Math.ceil(sortedFeatures.length / ROWS_PER_PAGE);
    for (let i = 0; i < sortedFeatures.length; i += ROWS_PER_PAGE) {
        const chunk = sortedFeatures.slice(i, i + ROWS_PER_PAGE); const currentPageNum = (i / ROWS_PER_PAGE) + 1;
        const pageEl = document.createElement('div'); pageEl.className = 'page';
        pageEl.setAttribute('data-page-id', page.id);
        
        let headers = []; if(granularity === 'com') headers = ['Code', 'Commune', 'Département', 'Valeur']; else if(granularity === 'dep') headers = ['Code', 'Département', 'Région', 'Valeur']; else headers = ['Code', 'Région', '', 'Valeur'];
        const rows = chunk.map(f => {
            const p = f.properties; const code = getCodeFromFeature(f, granularity) || ""; let name = p.libelle || p.nom || ""; let parentName = "";
            if (granularity === 'com') { if(appState.refData.communes.has(code)) name = appState.refData.communes.get(code); else name = "INCONNU (" + code + ")"; const depCode = p.dep || (code.length >= 2 ? code.substring(0,2) : ""); parentName = DEP_NAMES[depCode] || depCode; } else if (granularity === 'dep') { name = DEP_NAMES[code] || name; const regCode = p.reg; parentName = REG_NAMES[regCode] || regCode || "-"; } else { name = REG_NAMES[code] || name; parentName = "-"; }
            const val = dataMap.get(code); const valStr = val !== undefined ? val.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '-';
            return `<tr><td class="col-code">${escapeHtml(code)}</td><td class="col-text">${escapeHtml(name)}</td><td class="col-text">${escapeHtml(parentName)}</td><td class="col-val">${valStr}</td></tr>`;
        }).join('');
        pageEl.innerHTML = `<div class="page-header"><div class="header-content"><h1 class="page-title">${config.titre}</h1><div class="page-subtitle">Page ${currentPageNum} / ${totalPages}</div></div><div class="header-line"></div></div><div class="report-layout" style="display:block; overflow:hidden;"><div class="table-page-content"><table class="data-table"><thead><tr><th style="width:80px">${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th><th style="width:120px; text-align:right">${headers[3]}</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="page-footer"><span>${config.footerLeft}</span><span>Page de données ${currentPageNum}/${totalPages}</span><span>${config.footerRight}</span></div>`;
        pages.push(pageEl);
    }
    return pages;
}

function getCodeFromFeature(feature, granularity) {
    const p = feature.properties;
    if (granularity === 'com') return p.INSEE_COM || p.CODE_COM || p.com || p.codgeo || p.id;
    if (granularity === 'dep') return p.INSEE_DEP || p.CODE_DEP || p.dep || p.code || p.id;
    return p.INSEE_REG || p.CODE_REG || p.reg || p.code || p.id;
}
function getGeoFeatures(fileData, preferredName) {
    if (!fileData) return { features: [] };
    if (fileData.type === 'FeatureCollection') return fileData;
    if (fileData.type === 'Topology') {
        let key = preferredName;
        if (!fileData.objects[key]) { const keys = Object.keys(fileData.objects); key = keys.find(k => k.includes('com')) || keys[0]; }
        return topojson.feature(fileData, fileData.objects[key]);
    }
    return { features: [] };
}
function getFeaturesForPage(pageData, granularity) {
    let primaryGeoJSON;
    if (granularity === 'reg') primaryGeoJSON = getGeoFeatures(appState.geoData.reg, 'a_reg2021');
    else if (granularity === 'com') primaryGeoJSON = getGeoFeatures(appState.geoData.com, 'a_com2022');
    else primaryGeoJSON = getGeoFeatures(appState.geoData.dep, 'a_dep2021');
    if (!primaryGeoJSON || !primaryGeoJSON.features) return [];
    let features = primaryGeoJSON.features;
    if (pageData.focus) {
        if (pageData.focus.type === 'region') features = features.filter(f => { const r = f.properties.reg || f.properties.INSEE_REG; return r == pageData.focus.code; });
        else if (pageData.focus.type === 'delegation') {
            const depList = pageData.focus.list;
            features = features.filter(f => {
                const depCode = f.properties.dep || f.properties.INSEE_DEP || (getCodeFromFeature(f, 'com') || "").substring(0,2);
                return depList.includes(depCode);
            });
        } else if (pageData.focus.type === 'department') {
            features = features.filter(f => {
                const depCode = f.properties.dep || (getCodeFromFeature(f, 'com') || "").substring(0,2);
                return depCode == pageData.focus.code;
            });
        }
    }
    return features;
}
function getGranularityLabel(g) { if(g==='reg') return "Régions"; if(g==='com') return "Communes"; return "Départements"; }

// --- FONCTION LIEE AU BLOC MARQUE DYNAMIQUE ---
function updateMainBrand() {
    const line1 = document.getElementById('input-brand-1').value || '';
    const line2 = document.getElementById('input-brand-2').value || '';
    const br = (line1 && line2) ? '<br>' : '';
    const brandEl = document.getElementById('main-brand-text');
    if (brandEl) {
        brandEl.innerHTML = `${escapeHtml(line1)}${br}${escapeHtml(line2)}`;
    }
}

function setupUIListeners() {
    ['input-titre', 'input-date', 'select-palette', 'input-footer-left', 'input-footer-right'].forEach(id => { const el = document.getElementById(id); if (el) el.oninput = generateReport; });
    
    // Ajout des écouteurs pour les champs du bloc marque
    ['input-brand-1', 'input-brand-2'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.addEventListener('input', updateMainBrand); 
    });

    const selectMode = document.getElementById('select-report-mode');
    if (selectMode) { selectMode.onchange = (e) => { const wrapper = document.getElementById('wrapper-select-dept'); if (wrapper) wrapper.style.display = (e.target.value === 'mode-dep-com') ? 'block' : 'none'; buildDefaultStructure(); }; }
    const selectDept = document.getElementById('select-dept-target'); if (selectDept) selectDept.onchange = buildDefaultStructure;
    ['check-show-maps', 'check-show-tables', 'check-show-freepages', 'check-auto-agreg', 'check-show-subtotal'].forEach(id => { const el = document.getElementById(id); if (el) el.onchange = generateReport; });
    document.getElementById('btn-reset-structure').onclick = buildDefaultStructure;
    document.getElementById('csv-file').onchange = (e) => { Papa.parse(e.target.files[0], { header: true, skipEmptyLines: true, complete: (res) => { if (res.data && res.meta.fields.length >= 2) { const firstCode = res.data[0][res.meta.fields[0]].toString().trim(); appState.sourceGranularity = (firstCode.length === 5) ? 'com' : 'dep'; const granSel = document.getElementById('select-granularity'); if(granSel) granSel.value = appState.sourceGranularity; appState.userData = res.data.map(row => ({ code: row[res.meta.fields[0]].toString().trim(), val: parseFloat(row[res.meta.fields[1]].toString().replace(/\s/g, '').replace(',', '.')) || 0 })); buildDefaultStructure(); } }}); };
    document.getElementById('btn-add-slide').onclick = () => editPage();
    document.getElementById('btn-export').onclick = () => window.print();
    const modal = document.getElementById('modal-edit-slide');
    document.getElementById('btn-close-modal').onclick = () => { modal.classList.remove('fr-modal--opened'); modal.close(); };
    document.getElementById('btn-save-slide').onclick = saveCustomSlide;
}

window.togglePageLabels = (index) => {
    appState.pages[index].showLabels = !appState.pages[index].showLabels;
    updatePagesListUI();
    generateReport();
};

window.togglePageTable = (index) => {
    appState.pages[index].showTable = !appState.pages[index].showTable;
    updatePagesListUI();
    generateReport();
};

window.changeLabelSize = (index, size) => {
    appState.pages[index].labelSize = parseInt(size);
    generateReport();
};

window.changePagePosition = (oldIndex, newPosStr) => { let newIndex = parseInt(newPosStr) - 1; if (isNaN(newIndex)) return; if (newIndex < 0) newIndex = 0; if (newIndex >= appState.pages.length) newIndex = appState.pages.length - 1; if (newIndex !== oldIndex) { const itemMoved = appState.pages.splice(oldIndex, 1)[0]; appState.pages.splice(newIndex, 0, itemMoved); updatePagesListUI(); generateReport(); } else { updatePagesListUI(); } };
window.togglePageVisibility = (index) => { appState.pages[index].visible = !appState.pages[index].visible; updatePagesListUI(); generateReport(); };
window.deletePage = (index) => { if (confirm("Supprimer ?")) { appState.pages.splice(index, 1); updatePagesListUI(); generateReport(); } };

window.editPage = (id) => { 
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    document.getElementById('input-custom-logo').value = ""; 
    
    visualEditor.style.display = 'block';
    sourceEditor.style.display = 'none';

    if (id) {
        const page = appState.pages.find(p => p.id === id);
        if (page && page.type === 'free') {
            document.getElementById('edit-slide-id').value = id;
            document.getElementById('slide-title').value = page.title;
            visualEditor.innerHTML = page.content;
            sourceEditor.value = page.content;
        }
    } else {
        document.getElementById('edit-slide-id').value = '';
        document.getElementById('slide-title').value = '';
        visualEditor.innerHTML = '<p>Votre texte ici...</p>';
        sourceEditor.value = '<p>Votre texte ici...</p>';
    }
    document.getElementById('modal-edit-slide').classList.add('fr-modal--opened'); 
    document.getElementById('modal-edit-slide').showModal(); 
};

window.updatePagesListUI = function() { 
    const container = document.getElementById('pages-list'); container.innerHTML = '';
    appState.pages.forEach((page, index) => {
        const item = document.createElement('div'); 
        item.className = `page-item ${!page.visible ? 'is-hidden' : ''}`;
        item.setAttribute('data-page-id', page.id);
        
        let typeTag = `<span class="page-tag tag-map">CARTE</span>`; 
        let controls = '';

        if (page.type === 'free') { 
            typeTag = `<span class="page-tag tag-free">LIBRE</span>`; 
            controls = `<button class="btn-icon" onclick="editPage(${page.id})" title="Éditer"><span class="fr-icon-edit-line"></span></button>`; 
        } else {
            const labelIcon = page.showLabels ? 'fr-icon-price-tag-3-fill' : 'fr-icon-price-tag-3-line';
            const labelTitle = page.showLabels ? 'Masquer étiquettes' : 'Afficher étiquettes';
            const labelStyle = page.showLabels ? 'style="color:#000091"' : '';
            
            const tableIcon = 'fr-icon-table-line';
            const tableTitle = page.showTable ? 'Masquer tableau de données' : 'Afficher tableau de données';
            const tableStyle = page.showTable ? 'style="color:#000091"' : '';

            const fontSize = page.labelSize || 8;
            
            controls = `
                <input type="number" class="input-size" value="${fontSize}" min="4" max="24" onchange="changeLabelSize(${index}, this.value)" title="Taille Police (px)">
                <button class="btn-icon" onclick="togglePageTable(${index})" title="${tableTitle}" ${tableStyle}><span class="${tableIcon}"></span></button>
                <button class="btn-icon" onclick="togglePageLabels(${index})" title="${labelTitle}" ${labelStyle}><span class="${labelIcon}"></span></button>
            `;
        }

        item.innerHTML = `
            <div class="page-item-info">${typeTag} <strong>${page.title}</strong></div>
            <div class="page-item-controls">
                <input type="number" class="input-order" value="${index + 1}" min="1" max="${appState.pages.length}" onchange="changePagePosition(${index}, this.value)">
                ${controls}
                <button class="btn-icon" onclick="togglePageVisibility(${index})" title="Visibilité"><span class="${page.visible ? 'fr-icon-eye-fill' : 'fr-icon-eye-off-fill'}"></span></button>
                <button class="btn-icon btn-delete" onclick="deletePage(${index})" title="Supprimer"><span class="fr-icon-delete-line"></span></button>
            </div>`;
        container.appendChild(item);
    });
};

window.execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    const visual = document.getElementById('visual-editor');
    if (visual.style.display !== 'none') visual.focus();
};

window.toggleSourceMode = () => {
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    if (visualEditor.style.display !== 'none') {
        let htmlContent = visualEditor.innerHTML;
        sourceEditor.value = htmlContent;
        visualEditor.style.display = 'none';
        sourceEditor.style.display = 'block';
        sourceEditor.focus();
    } else {
        visualEditor.innerHTML = sourceEditor.value;
        sourceEditor.style.display = 'none';
        visualEditor.style.display = 'block';
        visualEditor.focus();
    }
};

window.insertDynamicTable = () => {
    const rowsStr = prompt("Nombre de lignes ?", "3");
    if (rowsStr === null) return;
    const colsStr = prompt("Nombre de colonnes ?", "3");
    if (colsStr === null) return;
    const rows = parseInt(rowsStr);
    const cols = parseInt(colsStr);
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
    let tableHTML = `<table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #ddd;">`;
    tableHTML += `<thead><tr style="background:#f0f0f0;">`;
    for (let c = 0; c < cols; c++) { tableHTML += `<th style="border:1px solid #ccc; padding:8px;">Titre ${c+1}</th>`; }
    tableHTML += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) { 
        tableHTML += `<tr>`;
        for (let c = 0; c < cols; c++) { tableHTML += `<td style="border:1px solid #ccc; padding:8px;">Donnée</td>`; }
        tableHTML += `</tr>`;
    }
    tableHTML += `</tbody></table><p><br></p>`;
    document.execCommand('insertHTML', false, tableHTML);
};

window.insertCustomList = (type) => {
    const countStr = prompt("Combien d'éléments voulez-vous insérer ?", "3");
    if (countStr === null) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count < 1) { document.execCommand(type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList'); return; }
    let listHTML = `<${type}>`;
    for (let i = 0; i < count; i++) { listHTML += `<li>Élément ${i+1}</li>`; }
    listHTML += `</${type}><p><br></p>`;
    document.execCommand('insertHTML', false, listHTML);
};

// --- NOUVELLE FONCTION LIEE AU BLOC MARQUE (WYSIWYG) ---
window.insertMarianne = () => {
    const line1 = escapeHtml(document.getElementById('input-brand-1').value || '');
    const line2 = escapeHtml(document.getElementById('input-brand-2').value || '');
    const br = (line1 && line2) ? '<br>' : '';

    const marianneHTML = `
    <div class="fr-header__brand" style="display:inline-block; margin-bottom: 20px; background:white;">
        <div class="fr-header__brand-top">
            <div class="fr-header__logo">
                <p class="fr-logo">
                    ${line1}${br}${line2}
                </p>
            </div>
        </div>
    </div><p><br></p>`;
    
    document.execCommand('insertHTML', false, marianneHTML);
    const visual = document.getElementById('visual-editor');
    if (visual) visual.focus();
};

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

window.insertWysiwygImage = async (input) => {
    if (input.files && input.files[0]) {
        try {
            const base64 = await readFileAsDataURL(input.files[0]);
            const imgHtml = `<img src="${base64}" style="max-width:100%; height:auto; margin:10px 0; border-radius:4px;" alt="Image insérée">`;
            
            const visual = document.getElementById('visual-editor');
            if (visual) visual.focus();
            
            document.execCommand('insertHTML', false, imgHtml);
        } catch (e) {
            console.error("Erreur lors de l'insertion de l'image", e);
        }
        input.value = ""; 
    }
};

window.saveCustomSlide = async () => { 
    const idStr = document.getElementById('edit-slide-id').value;
    const title = document.getElementById('slide-title').value || "Sans titre";
    
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    let content = "";
    if (visualEditor.style.display !== 'none') { content = visualEditor.innerHTML; } 
    else { content = sourceEditor.value; visualEditor.innerHTML = content; }

    const logoInput = document.getElementById('input-custom-logo');
    let logoData = null;

    if (logoInput.files && logoInput.files[0]) {
        try {
            logoData = await readFileAsDataURL(logoInput.files[0]);
        } catch (e) {
            console.error("Erreur lecture logo", e);
        }
    }

    if (idStr) { 
        const id = parseInt(idStr); 
        const pageIndex = appState.pages.findIndex(p => p.id === id); 
        if (pageIndex !== -1) { 
            appState.pages[pageIndex].title = title; 
            appState.pages[pageIndex].content = content;
            if (logoData) {
                appState.pages[pageIndex].logoData = logoData;
            }
        } 
    } else { 
        appState.pages.push({ 
            id: Date.now(), 
            type: 'free', 
            title: title, 
            content: content, 
            visible: true,
            logoData: logoData 
        }); 
    }
    
    document.getElementById('modal-edit-slide').classList.remove('fr-modal--opened'); 
    document.getElementById('modal-edit-slide').close(); 
    updatePagesListUI(); 
    generateReport();
};


function setupScrollTracking() {
    window.removeEventListener('scroll', handleReportScroll);
    window.addEventListener('scroll', handleReportScroll);
}

function handleReportScroll() {
    const pages = document.querySelectorAll('#report-container .page');
    let activePageId = null;

    pages.forEach(page => {
        const rect = page.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 4) {
            activePageId = page.getAttribute('data-page-id');
        }
    });

    if (activePageId) {
        highlightAndScrollToNavItem(activePageId);
    }
}

function highlightAndScrollToNavItem(pageId) {
    if (!pageId) return;
    const items = document.querySelectorAll('#pages-list .page-item');
    let targetItem = null;
    let isAlreadyActive = false;
    
    items.forEach(item => {
        if (item.getAttribute('data-page-id') === pageId.toString()) {
            if (item.classList.contains('active-page-item')) {
                isAlreadyActive = true; 
            } else {
                item.classList.add('active-page-item');
            }
            targetItem = item;
        } else {
            item.classList.remove('active-page-item');
        }
    });
    
    if (targetItem && !isAlreadyActive) {
        const container = document.getElementById('pages-list');
        container.scrollTo({
            top: targetItem.offsetTop,
            behavior: 'smooth'
        });
    }
}

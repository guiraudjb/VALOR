import { appState } from '../core/state.js';
import { escapeHtml, getAbbreviatedName, formatValue } from '../core/utils.js';
import { getFeaturesForPage, getCodeFromFeature, getGeoFeatures } from '../core/geoUtils.js';
import { DEP_NAMES, REG_NAMES } from '../config/constants.js';
import { PALETTE_SCALES, PALETTE_GRADIENTS } from '../config/palettes.js'; // <-- NOUVEL IMPORT

// NOUVEAU : Fonction pour calculer le contraste optimal
// Retourne du texte blanc sur fond sombre, et du texte bleu foncé sur fond clair
function getContrastStyle(bgColor) {
    if (!bgColor) return { fill: '#000091', stroke: '#FFFFFF' };
    
    // D3 convertit n'importe quel format de couleur (hex, rgb, etc.) en objet RGB
    const rgb = window.d3.color(bgColor).rgb();
    
    // Formule standard de luminosité perçue (YIQ)
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    if (brightness < 128) {
        // Fond sombre -> Texte Blanc, Contour Bleu foncé (DSFR)
        return { fill: '#FFFFFF', stroke: '#000091' }; 
    } else {
        // Fond clair -> Texte Bleu foncé (DSFR), Contour Blanc
        return { fill: '#000091', stroke: '#FFFFFF' }; 
    }
}

function rectCollide(nodes, padding) {
    const quadtree = window.d3.quadtree(nodes, d => d.x, d => d.y);
    nodes.forEach(d => {
        const r = d.width/2 + padding;
        const nx1 = d.x - r, nx2 = d.x + r, ny1 = d.y - d.height/2 - padding, ny2 = d.y + d.height/2 + padding;
        quadtree.visit((visited, x1, y1, x2, y2) => {
            if (visited.data && (visited.data !== d)) {
                let x = d.x - visited.data.x, y = d.y - visited.data.y;
                const r_visited = visited.data.width/2 + padding;
                if (x1 < nx2 && x2 > nx1 && y1 < ny2 && y2 > ny1) {
                    const xOverlap = (r + r_visited) - Math.abs(x);
                    const yOverlap = (d.height/2 + visited.data.height/2 + padding*2) - Math.abs(y);
                    if (xOverlap > 0 && yOverlap > 0) {
                        if (xOverlap < yOverlap) { const nudge = xOverlap / 2; if (x > 0) { d.x += nudge; visited.data.x -= nudge; } else { d.x -= nudge; visited.data.x += nudge; } } 
                        else { const nudge = yOverlap / 2; if (y > 0) { d.y += nudge; visited.data.y -= nudge; } else { d.y -= nudge; visited.data.y += nudge; } }
                    }
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    });
}

export function drawD3Map(pageData, config, dataMap, mapId, legendId, subtotalId, granularity) {
    const container = document.getElementById(mapId); if(!container) return;
    // NOUVEAU : On s'assure de vider le conteneur avant de dessiner
    container.innerHTML = '';
    const width = 1400; 
    const height = 900;
    
    let featuresToDraw = getFeaturesForPage(pageData, granularity, appState);
    if (!featuresToDraw || !featuresToDraw.length) { container.innerHTML = "Aucune donnée."; return; }

    const localValues = featuresToDraw.map(f => {
        const code = getCodeFromFeature(f, granularity); const dataObj = dataMap.get(code);
        return (dataObj && dataObj._inSelection && dataObj._computed !== undefined) ? dataObj._computed : null;
    }).filter(v => v !== null && !isNaN(v));
    
    const localMin = localValues.length ? window.d3.min(localValues) : 0;
    const localMax = localValues.length ? window.d3.max(localValues) : 100;
    
    if (config.showSubtotal) {
        const stEl = document.getElementById(subtotalId);
        if (stEl) { 
            let viewTotal = localValues.reduce((acc, curr) => acc + curr, 0);
            stEl.style.display = 'block'; 
            stEl.querySelector('.kpi-value').innerText = viewTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 }); 
        }
    }
    
    let domain = [localMin, localMax];
    if (['dev_abs', 'dev_pct', 'growth'].includes(config.calcMode)) {
        const maxAbs = Math.max(Math.abs(localMin), Math.abs(localMax));
        domain = [-maxAbs, maxAbs];
    }
    
    const interpolator = PALETTE_SCALES[config.palette] || PALETTE_SCALES["sequentialDescending"];
    const colorScale = window.d3.scaleSequential(interpolator).domain(domain);
	const legendDiv = document.getElementById(legendId);
    if(legendDiv) { 
        legendDiv.style.background = PALETTE_GRADIENTS[config.palette];
        
        // 1. On interroge l'échelle D3 pour connaître les couleurs exactes aux deux extrémités
        const colorLeft = colorScale(domain[0]);
        const colorRight = colorScale(domain[1]);
        
        // 2. On récupère les styles de contraste via votre excellente fonction maison
        const styleLeft = getContrastStyle(colorLeft);
        const styleRight = getContrastStyle(colorRight);
        
        // 3. On génère un "stroke" CSS équivalent au SVG avec text-shadow
        const shadowLeft = `-1px -1px 0 ${styleLeft.stroke}, 1px -1px 0 ${styleLeft.stroke}, -1px 1px 0 ${styleLeft.stroke}, 1px 1px 0 ${styleLeft.stroke}`;
        const shadowRight = `-1px -1px 0 ${styleRight.stroke}, 1px -1px 0 ${styleRight.stroke}, -1px 1px 0 ${styleRight.stroke}, 1px 1px 0 ${styleRight.stroke}`;

        // 4. On injecte les spans stylisés (j'ai ajouté padding, line-height et bold pour la finition)
        legendDiv.innerHTML = `
            <span style="float:left; color:${styleLeft.fill}; text-shadow:${shadowLeft}; padding: 0 4px; line-height: 20px; font-weight: bold;">
                ${formatValue(domain[0], config.calcMode)}
            </span>
            <span style="float:right; color:${styleRight.fill}; text-shadow:${shadowRight}; padding: 0 4px; line-height: 20px; font-weight: bold;">
                ${formatValue(domain[1], config.calcMode)}
            </span>
        `; 
    }

    const svg = window.d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");
    
    const projection = window.d3.geoIdentity().reflectY(true).fitSize([width, height], { type: "FeatureCollection", features: featuresToDraw });
    const path = window.d3.geoPath().projection(projection);

    const g = svg.append("g");
    g.selectAll("path").data(featuresToDraw).enter().append("path").attr("d", path)
        .attr("fill", d => { 
            const code = getCodeFromFeature(d, granularity); const dataObj = dataMap.get(code); 
            if (!dataObj || !dataObj._inSelection || dataObj._computed === undefined) return "#f3f5f9"; 
            return colorScale(dataObj._computed); 
        })
        .attr("stroke", "white").attr("stroke-width", granularity === 'com' ? 0.1 : 0.5)
        .on("mouseover", function(event, d) {
            const code = getCodeFromFeature(d, granularity); const dataObj = dataMap.get(code);
            let name = "";
            if (granularity === 'com') name = appState.refData.communes.get(code) || d.properties.libelle || d.properties.nom || code; 
            else name = (granularity === 'dep' ? DEP_NAMES[code] : REG_NAMES[code]) || d.properties.libelle || d.properties.nom;
            
            let tooltipHtml = `<strong>${escapeHtml(name)}</strong> (${code})`;
            
            if (dataObj && dataObj._computed !== undefined) {
                tooltipHtml += `<br><b>Résultat : ${formatValue(dataObj._computed, config.calcMode)}</b><br><hr style="margin:5px 0">`;
                config.selectedMetrics.forEach((m, idx) => {
                    let rowLabel = m;
                    if (config.calcMode === 'growth') rowLabel = idx === 0 ? `Initiale (${m})` : `Arrivée (${m})`;
                    if (config.calcMode === 'ratio') rowLabel = idx === 0 ? `Numérateur (${m})` : `Dénominateur (${m})`;
                    if (['share', 'dev_abs', 'dev_pct'].includes(config.calcMode)) rowLabel = `Valeur brute (${m})`;
                    tooltipHtml += `<br>${rowLabel} : ${formatValue(dataObj[m], 'simple')}`;
                });
            }
            window.d3.select(this).attr("stroke", "orange").attr("stroke-width", 1.5).raise();
            window.d3.select("#d3-tooltip").style("display", "block").html(window.DOMPurify.sanitize(tooltipHtml)).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function(event, d) { window.d3.select(this).attr("stroke", "white").attr("stroke-width", granularity === 'com' ? 0.1 : 0.5); window.d3.select("#d3-tooltip").style("display", "none"); });

    if (granularity === 'com') {
        let depFeatures = getGeoFeatures(appState.geoData.dep, 'a_dep2021').features;
        if (pageData.focus && pageData.focus.type === 'region') depFeatures = depFeatures.filter(f => f.properties.reg === pageData.focus.code);
        else if (pageData.focus && pageData.focus.type === 'department') depFeatures = depFeatures.filter(f => (f.properties.dep || f.properties.code) == pageData.focus.code);
        else if (pageData.focus && pageData.focus.type === 'epci') {
            const epciDeps = [...new Set(appState.refData.epciList.filter(r => r.EPCI === pageData.focus.code).map(r => r.DEP))];
            depFeatures = depFeatures.filter(f => epciDeps.includes((f.properties.dep || f.properties.code)));
        }
        g.append("g").selectAll("path").data(depFeatures).enter().append("path").attr("d", path).attr("fill", "none").attr("stroke", "#444").attr("stroke-width", "0.8px").style("pointer-events", "none");
    }

    if (pageData.showLabels) { 
        const labelNodes = [];
        const labelSize = pageData.labelSize || 8;
        const tempGroup = svg.append("g").style("opacity", 0);

        featuresToDraw.forEach(d => {
            const code = getCodeFromFeature(d, granularity); const dataObj = dataMap.get(code);
            if (!dataObj || !dataObj._inSelection || dataObj._computed === undefined) return; 

            const centroid = path.centroid(d); if (isNaN(centroid[0])) return;
            
            // On calcule ici la couleur de remplissage exacte du département sur la carte
            const bgColor = colorScale(dataObj._computed);
            
            let rawName = "";
            if (granularity === 'com') rawName = appState.refData.communes.get(code) || d.properties.libelle || d.properties.nom || "";
            else rawName = (granularity === 'dep' ? DEP_NAMES[code] : REG_NAMES[code]) || d.properties.libelle || d.properties.nom || "";
            const abbrName = getAbbreviatedName(rawName);
            
            let vals = [];
            if (['simple', 'top10', 'flop10'].includes(config.calcMode)) {
                vals.push(formatValue(dataObj._computed, config.calcMode));
            } else {
                let prefix = "";
                if (config.calcMode === 'sum') prefix = "Σ:"; else if (config.calcMode === 'avg') prefix = "Moy:";
                else if (config.calcMode === 'ratio') prefix = "R:"; else if (config.calcMode === 'growth') prefix = "Évol:";
                else if (config.calcMode === 'share') prefix = "Part:"; else if (config.calcMode.startsWith('dev')) prefix = "Écart:";
                
                vals.push(`${prefix} ${formatValue(dataObj._computed, config.calcMode)}`);
                
                
                if (pageData.richLabels) {
                    config.selectedMetrics.forEach((m, idx) => {
                        if (dataObj[m] !== undefined) {
                            let shortName = m.substring(0,3);
                            if (config.calcMode === 'growth') shortName = idx === 0 ? "Ini" : "Fin";
                            if (config.calcMode === 'ratio') shortName = idx === 0 ? "Num" : "Dén";
                            if (['share', 'dev_abs', 'dev_pct'].includes(config.calcMode)) shortName = "Val";
                            vals.push(`${shortName}: ${formatValue(dataObj[m], 'simple')}`);
                        }
                    });
                }
            }
            
            const labelText = `${abbrName} : ${vals.join(' | ')}`;
            const txt = tempGroup.append("text").style("font-size", labelSize + "px").style("font-weight", "bold").text(labelText);
            const bbox = txt.node().getBBox();
            
            // On stocke la bgColor dans le nœud pour l'utiliser lors du rendu
            labelNodes.push({ fx: null, fy: null, x: centroid[0], y: centroid[1], targetX: centroid[0], targetY: centroid[1], width: bbox.width + 4, height: bbox.height + 2, text: labelText, code: code, bgColor: bgColor });
        });
        tempGroup.remove();

        const simulation = window.d3.forceSimulation(labelNodes)
            .force("charge", window.d3.forceManyBody().strength(-10)) 
            .force("anchorX", window.d3.forceX(d => d.targetX).strength(0.05))
            .force("anchorY", window.d3.forceY(d => d.targetY).strength(0.05))
            .stop();
            
        for (let i = 0; i < 250; ++i) {
            simulation.tick(); rectCollide(labelNodes, 2);
            labelNodes.forEach(d => { d.x = Math.max((d.width/2)+15, Math.min(width - (d.width/2)-15, d.x)); d.y = Math.max((d.height/2)+15, Math.min(height - (d.height/2)-15, d.y)); });
        }

        const labelsGroup = svg.append("g").style("pointer-events", "none");
        labelsGroup.selectAll(".label-link").data(labelNodes.filter(d => Math.sqrt(Math.pow(d.x - d.targetX, 2) + Math.pow(d.y - d.targetY, 2)) > (d.width / 2))).enter().append("line").attr("class", "label-link").attr("x1", d => d.targetX).attr("y1", d => d.targetY).attr("x2", d => d.x).attr("y2", d => d.y);
        
        const texts = labelsGroup.selectAll(".label-text-group").data(labelNodes).enter().append("g").attr("transform", d => `translate(${d.x},${d.y})`);
        
        // CONTOUR (Stroke) dynamique basé sur le contraste
        texts.append("text")
            .attr("class", "label-text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", labelSize + "px")
            .style("stroke", d => getContrastStyle(d.bgColor).stroke)
            .style("stroke-width", "3px")
            .text(d => d.text);
        
        // TEXTE (Fill) dynamique basé sur le contraste
        texts.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", labelSize + "px")
            .style("font-weight", "bold")
            .style("fill", d => getContrastStyle(d.bgColor).fill)
            .text(d => d.text);
    }
}

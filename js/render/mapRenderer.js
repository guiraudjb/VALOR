import { appState } from "../core/state.js";
import { escapeHtml, getAbbreviatedName, formatValue } from "../core/utils.js";
import {
  getFeaturesForPage,
  getCodeFromFeature,
  getGeoFeatures,
} from "../core/geoUtils.js";
import { DEP_NAMES, REG_NAMES } from "../config/constants.js";
import { PALETTE_SCALES, PALETTE_GRADIENTS } from "../config/palettes.js"; // <-- NOUVEL IMPORT

// NOUVEAU : Fonction pour calculer le contraste optimal
// Retourne du texte blanc sur fond sombre, et du texte bleu foncé sur fond clair
function getContrastStyle(bgColor) {
  if (!bgColor) return { fill: "#000091", stroke: "#FFFFFF" };

  // D3 convertit n'importe quel format de couleur (hex, rgb, etc.) en objet RGB
  const rgb = window.d3.color(bgColor).rgb();

  // Formule standard de luminosité perçue (YIQ)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  if (brightness < 128) {
    // Fond sombre -> Texte Blanc, Contour Bleu foncé (DSFR)
    return { fill: "#FFFFFF", stroke: "#000091" };
  } else {
    // Fond clair -> Texte Bleu foncé (DSFR), Contour Blanc
    return { fill: "#000091", stroke: "#FFFFFF" };
  }
}

function rectCollide(nodes, padding) {
  const quadtree = window.d3.quadtree(
    nodes,
    (d) => d.x,
    (d) => d.y,
  );
  nodes.forEach((d) => {
    const r = d.width / 2 + padding;
    const nx1 = d.x - r,
      nx2 = d.x + r,
      ny1 = d.y - d.height / 2 - padding,
      ny2 = d.y + d.height / 2 + padding;
    quadtree.visit((visited, x1, y1, x2, y2) => {
      if (visited.data && visited.data !== d) {
        let x = d.x - visited.data.x,
          y = d.y - visited.data.y;
        const r_visited = visited.data.width / 2 + padding;
        if (x1 < nx2 && x2 > nx1 && y1 < ny2 && y2 > ny1) {
          const xOverlap = r + r_visited - Math.abs(x);
          const yOverlap =
            d.height / 2 + visited.data.height / 2 + padding * 2 - Math.abs(y);
          if (xOverlap > 0 && yOverlap > 0) {
            if (xOverlap < yOverlap) {
              const nudge = xOverlap / 2;
              if (x > 0) {
                d.x += nudge;
                visited.data.x -= nudge;
              } else {
                d.x -= nudge;
                visited.data.x += nudge;
              }
            } else {
              const nudge = yOverlap / 2;
              if (y > 0) {
                d.y += nudge;
                visited.data.y -= nudge;
              } else {
                d.y -= nudge;
                visited.data.y += nudge;
              }
            }
          }
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  });
}

export function drawD3Map(
  pageData,
  config,
  dataMap,
  mapId,
  legendId,
  subtotalId,
  granularity,
) {
  const container = document.getElementById(mapId);
  if (!container) return;
  // NOUVEAU : On s'assure de vider le conteneur avant de dessiner
  container.innerHTML = "";
  const width = 1400;
  const height = 900;

  let featuresToDraw = getFeaturesForPage(pageData, granularity, appState);
  if (!featuresToDraw || !featuresToDraw.length) {
    container.innerHTML = "Aucune donnée.";
    return;
  }

  const localValues = featuresToDraw
    .map((f) => {
      const code = getCodeFromFeature(f, granularity);
      const dataObj = dataMap.get(code);
      return dataObj && dataObj._inSelection && dataObj._computed !== undefined
        ? dataObj._computed
        : null;
    })
    .filter((v) => v !== null && !isNaN(v));

  const localMin = localValues.length ? window.d3.min(localValues) : 0;
  const localMax = localValues.length ? window.d3.max(localValues) : 100;

  if (config.showSubtotal) {
    const stEl = document.getElementById(subtotalId);
    if (stEl) {
      let viewTotal = localValues.reduce((acc, curr) => acc + curr, 0);
      stEl.style.display = "block";
      stEl.querySelector(".kpi-value").innerText = viewTotal.toLocaleString(
        "fr-FR",
        { maximumFractionDigits: 0 },
      );
    }
  }

  let domain = [localMin, localMax];
  if (["dev_abs", "dev_pct", "growth"].includes(config.calcMode)) {
    const maxAbs = Math.max(Math.abs(localMin), Math.abs(localMax));
    domain = [-maxAbs, maxAbs];
  }

  const interpolator =
    PALETTE_SCALES[config.palette] || PALETTE_SCALES["sequentialDescending"];
  const colorScale = window.d3.scaleSequential(interpolator).domain(domain);
  const legendDiv = document.getElementById(legendId);
  if (legendDiv) {
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

  //const svg = window.d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("width", "100%").style("height", "100%");
  const svg = window.d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet") // Force le maintien du ratio au centre
    .style("width", "100%")
    .style("height", "auto"); // La hauteur s'ajuste désormais proportionnellement
  const projection = window.d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([width, height], {
      type: "FeatureCollection",
      features: featuresToDraw,
    });
  const path = window.d3.geoPath().projection(projection);

  const g = svg.append("g");
  g.selectAll("path")
    .data(featuresToDraw)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const code = getCodeFromFeature(d, granularity);
      const dataObj = dataMap.get(code);
      if (!dataObj || !dataObj._inSelection || dataObj._computed === undefined)
        return "#f3f5f9";
      return colorScale(dataObj._computed);
    })
    .attr("stroke", "white")
    .attr("stroke-width", granularity === "com" ? 0.1 : 0.5)
    .on("mouseover", function (event, d) {
      const code = getCodeFromFeature(d, granularity);
      const dataObj = dataMap.get(code);
      let name = "";
      if (granularity === "com")
        name =
          appState.refData.communes.get(code) ||
          d.properties.nom_officiel ||
          d.properties.libelle ||
          d.properties.nom ||
          code;
      else
        name =
          (granularity === "dep" ? DEP_NAMES[code] : REG_NAMES[code]) ||
          d.properties.nom_officiel ||
          d.properties.libelle ||
          d.properties.nom;
      let tooltipHtml = `<strong>${escapeHtml(name)}</strong> (${code})`;

      if (dataObj && dataObj._computed !== undefined) {
        tooltipHtml += `<br><b>Résultat : ${formatValue(dataObj._computed, config.calcMode)}</b><br><hr style="margin:5px 0">`;
        config.selectedMetrics.forEach((m, idx) => {
          if (config.calcMode !== "custom") {
            config.selectedMetrics.forEach((m, idx) => {
              let rowLabel = m;
              if (config.calcMode === "growth")
                rowLabel = idx === 0 ? `Initiale (${m})` : `Arrivée (${m})`;
              if (config.calcMode === "ratio")
                rowLabel =
                  idx === 0 ? `Numérateur (${m})` : `Dénominateur (${m})`;
              if (["share", "dev_abs", "dev_pct"].includes(config.calcMode))
                rowLabel = `Valeur brute (${m})`;
              tooltipHtml += `<br>${rowLabel} : ${formatValue(dataObj[m], "simple")}`;
            });
          }

          let rowLabel = m;
          if (config.calcMode === "growth")
            rowLabel = idx === 0 ? `Initiale (${m})` : `Arrivée (${m})`;
          if (config.calcMode === "ratio")
            rowLabel = idx === 0 ? `Numérateur (${m})` : `Dénominateur (${m})`;
          if (["share", "dev_abs", "dev_pct"].includes(config.calcMode))
            rowLabel = `Valeur brute (${m})`;
          tooltipHtml += `<br>${rowLabel} : ${formatValue(dataObj[m], "simple")}`;
        });
      }
      window.d3
        .select(this)
        .attr("stroke", "orange")
        .attr("stroke-width", 1.5)
        .raise();
      window.d3
        .select("#d3-tooltip")
        .style("display", "block")
        .html(window.DOMPurify.sanitize(tooltipHtml))
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function (event, d) {
      window.d3
        .select(this)
        .attr("stroke", "white")
        .attr("stroke-width", granularity === "com" ? 0.1 : 0.5);
      window.d3.select("#d3-tooltip").style("display", "none");
    });

  if (granularity === "com") {
    let depFeatures = getGeoFeatures(
      appState.geoData.dep,
      "a_dep2021",
    ).features;

    if (pageData.focus && pageData.focus.type === "region") {
      depFeatures = depFeatures.filter(
        (f) =>
          (f.properties.reg || f.properties.code_insee_de_la_region) ===
          pageData.focus.code,
      );
    } else if (pageData.focus && pageData.focus.type === "department") {
      // CORRECTION : Ajout de code_insee
      depFeatures = depFeatures.filter(
        (f) =>
          (f.properties.dep || f.properties.code || f.properties.code_insee) ==
          pageData.focus.code,
      );
    } else if (pageData.focus && pageData.focus.type === "epci") {
      const epciDeps = [
        ...new Set(
          appState.refData.epciList
            .filter((r) => r.EPCI === pageData.focus.code)
            .map((r) => r.DEP),
        ),
      ];
      // CORRECTION : Ajout de code_insee
      depFeatures = depFeatures.filter((f) =>
        epciDeps.includes(
          f.properties.dep || f.properties.code || f.properties.code_insee,
        ),
      );
    }

    g.append("g")
      .selectAll("path")
      .data(depFeatures)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#444")
      .attr("stroke-width", "0.8px")
      .style("pointer-events", "none");
  }

  if (pageData.showLabels) {
    const labelNodes = [];
    const labelSize = pageData.labelSize || 8;
    const tempGroup = svg.append("g").style("opacity", 0);

    featuresToDraw.forEach((d) => {
      const code = getCodeFromFeature(d, granularity);
      const dataObj = dataMap.get(code);
      if (!dataObj || !dataObj._inSelection || dataObj._computed === undefined)
        return;

      const centroid = path.centroid(d);
      if (isNaN(centroid[0])) return;

      // On calcule ici la couleur de remplissage exacte du département sur la carte
      const bgColor = colorScale(dataObj._computed);

      let rawName = "";
      if (granularity === "com")
        rawName =
          appState.refData.communes.get(code) ||
          d.properties.nom_officiel ||
          d.properties.libelle ||
          d.properties.nom ||
          "";
      else
        rawName =
          (granularity === "dep" ? DEP_NAMES[code] : REG_NAMES[code]) ||
          d.properties.nom_officiel ||
          d.properties.libelle ||
          d.properties.nom ||
          "";
      const abbrName = getAbbreviatedName(rawName);

      let vals = [];
      if (["simple", "top10", "flop10", "custom"].includes(config.calcMode)) {
        vals.push(formatValue(dataObj._computed, config.calcMode));
      } else {
        let prefix = "";
        if (config.calcMode === "sum") prefix = "Σ:";
        else if (config.calcMode === "avg") prefix = "Moy:";
        else if (config.calcMode === 'median') prefix = "Med:";
        else if (config.calcMode === "ratio") prefix = "R:";
        else if (config.calcMode === "growth") prefix = "Évol:";
        else if (config.calcMode === "share") prefix = "Part:";
        else if (config.calcMode.startsWith("dev")) prefix = "Écart:";

        vals.push(
          `${prefix} ${formatValue(dataObj._computed, config.calcMode)}`,
        );

        if (pageData.richLabels) {
          config.selectedMetrics.forEach((m, idx) => {
            if (dataObj[m] !== undefined) {
              let shortName = m.substring(0, 3);
              if (config.calcMode === "growth")
                shortName = idx === 0 ? "Ini" : "Fin";
              if (config.calcMode === "ratio")
                shortName = idx === 0 ? "Num" : "Dén";
              if (["share", "dev_abs", "dev_pct"].includes(config.calcMode))
                shortName = "Val";
              vals.push(`${shortName}: ${formatValue(dataObj[m], "simple")}`);
            }
          });
        }
      }

      const labelText = `${abbrName} : ${vals.join(" | ")}`;
      const txt = tempGroup
        .append("text")
        .style("font-size", labelSize + "px")
        .style("font-weight", "bold")
        .text(labelText);
      const bbox = txt.node().getBBox();

      // On stocke la bgColor dans le nœud pour l'utiliser lors du rendu
      labelNodes.push({
        fx: null,
        fy: null,
        x: centroid[0],
        y: centroid[1],
        targetX: centroid[0],
        targetY: centroid[1],
        width: bbox.width + 4,
        height: bbox.height + 2,
        text: labelText,
        code: code,
        bgColor: bgColor,
      });
    });
    tempGroup.remove();

    const simulation = window.d3
      .forceSimulation(labelNodes)
      .force("charge", window.d3.forceManyBody().strength(-10))
      .force("anchorX", window.d3.forceX((d) => d.targetX).strength(0.05))
      .force("anchorY", window.d3.forceY((d) => d.targetY).strength(0.05))
      .stop();

    for (let i = 0; i < 250; ++i) {
      simulation.tick();
      rectCollide(labelNodes, 2);
      labelNodes.forEach((d) => {
        d.x = Math.max(
          d.width / 2 + 15,
          Math.min(width - d.width / 2 - 15, d.x),
        );
        d.y = Math.max(
          d.height / 2 + 15,
          Math.min(height - d.height / 2 - 15, d.y),
        );
      });
    }

    const labelsGroup = svg.append("g").style("pointer-events", "none");
    labelsGroup
      .selectAll(".label-link")
      .data(
        labelNodes.filter(
          (d) =>
            Math.sqrt(
              Math.pow(d.x - d.targetX, 2) + Math.pow(d.y - d.targetY, 2),
            ) >
            d.width / 2,
        ),
      )
      .enter()
      .append("line")
      .attr("class", "label-link")
      .attr("x1", (d) => d.targetX)
      .attr("y1", (d) => d.targetY)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y);

    const texts = labelsGroup
      .selectAll(".label-text-group")
      .data(labelNodes)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // CONTOUR (Stroke) dynamique basé sur le contraste
    texts
      .append("text")
      .attr("class", "label-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", labelSize + "px")
      .style("stroke", (d) => getContrastStyle(d.bgColor).stroke)
      .style("stroke-width", "3px")
      .text((d) => d.text);

    // TEXTE (Fill) dynamique basé sur le contraste
    texts
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", labelSize + "px")
      .style("font-weight", "bold")
      .style("fill", (d) => getContrastStyle(d.bgColor).fill)
      .text((d) => d.text);
  }
    // ==========================================
    // NOUVEAU : COUCHE D'ANNOTATIONS VECTORIELLES (V12 - Support total Icônes & Pictogrammes)
    // ==========================================
    
    // --- 1. GESTION GLOBALE DE LA MODALE D'ICÔNES POUR LA CARTE ---
    if (!window.mapIconPickerListenerAdded) {
        window.mapIconPickerListenerAdded = true;
        // L'état stocke désormais un objet pour savoir si c'est une classe ou une image
        window.activeMapIconData = { type: 'class', value: 'fr-icon-map-pin-2-fill' }; 
        
        window.openMapIconPicker = function(pageId) {
            window.mapIconPickerActive = true;
            window.currentMapPageId = pageId;
            
            if (typeof window.openIconPicker === 'function') {
                window.openIconPicker(); 
            }
            
            const modal = document.getElementById('modal-dsfr-icons');
            if (modal) {
                if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
                modal.classList.add('fr-modal--opened');
            }
        };

        // Intercepteur intelligent
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('modal-dsfr-icons');
            if (window.mapIconPickerActive && modal && modal.contains(e.target)) {
                
                if (e.target.closest('.fr-btn--close')) {
                    window.mapIconPickerActive = false; return;
                }

                const grid = document.getElementById('icon-picker-grid');
                if (!grid || !grid.contains(e.target)) return; 

                let iconData = null;
                let el = e.target;
                
                // On remonte l'arbre DOM pour trouver ce sur quoi l'utilisateur a cliqué
                while (el && el !== grid) {
                    // Test 1 : Est-ce une image (Pictogramme) ?
                    if (el.tagName === 'IMG' && el.getAttribute('src')) {
                        iconData = { type: 'src', value: el.getAttribute('src') }; break;
                    }
                    const imgChild = el.querySelector('img');
                    if (imgChild && imgChild.getAttribute('src')) {
                        iconData = { type: 'src', value: imgChild.getAttribute('src') }; break;
                    }

                    // Test 2 : Est-ce une classe CSS (Icône simple) ?
                    let classStr = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
                    let match = classStr.match(/(?:fr\-icon\-|fr\-fi\-)(?!-)[a-zA-Z0-9\-]+/); // Regex précise
                    if (match) { iconData = { type: 'class', value: match[0] }; break; }
                    
                    const classChild = el.querySelector('[class*="fr-icon-"], [class*="fr-fi-"]');
                    if (classChild) {
                        let childClassStr = typeof classChild.className === 'string' ? classChild.className : (classChild.getAttribute('class') || '');
                        let matchChild = childClassStr.match(/(?:fr\-icon\-|fr\-fi\-)(?!-)[a-zA-Z0-9\-]+/);
                        if (matchChild) { iconData = { type: 'class', value: matchChild[0] }; break; }
                    }

                    el = el.parentElement;
                }

                if (iconData) {
                    e.preventDefault(); e.stopPropagation(); // On bloque l'éditeur WYSIWYG

                    window.activeMapIconData = iconData;
                    
                    // Mise à jour visuelle des boutons selon le type trouvé
                    const btnClass = iconData.type === 'class' ? iconData.value : 'fr-icon-image-fill';
                    const btnChoose = document.querySelector(`.btn-choose-map-icon[data-page-id="${window.currentMapPageId}"]`);
                    if (btnChoose) btnChoose.className = `fr-btn fr-btn--sm fr-btn--secondary ${btnClass} btn-choose-map-icon`;
                    
                    const btnMain = document.querySelector(`.btn-draw-icon[data-page-id="${window.currentMapPageId}"]`);
                    if (btnMain) btnMain.className = `fr-btn fr-btn--sm fr-btn--secondary ${btnClass} btn-draw-icon`;

                    modal.classList.remove('fr-modal--opened');
                    if (typeof modal.close === 'function') modal.close();
                    
                    window.mapIconPickerActive = false;
                }
            }
        }, true);
    }

    // --- 2. DÉFINITION DES POINTEURS ---
    const defs = svg.append("defs");
    defs.append("marker").attr("id", "arrowhead-dark").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("orient", "auto").attr("markerWidth", 6).attr("markerHeight", 6).append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#000091");
    defs.append("marker").attr("id", "arrowhead-light").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("orient", "auto").attr("markerWidth", 6).attr("markerHeight", 6).append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#FFFFFF");

    const annotationsGroup = svg.append("g").attr("class", "annotations-layer");

    let isDraggingAnno = false; let draggingAnnoIndex = null; let dragStartMouse = null; let dragStartAnnoCoords = null;

    // --- 3. FONCTION DE RENDU ---
    function renderAnnotations() {
        annotationsGroup.selectAll("*").remove();
        if (!pageData.annotations) pageData.annotations = [];

        pageData.annotations.forEach((anno, index) => {
            const strokeColor = anno.color || "#000091";
            const inverseColor = strokeColor === "#FFFFFF" ? "rgba(0,0,145,0.6)" : "rgba(255,255,255,0.8)";
            let textHalo = `-2px -2px 2px ${inverseColor}, 2px -2px 2px ${inverseColor}, -2px 2px 2px ${inverseColor}, 2px 2px 2px ${inverseColor}, 0 0 5px ${inverseColor}`;
            let controlX = 0; let controlY = 0; let drawSuccess = false;

            if (anno.type === "shape" || anno.type === "circle") {
                const coords = projection([anno.x, anno.y]);
                if (coords) {
                    drawSuccess = true; controlX = coords[0] + 15; controlY = coords[1] - 15;
                    const shape = anno.shape || "circle";
                    const gShape = annotationsGroup.append("g").attr("transform", `translate(${coords[0]}, ${coords[1]})`);
                    const drawShape = (sel, color, width, isHalo) => {
                        const dash = isHalo ? "none" : (shape === "circle" || shape === "rect" ? "5,5" : "none");
                        if (shape === "circle") sel.append("circle").attr("r", 20).attr("fill", "none").attr("stroke", color).attr("stroke-width", width).attr("stroke-dasharray", dash);
                        else if (shape === "rect") sel.append("rect").attr("x", -18).attr("y", -18).attr("width", 36).attr("height", 36).attr("fill", "none").attr("stroke", color).attr("stroke-width", width).attr("stroke-dasharray", dash);
                        else if (shape === "star") sel.append("path").attr("d", "M 0 -20 L 5.88 -5.88 L 20 -5.88 L 8.56 2.94 L 12.94 18.04 L 0 9.4 L -12.94 18.04 L -8.56 2.94 L -20 -5.88 L -5.88 -5.88 Z").attr("fill", "none").attr("stroke", color).attr("stroke-width", width).attr("stroke-linejoin", "round");
                        else if (shape === "check") sel.append("path").attr("d", "M -15 0 L -5 10 L 15 -15").attr("fill", "none").attr("stroke", color).attr("stroke-width", width).attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
                    };
                    drawShape(gShape, inverseColor, 6, true); drawShape(gShape, strokeColor, 3, false);
                }
            } else if (anno.type === "arrow") {
                const start = projection([anno.startX, anno.startY]); const end = projection([anno.endX, anno.endY]);
                if (start && end) {
                    drawSuccess = true; controlX = start[0]; controlY = start[1] - 15;
                    const marker = anno.marker || "url(#arrowhead-dark)";
                    annotationsGroup.append("line").attr("x1", start[0]).attr("y1", start[1]).attr("x2", end[0]).attr("y2", end[1]).attr("stroke", inverseColor).attr("stroke-width", 6);
                    annotationsGroup.append("line").attr("x1", start[0]).attr("y1", start[1]).attr("x2", end[0]).attr("y2", end[1]).attr("stroke", strokeColor).attr("stroke-width", 3).attr("marker-end", marker);
                }
            } else if (anno.type === "text") {
                const coords = projection([anno.x, anno.y]);
                if (coords) {
                    drawSuccess = true; controlX = coords[0] + 90; controlY = coords[1] - 15;
                    const fSize = anno.fontSize || "1rem"; const bStyle = anno.borderStyle || "none";
                    let bgCss = "transparent", borderCss = "none", borderRadius = "0px", paddingCss = "0px";
                    if (bStyle !== "none") { bgCss = "rgba(255, 255, 255, 0.85)"; borderCss = `2px solid ${strokeColor}`; paddingCss = "6px 12px"; textHalo = "none"; borderRadius = bStyle === "round" ? "20px" : "4px"; }

                    const fo = annotationsGroup.append("foreignObject").attr("x", coords[0] - 100).attr("y", coords[1] - 15).attr("width", 200).attr("height", 150).style("overflow", "visible");
                    fo.append("xhtml:div")
                        .style("background-color", bgCss).style("color", strokeColor).style("text-shadow", textHalo).style("border", borderCss).style("border-radius", borderRadius).style("padding", paddingCss)
                        .style("font-weight", "bold").style("text-align", "center").style("font-size", fSize).style("font-family", "Marianne, Arial, sans-serif").style("outline", "none")
                        .style("cursor", currentDrawMode === 'none' ? "default" : "text").style("min-width", "50px").style("min-height", "30px").style("display", "inline-block")
                        .attr("contenteditable", currentDrawMode === 'none' ? "false" : "true").html(anno.content || "Texte...")
                        .on("input", function() { anno.content = this.innerHTML; if (window.markAsDirty) window.markAsDirty(); })
                        .on("mousedown", function(e) { e.stopPropagation(); });
                }
            } else if (anno.type === "icon") {
                // --- INTÉGRATION INTELLIGENTE DES PICTOGRAMMES ET ICÔNES ---
                const coords = projection([anno.x, anno.y]);
                if (coords) {
                    drawSuccess = true; controlX = coords[0] + 15; controlY = coords[1] - 25; 
                    const iSize = anno.iconSize || "2.5rem"; 
                    const iconData = anno.iconData || { type: 'class', value: 'fr-icon-map-pin-2-fill' };

                    const fo = annotationsGroup.append("foreignObject")
                        .attr("x", coords[0] - 50).attr("y", coords[1] - 50)
                        .attr("width", 100).attr("height", 100).style("overflow", "visible");

                    const wrapper = fo.append("xhtml:div")
                        .style("display", "flex").style("justify-content", "center").style("align-items", "center")
                        .style("width", "100%").style("height", "100%").style("pointer-events", "none");

                    if (iconData.type === 'class') {
                        // Rendu d'une icône CSS (Police)
                        wrapper.append("xhtml:span")
                            .attr("class", iconData.value).style("color", strokeColor).style("text-shadow", textHalo).style("font-size", iSize);
                    } else if (iconData.type === 'src') {
                        // Rendu d'un Pictogramme (Image)
                        const filterDropShadow = strokeColor === "#FFFFFF" ? "drop-shadow(0px 0px 4px rgba(0,0,145,0.6))" : "drop-shadow(0px 0px 4px rgba(255,255,255,0.8))";
                        wrapper.append("xhtml:img")
                            .attr("src", iconData.value).style("width", iSize).style("height", iSize).style("object-fit", "contain").style("filter", filterDropShadow);
                    }
                }
            }

            // Poignées de contrôle
            if (drawSuccess && currentDrawMode === 'none') {
                const controls = annotationsGroup.append("g").attr("transform", `translate(${controlX}, ${controlY})`);
                const btnMove = controls.append("g").style("cursor", "move").on("mousedown", (e) => { e.stopPropagation(); isDraggingAnno = true; draggingAnnoIndex = index; dragStartMouse = window.d3.pointer(e, svg.node()); dragStartAnnoCoords = JSON.parse(JSON.stringify(anno)); });
                btnMove.append("circle").attr("cx", -22).attr("cy", 0).attr("r", 9).attr("fill", "#000091").attr("stroke", "white").attr("stroke-width", 2);
                btnMove.append("text").text("☩").attr("x", -22).attr("y", 4).attr("fill", "white").attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").style("pointer-events", "none");
                const btnDel = controls.append("g").style("cursor", "pointer").on("mousedown", (e) => { e.stopPropagation(); pageData.annotations.splice(index, 1); renderAnnotations(); if (window.markAsDirty) window.markAsDirty(); });
                btnDel.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 9).attr("fill", "#ce0500").attr("stroke", "white").attr("stroke-width", 2);
                btnDel.append("text").text("×").attr("x", 0).attr("y", 3).attr("fill", "white").attr("text-anchor", "middle").style("font-size", "14px").style("font-weight", "bold").style("pointer-events", "none");
            }
        });
    }

    // --- 4. INTERACTIONS ---
    let currentDrawMode = 'none'; let isDrawingArrow = false; let dragStartCoords = null; let tempArrow = null; let tempBgArrow = null;
    let activeColor = "#000091"; let activeMarker = "url(#arrowhead-dark)"; let activeInverse = "rgba(255,255,255,0.7)";

    const btnPointer = document.querySelector(`.btn-draw-pointer[data-page-id="${pageData.id}"]`);
    const btnShape = document.querySelector(`.btn-draw-shape[data-page-id="${pageData.id}"]`);
    const btnArrow = document.querySelector(`.btn-draw-arrow[data-page-id="${pageData.id}"]`);
    const btnText = document.querySelector(`.btn-draw-text[data-page-id="${pageData.id}"]`);
    const btnIcon = document.querySelector(`.btn-draw-icon[data-page-id="${pageData.id}"]`);
    const selShape = document.querySelector(`.shape-type-select[data-page-id="${pageData.id}"]`);
    const selSize = document.querySelector(`.text-size-select[data-page-id="${pageData.id}"]`);
    const selBorder = document.querySelector(`.text-border-select[data-page-id="${pageData.id}"]`);
    const grpIconOpts = document.querySelector(`.icon-options-group[data-page-id="${pageData.id}"]`); 
    const selIconSize = document.querySelector(`.icon-size-select[data-page-id="${pageData.id}"]`); 
    const btnClear = document.querySelector(`.btn-clear-draw[data-page-id="${pageData.id}"]`);

    function updateButtonsUI() {
        if (btnPointer) { btnPointer.classList.toggle("fr-btn--secondary", currentDrawMode === 'none'); btnPointer.classList.toggle("fr-btn--tertiary-no-outline", currentDrawMode !== 'none'); }
        if (btnShape) { btnShape.classList.toggle("fr-btn--secondary", currentDrawMode === 'shape'); btnShape.classList.toggle("fr-btn--tertiary-no-outline", currentDrawMode !== 'shape'); }
        if (btnArrow) { btnArrow.classList.toggle("fr-btn--secondary", currentDrawMode === 'arrow'); btnArrow.classList.toggle("fr-btn--tertiary-no-outline", currentDrawMode !== 'arrow'); }
        if (btnText) { btnText.classList.toggle("fr-btn--secondary", currentDrawMode === 'text'); btnText.classList.toggle("fr-btn--tertiary-no-outline", currentDrawMode !== 'text'); }
        if (btnIcon) { btnIcon.classList.toggle("fr-btn--secondary", currentDrawMode === 'icon'); btnIcon.classList.toggle("fr-btn--tertiary-no-outline", currentDrawMode !== 'icon'); }
        if (selShape) selShape.style.display = currentDrawMode === 'shape' ? 'block' : 'none';
        if (selSize) selSize.style.display = currentDrawMode === 'text' ? 'block' : 'none';
        if (selBorder) selBorder.style.display = currentDrawMode === 'text' ? 'block' : 'none';
        if (grpIconOpts) grpIconOpts.style.display = currentDrawMode === 'icon' ? 'flex' : 'none';
        svg.style("cursor", currentDrawMode !== 'none' ? "crosshair" : "default");
        renderAnnotations();
    }

    if (btnPointer && btnShape && btnArrow && btnText && btnIcon && btnClear) {
        btnPointer.onclick = () => { currentDrawMode = 'none'; updateButtonsUI(); };
        btnShape.onclick = () => { currentDrawMode = 'shape'; updateButtonsUI(); };
        btnArrow.onclick = () => { currentDrawMode = 'arrow'; updateButtonsUI(); };
        btnText.onclick = () => { currentDrawMode = 'text'; updateButtonsUI(); };
        btnIcon.onclick = () => { currentDrawMode = 'icon'; updateButtonsUI(); };
        btnClear.onclick = () => { pageData.annotations = []; renderAnnotations(); if (window.markAsDirty) window.markAsDirty(); };

        updateButtonsUI();

        svg.on("mousedown", function(event) {
            if (currentDrawMode === 'none') return; 
            const [mouseX, mouseY] = window.d3.pointer(event, this);
            const geoCoords = projection.invert([mouseX, mouseY]);
            if (!geoCoords) return;

            activeColor = "#000091"; activeMarker = "url(#arrowhead-dark)"; activeInverse = "rgba(255,255,255,0.7)";
            const feature = window.d3.select(event.target).datum();
            if (feature && feature.properties) {
                const code = getCodeFromFeature(feature, granularity);
                const dataObj = dataMap.get(code);
                if (dataObj && dataObj._inSelection && dataObj._computed !== undefined) {
                    const contrast = getContrastStyle(colorScale(dataObj._computed));
                    activeColor = contrast.fill;
                    if (activeColor === "#FFFFFF") { activeMarker = "url(#arrowhead-light)"; activeInverse = "rgba(0,0,145,0.6)"; }
                }
            }

            if (currentDrawMode === 'shape') {
                const activeShape = selShape ? selShape.value : "circle";
                if (!pageData.annotations) pageData.annotations = [];
                pageData.annotations.push({ type: "shape", shape: activeShape, x: geoCoords[0], y: geoCoords[1], color: activeColor });
                renderAnnotations(); if (window.markAsDirty) window.markAsDirty();
            } else if (currentDrawMode === 'arrow') {
                isDrawingArrow = true; dragStartCoords = geoCoords;
                tempBgArrow = annotationsGroup.append("line").attr("x1", mouseX).attr("y1", mouseY).attr("x2", mouseX).attr("y2", mouseY).attr("stroke", activeInverse).attr("stroke-width", 6);
                tempArrow = annotationsGroup.append("line").attr("x1", mouseX).attr("y1", mouseY).attr("x2", mouseX).attr("y2", mouseY).attr("stroke", activeColor).attr("stroke-width", 3).attr("marker-end", activeMarker);
            } else if (currentDrawMode === 'text') {
                const activeFontSize = selSize ? selSize.value : "1rem"; const activeBorderStyle = selBorder ? selBorder.value : "none";
                if (!pageData.annotations) pageData.annotations = [];
                pageData.annotations.push({ type: "text", x: geoCoords[0], y: geoCoords[1], content: "", color: activeColor, fontSize: activeFontSize, borderStyle: activeBorderStyle });
                currentDrawMode = 'text'; renderAnnotations(); if (window.markAsDirty) window.markAsDirty();
            } else if (currentDrawMode === 'icon') {
                // On récupère désormais l'objet complet (classe CSS ou lien de l'image)
                const activeData = window.activeMapIconData || { type: 'class', value: 'fr-icon-map-pin-2-fill' };
                const activeIconSize = selIconSize ? selIconSize.value : "2.5rem";
                if (!pageData.annotations) pageData.annotations = [];
                pageData.annotations.push({ 
                    type: "icon", 
                    iconData: activeData, 
                    iconSize: activeIconSize, 
                    x: geoCoords[0], y: geoCoords[1], color: activeColor 
                });
                renderAnnotations(); if (window.markAsDirty) window.markAsDirty();
            }
        });

        svg.on("mousemove", function(event) {
            if (isDraggingAnno && draggingAnnoIndex !== null) {
                const [mouseX, mouseY] = window.d3.pointer(event, this);
                const dx = mouseX - dragStartMouse[0]; const dy = mouseY - dragStartMouse[1];
                const anno = pageData.annotations[draggingAnnoIndex]; const orig = dragStartAnnoCoords;
                if (anno.type === 'shape' || anno.type === 'circle' || anno.type === 'text' || anno.type === 'icon') {
                     const origScreen = projection([orig.x, orig.y]);
                     const newGeo = projection.invert([origScreen[0] + dx, origScreen[1] + dy]);
                     anno.x = newGeo[0]; anno.y = newGeo[1];
                } else if (anno.type === 'arrow') {
                     const origStartScreen = projection([orig.startX, orig.startY]); const origEndScreen = projection([orig.endX, orig.endY]);
                     const newStartGeo = projection.invert([origStartScreen[0] + dx, origStartScreen[1] + dy]); const newEndGeo = projection.invert([origEndScreen[0] + dx, origEndScreen[1] + dy]);
                     anno.startX = newStartGeo[0]; anno.startY = newStartGeo[1]; anno.endX = newEndGeo[0]; anno.endY = newEndGeo[1];
                }
                renderAnnotations(); return;
            }
            if (isDrawingArrow && tempArrow) {
                const [mouseX, mouseY] = window.d3.pointer(event, this);
                if(tempBgArrow) tempBgArrow.attr("x2", mouseX).attr("y2", mouseY); tempArrow.attr("x2", mouseX).attr("y2", mouseY);
            }
        });

        svg.on("mouseup", function(event) {
            if (isDraggingAnno) { isDraggingAnno = false; draggingAnnoIndex = null; if (window.markAsDirty) window.markAsDirty(); return; }
            if (isDrawingArrow) {
                isDrawingArrow = false;
                if (tempArrow) { tempArrow.remove(); tempArrow = null; }
                if (tempBgArrow) { tempBgArrow.remove(); tempBgArrow = null; }
                const [mouseX, mouseY] = window.d3.pointer(event, this); const dragEndCoords = projection.invert([mouseX, mouseY]);
                if (dragStartCoords && dragEndCoords && (dragStartCoords[0] !== dragEndCoords[0] || dragStartCoords[1] !== dragEndCoords[1])) {
                    if (!pageData.annotations) pageData.annotations = [];
                    pageData.annotations.push({ type: "arrow", startX: dragStartCoords[0], startY: dragStartCoords[1], endX: dragEndCoords[0], endY: dragEndCoords[1], color: activeColor, marker: activeMarker });
                    renderAnnotations(); if (window.markAsDirty) window.markAsDirty();
                }
            }
        });
    }
}

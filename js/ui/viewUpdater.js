import { appState } from "../core/state.js";
import { escapeHtml } from "../core/utils.js";
import {
  buildDefaultStructure,
  generateReport,
} from "../features/reportGenerator.js";
import { DEP_NAMES, REG_NAMES } from "../config/constants.js";
import { PALETTE_LABELS } from "../config/palettes.js";

export function populatePaletteSelect() {
  const select = document.getElementById("select-palette");
  if (!select) return;

  select.innerHTML = "";

  // On parcourt le dictionnaire des labels pour créer les options
  for (const [key, label] of Object.entries(PALETTE_LABELS)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

export function updateMainBrand() {
  const line1 = document.getElementById("input-brand-1").value || "";
  const line2 = document.getElementById("input-brand-2").value || "";
  const br = line1 && line2 ? "<br>" : "";
  const brandEl = document.getElementById("main-brand-text");
  if (brandEl)
    brandEl.innerHTML = `${escapeHtml(line1)}${br}${escapeHtml(line2)}`;
}

export function updateFilterControls() {
  const checkEnable = document.getElementById("check-enable-filter");
  const filterControls = document.getElementById("filter-controls");
  const selectOp = document.getElementById("select-filter-operator");
  const selectMetric = document.getElementById("select-filter-metric");
  const val1 = document.getElementById("input-filter-val1");
  const val2 = document.getElementById("input-filter-val2");

  if (!checkEnable || !filterControls || !selectOp || !val1 || !val2) return;

  if (checkEnable.checked) {
    filterControls.style.display = "block";
    if (selectMetric) {
      selectMetric.innerHTML =
        '<option value="_computed">Résultat final calculé</option>';
      appState.availableMetrics.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.innerText = m;
        selectMetric.appendChild(opt);
      });
      selectMetric.value = appState.dataFilter.metric || "_computed";
    }

    if (selectOp.value === "between") {
      val2.style.display = "block";
      val1.placeholder = "Valeur min";
    } else {
      val2.style.display = "none";
      val1.placeholder = "Valeur";
    }
  } else {
    filterControls.style.display = "none";
  }
}

export function populateDeptSelect() {
  const sel = document.getElementById("select-dept-target");
  if (!sel) return;
  Object.keys(DEP_NAMES)
    .sort()
    .forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.innerText = `${k} - ${DEP_NAMES[k]}`;
      sel.appendChild(opt);
    });
}

export function populateEpciRegSelect() {
  const sel = document.getElementById("select-epci-reg");
  if (!sel) return;
  const regs = [...new Set(appState.refData.epciList.map((r) => r.REG))].filter(
    Boolean,
  );
  regs.sort().forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.innerText = REG_NAMES[r] ? `${r} - ${REG_NAMES[r]}` : r;
    sel.appendChild(opt);
  });
  sel.onchange = populateEpciDepSelect;
}

export function populateEpciDepSelect() {
  const reg = document.getElementById("select-epci-reg").value;
  const sel = document.getElementById("select-epci-dep");
  sel.innerHTML = '<option value="">-- Choisir --</option>';
  document.getElementById("select-epci-id").innerHTML =
    '<option value="">-- Choisir --</option>';
  if (!reg) return;
  const deps = [
    ...new Set(
      appState.refData.epciList.filter((r) => r.REG === reg).map((r) => r.DEP),
    ),
  ].filter(Boolean);
  deps.sort().forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.innerText = DEP_NAMES[d] ? `${d} - ${DEP_NAMES[d]}` : d;
    sel.appendChild(opt);
  });
  sel.onchange = populateEpciIdSelect;
}

export function populateEpciIdSelect() {
  const dep = document.getElementById("select-epci-dep").value;
  const sel = document.getElementById("select-epci-id");
  sel.innerHTML = '<option value="">-- Choisir --</option>';
  if (!dep) return;
  const epcis = new Map();
  appState.refData.epciList
    .filter((r) => r.DEP === dep)
    .forEach((r) => {
      if (r.EPCI && r.LIBEPCI) epcis.set(r.EPCI, r.LIBEPCI);
    });
  Array.from(epcis.keys())
    .sort()
    .forEach((id) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.innerText = epcis.get(id);
      sel.appendChild(opt);
    });
  sel.onchange = () => {
    appState.isStructureDirty = true;
    markAsDirty();
  };
}

export function updateMetricControls() {
  const wrapperSelect = document.getElementById("wrapper-metric-select");
  const checkboxesContainer = document.getElementById("metric-checkboxes");
  const hint = document.getElementById("metric-hint");
  const wrapperShareBase = document.getElementById("wrapper-share-base");
  const wrapperFilter = document.getElementById("wrapper-data-filter");
  const calcMode = document.getElementById("select-calc-mode").value;
  const formulaWrapper = document.getElementById("wrapper-custom-formula");

  // Ancien ID de conteneur, conservé par sécurité pour la rétrocompatibilité
  const metricsContainer = document.getElementById(
    "metrics-checkboxes-container",
  );

  // 1. GESTION DE L'AFFICHAGE DE L'ÉDITEUR DE FORMULE
  if (calcMode === "custom") {
    if (formulaWrapper) formulaWrapper.style.display = "block";
    if (metricsContainer) metricsContainer.style.display = "none";
  } else {
    if (formulaWrapper) formulaWrapper.style.display = "none";
    if (metricsContainer) metricsContainer.style.display = "flex";
  }

  if (!wrapperSelect || !checkboxesContainer) return;

  if (appState.availableMetrics.length > 0) {
    document.getElementById("select-calc-mode").value = appState.calcMode;
    checkboxesContainer.innerHTML = "";
    const mode = appState.calcMode;

    // 2. GESTION DE LA BASE DE RÉFÉRENCE (Parts et Écarts)
    if (wrapperShareBase) {
      if (["share", "dev_abs", "dev_pct", "top10", "flop10"].includes(mode)) {
        wrapperShareBase.style.display = "block";
        document.getElementById("select-share-base").value = appState.shareBase;
      } else {
        wrapperShareBase.style.display = "none";
      }
    }

    // 3. NOUVEAU : GESTION DU MODE CUSTOM (Badges)
    if (mode === "custom") {
      if (hint) {
        hint.innerHTML = `<span class="fr-icon-info-line" style="color:#000091;"></span> Les variables détectées dans votre formule s'affichent ci-dessous.`;
      }

      if (appState.selectedMetrics.length === 0) {
        checkboxesContainer.innerHTML =
          '<p class="fr-text--sm fr-mb-0" style="color:#666; font-style:italic;">Tapez "[" dans l\'éditeur pour ajouter une donnée à la formule.</p>';
      } else {
        appState.selectedMetrics.forEach((metric) => {
          const badge = document.createElement("span");
          badge.className = "fr-badge fr-badge--info fr-mr-1v fr-mb-1v";
          badge.innerText = metric;
          checkboxesContainer.appendChild(badge);
        });
      }
    }
    // 4. GESTION DES RATIOS ET ÉVOLUTIONS (2 Selects)
    else if (["ratio", "growth"].includes(mode)) {
      if (hint) {
        hint.innerHTML =
          mode === "growth"
            ? `<span class="fr-icon-info-line" style="color:#000091;"></span> Sélectionnez l'année de départ et d'arrivée.`
            : `<span class="fr-icon-info-line" style="color:#000091;"></span> Sélectionnez le numérateur et le dénominateur.`;
      }

      if (appState.selectedMetrics.length < 2) {
        appState.selectedMetrics = [
          appState.availableMetrics[0],
          appState.availableMetrics[1] || appState.availableMetrics[0],
        ];
      }

      const labelA =
        mode === "growth" ? "Valeur initiale (Départ)" : "Numérateur (A)";
      const labelB =
        mode === "growth" ? "Valeur d'arrivée (Fin)" : "Dénominateur (B)";

      const optionsA = appState.availableMetrics
        .map(
          (m) =>
            `<option value="${escapeHtml(m)}" ${appState.selectedMetrics[0] === m ? "selected" : ""}>${escapeHtml(m)}</option>`,
        )
        .join("");

      const optionsB = appState.availableMetrics
        .map(
          (m) =>
            `<option value="${escapeHtml(m)}" ${appState.selectedMetrics[1] === m ? "selected" : ""}>${escapeHtml(m)}</option>`,
        )
        .join("");

      checkboxesContainer.innerHTML = `
                <div class="fr-select-group fr-mb-1v">
                    <label class="fr-label fr-text--sm" style="font-weight:bold">${labelA}</label>
                    <select class="fr-select" id="select-metric-a">${optionsA}</select>
                </div>
                <div class="fr-select-group">
                    <label class="fr-label fr-text--sm" style="font-weight:bold">${labelB}</label>
                    <select class="fr-select" id="select-metric-b">${optionsB}</select>
                </div>
            `;

      const updateAB = () => {
        appState.selectedMetrics = [
          document.getElementById("select-metric-a").value,
          document.getElementById("select-metric-b").value,
        ];
        markAsDirty();
      };

      document
        .getElementById("select-metric-a")
        .addEventListener("change", updateAB);
      document
        .getElementById("select-metric-b")
        .addEventListener("change", updateAB);
    }
    // 5. GESTION CLASSIQUE (Simple, Somme, Moyenne, Palmarès)
    else {
      const isMulti = ["sum", "avg"].includes(mode);
      const inputType = isMulti ? "checkbox" : "radio";

      if (hint) {
        hint.innerHTML = isMulti
          ? `Cochez les données à inclure.`
          : `Sélectionnez la donnée source.`;
      }

      appState.availableMetrics.forEach((metric, index) => {
        const div = document.createElement("div");
        div.className = `fr-${inputType}-group fr-${inputType}-group--sm`;

        const input = document.createElement("input");
        input.type = inputType;
        input.id = `input-metric-${index}`;
        input.value = metric;
        input.name = "metric-selection";

        if (appState.selectedMetrics.includes(metric)) {
          input.checked = true;
        }

        input.addEventListener("change", () => {
          appState.selectedMetrics = Array.from(
            document.querySelectorAll('input[name="metric-selection"]:checked'),
          ).map((cb) => cb.value);

          // Sécurité : forcer une sélection par défaut si tout est décoché en mode radio (valeur simple)
          if (appState.selectedMetrics.length === 0 && !isMulti) {
            appState.selectedMetrics = [metric];
            input.checked = true;
          }

          markAsDirty();
        });

        const label = document.createElement("label");
        label.className = "fr-label";
        label.htmlFor = `input-metric-${index}`;
        label.innerText = metric;

        div.appendChild(input);
        div.appendChild(label);
        checkboxesContainer.appendChild(div);
      });
    }

    wrapperSelect.style.display = "block";
    if (wrapperFilter) wrapperFilter.style.display = "block";
  } else {
    wrapperSelect.style.display = "none";
    if (wrapperFilter) wrapperFilter.style.display = "none";
  }
}
// --- GESTION DE LA STRUCTURE ET DU MENU (Global et Individuel) ---

window.togglePageMap = (index) => {
  if (appState.pages[index].showMap === undefined)
    appState.pages[index].showMap = false;
  else appState.pages[index].showMap = !appState.pages[index].showMap;
  updatePagesListUI();
  generateReport();
};

window.togglePageRichLabels = (index) => {
  appState.pages[index].richLabels = !appState.pages[index].richLabels;
  updatePagesListUI();
  generateReport();
};
window.togglePageRichTable = (index) => {
  appState.pages[index].richTable = !appState.pages[index].richTable;
  updatePagesListUI();
  generateReport();
};

window.toggleAllRichLabels = (checkbox) => {
  const isChecked = checkbox.checked;
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.richLabels = isChecked;
  });
  updatePagesListUI();
  generateReport();
};
window.toggleAllRichTables = (checkbox) => {
  const isChecked = checkbox.checked;
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.richTable = isChecked;
  });
  updatePagesListUI();
  generateReport();
};

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
window.changePagePosition = (oldIndex, newPosStr) => {
  let newIndex = parseInt(newPosStr) - 1;
  if (isNaN(newIndex)) return;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= appState.pages.length) newIndex = appState.pages.length - 1;
  if (newIndex !== oldIndex) {
    const itemMoved = appState.pages.splice(oldIndex, 1)[0];
    appState.pages.splice(newIndex, 0, itemMoved);
    updatePagesListUI();
    generateReport();
  } else {
    updatePagesListUI();
  }
};
window.togglePageVisibility = (index) => {
  appState.pages[index].visible = !appState.pages[index].visible;
  updatePagesListUI();
  generateReport();
};
// Dans js/ui/viewUpdater.js

window.deletePage = (index) => {
  const page = appState.pages[index];

  // --- SÉCURITÉ : BLOCAGE SI VERROUILLÉ ---
  if (page && page.snapshotData) {
    alert(
      "🔒 Impossible de supprimer une diapositive verrouillée.\n\nVeuillez d'abord cliquer sur le cadenas pour la déverrouiller.",
    );
    return;
  }

  // Suppression normale
  if (confirm("Supprimer cette diapositive ?")) {
    appState.pages.splice(index, 1);
    updatePagesListUI();
    generateReport();
  }
};

window.toggleAllMaps = () => {
  const allMaps = appState.pages.filter((p) => p.type !== "free");
  if (allMaps.length === 0) return;
  const allEnabled = allMaps.every((p) => p.showMap !== false);
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.showMap = !allEnabled;
  });
  updatePagesListUI();
  generateReport();
};
window.changeAllLabelSizes = (size) => {
  const parsedSize = parseInt(size);
  if (isNaN(parsedSize)) return;
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.labelSize = parsedSize;
  });
  updatePagesListUI();
  generateReport();
};
window.toggleAllTables = () => {
  const allMaps = appState.pages.filter((p) => p.type !== "free");
  if (allMaps.length === 0) return;
  const allEnabled = allMaps.every((p) => p.showTable);
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.showTable = !allEnabled;
  });
  updatePagesListUI();
  generateReport();
};
window.toggleAllLabels = () => {
  const allMaps = appState.pages.filter((p) => p.type !== "free");
  if (allMaps.length === 0) return;
  const allEnabled = allMaps.every((p) => p.showLabels);
  appState.pages.forEach((p) => {
    if (p.type !== "free") p.showLabels = !allEnabled;
  });
  updatePagesListUI();
  generateReport();
};
window.toggleAllVisibility = () => {
  if (appState.pages.length === 0) return;
  const allEnabled = appState.pages.every((p) => p.visible);
  appState.pages.forEach((p) => (p.visible = !allEnabled));
  updatePagesListUI();
  generateReport();
};

window.deleteAllPages = () => {
  if (appState.pages.length === 0) return;

  // On compte le nombre de diapositives qui ne sont PAS verrouillées
  const unlockedPages = appState.pages.filter((p) => !p.snapshotData);

  if (unlockedPages.length === 0) {
    alert(
      "🔒 Toutes les diapositives sont verrouillées. Aucune suppression n'a été effectuée.",
    );
    return;
  }

  if (
    confirm(
      `Supprimer TOUTES les diapositives non verrouillées (${unlockedPages.length} diapositive(s)) ?`,
    )
  ) {
    // On remplace le tableau par un tableau ne contenant QUE les diapositives verrouillées
    appState.pages = appState.pages.filter((p) => p.snapshotData);
    updatePagesListUI();
    generateReport();
  }
};
// Dans js/ui/viewUpdater.js, remplacez intégralement updatePagesListUI

export function updatePagesListUI() {
  const container = document.getElementById("pages-list");
  if (!container) return;

  container.innerHTML = "";

  // États globaux
  const allMapsList = appState.pages.filter((p) => p.type !== "free");
  const allMapsOn =
    allMapsList.length > 0 && allMapsList.every((p) => p.showMap !== false);
  const allLabelsOn =
    allMapsList.length > 0 && allMapsList.every((p) => p.showLabels);
  const allTablesOn =
    allMapsList.length > 0 && allMapsList.every((p) => p.showTable);
  const allVisible =
    appState.pages.length > 0 && appState.pages.every((p) => p.visible);
  const allRichLabels =
    allMapsList.length > 0 && allMapsList.every((p) => p.richLabels);
  const allRichTables =
    allMapsList.length > 0 && allMapsList.every((p) => p.richTable);

  // EN-TÊTE
  const headerRow = document.createElement("div");
  headerRow.style.cssText =
    "display: flex; justify-content: space-between; align-items: flex-end; padding: 0.5rem 1rem; background: #f4f6ff; border-bottom: 2px solid #000091; position: sticky; top: 0; z-index: 10; font-size: 0.75rem; font-weight: bold; color: #000091; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";

  headerRow.innerHTML = `
        <div style="flex: 1; text-transform: uppercase;">Diapositives</div>
        <div class="page-item-controls" style="align-items: flex-end; gap: 5px;">
            <div style="width: 50px; text-align: center; font-size: 0.65rem;">Ordre</div>
            <div style="width: 35px; text-align: center; font-size: 0.65rem;">Figer</div>
            <div style="width: 35px; text-align: center; font-size: 0.65rem;">Dupli.</div>
            
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Carte</span><button class="btn-icon" onclick="toggleAllMaps()" title="Toutes les cartes" style="padding: 2px; ${allMapsOn ? "color:#000091;" : ""}"><span class="${allMapsOn ? "fr-icon-earth-fill" : "fr-icon-earth-line"}"></span></button></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Étiq.</span><button class="btn-icon" onclick="toggleAllLabels()" title="Toutes les étiquettes" style="padding: 2px; ${allLabelsOn ? "color:#000091;" : ""}"><span class="${allLabelsOn ? "fr-icon-price-tag-3-fill" : "fr-icon-price-tag-3-line"}"></span></button></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Ét. +</span><input type="checkbox" onchange="toggleAllRichLabels(this)" title="Tout passer en Légendes Riches" ${allRichLabels ? "checked" : ""} style="margin: 0;"></div>
            <div style="width: 60px; text-align: center; font-size: 0.65rem;"><div>Taille</div><input type="number" class="input-size" style="width: 100%; margin: 0; padding: 0 2px; font-size: 0.75rem;" min="4" max="24" onchange="changeAllLabelSizes(this.value)" placeholder="Toutes" title="Appliquer à toutes les cartes"></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Tab.</span><button class="btn-icon" onclick="toggleAllTables()" title="Tous les tableaux" style="padding: 2px; ${allTablesOn ? "color:#000091;" : ""}"><span class="${allTablesOn ? "fr-icon-table-fill" : "fr-icon-table-line"}"></span></button></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Tb. +</span><input type="checkbox" onchange="toggleAllRichTables(this)" title="Tout passer en Tableaux Riches" ${allRichTables ? "checked" : ""} style="margin: 0;"></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Panier</span><button class="btn-icon" onclick="if(window.addAllToCart) window.addAllToCart();" title="Ajouter tout au panier" style="padding: 2px; color:#000091;"><span class="fr-icon-shopping-cart-2-fill"></span></button></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Vue</span><button class="btn-icon" onclick="toggleAllVisibility()" title="Visibilité" style="padding: 2px; ${allVisible ? "color:#000091;" : ""}"><span class="${allVisible ? "fr-icon-eye-fill" : "fr-icon-eye-off-fill"}"></span></button></div>
            <div style="width: 35px; display: flex; flex-direction: column; align-items: center;"><span style="font-size: 0.65rem; margin-bottom: 2px;">Supp.</span><button class="btn-icon btn-delete" onclick="deleteAllPages()" title="Tout supprimer" style="padding: 2px;"><span class="fr-icon-delete-line" style="color:#ce0500;"></span></button></div>
        </div>
    `;
  container.appendChild(headerRow);

  // BOUCLE DES PAGES
  appState.pages.forEach((page, index) => {
    const item = document.createElement("div");
    item.className = `page-item ${!page.visible ? "is-hidden" : ""}`;
    item.setAttribute("data-page-id", page.id);

    let typeTag = "";
    let controls = "";
    const isLocked = !!page.snapshotData;

    // -- BOUTONS COMMUNS --
    const lockBtn = `
            <div style="width: 35px; display:flex; justify-content:center;">
                <button class="btn-icon" onclick="window.togglePageLock(${index})" 
                    title="${isLocked ? "Déverrouiller" : "Verrouiller"}">
                    <span class="${isLocked ? "fr-icon-lock-fill" : "fr-icon-lock-unlock-line"}" 
                          style="${isLocked ? "color:#ce0500;" : "color:#929292;"}"></span>
                </button>
            </div>`;

    const emptyLockSlot = `<div style="width: 35px;"></div>`;

    const dupBtn = `
            <div style="width: 35px; display:flex; justify-content:center;">
                <button class="btn-icon" onclick="window.duplicatePage(${index})" title="Dupliquer">
                    <span class="fr-icon-file-copy-line" style="color:#000091;"></span>
                </button>
            </div>`;

    // -- LOGIQUE DE SUPPRESSION (Grisé si verrouillé) --
    const deleteStyle = isLocked
      ? "color:#ccc; cursor:not-allowed;"
      : "color:#ce0500;";
    const deleteTitle = isLocked
      ? "Déverrouillez pour supprimer"
      : "Supprimer la diapo";

    // -- Rendu des contrôles selon le type --
    if (page.type === "free") {
      typeTag = `<span class="page-tag tag-free">LIBRE</span>`;
      controls = `
                ${emptyLockSlot} ${dupBtn}
                <div style="width: 35px;"></div><div style="width: 35px;"></div><div style="width: 35px;"></div><div style="width: 60px;"></div><div style="width: 35px;"></div><div style="width: 35px;"></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="editPage(${page.id})" title="Éditer"><span class="fr-icon-edit-line" style="color:#000091;"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="if(window.addToCart) window.addToCart(${index})" title="Panier"><span class="fr-icon-shopping-cart-2-line" style="color:#000091;"></span></button></div>
            `;
    } else if (page.type === "chart") {
      typeTag = `<span class="page-tag tag-chart" style="background-color: #fceea7; color: #716000;">GRAPH.</span>`;
      if (isLocked)
        typeTag += ` <span class="fr-icon-lock-fill fr-icon--sm" style="color:#ce0500" title="Verrouillé"></span>`;

      const tableIcon = page.showTable
        ? "fr-icon-table-fill"
        : "fr-icon-table-line";
      const tableStyle = page.showTable ? 'style="color:#000091"' : "";

      // Si verrouillé, on cache le bouton Éditer. Sinon on l'affiche.
      const editBtnHtml = isLocked
        ? `<div style="width: 35px;"></div>`
        : `<div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="if(window.editChartSlide) window.editChartSlide(${page.id})" title="Éditer"><span class="fr-icon-edit-line" style="color:#000091;"></span></button></div>`;

      controls = `${lockBtn} ${dupBtn}
                ${editBtnHtml}
                <div style="width: 35px;"></div><div style="width: 35px;"></div><div style="width: 60px;"></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="togglePageTable(${index})" ${tableStyle} title="Tableau"><span class="${tableIcon}"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><input type="checkbox" onchange="togglePageRichTable(${index})" ${page.richTable ? "checked" : ""} title="Riche" style="cursor: pointer; margin: 0;"></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="if(window.addToCart) window.addToCart(${index})" title="Panier"><span class="fr-icon-shopping-cart-2-line" style="color:#000091;"></span></button></div>`;
    } else {
      // CARTE
      typeTag = `<span class="page-tag tag-map">CARTE</span>`;
      if (isLocked)
        typeTag += ` <span class="fr-icon-lock-fill fr-icon--sm" style="color:#ce0500" title="Verrouillé"></span>`;

      // On affiche toujours ces contrôles, même si la carte est verrouillée
      const showMap = page.showMap !== false;
      const mapIcon = showMap ? "fr-icon-earth-fill" : "fr-icon-earth-line";
      const mapStyle = showMap ? 'style="color:#000091"' : "";

      const labelIcon = page.showLabels
        ? "fr-icon-price-tag-3-fill"
        : "fr-icon-price-tag-3-line";
      const labelStyle = page.showLabels ? 'style="color:#000091"' : "";

      const tableIcon = page.showTable
        ? "fr-icon-table-fill"
        : "fr-icon-table-line";
      const tableStyle = page.showTable ? 'style="color:#000091"' : "";

      controls = `${lockBtn} ${dupBtn}
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="togglePageMap(${index})" ${mapStyle} title="Carte"><span class="${mapIcon}"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="togglePageLabels(${index})" ${labelStyle} title="Étiquettes"><span class="${labelIcon}"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><input type="checkbox" onchange="togglePageRichLabels(${index})" ${page.richLabels ? "checked" : ""} title="Riches" style="cursor: pointer; margin: 0;"></div>
                <div style="width: 60px; display:flex; justify-content:center;"><input type="number" class="input-size" value="${page.labelSize || 8}" min="4" max="24" onchange="changeLabelSize(${index}, this.value)" title="Taille"></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="togglePageTable(${index})" ${tableStyle} title="Tableau"><span class="${tableIcon}"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><input type="checkbox" onchange="togglePageRichTable(${index})" ${page.richTable ? "checked" : ""} title="Riche" style="cursor: pointer; margin: 0;"></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="if(window.addToCart) window.addToCart(${index})" title="Panier"><span class="fr-icon-shopping-cart-2-line" style="color:#000091;"></span></button></div>`;
    }
    const visIcon = page.visible ? "fr-icon-eye-fill" : "fr-icon-eye-off-fill";
    const visStyle = page.visible ? 'style="color:#000091"' : "";

    item.innerHTML = `
            <div class="page-item-info">${typeTag} <strong>${escapeHtml(page.title)}</strong></div>
            <div class="page-item-controls" style="gap: 5px;">
                <input type="number" class="input-order" value="${index + 1}" min="1" max="${appState.pages.length}" onchange="changePagePosition(${index}, this.value)" title="Ordre">
                ${controls}
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon" onclick="togglePageVisibility(${index})" ${visStyle} title="Visibilité"><span class="${visIcon}"></span></button></div>
                <div style="width: 35px; display:flex; justify-content:center;"><button class="btn-icon btn-delete" onclick="deletePage(${index})" title="${deleteTitle}"><span class="fr-icon-delete-line" style="${deleteStyle}"></span></button></div>
            </div>
        `;
    container.appendChild(item);
  });
}
// Dans js/ui/viewUpdater.js

export function updateCosmetics() {
  const globalTitle = document.getElementById("input-titre").value;
  const dateStr = document.getElementById("input-date").value;
  const footerLeft = document.getElementById("input-footer-left").value;
  const footerRight = document.getElementById("input-footer-right").value;

  document.querySelectorAll("#report-container .page").forEach((pageEl) => {
    const pageId = parseInt(pageEl.getAttribute("data-page-id"));
    const pageData = appState.pages.find((p) => p.id === pageId);

    // --- PROTECTION : Si la page est verrouillée, on ignore la mise à jour globale ---
    if (pageData && pageData.snapshotData) {
      return; // On passe à la page suivante sans rien modifier
    }

    // 1. Pied de page (Footer)
    const footerSpans = pageEl.querySelectorAll(".page-footer span");
    if (footerSpans.length >= 2) {
      footerSpans[0].textContent = footerLeft;
      footerSpans[footerSpans.length - 1].textContent = footerRight;
    }

    // 2. Date (Sous-titre)
    const subtitleEl = pageEl.querySelector(".editable-page-subtitle");
    if (subtitleEl) {
      subtitleEl.textContent = dateStr;
    }

    // 3. Titre principal
    // On ne modifie que si l'utilisateur n'a pas défini de titre spécifique manuel
    if (pageData && !pageData.mainTitle) {
      const titleSpan = pageEl.querySelector(".editable-report-title");
      if (titleSpan) {
        titleSpan.textContent = globalTitle;
      }
    }
  });
}
// --- GESTION DU "DIRTY STATE" (Bouton Actualiser) ---

export function markAsDirty() {
  const btn = document.getElementById("btn-actualiser");
  if (btn) {
    btn.style.display = "flex"; // Fait apparaître le bouton
  }
}

export function clearDirty() {
  const btn = document.getElementById("btn-actualiser");
  if (btn) {
    btn.style.display = "none"; // Cache le bouton une fois cliqué
  }
}

/**
 * Scrolle automatiquement vers une diapositive spécifique dans la liste de gauche
 * @param {string} pageId - L'identifiant de la page vers laquelle scroller
 */
export function scrollToPage(pageId) {
  const element = document.querySelector(`[data-page-id="${pageId}"]`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Petit effet visuel pour confirmer la modification (optionnel)
    element.style.transition = "background-color 0.5s";
    element.style.backgroundColor = "#f5f5fe";
    setTimeout(() => {
      element.style.backgroundColor = "";
    }, 1000);
  }
}

// N'oubliez pas de l'ajouter à l'objet window si vous l'appelez depuis l'extérieur
window.scrollToPage = scrollToPage;

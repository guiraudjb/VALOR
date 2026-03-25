import { appState } from "../core/state.js";
import { db, escapeHtml } from "../core/utils.js";
import {
  getAggregatedDataMap,
  renderPageItem,
  getCurrentConfig,
  generateReport,
} from "./reportGenerator.js";
import { DEP_NAMES, REG_NAMES } from "../config/constants.js";
import { updatePagesListUI } from "../ui/viewUpdater.js";
import { getDepFromCom } from "../core/geoUtils.js";

export async function initCart() {
  appState.cart = await db.loadCart();
  updateCartBadge();
}

export async function addToCart(pageIndex) {
  const page = appState.pages[pageIndex];
  if (!page) return;
  const config = getCurrentConfig();
  let dataMapArray = [];

  if (page.type !== "free") {
    const granularity = page.granularity || config.granularity;
    const dataMap = getAggregatedDataMap(granularity, page, config);
    dataMapArray = Array.from(dataMap.entries());
  }

  const cartItem = {
    id: Date.now() + Math.random(),
    type: page.type,
    title: page.title || "Diapositive libre",
    page: JSON.parse(JSON.stringify(page)),
    config: JSON.parse(JSON.stringify(config)),
    dataMapArray: dataMapArray,
  };
  appState.cart.push(cartItem);
  await db.saveCart(appState.cart);
  updateCartBadge();
}

export async function addAllToCart() {
  const config = getCurrentConfig();
  appState.pages.forEach((page) => {
    if (!page.visible) return;
    let dataMapArray = [];
    if (page.type !== "free") {
      const granularity = page.granularity || config.granularity;
      const dataMap = getAggregatedDataMap(granularity, page, config);
      dataMapArray = Array.from(dataMap.entries());
    }
    appState.cart.push({
      id: Date.now() + Math.random(),
      type: page.type,
      title: page.title || "Diapositive libre",
      page: JSON.parse(JSON.stringify(page)),
      config: JSON.parse(JSON.stringify(config)),
      dataMapArray: dataMapArray,
    });
  });
  await db.saveCart(appState.cart);
  updateCartBadge();
}

export function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.innerText = appState.cart.length;
}

export function renderCartModal() {
  const container = document.getElementById("cart-list-container");
  if (!container) return;
  container.innerHTML = "";
  if (appState.cart.length === 0) {
    container.innerHTML =
      '<p class="fr-text--sm" style="color:#666; font-style:italic;">Votre panier est vide.</p>';
    return;
  }

  appState.cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "del-list-item";

    const icon =
      item.type === "free"
        ? "fr-icon-file-text-line"
        : "fr-icon-map-pin-2-line";

    let mainTitle = escapeHtml(item.config.titre || item.title);
    let subTitle = "";
    let details = "";

    if (item.type === "free") {
      subTitle = escapeHtml(item.title) || "Diapositive Libre";
      details = "Diapositive Libre (Contenu textuel personnalisé)";
    } else {
      subTitle = escapeHtml(item.title);
      details = `Mode analytique : <strong>${escapeHtml(item.config.calcMode)}</strong>`;
    }

    div.innerHTML = `
            <div class="del-info">
                <div class="del-name" style="color:#161616; margin-bottom: 2px;">
                    <span class="${icon} fr-mr-1v" style="color:#000091;"></span> 
                    <strong>${mainTitle}</strong>
                </div>
                <div style="font-size:0.9rem; color:#000091; font-weight: 500; margin-bottom: 2px; padding-left: 24px;">
                    ↳ ${subTitle}
                </div>
                <div class="del-deps" style="font-size:0.75rem; padding-left: 24px;">
                    ${details}
                </div>
            </div>
            <div class="del-actions" style="align-items: center;">
                <input type="number" class="input-order" value="${index + 1}" min="1" max="${appState.cart.length}" onchange="changeCartItemPosition(${index}, this.value)" title="Modifier la position directe">
                ${item.type !== "free" ? `<button class="fr-btn fr-btn--sm fr-btn--tertiary-no-outline fr-icon-download-line" onclick="exportCartItemToCSV(${index})" title="Exporter ce tableau en CSV"></button>` : ""}
                <button class="fr-btn fr-btn--sm fr-btn--secondary fr-icon-arrow-up-line" onclick="moveCartItem(${index}, -1)" title="Monter"></button>
                <button class="fr-btn fr-btn--sm fr-btn--secondary fr-icon-arrow-down-line" onclick="moveCartItem(${index}, 1)" title="Descendre"></button>
                <button class="fr-btn fr-btn--sm fr-btn--secondary fr-icon-delete-line" style="color: #ce0500;" onclick="removeCartItem(${index})" title="Supprimer"></button>
            </div>
        `;
    container.appendChild(div);
  });
}

export async function moveCartItem(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= appState.cart.length) return;
  const item = appState.cart.splice(index, 1)[0];
  appState.cart.splice(newIndex, 0, item);
  await db.saveCart(appState.cart);
  renderCartModal();
}

export async function changeCartItemPosition(oldIndex, newPosStr) {
  let newIndex = parseInt(newPosStr) - 1;
  if (isNaN(newIndex)) return;

  if (newIndex < 0) newIndex = 0;
  if (newIndex >= appState.cart.length) newIndex = appState.cart.length - 1;

  if (newIndex !== oldIndex) {
    const itemMoved = appState.cart.splice(oldIndex, 1)[0];
    appState.cart.splice(newIndex, 0, itemMoved);
    await db.saveCart(appState.cart);
    renderCartModal();
  } else {
    renderCartModal();
  }
}

export async function removeCartItem(index) {
  appState.cart.splice(index, 1);
  await db.saveCart(appState.cart);
  updateCartBadge();
  renderCartModal();
}

export async function clearCart() {
  if (
    confirm(
      "Vider complètement le panier ? Toutes les vues stockées seront effacées.",
    )
  ) {
    appState.cart = [];
    await db.saveCart(appState.cart);
    updateCartBadge();
    renderCartModal();
  }
}

export function printCart() {
  if (appState.cart.length === 0) {
    alert("Le panier est vide.");
    return;
  }

  const container = document.getElementById("report-container");
  container.innerHTML = "";
  appState.cart.forEach((item) => {
    const dataMap = item.dataMapArray ? new Map(item.dataMapArray) : new Map();
    renderPageItem(item.page, item.config, dataMap, container);
  });
  document.getElementById("modal-manage-cart").close();
  document
    .getElementById("modal-manage-cart")
    .classList.remove("fr-modal--opened");

  setTimeout(() => {
    window.print();
    window.onafterprint = () => {
      setTimeout(() => {
        generateReport();
      }, 50);
      window.onafterprint = null;
    };
  }, 3000);
}

export function exportProject() {
  if (appState.cart.length === 0) {
    alert("Le panier est vide. Il n'y a rien à sauvegarder.");
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultName = `valor_projet_${dateStr}.json`;

  let fileName = prompt(
    "Sous quel nom voulez-vous sauvegarder ce projet ?",
    defaultName,
  );
  if (fileName === null) return;
  fileName = fileName.trim();
  if (!fileName.toLowerCase().endsWith(".json")) {
    fileName += ".json";
  }

  const dataStr = JSON.stringify(appState.cart);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", url);
  linkElement.setAttribute("download", fileName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(url);
}

export async function importProject(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        if (appState.cart.length > 0) {
          if (
            !confirm(
              "L'import va écraser votre panier actuel. Voulez-vous continuer ?",
            )
          ) {
            event.target.value = "";
            return;
          }
        }

        appState.cart = importedData;
        await db.saveCart(appState.cart);
        updateCartBadge();
        renderCartModal();
        alert("Projet importé avec succès !");
      } else {
        alert(
          "Format de fichier invalide. Veuillez sélectionner un fichier projet V.A.L.O.R. (.json)",
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'import :", error);
      alert("Impossible de lire le fichier. Il est peut-être corrompu.");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

// --- DÉBUT DES FONCTIONS D'EXPORT CSV ---

// Fonction utilitaire pour retrouver le nom et le parent d'une entité
function getEntityInfo(code, granularity) {
  let name = code;
  let parent = "-";
  if (granularity === "com") {
    name = appState.refData.communes.get(code) || code;
    //const depCode = appState.refData.comToDep?.get(code) || (code.startsWith('97') ? code.substring(0,3) : code.substring(0,2));
    const depCode = getDepFromCom(code, appState);
    parent = DEP_NAMES[depCode] || depCode;
  } else if (granularity === "dep") {
    name = DEP_NAMES[code] || code;
    const regCode = appState.refData.depToReg?.get(code);
    parent = REG_NAMES[regCode] || "-";
  } else if (granularity === "reg") {
    name = REG_NAMES[code] || code;
  }
  return { name, parent };
}

// Générateur de contenu CSV
function buildCSVContent(items) {
  if (!items || items.length === 0) return "";
  const firstConfig = items[0].config;
  const granularity = items[0].page.granularity || firstConfig.granularity;

  // 1. Construction des en-têtes
  let headers = ["Code", "Libellé"];
  if (granularity === "com") headers.push("Département");
  else if (granularity === "dep") headers.push("Région");

  if (!["simple", "top10", "flop10"].includes(firstConfig.calcMode)) {
    firstConfig.selectedMetrics.forEach((m) => headers.push(m));
  }
  headers.push(`Résultat (${firstConfig.calcMode})`);

  // BOM UTF-8 pour ouverture propre dans Excel
  let csvContent = "\uFEFF";
  csvContent += headers.map((h) => `"${h}"`).join(";") + "\n";

  // 2. Remplissage des données (avec Set pour éviter les doublons lors de fusions)
  const seenCodes = new Set();

  items.forEach((item) => {
    if (!item.dataMapArray) return;
    item.dataMapArray.forEach(([code, d]) => {
      if (!d._inSelection || seenCodes.has(code)) return;
      seenCodes.add(code);

      const info = getEntityInfo(code, granularity);
      let row = [`"${code}"`, `"${info.name}"`];

      if (granularity === "com" || granularity === "dep") {
        row.push(`"${info.parent}"`);
      }

      // Formatage numérique pour Excel FR (remplacement du point par une virgule)
      const formatNum = (val) =>
        val !== undefined && val !== null ? String(val).replace(".", ",") : "";

      if (!["simple", "top10", "flop10"].includes(firstConfig.calcMode)) {
        firstConfig.selectedMetrics.forEach((m) =>
          row.push(`"${formatNum(d[m])}"`),
        );
      }

      row.push(`"${formatNum(d._computed)}"`);
      csvContent += row.join(";") + "\n";
    });
  });

  return csvContent;
}

// Fonction de déclenchement du téléchargement
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export d'une seule vue
export function exportCartItemToCSV(index) {
  const item = appState.cart[index];
  if (!item || item.type === "free") return;

  const csvContent = buildCSVContent([item]);
  const cleanTitle = (item.title || "Export")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  downloadCSV(csvContent, `valor_${cleanTitle}.csv`);
}

// Export global : Regroupement intelligent
export function exportAllCartToCSV() {
  const mapItems = appState.cart.filter(
    (i) => i.type !== "free" && i.dataMapArray && i.dataMapArray.length > 0,
  );
  if (mapItems.length === 0) {
    alert("Aucune donnée cartographique à exporter.");
    return;
  }

  // Regrouper par "Nature" : Granularité + Mode de calcul + Métriques
  const groups = {};
  mapItems.forEach((item) => {
    const gran = item.page.granularity || item.config.granularity;
    const mode = item.config.calcMode;
    const metrics = item.config.selectedMetrics.join("|");
    const natureKey = `${gran}_${mode}_${metrics}`;

    if (!groups[natureKey]) groups[natureKey] = [];
    groups[natureKey].push(item);
  });

  const groupKeys = Object.keys(groups);

  // S'il n'y a qu'une seule nature de données, on fait un export unique et propre
  if (groupKeys.length === 1) {
    const csvContent = buildCSVContent(groups[groupKeys[0]]);
    downloadCSV(csvContent, `valor_export_global.csv`);
  } else {
    // Si natures différentes (ex: un tableau Commune et un tableau Département)
    if (
      confirm(
        `Votre panier contient des tableaux de natures différentes (ex: granularités ou calculs distincts).\n${groupKeys.length} fichiers CSV distincts vont être téléchargés. Continuer ?`,
      )
    ) {
      groupKeys.forEach((key, idx) => {
        const csvContent = buildCSVContent(groups[key]);
        // On met un léger délai pour éviter que le navigateur bloque les téléchargements multiples
        setTimeout(() => {
          downloadCSV(csvContent, `valor_export_partie_${idx + 1}.csv`);
        }, idx * 500);
      });
    }
  }
}
export async function transferCartToEditor() {
  if (appState.cart.length === 0) {
    alert("Votre panier est vide.");
    return;
  }

  if (
    confirm(
      `Voulez-vous transférer les ${appState.cart.length} éléments du panier vers le rapport principal ? Le panier sera ensuite vidé.`,
    )
  ) {
    // 1. Clonage et injection dans l'éditeur
    appState.cart.forEach((item) => {
      // On clone la page pour éviter les conflits de références
      const newPage = JSON.parse(JSON.stringify(item.page));
      // On génère un nouvel ID unique
      newPage.id = Date.now() + Math.floor(Math.random() * 10000);

      // --- NOUVEAU : On attache les données et la config figées à la page ---
      if (item.type !== "free") {
        newPage.snapshotData = item.dataMapArray;
        newPage.snapshotConfig = item.config;
      }
      // ----------------------------------------------------------------------

      // On ajoute la diapo à la liste de l'éditeur
      appState.pages.push(newPage);
    });

    // 2. Vidage du panier
    appState.cart = [];
    await db.saveCart(appState.cart);
    updateCartBadge();
    renderCartModal();

    // 3. Fermeture de la modale
    const modal = document.getElementById("modal-manage-cart");
    if (modal) {
      modal.classList.remove("fr-modal--opened");
      modal.close();
    }

    // 4. Rafraîchissement de l'interface et des graphiques
    updatePagesListUI();
    // On importe dynamiquement generateReport pour éviter les dépendances circulaires si besoin,
    // ou on s'assure qu'il est importé en haut du fichier.
    window.dispatchEvent(new CustomEvent("valor:refreshReport"));
  }
}

// --- FIN DES FONCTIONS D'EXPORT CSV ---

// Exportation des fonctions vers l'objet global Window pour les appels HTML
window.addToCart = addToCart;
window.addAllToCart = addAllToCart;
window.moveCartItem = moveCartItem;
window.changeCartItemPosition = changeCartItemPosition;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.printCart = printCart;
window.exportProject = exportProject;
window.importProject = importProject;
window.exportCartItemToCSV = exportCartItemToCSV;
window.exportAllCartToCSV = exportAllCartToCSV;
window.transferCartToEditor = transferCartToEditor;

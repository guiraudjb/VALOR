import { appState } from "../core/state.js";
import { DEFAULT_DELEGATIONS, DEP_NAMES } from "../config/constants.js";
import { escapeHtml } from "../core/utils.js";

export function initDelegations() {
  const saved = localStorage.getItem("valor_delegations");
  if (saved) {
    try {
      appState.customDelegations = JSON.parse(saved);
    } catch (e) {
      appState.customDelegations = JSON.parse(
        JSON.stringify(DEFAULT_DELEGATIONS),
      );
    }
  } else {
    appState.customDelegations = JSON.parse(
      JSON.stringify(DEFAULT_DELEGATIONS),
    );
  }
}

export function saveDelegations() {
  localStorage.setItem(
    "valor_delegations",
    JSON.stringify(appState.customDelegations),
  );
}

export function renderDelegationList() {
  const container = document.getElementById("delegation-list-container");
  if (!container) return;
  if (appState.customDelegations.length === 0) {
    container.innerHTML =
      '<p class="fr-text--sm" style="color:#666; font-style:italic;">Aucune délégation configurée.</p>';
    return;
  }

  container.innerHTML = "";
  appState.customDelegations.forEach((del, index) => {
    const item = document.createElement("div");
    item.className = "del-list-item";
    const depsStr = del.depCodes.join(", ");
    const displayDeps =
      depsStr.length > 50 ? depsStr.substring(0, 47) + "..." : depsStr;
    item.innerHTML = `
            <div class="del-info">
                <div class="del-name">${escapeHtml(del.label)} <span class="fr-badge fr-badge--sm fr-badge--info fr-ml-1v">${del.depCodes.length} Dép.</span></div>
                <div class="del-deps" title="${escapeHtml(depsStr)}">${escapeHtml(displayDeps)}</div>
            </div>
            <div class="del-actions">
                <button class="fr-btn fr-btn--sm fr-btn--secondary fr-icon-edit-line" title="Modifier" onclick="editDelegation(${index})"></button>
                <button class="fr-btn fr-btn--sm fr-btn--secondary fr-icon-delete-line" style="color: #ce0500;" title="Supprimer" onclick="deleteDelegation(${index})"></button>
            </div>
        `;
    container.appendChild(item);
  });
}

export function resetDelegationForm() {
  document.getElementById("del-edit-index").value = "-1";
  document.getElementById("del-input-name").value = "";
  document.getElementById("del-input-deps").value = "";
  document.getElementById("del-form-title").innerText =
    "Ajouter une délégation";
  document.getElementById("btn-cancel-delegation").style.display = "none";
}

export function handleSaveDelegation() {
  const name = document.getElementById("del-input-name").value.trim();
  const depsRaw = document.getElementById("del-input-deps").value;
  const indexStr = document.getElementById("del-edit-index").value;
  if (!name) {
    alert("Le nom de la délégation est requis.");
    return;
  }

  let rawCodes = depsRaw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
  let validCodes = [];
  let invalidCodes = [];
  rawCodes.forEach((code) => {
    if (DEP_NAMES[code]) validCodes.push(code);
    else invalidCodes.push(code);
  });

  if (validCodes.length === 0) {
    alert("Aucun code de département valide trouvé.");
    return;
  }
  if (invalidCodes.length > 0) {
    if (
      !confirm(
        `Certains codes semblent invalides : ${invalidCodes.join(", ")}.\nVoulez-vous tout de même enregistrer sans ces codes ?`,
      )
    )
      return;
  }

  const newDel = { label: name, depCodes: validCodes };
  const index = parseInt(indexStr);
  if (index >= 0) appState.customDelegations[index] = newDel;
  else appState.customDelegations.push(newDel);

  saveDelegations();
  renderDelegationList();
  resetDelegationForm();
}

window.editDelegation = (index) => {
  const del = appState.customDelegations[index];
  if (!del) return;
  document.getElementById("del-edit-index").value = index;
  document.getElementById("del-input-name").value = del.label;
  document.getElementById("del-input-deps").value = del.depCodes.join(", ");
  document.getElementById("del-form-title").innerText =
    "Modifier la délégation";
  document.getElementById("btn-cancel-delegation").style.display =
    "inline-block";
};

window.deleteDelegation = (index) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette délégation ?")) {
    appState.customDelegations.splice(index, 1);
    saveDelegations();
    renderDelegationList();
    resetDelegationForm();
  }
};

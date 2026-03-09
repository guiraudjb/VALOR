import { escapeHtml, readFileAsDataURL,db } from '../core/utils.js';
import { appState } from '../core/state.js';
import { generateReport, buildDefaultStructure } from '../features/reportGenerator.js';
import { updateMainBrand, updateMetricControls, updateFilterControls, updateCosmetics , markAsDirty, clearDirty,updatePagesListUI as updateView  } from './viewUpdater.js';

import { saveCustomSlide } from '../features/editor.js';
import { renderDelegationList, resetDelegationForm, handleSaveDelegation, saveDelegations } from '../features/delegations.js';
import { DEFAULT_DELEGATIONS } from '../config/constants.js';
import { processCSV } from '../core/dataLoader.js';
import { renderCartModal, transferCartToEditor } from '../features/cart.js';
import { 
    openChartModal, handleScaleChange, saveChartSlide, 
    populateChartEpciDep, populateChartEpciId, checkPieWarning 
} from '../features/chartGenerator.js';

export function setupUIListeners() {
    initFormulaAutocomplete();
    // Gestion de la précision de la formule manuelle
    const inputPrecision = document.getElementById('input-precision');
    if (inputPrecision) {
        inputPrecision.addEventListener('change', (e) => {
            appState.formulaPrecision = e.target.value;
            markAsDirty(); // Fait apparaître le bouton Actualiser
        });
    }
    window.addEventListener('valor:refreshReport', () => {
        generateReport();
    });
    
    // --- GESTION DU REPLI AUTOMATIQUE DU PANNEAU ---
    const configPanel = document.getElementById('config-panel');
    let shrinkTimeout;

    if (configPanel) {
        // Quand la souris quitte le panneau
        configPanel.addEventListener('mouseleave', () => {
            shrinkTimeout = setTimeout(() => {
                configPanel.classList.add('shrunk');
            }, 1000); // 2 secondes
        });

        // Quand la souris revient sur le panneau (y compris sur la barre d'onglets)
        configPanel.addEventListener('mouseenter', () => {
            clearTimeout(shrinkTimeout);
            configPanel.classList.remove('shrunk');
        });
    }
    
   
   const structurePanel = document.getElementById('structure-panel');
    let bottomShrinkTimeout;

    if (structurePanel) {
        // Quand la souris quitte le panneau du bas
        structurePanel.addEventListener('mouseleave', () => {
            bottomShrinkTimeout = setTimeout(() => {
                structurePanel.classList.add('shrunk');
            }, 1000); // Délai de 2 secondes avant masquage
        });

        // Quand la souris revient sur le panneau
        structurePanel.addEventListener('mouseenter', () => {
            clearTimeout(bottomShrinkTimeout);
            structurePanel.classList.remove('shrunk');
        });
    }
   
    
    const btnAddChartSlide = document.getElementById('btn-add-chart-slide');
    if (btnAddChartSlide) btnAddChartSlide.onclick = openChartModal;

    // Écouteurs de la modale graphique
    document.getElementById('btn-close-chart-modal').onclick = () => {
        const m = document.getElementById('modal-chart-slide');
        m.classList.remove('fr-modal--opened'); m.close();
    };
    document.getElementById('chart-select-scale').onchange = handleScaleChange;
    document.getElementById('chart-select-type').onchange = checkPieWarning;
    document.getElementById('chart-select-epci-reg').onchange = populateChartEpciDep;
    document.getElementById('chart-select-epci-dep').onchange = populateChartEpciId;
    document.getElementById('btn-save-chart-slide').onclick = saveChartSlide;

    // --- 1. ACTIONS COSMÉTIQUES : Mise à jour instantanée sans recalcul ---
    
    // Textes simples (Titre, date, crédits)
    ['input-titre', 'input-date', 'input-footer-left', 'input-footer-right'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.oninput = updateCosmetics; 
    });

    // Textes Marianne 
    ['input-brand-1', 'input-brand-2'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.addEventListener('input', updateMainBrand); 
    });


    // --- 2. ACTIONS LOURDES : On marque le rapport comme "Dirty" (Bouton Actualiser) ---
    
// Le nouveau bouton "Actualiser le rapport"
    const btnActualiser = document.getElementById('btn-actualiser');
    if (btnActualiser) {
        btnActualiser.onclick = () => {
            if (appState.isStructureDirty) {
                buildDefaultStructure();
                appState.isStructureDirty = false; // On redescend le drapeau
            } else {
                generateReport();
            }
            clearDirty();
        };
    }

    // Palette de couleurs
    const selectPalette = document.getElementById('select-palette');
    if (selectPalette) selectPalette.onchange = markAsDirty;

    // Changement de mode de rapport (Départemental, Délégation, EPCI)
    const selectMode = document.getElementById('select-report-mode');
    if (selectMode) {
        selectMode.onchange = (e) => {
            const val = e.target.value;
            const wDept = document.getElementById('wrapper-select-dept'); 
            const wDel = document.getElementById('wrapper-manage-del'); 
            const wEpci = document.getElementById('wrapper-epci-selectors');
            
            if (wDept) wDept.style.display = (val === 'mode-dep-com') ? 'block' : 'none';
            if (wDel) wDel.style.display = (val === 'mode-nat-del') ? 'block' : 'none';
            if (wEpci) wEpci.style.display = (val === 'mode-epci') ? 'block' : 'none';
            appState.isStructureDirty = true;
            markAsDirty(); // Remplacé buildDefaultStructure par markAsDirty
        };
    }

    // Changement de la cible (Ex: choix d'un autre département)
    const selectDept = document.getElementById('select-dept-target'); 
    if (selectDept) selectDept.addEventListener('change', () => { 
        appState.isStructureDirty = true;
        markAsDirty(); 
    });

    // Changement du mode de calcul (Somme, Ratio, etc.)
    const selectCalcMode = document.getElementById('select-calc-mode');
    if (selectCalcMode) {
        selectCalcMode.addEventListener('change', (e) => {
            appState.calcMode = e.target.value;
            if (!['sum', 'avg', 'ratio', 'growth'].includes(appState.calcMode) && appState.selectedMetrics.length > 1) {
                appState.selectedMetrics = [appState.selectedMetrics[0]];
            }
            if (['ratio', 'growth'].includes(appState.calcMode) && appState.selectedMetrics.length < 2) {
                appState.selectedMetrics = [
                    appState.selectedMetrics[0] || appState.availableMetrics[0],
                    appState.availableMetrics[1] || appState.availableMetrics[0]
                ];
            }
            updateMetricControls(); 
            markAsDirty(); 
        });
    }
    
    // 3. Changement d'EPCI
    const selectEpci = document.getElementById('select-epci-id');
    if (selectEpci) selectEpci.addEventListener('change', () => { 
        appState.isStructureDirty = true;
        markAsDirty(); 
    });

    // Changement de la base pour les parts
    const selectShareBase = document.getElementById('select-share-base');
    if (selectShareBase) {
        selectShareBase.addEventListener('change', (e) => {
            appState.shareBase = e.target.value;
            markAsDirty();
        });
    }

    // Gestion du filtre de données dynamique
    const checkFilter = document.getElementById('check-enable-filter');
    const selectFilterOp = document.getElementById('select-filter-operator');
    const selectFilterMetric = document.getElementById('select-filter-metric');
    const inputFilterVal1 = document.getElementById('input-filter-val1');
    const inputFilterVal2 = document.getElementById('input-filter-val2');

    const applyDataFilter = () => {
        appState.dataFilter.active = checkFilter ? checkFilter.checked : false;
        appState.dataFilter.operator = selectFilterOp ? selectFilterOp.value : 'none';
        appState.dataFilter.metric = selectFilterMetric && selectFilterMetric.value ? selectFilterMetric.value : '_computed';
        appState.dataFilter.value1 = inputFilterVal1 ? parseFloat(inputFilterVal1.value) : 0;
        appState.dataFilter.value2 = inputFilterVal2 ? parseFloat(inputFilterVal2.value) : 0;
        updateFilterControls();
        markAsDirty(); 
    };

    if (checkFilter) checkFilter.addEventListener('change', applyDataFilter);
    if (selectFilterOp) selectFilterOp.addEventListener('change', applyDataFilter);
    if (selectFilterMetric) selectFilterMetric.addEventListener('change', applyDataFilter);
    if (inputFilterVal1) inputFilterVal1.addEventListener('input', applyDataFilter);
    if (inputFilterVal2) inputFilterVal2.addEventListener('input', applyDataFilter);

    // Options d'affichage des tableaux
    ['check-auto-agreg', 'check-show-subtotal'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.onchange = markAsDirty; 
    });


    // --- 3. ACTIONS GLOBALES ET BOUTONS SPÉCIFIQUES ---

    // Réinitialisation structurelle explicite (action directe)
    document.getElementById('btn-reset-structure').onclick = buildDefaultStructure;

    // Gestion du logo d'en-tête global
    const globalLogoInput = document.getElementById('input-global-logo');
    if (globalLogoInput) {
        globalLogoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    appState.globalLogo = await readFileAsDataURL(file);
                    markAsDirty();
                } catch (err) { console.error("Erreur de lecture du logo", err); }
            } else {
                appState.globalLogo = null;
                markAsDirty();
            }
        });
    }

    // Chargement CSV
    document.getElementById('csv-file').onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert("Limite de taille : 10 Mo."); e.target.value = ''; return; }
        processCSV(file);
    };

    const btnAddSlide = document.getElementById('btn-add-slide');
    if (btnAddSlide) btnAddSlide.onclick = () => { if (window.editPage) window.editPage(); };

	const btnAddMap = document.getElementById('btn-add-map-slide');
    if (btnAddMap) {
        btnAddMap.onclick = () => {
            const modal = document.getElementById('modal-add-map');
            
            // On réinitialise le select sur "Région" par défaut
            document.getElementById('select-map-type').value = 'region';
            // On remplit la liste des cibles
            window.updateMapTargetList();
            
            modal.classList.add('fr-modal--opened');
            modal.showModal();
        };
    }


    // Ajout global au panier
    const btnAddAllCart = document.getElementById('btn-add-all-cart');
    if (btnAddAllCart) btnAddAllCart.onclick = () => { if (window.addAllToCart) window.addAllToCart(); };

    // Affichage Modal Panier
    const btnOpenCart = document.getElementById('btn-open-cart');
    if (btnOpenCart) btnOpenCart.onclick = () => { renderCartModal(); document.getElementById('modal-manage-cart').classList.add('fr-modal--opened'); document.getElementById('modal-manage-cart').showModal(); };

    // Transfert Panier -> Éditeur
    const btnCartToEditor = document.getElementById('btn-cart-to-editor');
    if (btnCartToEditor) {
        btnCartToEditor.onclick = () => { transferCartToEditor(); };
    }

    // Impression de l'Aperçu (hors panier)
    document.getElementById('btn-export').onclick = () => window.print();

    // Modale Diapositive Libre
    const modalSlide = document.getElementById('modal-edit-slide');
    document.getElementById('btn-close-modal').onclick = () => { modalSlide.classList.remove('fr-modal--opened'); modalSlide.close(); };
    document.getElementById('btn-save-slide').onclick = saveCustomSlide;

    // Modale Délégations
    const modalDel = document.getElementById('modal-manage-delegations');
    document.getElementById('btn-open-del-modal').onclick = () => { renderDelegationList(); resetDelegationForm(); modalDel.classList.add('fr-modal--opened'); modalDel.showModal(); };
    document.getElementById('btn-close-del-modal').onclick = () => { modalDel.classList.remove('fr-modal--opened'); modalDel.close(); };
document.getElementById('btn-apply-delegations').onclick = () => { 
    modalDel.classList.remove('fr-modal--opened'); 
    modalDel.close(); 
    appState.isStructureDirty = true; 
    markAsDirty(); 
};
    document.getElementById('btn-save-delegation').onclick = handleSaveDelegation;
    document.getElementById('btn-cancel-delegation').onclick = resetDelegationForm;
    document.getElementById('btn-reset-delegations').onclick = () => {
        if (confirm("Réinitialiser délégations ?")) { appState.customDelegations = JSON.parse(JSON.stringify(DEFAULT_DELEGATIONS)); saveDelegations(); renderDelegationList(); resetDelegationForm(); }
    };

    // Navigation pagination
    const btnFirst = document.getElementById('btn-nav-first'); if (btnFirst) btnFirst.onclick = () => navigateToSlide('first');
    const btnLast = document.getElementById('btn-nav-last'); if (btnLast) btnLast.onclick = () => navigateToSlide('last');
    const btnGoto = document.getElementById('btn-nav-goto');
    if (btnGoto) btnGoto.onclick = () => {
        if (appState.pages.length === 0) return; const num = prompt(`Aller à la diapo (1 - ${appState.pages.length}) :`);
        if (num !== null) { const parsed = parseInt(num); if (!isNaN(parsed) && parsed >= 1 && parsed <= appState.pages.length) navigateToSlide(parsed - 1); else alert("Numéro invalide."); }
    };


    // --- 4. ÉDITION DES TITRES EN LIGNE (AVEC ICÔNE) ---
    const reportContainer = document.getElementById('report-container');
    
    if (reportContainer) {
        // 1. Sauvegarde quand on clique en dehors
        reportContainer.addEventListener('focusout', (e) => {
            if (e.target.classList.contains('editable-report-title')) {
                const newTitle = e.target.innerText.trim();
                const pageEl = e.target.closest('.page');
                const pageId = pageEl ? parseInt(pageEl.getAttribute('data-page-id')) : null;
                
                if (pageId) {
                    const pageIndex = appState.pages.findIndex(p => p.id === pageId);
                    if (pageIndex !== -1) {
                        appState.pages[pageIndex].mainTitle = newTitle;
                    }
                }
            }
        });

// 2. Sauvegarde quand on appuie sur "Entrée"
        reportContainer.addEventListener('keydown', (e) => {
            if ((e.target.classList.contains('editable-slide-title') || e.target.classList.contains('editable-report-title')) && e.key === 'Enter') {
                e.preventDefault(); 
                e.target.blur();    
            }
        });

        // 3. Effets visuels au survol
        reportContainer.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('editable-slide-title') || e.target.classList.contains('editable-report-title')) {
                e.target.style.backgroundColor = 'rgba(0, 0, 145, 0.05)';
                e.target.style.borderBottom = '1px dashed #000091';
            }
        });

        reportContainer.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('editable-slide-title') || e.target.classList.contains('editable-report-title')) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderBottom = '1px dashed transparent';
            }
        });

        // 4. Action de l'icône Crayon : Focus et sélection
        reportContainer.addEventListener('click', (e) => {
            
            // A. Pour le titre secondaire (Cartes et Graphiques)
            if (e.target.classList.contains('edit-icon-trigger')) {
                const targetId = e.target.getAttribute('data-target-id');
                const titleSpan = document.querySelector(`.editable-slide-title[data-page-id="${targetId}"]`);
                
                if (titleSpan) {
                    titleSpan.focus();
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(titleSpan);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }

            // B. NOUVEAU : Pour le titre principal (En-tête de page global)
            if (e.target.classList.contains('edit-report-icon-trigger')) {
                // On remonte au conteneur parent (.page-header) pour trouver le span correspondant
                const titleSpan = e.target.closest('.page-header').querySelector('.editable-report-title');
                
                if (titleSpan) {
                    titleSpan.focus();
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(titleSpan);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });
    }
}
// --- ACTIONS DE BAS DE PANNEAU (TRANSFERT ET SÉCURITÉ) ---
    
    // 1. Transfert Panier -> Éditeur
    //const btnCartToEditor = document.getElementById('btn-cart-to-editor');
    //if (btnCartToEditor) {
    //    btnCartToEditor.onclick = async () => {
    //        if (!appState.cart || appState.cart.length === 0) {
    //            alert("Votre panier est vide.");
    //            return;
    //        }
    //        if (confirm(`Transférer les ${appState.cart.length} éléments du panier vers le rapport ?`)) {
    //            appState.cart.forEach(item => {
    //                const newPage = JSON.parse(JSON.stringify(item.page));
    //                newPage.id = Date.now() + Math.random();
    //                appState.pages.push(newPage);
    //            });
    //            appState.cart = [];
    //            await db.saveCart(appState.cart);
    //            if (window.updateCartBadge) window.updateCartBadge();
    //            buildDefaultStructure(); // Ou updatePagesListUI() selon votre import
    //            generateReport();
    //        }
    //    };
    //}

    // 2. Nettoyage de sécurité (Wipe) - DÉCLARATION UNIQUE ICI
    const btnWipe = document.getElementById('btn-wipe-data');
    if (btnWipe) {
        btnWipe.onclick = async () => {
            if (confirm("⚠️ Supprimer définitivement toutes vos données locales (panier et réglages) ?")) {
                if (confirm("Confirmation finale : cette action est irréversible.")) {
                    try {
                        await db.wipeAll();
                        localStorage.clear();
                        window.location.reload();
                    } catch (e) {
                        alert("Erreur lors du nettoyage.");
                    }
                }
            }
        };
    }



window.navigateToSlide = function (target) {
    if (appState.pages.length === 0) return;
    let slideIndex = null;
    if (target === 'first') slideIndex = 0; else if (target === 'last') slideIndex = appState.pages.length - 1; else if (typeof target === 'number' && target >= 0 && target < appState.pages.length) slideIndex = target;
    if (slideIndex !== null) {
        const targetSlideId = appState.pages[slideIndex].id;
        const targetElement = document.querySelector(`#report-container .page[data-page-id="${targetSlideId}"]`);
        if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

export function setupScrollTracking() { window.removeEventListener('scroll', handleReportScroll); window.addEventListener('scroll', handleReportScroll); }

export function handleReportScroll() {
    const pages = document.querySelectorAll('#report-container .page');
    let activePageId = null;
    pages.forEach(page => { const rect = page.getBoundingClientRect(); if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 4) activePageId = page.getAttribute('data-page-id'); });
    if (activePageId) highlightAndScrollToNavItem(activePageId);
}

export function highlightAndScrollToNavItem(pageId) {
    if (!pageId) return;
    const items = document.querySelectorAll('#pages-list .page-item');
    let targetItem = null; let isAlreadyActive = false;
    items.forEach(item => {
        if (item.getAttribute('data-page-id') === pageId.toString()) { if (item.classList.contains('active-page-item')) isAlreadyActive = true; else item.classList.add('active-page-item'); targetItem = item; }
        else item.classList.remove('active-page-item');
    });
    if (targetItem && !isAlreadyActive) { const container = document.getElementById('pages-list'); const header = container.firstElementChild; const headerHeight = header ? header.offsetHeight : 45; container.scrollTo({ top: targetItem.offsetTop - headerHeight, behavior: 'smooth' }); }
}

function initFormulaAutocomplete() {
    const input = document.getElementById('input-custom-formula');
    const list = document.getElementById('formula-autocomplete');
    
    input.addEventListener('input', () => {
        const val = input.value;
        const lastBracket = val.lastIndexOf('[');
        
        // 1. Gestion de l'autocomplétion
        if (lastBracket !== -1 && val.indexOf(']', lastBracket) === -1) {
            const search = val.substring(lastBracket + 1).toLowerCase();
            const matches = appState.availableMetrics.filter(m => m.toLowerCase().includes(search));
            
            list.innerHTML = matches.map(m => `<div class="suggestion">${m}</div>`).join('');
            list.style.display = matches.length ? 'block' : 'none';
            
            list.querySelectorAll('.suggestion').forEach(div => {
                div.onclick = () => {
                    input.value = val.substring(0, lastBracket) + '[' + div.textContent + ']';
                    list.style.display = 'none';
                    appState.customFormula = input.value;
                    triggerCustomFormulaUpdate(); // Nouvelle fonction d'aide
                };
            });
        } else {
            list.style.display = 'none';
        }
        
        appState.customFormula = input.value;
        triggerCustomFormulaUpdate(); // Nouvelle fonction d'aide
    });
}

// Fonction d'aide pour mettre à jour l'interface dynamiquement
function triggerCustomFormulaUpdate() {
    // Extraction des variables entre crochets
    const matches = appState.customFormula.match(/\[(.*?)\]/g) || [];
    const detectedMetrics = [...new Set(matches.map(m => m.slice(1, -1)))]; // Nettoyage et dédoublonnage
    
    // Mise à jour de l'état global (seulement si la métrique existe vraiment)
    appState.selectedMetrics = detectedMetrics.filter(m => appState.availableMetrics.includes(m));
    
    // Appel du rafraîchissement visuel du panneau droit
    import('./viewUpdater.js').then(module => {
        module.updateMetricControls();
    });
    
    markAsDirty();
}

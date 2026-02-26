import { setupUIListeners } from './ui/domEvents.js';
import { initDelegations } from './features/delegations.js';
import { loadInitialData } from './core/dataLoader.js';
import { 
    updatePagesListUI, 
    populateEpciRegSelect, 
    populateDeptSelect, // <-- 1. AJOUTE CET IMPORT
    updateMetricControls,
    populatePaletteSelect, 
    updateMainBrand 
} from './ui/viewUpdater.js';
import { initCart } from './features/cart.js';
import './features/editor.js';

window.addEventListener('DOMContentLoaded', async () => {
    initDelegations();
    setupUIListeners();
    populateEpciRegSelect();
    populateDeptSelect();
    populatePaletteSelect(); // <-- 2. AJOUTE L'APPEL ICI
    await initCart();
    await loadInitialData();
});

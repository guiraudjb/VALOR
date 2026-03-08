import { GEO_ABBR } from '../config/constants.js';
import { appState } from './state.js';

export function escapeHtml(text) {
    if (!text) return text;
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function getAbbreviatedName(name) {
    if (!name) return "";
    let abbrName = name.toUpperCase();
    GEO_ABBR.forEach(item => { abbrName = abbrName.replace(item.full, item.short); });
    return abbrName.length > 20 ? abbrName.substring(0, 18) + "." : abbrName;
}

export const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function formatValue(val, mode) {
    if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return '-';
    
    if (['dev_pct', 'share', 'growth'].includes(mode)) {
        const prefix = (val > 0 && mode !== 'share') ? '+' : '';
        return prefix + val.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
    }
    if (mode === 'dev_abs') return (val > 0 ? '+' : '') + val.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    if (mode === 'ratio') return val.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    if (mode === 'avg') return val.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    
    // --- NOUVEAU : Prise en compte du mode Custom et de la précision voulue ---
    if (mode === 'custom') {
        // On récupère la précision stockée dans l'état, par défaut 2
        const prec = parseInt(appState.formulaPrecision);
        const safePrec = isNaN(prec) ? 2 : prec;
        return val.toLocaleString('fr-FR', { 
            minimumFractionDigits: safePrec, 
            maximumFractionDigits: safePrec 
        });
    }
    
    return val.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

// NOUVEAU: Moteur de base de données locale pour persister le panier
export const db = {
    name: 'ValorDB', 
    version: 1, 
    storeName: 'cart',
    instance: null, // Pour stocker la connexion active

    async init() {
        if (this.instance) return this.instance;
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open(this.name, this.version);
            req.onupgradeneeded = e => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    database.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            req.onsuccess = e => {
                this.instance = e.target.result;
                resolve(this.instance);
            };
            req.onerror = e => reject(e);
        });
    },

    async saveCart(cartArray) {
        const database = await this.init();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.clear();
            cartArray.forEach(item => store.put(item));
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e);
        });
    },

    async loadCart() {
        const database = await this.init();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = e => reject(e);
        });
    },

    async wipeAll() {
        // 1. Fermer la connexion active si elle existe
        if (this.instance) {
            this.instance.close();
            this.instance = null;
        }
        
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.deleteDatabase(this.name);
            req.onsuccess = () => resolve();
            req.onerror = () => reject();
            req.onblocked = () => {
                alert("Suppression bloquée : fermez les autres onglets V.A.L.O.R.");
                reject();
            };
        });
    }
};


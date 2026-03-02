import { appState } from '../core/state.js';
import { escapeHtml, readFileAsDataURL } from '../core/utils.js';
import { updatePagesListUI } from '../ui/viewUpdater.js';
import { generateReport } from './reportGenerator.js';

window.execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    const visual = document.getElementById('visual-editor');
    if (visual.style.display !== 'none') visual.focus();
};

window.toggleSourceMode = () => {
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    if (visualEditor.style.display !== 'none') {
        sourceEditor.value = visualEditor.innerHTML;
        visualEditor.style.display = 'none';
        sourceEditor.style.display = 'block';
        sourceEditor.focus();
    } else {
        visualEditor.innerHTML = window.DOMPurify.sanitize(sourceEditor.value);
        sourceEditor.style.display = 'none';
        visualEditor.style.display = 'block';
        visualEditor.focus();
    }
};

window.insertDynamicTable = () => {
    const rowsStr = prompt("Nombre de lignes ?", "3"); if (rowsStr === null) return;
    const colsStr = prompt("Nombre de colonnes ?", "3"); if (colsStr === null) return;
    const rows = parseInt(rowsStr); const cols = parseInt(colsStr);
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;
    let tableHTML = `<table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #ddd;"><thead><tr style="background:#f0f0f0;">`;
    for (let c = 0; c < cols; c++) tableHTML += `<th style="border:1px solid #ccc; padding:8px;">Titre ${c+1}</th>`;
    tableHTML += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) { 
        tableHTML += `<tr>`;
        for (let c = 0; c < cols; c++) tableHTML += `<td style="border:1px solid #ccc; padding:8px;">Donnée</td>`;
        tableHTML += `</tr>`;
    }
    tableHTML += `</tbody></table><p><br></p>`;
    document.execCommand('insertHTML', false, tableHTML);
};

window.insertCustomList = (type) => {
    const countStr = prompt("Combien d'éléments voulez-vous insérer ?", "3"); if (countStr === null) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count < 1) { document.execCommand(type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList'); return; }
    let listHTML = `<${type}>`;
    for (let i = 0; i < count; i++) listHTML += `<li>Élément ${i+1}</li>`;
    listHTML += `</${type}><p><br></p>`;
    document.execCommand('insertHTML', false, listHTML);
};


window.insertWysiwygImage = async (input) => {
    if (input.files && input.files[0]) {
        try {
            const base64 = await readFileAsDataURL(input.files[0]);
            
            // On demande à l'utilisateur la taille souhaitée
            let width = prompt("Quelle largeur pour cette image ? (ex: 50%, 400px, ou 100% par défaut)", "100%");
            if (!width) width = "100%"; // On sécurise si l'utilisateur annule ou laisse vide
            
            // On injecte la largeur choisie dans le style inline
            const imgHtml = `<img src="${base64}" style="width: ${width}; max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;" alt="Image insérée">`;
            
            const visual = document.getElementById('visual-editor');
            if (visual) visual.focus();
            document.execCommand('insertHTML', false, imgHtml);
            
        } catch (e) { console.error("Erreur", e); }
        input.value = "";
    }
};

window.editPage = (id) => { 
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    
    visualEditor.style.display = 'block';
    sourceEditor.style.display = 'none';

    if (id) {
        const page = appState.pages.find(p => p.id === id);
        if (page && page.type === 'free') {
            document.getElementById('edit-slide-id').value = id;
            document.getElementById('slide-title').value = page.title;
            visualEditor.innerHTML = window.DOMPurify.sanitize(page.content);
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

export const saveCustomSlide = async () => { 
    const idStr = document.getElementById('edit-slide-id').value;
    const title = document.getElementById('slide-title').value || "Sans titre";
    const visualEditor = document.getElementById('visual-editor');
    const sourceEditor = document.getElementById('source-editor');
    
let content = "";
    // CORRECTION : On autorise DOMPurify à conserver les attributs "style" et les balises "img"
    const purifyConfig = { ADD_TAGS: ['img'], ADD_ATTR: ['style'] };
    
    if (visualEditor.style.display !== 'none') {
        content = window.DOMPurify.sanitize(visualEditor.innerHTML, purifyConfig);
    } else { 
        content = window.DOMPurify.sanitize(sourceEditor.value, purifyConfig); 
        visualEditor.innerHTML = content;
    }

    let finalId; 

    if (idStr) { 
        const id = parseInt(idStr);
        finalId = id;
        const pageIndex = appState.pages.findIndex(p => p.id === id); 
        if (pageIndex !== -1) { 
            appState.pages[pageIndex].title = title;
            appState.pages[pageIndex].content = content;
        } 
    } else { 
        finalId = Date.now();
        appState.pages.push({ id: finalId, type: 'free', title: title, content: content, visible: true });
    }
    
    document.getElementById('modal-edit-slide').classList.remove('fr-modal--opened'); 
    document.getElementById('modal-edit-slide').close(); 
    
    // On met à jour l'interface et on régénère le rapport
    updatePagesListUI(); 
    generateReport();

    // On utilise un délai de 300ms pour laisser le temps au navigateur de tout dessiner
    setTimeout(() => {
        // Ciblage strict et robuste de la diapositive dans le conteneur principal
        const slideEl = document.querySelector(`#report-container .page[data-page-id="${finalId}"]`);
        
        if (slideEl) {
            // Scroll au centre de l'écran
            slideEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
           
            // CORRECTION : On remet la valeur à vide pour que le CSS d'origine (blanc) reprenne le dessus
            setTimeout(() => { 
                slideEl.style.backgroundColor = ''; 
            }, 1000);
        } else if (window.scrollToPage) {
            // Fallback de sécurité
            window.scrollToPage(finalId);
        }
    }, 300);
};

let dsfrIconsData = {};
let editorSavedRange = null; // NOUVEAU : Mémorise la position du curseur

window.openIconPicker = async () => {
    // 1. Sauvegarder la position exacte du curseur avant d'ouvrir la modale
    const sel = window.getSelection();
    const visual = document.getElementById('visual-editor');
    if (sel.rangeCount > 0 && visual.contains(sel.anchorNode)) {
        editorSavedRange = sel.getRangeAt(0);
    } else {
        editorSavedRange = null;
    }

    // 2. Charger les données si ce n'est pas déjà fait
    if (Object.keys(dsfrIconsData).length === 0) {
        try {
            const res = await fetch('iconsdsfr.txt');
            const text = await res.text();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            
            lines.forEach(path => {
                const parts = path.split('/');
                const filename = parts.pop();
                const category = parts.pop(); 
                const type = path.includes('artwork') ? 'Pictogrammes' : 'Icônes';
                
                const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
                const group = `${type} - ${catLabel}`;
                
                if (!dsfrIconsData[group]) dsfrIconsData[group] = [];
                dsfrIconsData[group].push(path);
            });
        } catch (e) {
            console.error("Erreur de chargement du fichier iconsdsfr.txt", e);
            alert("Impossible de charger la liste des icônes.");
            return;
        }
    }
    
    // 3. Remplir le menu déroulant
    const select = document.getElementById('icon-category-select');
    select.innerHTML = '';
    Object.keys(dsfrIconsData).sort().forEach(group => {
        const opt = document.createElement('option');
        opt.value = group;
        opt.innerText = `${group} (${dsfrIconsData[group].length})`;
        select.appendChild(opt);
    });
    
    renderIconGrid(Object.keys(dsfrIconsData).sort()[0]);
    
    const modal = document.getElementById('modal-dsfr-icons');
    modal.classList.add('fr-modal--opened');
    modal.showModal();
};

window.closeIconPicker = () => {
    const modal = document.getElementById('modal-dsfr-icons');
    modal.classList.remove('fr-modal--opened');
    modal.close();
};

window.renderIconGrid = (group) => {
    const grid = document.getElementById('icon-picker-grid');
    grid.innerHTML = '';
    if (!dsfrIconsData[group]) return;
    
    dsfrIconsData[group].forEach(path => {
        const btn = document.createElement('div');
        btn.className = 'icon-grid-item';
        btn.title = path.split('/').pop(); 
        btn.onclick = () => insertDsfrIcon(path, group.includes('Pictogrammes'));
        btn.innerHTML = `<img src="${path}" alt="icon">`;
        grid.appendChild(btn);
    });
};

window.insertDsfrIcon = (path, isPictogram) => {
    // 1. Fermer la modale en premier pour libérer le focus
    closeIconPicker();

    // 2. Redonner le focus à l'éditeur
    const visual = document.getElementById('visual-editor');
    if (visual) visual.focus();

    // 3. Restaurer la position exacte du curseur
    if (editorSavedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(editorSavedRange);
    }

    // 4. Demander la taille (Redimensionnement)
    const defaultWidth = isPictogram ? '80px' : '32px';
    let width = prompt("Quelle taille pour ce graphique ? (ex: 80px, 150px, 50%)", defaultWidth);
    if (!width) width = defaultWidth; // Sécurité si l'utilisateur annule

    // 5. Insérer l'image
    const imgHtml = `<img src="${path}" style="width: ${width}; height: auto; vertical-align: middle; margin: 0 5px;" alt="Graphique DSFR">`;
    document.execCommand('insertHTML', false, imgHtml);
};

// --- BIBLIOTHÈQUE DE MODÈLES PRÉFORMATÉS ---

const slideTemplates = {
"titre": `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; min-height: 450px; text-align: center;">
            <div style="width: 70%; max-width: 800px; border-top: 3px solid #000091; border-left: 3px solid #000091; border-right: 3px solid #000091; height: 40px; margin: 0 auto;"></div>
            
            <div style="width: 70%; max-width: 800px; padding: 20px 0;">
                <h1 style="color: #161616; font-size: 4rem; margin: 0; line-height: 1.2; font-weight: bold;">Titre de la<br>présentation</h1>
                <p style="color: #161616; font-size: 1.8rem; margin: 20px 0 0 0;">Sous-titre de la présentation</p>
            </div>

            <div style="width: 70%; max-width: 800px; border-bottom: 3px solid #ce0500; border-left: 3px solid #ce0500; border-right: 3px solid #ce0500; height: 40px; margin: 0 auto;"></div>
            
            <div style="margin-top: 50px; color: #929292; font-size: 1.3rem; line-height: 1.4;">
                xx mai<br><strong style="font-size: 1.5rem; color: #666;">2026</strong>
            </div>
        </div>
    `,
    "sommaire": `
        <h2 style="color: #000091; font-size: 2rem; margin-bottom: 2rem;">SOMMAIRE</h2>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem;">
                <div style="color: #000091; font-size: 3rem; font-weight: bold;">01.</div>
                <div>
                    <h4 style="margin: 0; font-size: 1.5rem; color: #161616;">ÉLÉMENT 1</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Descriptif ou sous-titre de cette partie...</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem;">
                <div style="color: #000091; font-size: 3rem; font-weight: bold;">02.</div>
                <div>
                    <h4 style="margin: 0; font-size: 1.5rem; color: #161616;">ÉLÉMENT 2</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Descriptif ou sous-titre de cette partie...</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem;">
                <div style="color: #000091; font-size: 3rem; font-weight: bold;">03.</div>
                <div>
                    <h4 style="margin: 0; font-size: 1.5rem; color: #161616;">ÉLÉMENT 3</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Descriptif ou sous-titre de cette partie...</p>
                </div>
            </div>
        </div>
    `,
    "intercalaire": `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 400px; background: #f4f6ff; border-left: 10px solid #000091; border-radius: 4px;">
            <div style="text-align: center;">
                <div style="color: #000091; font-size: 6rem; font-weight: bold; line-height: 1;">1</div>
                <h2 style="color: #161616; font-size: 2.5rem; margin-top: 1rem;">Nom de la partie</h2>
            </div>
        </div>
    `,
    "1col": `
        <h3 style="color: #161616; margin-bottom: 0;">ÉLÉMENT 1 :</h3>
        <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 2rem; border-radius: 0 0 4px 4px; margin-top: 1rem;">
            <p style="font-size: 1.1rem; line-height: 1.6;">Double-cliquez ici pour éditer votre texte. Vous pouvez utiliser ce bloc pour détailler une analyse globale, insérer une grande image, ou présenter un compte-rendu textuel de la région.</p>
        </div>
    `,
    "2cols": `
        <div style="display: flex; gap: 2rem; margin-top: 1rem; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column;">
                <h3 style="color: #161616; margin-bottom: 1rem;"><span style="color:#000091;">1.</span> ÉLÉMENT 1</h3>
                <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 1.5rem; flex: 1;">
                    <p>Contenu de la première colonne...</p>
                </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column;">
                <h3 style="color: #161616; margin-bottom: 1rem;"><span style="color:#000091;">2.</span> ÉLÉMENT 2</h3>
                <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 1.5rem; flex: 1;">
                    <p>Contenu de la seconde colonne...</p>
                </div>
            </div>
        </div>
    `,
    "3cols": `
        <div style="display: flex; gap: 1.5rem; margin-top: 1rem;">
            <div style="flex: 1;">
                <h4 style="color: #161616; margin-bottom: 0.5rem;"><span style="color:#000091;">1.</span> ÉLÉMENT 1</h4>
                <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 1rem; min-height: 200px;">
                    <p>Texte court ou description...</p>
                </div>
            </div>
            <div style="flex: 1;">
                <h4 style="color: #161616; margin-bottom: 0.5rem;"><span style="color:#000091;">2.</span> ÉLÉMENT 2</h4>
                <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 1rem; min-height: 200px;">
                    <p>Texte court ou description...</p>
                </div>
            </div>
            <div style="flex: 1;">
                <h4 style="color: #161616; margin-bottom: 0.5rem;"><span style="color:#000091;">3.</span> ÉLÉMENT 3</h4>
                <div style="background: #f6f6f6; border-top: 4px solid #000091; padding: 1rem; min-height: 200px;">
                    <p>Texte court ou description...</p>
                </div>
            </div>
        </div>
    `,
    "4kpi": `
        <div style="display: flex; justify-content: space-around; text-align: center; gap: 2rem; margin-top: 4rem;">
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #000091; color: white; width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">XX</div>
                <div style="font-size: 2rem; color: #000091; margin: 10px 0; line-height: 0.5;">⋮</div>
                <p style="font-weight: bold; font-size: 1.1rem; margin-top: 10px;">Zone de texte explicative</p>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #000091; color: white; width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">XX</div>
                <div style="font-size: 2rem; color: #000091; margin: 10px 0; line-height: 0.5;">⋮</div>
                <p style="font-weight: bold; font-size: 1.1rem; margin-top: 10px;">Zone de texte explicative</p>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #000091; color: white; width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">XX</div>
                <div style="font-size: 2rem; color: #000091; margin: 10px 0; line-height: 0.5;">⋮</div>
                <p style="font-weight: bold; font-size: 1.1rem; margin-top: 10px;">Zone de texte explicative</p>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #000091; color: white; width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">XX</div>
                <div style="font-size: 2rem; color: #000091; margin: 10px 0; line-height: 0.5;">⋮</div>
                <p style="font-weight: bold; font-size: 1.1rem; margin-top: 10px;">Zone de texte explicative</p>
            </div>
        </div>
    `,
    "timeline": `
        <div style="display: flex; flex-direction: column; gap: 2rem; margin-top: 2rem;">
            <div style="display: flex; gap: 2rem;">
                <div style="background: #000091; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; flex-shrink: 0;">1</div>
                <div style="flex: 1; border-left: 3px dashed #000091; padding-left: 2rem; margin-left: -43px;">
                    <h4 style="margin-top: 0;">Élément 1</h4>
                    <p style="background: #f6f6f6; padding: 1rem; border-radius: 4px;">Zone de texte descriptive pour cette première étape ou information.</p>
                </div>
            </div>
            <div style="display: flex; gap: 2rem;">
                <div style="background: #000091; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; flex-shrink: 0;">2</div>
                <div style="flex: 1; border-left: 3px dashed #000091; padding-left: 2rem; margin-left: -43px;">
                    <h4 style="margin-top: 0;">Élément 2</h4>
                    <p style="background: #f6f6f6; padding: 1rem; border-radius: 4px;">Zone de texte descriptive pour cette deuxième étape.</p>
                </div>
            </div>
            <div style="display: flex; gap: 2rem;">
                <div style="background: #000091; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; flex-shrink: 0;">3</div>
                <div style="flex: 1; padding-left: 2rem; margin-left: -40px;">
                    <h4 style="margin-top: 0;">Élément 3</h4>
                    <p style="background: #f6f6f6; padding: 1rem; border-radius: 4px;">Zone de texte descriptive pour la conclusion.</p>
                </div>
            </div>
        </div>
    `
};

window.insertTemplate = (templateKey) => {
    const select = document.getElementById('template-select');
    if (!templateKey) return;

    const visual = document.getElementById('visual-editor');
    
    // Protection : on avertit l'utilisateur s'il a déjà tapé du texte
    const currentText = visual.innerText.trim();
    if (currentText.length > 20 && currentText !== "Votre texte ici...") {
        if (!confirm("Attention, l'application d'un modèle va écraser votre contenu actuel. Voulez-vous continuer ?")) {
            select.selectedIndex = 0; // Réinitialise le select
            return;
        }
    }

    // Injection du modèle
    visual.innerHTML = slideTemplates[templateKey];
    
    // Réinitialisation du menu déroulant et remise du focus
    select.selectedIndex = 0;
    visual.focus();
};



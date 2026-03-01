import { 
    getMean, 
    getLinearTrend, 
    getMovingAverage, 
    detectOutliers 
} from './utils/data-analytics.js';
import { interactiveDataLabelsPlugin } from './features/interactiveDataLabels.js';

/**
 * UTILITAIRE : Convertit une couleur HEX ou RGB en RGBA avec transparence
 * @param {string} color - La couleur (ex: #000091, #091 ou rgb(0,0,145))
 * @param {number} alpha - L'opacité de 0.0 (transparent) à 1.0 (solide)
 * @returns {string} La chaîne RGBA
 */
function colorToRgba(color, alpha = 1) {
    if (!color) return `rgba(0, 0, 0, ${alpha})`;
    // Fallback noir

    // 1. Gestion du format RGB venant de D3.js (ex: "rgb(255, 120, 0)")
    if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
            return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
        }
    }

    // 2. Gestion du format HEX (ex: "#000091")
    let hex = color.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Si le parsing échoue, on retourne une couleur par défaut (Bleu DSFR)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 145, ${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 1. Définition du plugin custom pour dessiner les lignes de moyenne (baselines)
const inlineBaselinesPlugin = {
    id: 'inlineBaselines',
    beforeDraw(chart) {
        if (!chart.config.options.plugins.inlineBaselines) return;
        const baselines = chart.config.options.plugins.inlineBaselines;
        if (baselines.length === 0) return;

        const { ctx, chartArea, scales } = chart;
        const isHorizontal = chart.config.options.indexAxis === 'y';
        
        // On cible le bon axe selon l'orientation
        const valueScale = isHorizontal ? scales.x : scales.y;

        // Sécurité anti-crash pour Pie/Radar qui n'ont pas d'axes cartésiens
        if (!valueScale) return; 

        ctx.save();
        baselines.forEach(line => {
            const pos = valueScale.getPixelForValue(line.value);
            
            ctx.beginPath();
            if (isHorizontal) {
                // Tracé vertical pour les barres horizontales
                if (pos < chartArea.left || pos > chartArea.right) return;
                ctx.moveTo(pos, chartArea.top);
                ctx.lineTo(pos, chartArea.bottom);
            } else {
                // Tracé horizontal classique
                if (pos < chartArea.top || pos > chartArea.bottom) return;
                ctx.moveTo(chartArea.left, pos);
                ctx.lineTo(chartArea.right, pos);
            }
        
            ctx.lineWidth = line.width || 2;
            ctx.strokeStyle = colorToRgba(line.color, 0.8);
            ctx.setLineDash(line.dash || [5, 5]);
            ctx.stroke();

            if (line.label) {
                ctx.fillStyle = line.color || '#ce0500';
                ctx.font = 'bold 12px "Marianne", arial, sans-serif';
                if (isHorizontal) {
                    ctx.fillText(`${line.label} : ${line.value.toFixed(1)}`, pos + 5, chartArea.top + 15);
                } else {
                    ctx.fillText(`${line.label} : ${line.value.toFixed(1)}`, chartArea.left + 10, pos - 5);
                }
            }
        });
        ctx.restore();
    }
};

// Enregistrement global du plugin et des paramètres DSFR
if (window.Chart) {
    Chart.register(inlineBaselinesPlugin);
    // Forcer la police Marianne et la couleur DSFR pour TOUS les textes des graphiques
    Chart.defaults.font.family = '"Marianne", arial, sans-serif';
    Chart.defaults.color = '#161616'; // Gris très foncé du DSFR pour une bonne lisibilité
}

// 2. Définition de la classe principale
class DSFRChart extends HTMLElement {
    constructor() {
        super();
        this.chartInstance = null;
    }

    connectedCallback() {
        this.innerHTML = '<div style="position: relative; width: 100%; height: 100%; min-height: 350px;"><canvas></canvas></div>';
        this.ctx = this.querySelector('canvas').getContext('2d');

        setTimeout(() => {
            this.buildChartFromAttributes();
        }, 50);
    }

    buildChartFromAttributes() {
        try {
            const xLabels = JSON.parse(this.getAttribute('x') || '[]');
            const ySeries = JSON.parse(this.getAttribute('y') || '[]');
            const names = JSON.parse(this.getAttribute('name') || '[]');
            let rawColors = JSON.parse(this.getAttribute('colors') || '[]');
            const isHorizontal = this.getAttribute('horizontal') === 'true';

            // On lit les options analytiques depuis le HTML
            const showMeanLine = this.getAttribute('mean') === 'true';
            const showTrendline = this.getAttribute('trend') === 'true';
            const showMovingAvg = this.getAttribute('moving') === 'true';
            const highlightOutliers = this.getAttribute('outliers') === 'true';
            const chartType = this.tagName.toLowerCase().replace('-chart', '');
            const defaultColor = 'rgb(0, 0, 145)';
            
            const datasets = ySeries.map((seriesData, index) => {
                const baseColor = rawColors[index] || defaultColor;
                let bgColor, borderColor, borderWidth;

                if (chartType === 'line' || chartType === 'radar') {
                    borderColor = baseColor;
                    bgColor = colorToRgba(baseColor, 0.2);
                    borderWidth = 3;
                } else if (chartType === 'pie') {
                    const pieColors = rawColors.length >= seriesData.length ? rawColors : Array(seriesData.length).fill(baseColor);
                    bgColor = pieColors.map(c => colorToRgba(c, 0.8));
                    borderColor = '#ffffff';
                    borderWidth = 2;
                } else {
                    bgColor = colorToRgba(baseColor, 0.7);
                    borderColor = baseColor;
                    borderWidth = 1;
                }

                return {
                    label: names[index] || `Série ${index + 1}`,
                    data: seriesData,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    fill: chartType === 'radar' ? true : false, 
                    tension: 0.3
                };
            });

            // On passe ces options au renderChart
            this.renderChart(this.ctx, chartType, xLabels, datasets, { 
                horizontal: isHorizontal,
                showMeanLine: showMeanLine,
                showTrendline: showTrendline,
                showMovingAvg: showMovingAvg,
                highlightOutliers: highlightOutliers
            });
        } catch (error) {
            console.error("Erreur lors de la lecture des attributs du graphique :", error);
            this.innerHTML = '<p style="color:#ce0500; font-weight:bold; padding: 1rem;">Erreur de chargement des données du graphique.</p>';
        }
    }

    renderChart(ctxParam, chartType, xLabels, rawDatasets, options = {}) {
        const targetCtx = ctxParam || this.ctx;
        if (!targetCtx) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const isHorizontal = options.horizontal || false;
        const showTrendline = options.showTrendline || false;
        const showMovingAvg = options.showMovingAvg || false;
        const highlightOutliers = options.highlightOutliers || false;
        const showMeanLine = options.showMeanLine || false;
        
        let datasets = JSON.parse(JSON.stringify(rawDatasets));
        const baselinesToDraw = [];

        datasets.forEach((dataset) => {
            const rawData = dataset.data;
            const baseColorSolid = Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor || 'rgb(0, 0, 145)';

            if (highlightOutliers && chartType === 'bar') {
                const outliersMap = detectOutliers(rawData, 2);
                const normalColor = dataset.backgroundColor;
                
                dataset.backgroundColor = (context) => {
                    const ctxIndex = context.dataIndex;
                    if (outliersMap[ctxIndex]) {
                        return 'rgba(206, 5, 0, 0.8)'; 
                    }
                    return normalColor;
                };
            }

            // CORRECTION : On limite la ligne de moyenne aux graphiques à axes cartésiens (bar ou line)
            if (showMeanLine && (chartType === 'bar' || chartType === 'line')) {
                const mean = getMean(rawData);
                baselinesToDraw.push({
                    value: mean,
                    label: `Moy. ${dataset.label || ''}`,
                    color: baseColorSolid,
                    dash: [4, 4],
                    width: 2
                });
            }

            if (showTrendline && (chartType === 'bar' || chartType === 'line')) {
                const trendData = getLinearTrend(rawData);
                datasets.push({
                    type: 'line',
                    label: `Tendance (${dataset.label || ''})`,
                    data: trendData,
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    order: -1
                });
            }

            if (showMovingAvg && (chartType === 'bar' || chartType === 'line')) {
                const maData = getMovingAverage(rawData, 3);
                datasets.push({
                    type: 'line',
                    label: `Moy. Mobile (${dataset.label || ''})`,
                    data: maData,
                    borderColor: 'rgba(255, 153, 71, 0.9)', 
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 2,
                    fill: false,
                    order: -2
                });
            }
        });

        // 1. Préparation des options communes (sans les axes cartésiens)
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                inlineBaselines: baselinesToDraw,
                legend: {
                    position: 'bottom',
                    display: chartType === 'pie' || datasets.length > 1,
                    labels: { 
                        font: { family: '"Marianne", arial, sans-serif', size: 14 } 
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: '"Marianne", arial, sans-serif' },
                    bodyFont: { family: '"Marianne", arial, sans-serif' }
                }
            }
        };

        // 2. Injection conditionnelle des axes selon la nature du graphique
        if (chartType === 'bar' || chartType === 'line') {
            chartOptions.indexAxis = (isHorizontal && chartType === 'bar') ? 'y' : 'x';
            chartOptions.scales = {
                x: { grid: { display: true, drawBorder: false }, beginAtZero: isHorizontal },
                y: { grid: { display: true, drawBorder: false }, beginAtZero: !isHorizontal }
            };
        } else if (chartType === 'radar') {
            chartOptions.scales = { r: { beginAtZero: true } };
        }
        // Note : Pour les 'pie' (camemberts), on n'ajoute ni scales ni indexAxis.

        // 3. Initialisation du graphique
        try {
            this.chartInstance = new Chart(targetCtx, {
                type: chartType,
                data: {
                    labels: xLabels,
                    datasets: datasets
                },
                plugins: [interactiveDataLabelsPlugin],
                options: chartOptions
            });
        } catch (e) {
            console.error("Erreur de rendu du graphique :", e);
            this.innerHTML = '<p style="color:#ce0500; font-weight:bold; padding: 1rem;">Erreur lors de la génération du graphique.</p>';
        }
    }

// AJOUT : Nettoyage automatique à la destruction de l'élément
    disconnectedCallback() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.innerHTML = ''; // Libère les noeuds DOM internes
    }

}

customElements.define('bar-chart', class extends DSFRChart {});
customElements.define('pie-chart', class extends DSFRChart {});
customElements.define('line-chart', class extends DSFRChart {});
customElements.define('radar-chart', class extends DSFRChart {});

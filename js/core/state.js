export const appState = {
    isStructureDirty: false,
    geoData: {},
    userData: [],
    sourceGranularity: 'dep',
    availableMetrics: [],
    selectedMetrics: [],
    calcMode: 'simple',
    customFormula: '',       // Stockera la chaîne de caractères (ex: "[A]+[B]")
    formulaPrecision: 2,     // Nombre de décimales par défaut
    shareBase: 'global',
    cart: [],
    pages: [],
    customDelegations: [],
    globalLogo: null,
    defaultLabelSize: null,
    dataFilter: { active: false, metric: '_computed', operator: 'none', value1: 0, value2: 0 },
    refData: {
        communes: new Map(),
        comToDep: new Map(),
        depToReg: new Map(),
        epciList: []
    }


};

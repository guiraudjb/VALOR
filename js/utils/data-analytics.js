/**
 * data-analytics.js
 * Moteur de calcul statistique et d'analyse pour V.A.L.O.R.
 */

export const getMinMax = (data) => {
    return data.reduce((acc, val) => {
        if (val === null || isNaN(val)) return acc;
        return {
            min: val < acc.min ? val : acc.min,
            max: val > acc.max ? val : acc.max
        };
    }, { min: Infinity, max: -Infinity });
};

export const getMean = (data) => {
    const validData = data.filter(v => v !== null && !isNaN(v));
    if (validData.length === 0) return 0;
    const sum = validData.reduce((acc, val) => acc + val, 0);
    return sum / validData.length;
};

export const getMedian = (data) => {
    const validData = data.filter(v => v !== null && !isNaN(v));
    if (validData.length === 0) return 0;
    const sorted = [...validData].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
        return sorted[mid];
    } else {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
};

export const getStandardDeviation = (data, meanParam = null) => {
    const validData = data.filter(v => v !== null && !isNaN(v));
    if (validData.length === 0) return 0;
    const mean = meanParam !== null ? meanParam : getMean(validData);
    const squareDiffs = validData.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = getMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
};

export const getMovingAverage = (data, windowSize = 3) => {
    let result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
            result.push(null);
            continue;
        }
        let sum = 0;
        let count = 0;
        for (let j = 0; j < windowSize; j++) {
            if (data[i - j] !== null && !isNaN(data[i - j])) {
                sum += data[i - j];
                count++;
            }
        }
        result.push(count > 0 ? sum / count : null);
    }
    return result;
};

export const getLinearTrend = (data) => {
    let xSum = 0, ySum = 0, xxSum = 0, xySum = 0;
    let count = 0;

    data.forEach((y, x) => {
        if (y !== null && !isNaN(y)) {
            xSum += x;
            ySum += y;
            xxSum += x * x;
            xySum += x * y;
            count++;
        }
    });

    if (count === 0) return data.map(() => null);

    const m = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
    const b = (ySum - m * xSum) / count;

    return data.map((_, x) => m * x + b);
};

export const detectOutliers = (data, threshold = 2) => {
    const mean = getMean(data);
    const stdDev = getStandardDeviation(data, mean);
    
    if (stdDev === 0) return data.map(() => false);

    return data.map(val => {
        if (val === null || isNaN(val)) return false;
        const zScore = Math.abs((val - mean) / stdDev);
        return zScore > threshold;
    });
};

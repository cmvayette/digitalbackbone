import type { Process } from '../types/process';


export interface ProcessMaturity {
    level: 1 | 2 | 3 | 4 | 5;
    label: string;
    nextStep: string;
    score: number; // Legacy 0-100 score kept for sorting
    factors: {
        freshness: number;
        completeness: number;
        compliance: number;
        driftPenalty: number;
    };
}

export interface AggregationWeights {
    freshness: number;
    completeness: number;
    compliance: number;
}

export function calculateProcessHealth(
    process: Process,
    hasDrift: boolean = false,
    weights: AggregationWeights = { freshness: 0.3, completeness: 0.3, compliance: 0.4 }
): ProcessMaturity {
    // 1. Calculate Base Factors
    const steps = process.properties.steps;
    const totalSteps = steps.length;

    // Freshness
    const daysSinceUpdate = (new Date().getTime() - new Date(process.createdAt).getTime()) / (1000 * 3600 * 24);
    let freshnessScore = 100;
    if (daysSinceUpdate > 180) freshnessScore = 0;
    else if (daysSinceUpdate > 90) freshnessScore = 50;
    else if (daysSinceUpdate > 30) freshnessScore = 80;

    // Structure & Ownership
    const validOwnerSteps = steps.filter(s => s.owner && s.owner.length > 0).length;
    const ownerCompleteness = totalSteps > 0 ? (validOwnerSteps / totalSteps) : 0;

    // Obligations
    const stepsWithObligations = steps.filter(s => s.obligations && s.obligations.length > 0).length;

    // 2. Determine Maturity Level (Waterfall Logic)
    let level: 1 | 2 | 3 | 4 | 5 = 1;
    let label = "Drafting";
    let nextStep = "Define steps and owners";

    // Level 1: Basic Definition (Implicit if it exists)

    // Level 2: Ownership (Accountability)
    if (ownerCompleteness === 1) {
        level = 2;
        label = "Owned";
        nextStep = "Link policy obligations";
    }

    // Level 3: Governance (Linked)
    if (level === 2 && stepsWithObligations > 0) { // At least some obligations linked
        level = 3;
        label = "Governed";
        nextStep = "Resolve drift and compliance gaps";
    }

    // Level 4: Compliant (No Drift + Full Coverage)
    // For MVP, "Full Coverage" is hard to define strictly without policy engine.
    // We'll require No Drift + >50% Obligation Coverage
    const obCoverage = totalSteps > 0 ? (stepsWithObligations / totalSteps) : 0;
    if (level >= 3 && !hasDrift && obCoverage > 0.5) {
        level = 4;
        label = "Compliant";
        nextStep = "Optimize for freshness and complexity";
    }

    // Level 5: Optimized (Fresh + High Completeness)
    if (level === 4 && freshnessScore >= 80) {
        level = 5;
        label = "Optimized";
        nextStep = "Maintain excellence";
    }

    // Legacy Score Calculation (for compatibility/sorting)
    // Normalize weights to ensure they sum to ~1 or operate on 100 scale correctly
    const rawScore = (freshnessScore * weights.freshness) + (ownerCompleteness * weights.completeness * 100) + (obCoverage * weights.compliance * 100);
    const finalScore = Math.max(0, Math.round(rawScore - (hasDrift ? 20 : 0)));

    return {
        level,
        label,
        nextStep,
        score: finalScore,
        factors: {
            freshness: freshnessScore,
            completeness: ownerCompleteness * 100, // normalized to 0-100
            compliance: obCoverage * 100,
            driftPenalty: hasDrift ? 20 : 0
        }
    };
}

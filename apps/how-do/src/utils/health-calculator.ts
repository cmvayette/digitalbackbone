import type { Process } from '../types/process';
import { useDriftDetection } from '../hooks/useDriftDetection';

export interface HealthScore {
    score: number; // 0-100
    status: 'healthy' | 'at-risk' | 'critical';
    factors: {
        freshness: number;
        completeness: number;
        compliance: number;
        driftPenalty: number;
    };
}

export function calculateProcessHealth(process: Process, hasDrift: boolean = false): HealthScore {
    const weights = {
        freshness: 0.3,
        completeness: 0.3,
        compliance: 0.4
    };

    // 1. Freshness (Days since creation - strict freshness)
    // Assume mock data doesn't have 'updatedAt', using 'createdAt'
    const daysSinceUpdate = (new Date().getTime() - new Date(process.createdAt).getTime()) / (1000 * 3600 * 24);
    let freshnessScore = 100;
    if (daysSinceUpdate > 90) freshnessScore = 50;
    if (daysSinceUpdate > 180) freshnessScore = 0;
    if (daysSinceUpdate <= 30) freshnessScore = 100;
    // Linear decay between 30 and 90? Let's keep it simple:
    // < 30 days: 100
    // 30-90 days: 80
    // 90-180 days: 40
    // > 180 days: 0
    if (daysSinceUpdate > 30 && daysSinceUpdate <= 90) freshnessScore = 80;
    else if (daysSinceUpdate > 90 && daysSinceUpdate <= 180) freshnessScore = 40;


    // 2. Completeness (Steps have descriptions and owners)
    const steps = process.properties.steps;
    const totalSteps = steps.length;
    let completenessScore = 0;
    if (totalSteps > 0) {
        const validSteps = steps.filter(s => s.description && s.owner).length;
        completenessScore = (validSteps / totalSteps) * 100;
    }

    // 3. Compliance (Steps have obligations linked)
    let complianceScore = 0;
    if (totalSteps > 0) {
        const stepsWithObligations = steps.filter(s => s.obligations && s.obligations.length > 0).length;
        complianceScore = (stepsWithObligations / totalSteps) * 100;
    }

    // 4. Drift Penalty
    const driftPenalty = hasDrift ? 20 : 0;

    // Calculate Weighted Score
    let rawScore = (freshnessScore * weights.freshness) +
        (completenessScore * weights.completeness) +
        (complianceScore * weights.compliance);

    let finalScore = Math.max(0, Math.round(rawScore - driftPenalty));

    // Determine Status
    let status: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    if (finalScore < 50) status = 'critical';
    else if (finalScore < 80) status = 'at-risk';

    return {
        score: finalScore,
        status,
        factors: {
            freshness: freshnessScore,
            completeness: completenessScore,
            compliance: complianceScore,
            driftPenalty
        }
    };
}

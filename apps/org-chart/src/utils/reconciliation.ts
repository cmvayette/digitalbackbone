import type { Person, Position } from '../types/domain';


export interface MatchResult {
    score: number; // 0 to 100
    details: SatisfactionDetail[];
}

export interface SatisfactionDetail {
    qualificationId: string;
    qualificationName: string;
    isSatisfied: boolean;
    satisfiedBy?: string; // Certificate name
    source: string; // Policy/SOP
    strictness: 'mandatory' | 'desired';
}

// Mock knowledge base of what cert satisfies what qualification
// In a real system, this would be a graph query
const CERT_MAPPINGS: Record<string, string[]> = {
    // "Certificate held": ["Satisfies Qualification"]
    "CompTIA Security+": ["IAM Level 1", "IAM Level 2", "IAT Level 1", "IAT Level 2"],
    "CISSP": ["IAM Level 3", "IAT Level 3", "Cloud Security Architect"],
    "PMP": ["Project Management Professional"],
    "DAU Contracting Level 2": ["Contracting Officer Representative"],
};

export function reconcileCompetence(person: Person, position: Position): MatchResult {
    const requirements = position.properties.qualifications || [];
    if (requirements.length === 0) {
        return { score: 100, details: [] };
    }

    let satisfiedCount = 0;
    const details: SatisfactionDetail[] = requirements.map(req => {
        // Direct match
        const directMatch = person.properties.certificates.includes(req.name);

        // Mapped match (Reconciliation)
        let mappedMatchRaw: string | undefined;
        if (!directMatch) {
            mappedMatchRaw = person.properties.certificates.find(cert => {
                const satisfies = CERT_MAPPINGS[cert] || [];
                return satisfies.includes(req.name);
            });
        }

        const isSatisfied = directMatch || !!mappedMatchRaw;

        if (isSatisfied) satisfiedCount++;

        return {
            qualificationId: req.id,
            qualificationName: req.name,
            isSatisfied,
            satisfiedBy: directMatch ? req.name : mappedMatchRaw,
            source: req.source,
            strictness: req.strictness
        };
    });

    return {
        score: Math.round((satisfiedCount / requirements.length) * 100),
        details
    };
}

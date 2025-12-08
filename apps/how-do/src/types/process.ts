import { HolonType } from '@som/shared-types';

export interface ObligationLink {
    id: string;
}

export interface ProcessStep {
    id: string;
    title: string;
    description: string;
    owner: string;
    obligations: ObligationLink[];
    source?: 'native' | 'external';
    externalId?: string;
    externalSource?: string;
}

export interface ProcessProperties {
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    estimatedDuration: number;
    steps: ProcessStep[];
}

export interface Process {
    id: string;
    type: HolonType;
    createdAt: Date;
    createdBy: string;
    status: 'active' | 'archived' | 'draft';
    sourceDocuments: string[];
    properties: ProcessProperties;
}

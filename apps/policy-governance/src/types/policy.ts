export type DocumentType = 'Instruction' | 'Notice' | 'Order' | 'SOP' | 'Doctrine';

export type PolicyStatus = 'draft' | 'review' | 'active' | 'superseded' | 'archived';

export interface OwnerRef {
    id: string; // Real UUID from Org Store
    name: string; // Display name
    type: 'Organization' | 'Position' | 'RoleTag';
    uic?: string; // For Orgs
    billetCode?: string; // For Positions
}

export interface Obligation {
    id: string;
    statement: string;
    actor: OwnerRef;
    trigger?: string;
    deadline?: string;
    criticality: 'high' | 'medium' | 'low';
    status: 'draft' | 'validated' | 'deprecated';
    clauseRef?: string;
    suggestedProcessId?: string; // Link to How-Do
    linkedProcessId?: string;
}

export interface Clause {
    id: string;
    text: string;
    sectionId: string;
}

export interface PolicySection {
    id: string;
    title: string;
    content: string; // HTML or Markdown
    order: number;
}

export interface PolicyDocument {
    id: string;
    title: string;
    documentType: DocumentType;
    version: string;
    status: PolicyStatus;
    effectiveDate?: string; // ISO date string
    sections: PolicySection[];
    obligations: Obligation[];
    createdAt: string;
    updatedAt: string;
}

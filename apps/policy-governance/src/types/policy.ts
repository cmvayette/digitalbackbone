export type DocumentType = 'Instruction' | 'Notice' | 'Order' | 'SOP' | 'Doctrine';

export type PolicyStatus = 'draft' | 'review' | 'active' | 'superseded' | 'archived';

export interface OwnerRef {
    id: string;
    name: string;
    type: 'Organization' | 'Position' | 'RoleTag';
}

export interface Obligation {
    id: string;
    statement: string;
    actor: OwnerRef;
    trigger?: string;
    deadline?: string;
    criticality: 'high' | 'medium' | 'low';
    status: 'draft' | 'validated' | 'deprecated';
    clauseRef?: string; // ID of the clause this came from
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

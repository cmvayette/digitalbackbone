/**
 * Document Registry module for the Semantic Operating Model
 * Manages authoritative documents that define semantics, constraints, and measures
 */

import { DocumentID, HolonID, Timestamp, HolonType, DocumentHolon, DocumentType } from '../core/types/holon';
import { randomUUID } from 'crypto';

export interface RegisterDocumentParams {
  referenceNumbers: string[];
  title: string;
  documentType: DocumentType;
  version: string;
  effectiveDates: { start: Date; end?: Date };
  classificationMetadata: string;
  content?: string;
  supersedes?: DocumentID[];
  derivedFrom?: DocumentID[];
}

export interface DocumentLinkage {
  documentId: DocumentID;
  linkedHolonTypes?: HolonType[];
  linkedConstraintIds?: string[];
  linkedMeasureIds?: string[];
  linkedLensIds?: string[];
}

/**
 * DocumentRegistry manages the lifecycle and storage of authoritative documents
 */
export class DocumentRegistry {
  private documents: Map<DocumentID, DocumentHolon>;
  private documentsByType: Map<DocumentType, Set<DocumentID>>;
  private supersessionChains: Map<DocumentID, DocumentID[]>; // Maps document to documents it supersedes
  private linkages: Map<DocumentID, DocumentLinkage>;

  constructor() {
    this.documents = new Map();
    this.documentsByType = new Map();
    this.supersessionChains = new Map();
    this.linkages = new Map();
    
    // Initialize type index for all document types
    Object.values(DocumentType).forEach(type => {
      this.documentsByType.set(type, new Set());
    });
  }

  /**
   * Generate a unique UUID-based document ID
   * @returns A unique DocumentID
   */
  private generateDocumentID(): DocumentID {
    return randomUUID();
  }

  /**
   * Register a new document in the registry
   * @param params - Document registration parameters
   * @param createdBy - Event ID that created this document
   * @returns The created document holon
   */
  registerDocument(params: RegisterDocumentParams, createdBy: string): DocumentHolon {
    const id = this.generateDocumentID();
    const now = new Date();

    const document: DocumentHolon = {
      id,
      type: HolonType.Document,
      properties: {
        referenceNumbers: params.referenceNumbers,
        title: params.title,
        documentType: params.documentType,
        version: params.version,
        effectiveDates: params.effectiveDates,
        classificationMetadata: params.classificationMetadata,
        content: params.content,
        supersedes: params.supersedes,
        derivedFrom: params.derivedFrom,
      },
      createdAt: now,
      createdBy,
      status: 'active',
      sourceDocuments: [], // Documents are self-referential
    };

    // Store document
    this.documents.set(id, document);
    
    // Update type index
    const typeSet = this.documentsByType.get(params.documentType);
    if (typeSet) {
      typeSet.add(id);
    }

    // Track supersession relationships
    if (params.supersedes && params.supersedes.length > 0) {
      this.supersessionChains.set(id, params.supersedes);
    }

    // Initialize linkage entry
    this.linkages.set(id, {
      documentId: id,
      linkedHolonTypes: [],
      linkedConstraintIds: [],
      linkedMeasureIds: [],
      linkedLensIds: [],
    });

    return document;
  }

  /**
   * Get a document by its ID
   * @param documentId - The ID of the document to retrieve
   * @returns The document if found, undefined otherwise
   */
  getDocument(documentId: DocumentID): DocumentHolon | undefined {
    return this.documents.get(documentId);
  }

  /**
   * Get all documents of a specific type
   * @param documentType - The document type to query
   * @returns Array of documents matching the type
   */
  getDocumentsByType(documentType: DocumentType): DocumentHolon[] {
    const typeSet = this.documentsByType.get(documentType);
    if (!typeSet) {
      return [];
    }

    const documents: DocumentHolon[] = [];
    for (const id of typeSet) {
      const doc = this.documents.get(id);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  /**
   * Get documents that were in force at a specific timestamp
   * @param timestamp - The timestamp to query
   * @returns Array of documents in force at the given timestamp
   */
  getDocumentsInForce(timestamp: Timestamp): DocumentHolon[] {
    const documentsInForce: DocumentHolon[] = [];

    for (const document of this.documents.values()) {
      const { start, end } = document.properties.effectiveDates;
      
      // Check if timestamp falls within the effective date range
      if (timestamp >= start && (!end || timestamp <= end)) {
        documentsInForce.push(document);
      }
    }

    return documentsInForce;
  }

  /**
   * Create a supersession relationship between documents
   * @param newDocumentId - The new document that supersedes the old one
   * @param oldDocumentId - The old document being superseded
   */
  supersede(newDocumentId: DocumentID, oldDocumentId: DocumentID): void {
    const newDoc = this.documents.get(newDocumentId);
    const oldDoc = this.documents.get(oldDocumentId);

    if (!newDoc || !oldDoc) {
      throw new Error('Both documents must exist to create supersession relationship');
    }

    // Update the new document's supersedes list
    if (!newDoc.properties.supersedes) {
      newDoc.properties.supersedes = [];
    }
    if (!newDoc.properties.supersedes.includes(oldDocumentId)) {
      newDoc.properties.supersedes.push(oldDocumentId);
    }

    // Update supersession chain tracking
    const existingChain = this.supersessionChains.get(newDocumentId) || [];
    if (!existingChain.includes(oldDocumentId)) {
      existingChain.push(oldDocumentId);
      this.supersessionChains.set(newDocumentId, existingChain);
    }
  }

  /**
   * Get the supersession chain for a document
   * @param documentId - The document ID
   * @returns Array of document IDs that this document supersedes
   */
  getSupersessionChain(documentId: DocumentID): DocumentID[] {
    return this.supersessionChains.get(documentId) || [];
  }

  /**
   * Link a document to holon types it defines
   * @param documentId - The document ID
   * @param holonTypes - Array of holon types defined by this document
   */
  linkToHolonTypes(documentId: DocumentID, holonTypes: HolonType[]): void {
    const linkage = this.linkages.get(documentId);
    if (!linkage) {
      throw new Error(`Document ${documentId} not found`);
    }

    linkage.linkedHolonTypes = [...new Set([...(linkage.linkedHolonTypes || []), ...holonTypes])];
  }

  /**
   * Link a document to constraints it defines
   * @param documentId - The document ID
   * @param constraintIds - Array of constraint IDs defined by this document
   */
  linkToConstraints(documentId: DocumentID, constraintIds: string[]): void {
    const linkage = this.linkages.get(documentId);
    if (!linkage) {
      throw new Error(`Document ${documentId} not found`);
    }

    linkage.linkedConstraintIds = [...new Set([...(linkage.linkedConstraintIds || []), ...constraintIds])];
  }

  /**
   * Link a document to measures it defines
   * @param documentId - The document ID
   * @param measureIds - Array of measure IDs defined by this document
   */
  linkToMeasures(documentId: DocumentID, measureIds: string[]): void {
    const linkage = this.linkages.get(documentId);
    if (!linkage) {
      throw new Error(`Document ${documentId} not found`);
    }

    linkage.linkedMeasureIds = [...new Set([...(linkage.linkedMeasureIds || []), ...measureIds])];
  }

  /**
   * Link a document to lenses it defines
   * @param documentId - The document ID
   * @param lensIds - Array of lens IDs defined by this document
   */
  linkToLenses(documentId: DocumentID, lensIds: string[]): void {
    const linkage = this.linkages.get(documentId);
    if (!linkage) {
      throw new Error(`Document ${documentId} not found`);
    }

    linkage.linkedLensIds = [...new Set([...(linkage.linkedLensIds || []), ...lensIds])];
  }

  /**
   * Get the linkage information for a document
   * @param documentId - The document ID
   * @returns The linkage information
   */
  getDocumentLinkage(documentId: DocumentID): DocumentLinkage | undefined {
    return this.linkages.get(documentId);
  }

  /**
   * Get all documents that define a specific holon type
   * @param holonType - The holon type
   * @returns Array of documents that define this holon type
   */
  getDocumentsDefiningHolonType(holonType: HolonType): DocumentHolon[] {
    const documents: DocumentHolon[] = [];

    for (const [docId, linkage] of this.linkages.entries()) {
      if (linkage.linkedHolonTypes?.includes(holonType)) {
        const doc = this.documents.get(docId);
        if (doc) {
          documents.push(doc);
        }
      }
    }

    return documents;
  }

  /**
   * Get all documents that define a specific constraint
   * @param constraintId - The constraint ID
   * @returns Array of documents that define this constraint
   */
  getDocumentsDefiningConstraint(constraintId: string): DocumentHolon[] {
    const documents: DocumentHolon[] = [];

    for (const [docId, linkage] of this.linkages.entries()) {
      if (linkage.linkedConstraintIds?.includes(constraintId)) {
        const doc = this.documents.get(docId);
        if (doc) {
          documents.push(doc);
        }
      }
    }

    return documents;
  }

  /**
   * Get all documents (for testing/debugging)
   * @returns Array of all documents in the registry
   */
  getAllDocuments(): DocumentHolon[] {
    return Array.from(this.documents.values());
  }

  /**
   * Clear all documents from the registry (for testing purposes)
   */
  clear(): void {
    this.documents.clear();
    this.documentsByType.forEach(set => set.clear());
    this.supersessionChains.clear();
    this.linkages.clear();
  }
}

/**
 * Export a singleton instance for convenience
 */
export const documentRegistry = new DocumentRegistry();

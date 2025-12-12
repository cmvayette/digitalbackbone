import { useState, useCallback } from 'react';
import {
    HolonID,
    type DocumentCreatedPayload,
    type ClauseExtractedPayload,
    type ObligationDefinedPayload,
    type DocumentPublishedPayload
} from '@som/shared-types';
import * as SharedTypes from '@som/shared-types';
import { type SubmitEventRequest } from '../client';
import { createSOMClient } from '../factory';
import { v4 as uuidv4 } from 'uuid';

export function usePolicyComposer() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const client = createSOMClient();

    const createDraft = useCallback(async (
        title: string,
        authorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const documentId = uuidv4();
            const event: SubmitEventRequest<SharedTypes.EventType.DocumentCreated> = {
                type: SharedTypes.EventType.DocumentCreated,
                occurredAt: new Date(),
                actor: authorId,
                subjects: [documentId],
                payload: {
                    documentId,
                    title,
                    type: 'Policy', // Or generic 'Document' with a property
                    format: 'markdown',
                    content: '', // Initial empty content
                    version: '0.1.0'
                } as DocumentCreatedPayload,
                sourceSystem: 'som-policy-governance'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create draft');
            }
            return documentId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const extractClause = useCallback(async (
        documentId: HolonID,
        text: string,
        authorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const clauseId = uuidv4();
            const event: SubmitEventRequest<SharedTypes.EventType.ClauseExtracted> = {
                type: SharedTypes.EventType.ClauseExtracted,
                occurredAt: new Date(),
                actor: authorId,
                subjects: [clauseId, documentId],
                payload: {
                    clauseId,
                    sourceDocumentId: documentId,
                    text: text,
                    location: 'body' // Simple default
                } as ClauseExtractedPayload,
                sourceSystem: 'som-policy-governance'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to extract clause');
            }
            return clauseId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const defineObligation = useCallback(async (
        clauseId: HolonID,
        description: string,
        responsibleRole: string,
        authorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const obligationId = uuidv4();
            const event: SubmitEventRequest<SharedTypes.EventType.ObligationDefined> = {
                type: SharedTypes.EventType.ObligationDefined,
                occurredAt: new Date(),
                actor: authorId,
                subjects: [obligationId, clauseId],
                payload: {
                    obligationId,
                    sourceClauseId: clauseId,
                    description,
                    responsibleRole
                } as ObligationDefinedPayload,
                sourceSystem: 'som-policy-governance'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to define obligation');
            }
            return obligationId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const publishPolicy = useCallback(async (
        documentId: HolonID,
        version: string,
        authorId: HolonID
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const event: SubmitEventRequest<SharedTypes.EventType.DocumentPublished> = {
                type: SharedTypes.EventType.DocumentPublished,
                occurredAt: new Date(),
                actor: authorId,
                subjects: [documentId],
                payload: {
                    documentId,
                    version,
                    publishedAt: new Date(),
                    approverId: authorId // Self-approval for MVP
                } as DocumentPublishedPayload,
                sourceSystem: 'som-policy-governance'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to publish policy');
            }
            return true;
        } catch (err: any) {
            setLastError(err.message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        createDraft,
        extractClause,
        defineObligation,
        publishPolicy,
        isSubmitting,
        lastError
    };
}

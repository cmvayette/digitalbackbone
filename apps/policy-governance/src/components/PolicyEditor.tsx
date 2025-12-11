import React, { useState } from 'react';
import './PolicyEditor.css';

interface PolicyEditorProps {
    initialContent?: string;
    onSave?: (content: string) => void;
}

import { EventType } from '@som/shared-types';
import type { DocumentIssuedPayload } from '@som/shared-types';

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ initialContent = '', onSave }) => {
    const [content, setContent] = useState(initialContent);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handlePublish = () => {
        const payload: DocumentIssuedPayload = {
            title: 'Draft Policy',
            content: content,
            status: 'active',
            documentType: 'Policy'
        };

        // TODO: Wire up event sourcing - emit DocumentIssued event
        // const mockEvent = { type: EventType.DocumentIssued, payload };
        console.log('TODO: Emit event:', EventType.DocumentIssued, payload);

        if (onSave) onSave(content);
    };

    return (
        <div className="policy-editor">
            <div className="editor-header">
                <h2 className="editor-title">Policy Composer</h2>
                <div className="toolbar">
                    <button className="tool-btn">Scope</button>
                    <button className="tool-btn">Definitions</button>
                    <button className="tool-btn">Responsibilities</button>
                </div>
            </div>

            <textarea
                className="editor-textarea"
                value={content}
                onChange={handleChange}
                placeholder="Start typing your policy here..."
            />

            <div className="editor-footer">
                <div className="char-count">
                    {content.length} characters
                </div>
                <button
                    onClick={handlePublish}
                    className="publish-btn"
                >
                    Publish Policy
                </button>
            </div>
        </div>
    );
};

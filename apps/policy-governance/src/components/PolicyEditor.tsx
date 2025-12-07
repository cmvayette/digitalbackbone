import React, { useState } from 'react';
import './PolicyEditor.css';

interface PolicyEditorProps {
    initialContent?: string;
    onSave?: (content: string) => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ initialContent = '', onSave }) => {
    const [content, setContent] = useState(initialContent);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handlePublish = () => {
        console.log('Publishing Policy...');
        // In a real implementation, this would trigger the extraction logic
        // and emit DocumentIssued and ObligationDefined events.

        const mockEvent = {
            type: 'DocumentIssued',
            payload: {
                title: 'Draft Policy',
                content: content,
                status: 'active',
                documentType: 'Policy'
            }
        };
        console.log('Event Emitted:', mockEvent);

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

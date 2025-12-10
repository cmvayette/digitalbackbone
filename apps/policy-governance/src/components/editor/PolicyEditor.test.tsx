import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolicyEditor } from './PolicyEditor';
import { usePolicyStore } from '../../store/policyStore';
import React from 'react';

// Mock Tiptap to avoid complex JSDOM interactions in unit tests
// We just want to check if the component renders and interacts with store
vi.mock('@tiptap/react', () => ({
    useEditor: () => ({
        commands: { setContent: vi.fn(), focus: vi.fn() },
        chain: () => ({ focus: () => ({ toggleBold: () => ({ run: vi.fn() }), toggleHeading: () => ({ run: vi.fn() }), toggleBulletList: () => ({ run: vi.fn() }), setHighlight: () => ({ run: vi.fn() }), unsetHighlight: () => ({ run: vi.fn() }), undo: () => ({ run: vi.fn() }) }) }),
        isActive: () => false,
        getHTML: () => '<p>Mock Content</p>',
        getText: () => 'Mock Content',
        state: {
            selection: { from: 0, to: 0 },
            doc: { textBetween: () => 'Mock Selection' }
        },
        setEditable: vi.fn(),
        registerPlugin: vi.fn(),
        unregisterPlugin: vi.fn()
    }),
    BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>,
    EditorContent: () => <div data-testid="editor-content">Editor Content</div>
}));

vi.mock('@tiptap/react/menus', () => ({
    BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>
}));

vi.mock('@som/api-client', () => ({
    useExternalProcessData: () => ({
        getProcessById: vi.fn(),
        addProcess: vi.fn()
    }),
    useExternalOrgData: () => ({
        getCandidates: () => [{ id: 'user-1', name: 'User 1', type: 'Person' }]
    })
}));

vi.mock('lucide-react', () => ({
    ArrowLeft: () => <span>Back</span>,
    Edit3: () => <span>Edit</span>,
    Save: () => <span>Save</span>,
    Trash2: () => <span>Trash</span>,
    FileText: () => <span>File</span>,
    CheckSquare: () => <span>Obligations</span>,
    Plus: () => <span>Plus</span>,
    Bold: () => <span>Bold</span>,
    List: () => <span>List</span>,
    Heading1: () => <span>H1</span>,
    ShieldCheck: () => <span>Shield</span>,
    ChevronDown: () => <span>ChevronDown</span>
}));

describe('PolicyEditor', () => {
    beforeEach(() => {
        usePolicyStore.setState({
            policies: [],
            currentPolicy: {
                id: 'pol-1',
                title: 'Test Policy',
                documentType: 'Instruction',
                version: '1.0',
                status: 'draft',
                sections: [{ id: 's1', title: 'Sec 1', content: 'Content', order: 1 }],
                obligations: [],
                createdAt: '',
                updatedAt: ''
            }
        });
    });

    it('renders policy title', () => {
        render(<PolicyEditor onBack={() => { }} onPublish={() => { }} onAddObligation={() => { }} onUpdateObligation={() => { }} />);
        expect(screen.getByDisplayValue('Test Policy')).toBeInTheDocument();
    });

    it('renders editor content', () => {
        render(<PolicyEditor onBack={() => { }} onPublish={() => { }} onAddObligation={() => { }} onUpdateObligation={() => { }} />);
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('switches tabs', () => {
        render(<PolicyEditor onBack={() => { }} onPublish={() => { }} onAddObligation={() => { }} onUpdateObligation={() => { }} />);
        // Default is Document Text
        expect(screen.getByText('Document Text')).toBeInTheDocument();

        // Switch to Obligations
        fireEvent.click(screen.getByText(/Obligations \(/));
        expect(screen.getByText('Extracted Obligations')).toBeInTheDocument();
    });

    it('opens and closes obligation composer', () => {
        render(<PolicyEditor onBack={() => { }} onPublish={() => { }} onAddObligation={() => { }} onUpdateObligation={() => { }} />);
        fireEvent.click(screen.getByText(/Obligations \(/)); // Switch tab

        fireEvent.click(screen.getByText('Add'));
        // We look for parts of the composed form
        expect(screen.getByText('Requirement Statement')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Requirement Statement')).not.toBeInTheDocument();
    });
});

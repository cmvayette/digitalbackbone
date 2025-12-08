import React, { useEffect } from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { ArrowLeft, Edit3, Save, Trash2, FileText, CheckSquare, Plus, Bold, List, Heading1 } from 'lucide-react';
import { ObligationComposer } from './ObligationComposer';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { ClauseHighlighter } from './ClauseHighlighter';

interface PolicyEditorProps {
    onBack: () => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ onBack }) => {
    const { currentPolicy, updatePolicy, addObligation, publishPolicy } = usePolicyStore();
    const [activeTab, setActiveTab] = React.useState<'document' | 'obligations'>('document');
    const [showComposer, setShowComposer] = React.useState(false);
    const [pendingClauseText, setPendingClauseText] = React.useState('');

    if (!currentPolicy) return <div>No policy selected</div>;

    const isReadOnly = currentPolicy.status !== 'draft' && currentPolicy.status !== 'review';

    const editor = useEditor({
        editable: !isReadOnly,
        extensions: [
            StarterKit,
            Highlight.configure({ multicolor: true }),
            BubbleMenu
        ],
        content: currentPolicy.sections[0]?.content || '<p>Start writing your policy...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]'
            }
        },
        onUpdate: ({ editor }) => {
            if (isReadOnly) return;
            if (currentPolicy.sections[0]) {
                const updatedSections = [...currentPolicy.sections];
                updatedSections[0] = { ...updatedSections[0], content: editor.getHTML() };
                updatePolicy(currentPolicy.id, { sections: updatedSections });
            } else {
                // Initialize if empty
                updatePolicy(currentPolicy.id, {
                    sections: [{ id: 's1', title: 'Main', content: editor.getHTML(), order: 1 }]
                });
            }
        }
    });

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePolicy(currentPolicy.id, { title: e.target.value });
    };

    const handleExtract = () => {
        if (!editor || isReadOnly) return;
        const selection = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
        setPendingClauseText(selection);
        setActiveTab('obligations');
        setShowComposer(true);

        // Highlight the selection
        editor.chain().focus().setHighlight({ color: '#f59e0b' }).run(); // Amber highlight for pending
    };

    const handlePublish = () => {
        if (confirm('Are you sure you want to publish this policy? It will become active and read-only.')) {
            publishPolicy(currentPolicy.id);
            // Optionally force editor to update its editable state
            editor?.setEditable(false);
        }
    };

    // Sync content if it changes externally (e.g. reload) - minimal implementation
    useEffect(() => {
        if (editor && currentPolicy.sections[0]?.content && editor.getHTML() !== currentPolicy.sections[0].content) {
            if (editor.getText() === '') {
                editor.commands.setContent(currentPolicy.sections[0].content);
            }
        }
        editor?.setEditable(!isReadOnly);
    }, [currentPolicy.id, editor, isReadOnly]);


    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={currentPolicy.title}
                            onChange={handleTitleChange}
                            readOnly={isReadOnly}
                            className={`bg-transparent text-lg font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 border border-transparent ${!isReadOnly && 'hover:border-slate-700'}`}
                        />
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="uppercase font-bold tracking-wider">{currentPolicy.documentType}</span>
                            <span>•</span>
                            <span>Version {currentPolicy.version}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ml-2 ${currentPolicy.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-slate-700'}`}>
                                {currentPolicy.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isReadOnly && (
                        <>
                            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded">
                                <Save size={16} /> Save Draft
                            </button>
                            <button
                                onClick={handlePublish}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded border border-blue-900"
                            >
                                Publish
                            </button>
                        </>
                    )}
                    {isReadOnly && (
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 border border-slate-700 rounded cursor-not-allowed opacity-75">
                            Published (Read Only)
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900">
                    <div className="flex items-center border-b border-slate-800 px-4">
                        <button
                            onClick={() => setActiveTab('document')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'document' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                        >
                            <FileText size={16} /> Document Text
                        </button>
                        <button
                            onClick={() => setActiveTab('obligations')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'obligations' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                        >
                            <CheckSquare size={16} /> Obligations ({currentPolicy.obligations.length})
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 max-w-5xl mx-auto w-full flex gap-6">
                        {/* Document Column */}
                        <div className={`flex-1 transition-all ${activeTab === 'obligations' ? 'hidden xl:block xl:w-1/2' : 'w-full'}`}>
                            {editor && !isReadOnly && <ClauseHighlighter editor={editor} onExtract={handleExtract} />}

                            {!isReadOnly && (
                                <div className="mb-2 flex items-center gap-2 bg-slate-800 p-2 rounded-t-lg border border-slate-700 border-b-0">
                                    <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-slate-700 ${editor?.isActive('bold') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}><Bold size={16} /></button>
                                    <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-slate-700 ${editor?.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}><Heading1 size={16} /></button>
                                    <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-slate-700 ${editor?.isActive('bulletList') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}><List size={16} /></button>
                                </div>
                            )}

                            <div className={`bg-slate-950 border border-slate-800 rounded-b-lg p-6 min-h-[600px] shadow-inner ${isReadOnly && 'opacity-80'}`}>
                                <EditorContent editor={editor} />
                            </div>
                        </div>

                        {/* Obligations Column - Always visible if tab active, or side-by-side on large screens */}
                        <div className={`w-full xl:w-96 flex-col gap-4 overflow-hidden flex transition-all ${activeTab === 'document' ? 'hidden' : 'flex'}`}>
                            <div className="flex justify-between items-center shrink-0">
                                <h3 className="text-lg font-bold">Extracted Obligations</h3>
                                {!isReadOnly && (
                                    <button
                                        onClick={() => { setShowComposer(true); setPendingClauseText(''); }}
                                        className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto pr-2 space-y-4">
                                {showComposer && (
                                    <div className="border border-slate-700 rounded-lg p-4 bg-slate-800 shadow-xl z-10">
                                        <div className="mb-2 bg-amber-900/20 text-amber-300 text-xs p-2 rounded border border-amber-900/50 italic">
                                            Extracting from: "{pendingClauseText.substring(0, 50)}..."
                                        </div>
                                        <ObligationComposer
                                            initialStatement={pendingClauseText}
                                            onSave={(obl) => {
                                                addObligation(currentPolicy.id, obl);
                                                setShowComposer(false);
                                                setPendingClauseText('');
                                                // Confirm highlight color green?
                                                editor?.chain().focus().undo().run(); // Undo amber
                                                editor?.chain().focus().setHighlight({ color: '#22c55e' }).run(); // Set green
                                            }}
                                            onCancel={() => {
                                                setShowComposer(false);
                                                setPendingClauseText('');
                                                editor?.chain().focus().unsetHighlight().run();
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {currentPolicy.obligations.map(obl => (
                                        <div key={obl.id} className="bg-slate-800 border-l-4 border-blue-500 p-4 rounded shadow-sm hover:translate-x-1 transition-transform cursor-default">
                                            <p className="font-medium text-slate-200 mb-2">"{obl.statement}"</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><span className="text-slate-500">Actor:</span> {obl.actor.name}</span>
                                                {obl.deadline && <span className="flex items-center gap-1"><span className="text-slate-500">By:</span> {obl.deadline}</span>}
                                                <span className={`uppercase font-bold px-1.5 py-0.5 rounded ${obl.criticality === 'high' ? 'bg-red-900/30 text-red-400' : 'bg-slate-700'}`}>{obl.criticality}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {currentPolicy.obligations.length === 0 && !showComposer && (
                                        <div className="text-center py-8 text-slate-500 italic">No obligations extracted yet. Select text in the document to begin.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Context/Help) - Placeholder */}
                <div className="w-80 border-l border-slate-800 bg-slate-925 p-4 hidden xl:block">
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Governance Helper</h4>
                    <p className="text-xs text-slate-500 mb-4">
                        Highlight text in the document to extract obligations, or create them manually.
                    </p>
                    <div className="bg-blue-900/10 border border-blue-900/30 rounded p-3 text-xs text-blue-300">
                        <p className="font-bold mb-1">Tip:</p>
                        Use unambiguous language like "SHALL" or "MUST" to clearly define requirements.
                    </div>
                </div>
            </div>
        </div>
    );
};

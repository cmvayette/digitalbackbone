import React from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { ArrowLeft, Edit3, Save, Trash2, FileText, CheckSquare, Plus } from 'lucide-react';
import { ObligationComposer } from './ObligationComposer';

interface PolicyEditorProps {
    onBack: () => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ onBack }) => {
    const { currentPolicy, updatePolicy, addObligation } = usePolicyStore();
    const [activeTab, setActiveTab] = React.useState<'document' | 'obligations'>('document');
    const [showComposer, setShowComposer] = React.useState(false);

    if (!currentPolicy) return <div>No policy selected</div>;

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePolicy(currentPolicy.id, { title: e.target.value });
    };

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
                            className="bg-transparent text-lg font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 border border-transparent hover:border-slate-700"
                        />
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="uppercase font-bold tracking-wider">{currentPolicy.documentType}</span>
                            <span>•</span>
                            <span>Version {currentPolicy.version}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded">
                        <Save size={16} /> Save Draft
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded border border-blue-900">
                        Publish
                    </button>
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

                    <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
                        {activeTab === 'document' ? (
                            <div className="space-y-6">
                                {/* Placeholder for Sections - MVP Phase 1 Textarea for simple content */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Policy Content</label>
                                    <textarea
                                        className="w-full h-[600px] bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-600 resize-none leading-relaxed"
                                        placeholder="Type your policy here..."
                                        defaultValue={currentPolicy.sections[0]?.content || ''}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Extracted Obligations</h3>
                                    <button
                                        onClick={() => setShowComposer(true)}
                                        className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500"
                                    >
                                        <Plus size={16} /> Add Obligation
                                    </button>
                                </div>

                                {showComposer && (
                                    <div className="mb-6 border border-slate-700 rounded-lg p-4 bg-slate-800">
                                        <ObligationComposer
                                            onSave={(obl) => {
                                                addObligation(currentPolicy.id, obl);
                                                setShowComposer(false);
                                            }}
                                            onCancel={() => setShowComposer(false)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {currentPolicy.obligations.map(obl => (
                                        <div key={obl.id} className="bg-slate-800 border-l-4 border-blue-500 p-4 rounded shadow-sm">
                                            <p className="font-medium text-slate-200 mb-2">"{obl.statement}"</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><span className="text-slate-500">Actor:</span> {obl.actor.name}</span>
                                                {obl.deadline && <span className="flex items-center gap-1"><span className="text-slate-500">By:</span> {obl.deadline}</span>}
                                                <span className={`uppercase font-bold px-1.5 py-0.5 rounded ${obl.criticality === 'high' ? 'bg-red-900/30 text-red-400' : 'bg-slate-700'}`}>{obl.criticality}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {currentPolicy.obligations.length === 0 && (
                                        <div className="text-center py-8 text-slate-500 italic">No obligations extracted yet.</div>
                                    )}
                                </div>
                            </div>
                        )}
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

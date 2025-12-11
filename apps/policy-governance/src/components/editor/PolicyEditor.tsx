import React, { useEffect } from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { ArrowLeft, Save, Bold, Italic, List, Heading1, Heading2, Code, GitCompare } from 'lucide-react';
import { ObligationsSidecar } from './ObligationsSidecar';
import { RedlineView } from './RedlineView';
import { ImpactPreviewPanel } from './ImpactPreviewPanel';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { ClauseHighlighter } from './ClauseHighlighter';
import { ActorMention } from './ActorMention';
import type { Obligation } from '../../types/policy';
import 'tippy.js/dist/tippy.css';

interface PolicyEditorProps {
  onBack: () => void;
  onPublish: (id: string, version: string) => void;
  onAddObligation: (policyId: string, obligation: Omit<Obligation, 'id'>) => void;
  onUpdateObligation: (policyId: string, obligationId: string, updates: Partial<Obligation>) => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  onBack,
  onPublish,
  onAddObligation,
  onUpdateObligation,
}) => {
  const { currentPolicy, updatePolicy, getPreviousVersion, saveVersion } = usePolicyStore();
  const [pendingClauseText, setPendingClauseText] = React.useState('');
  const [showRedlineView, setShowRedlineView] = React.useState(false);
  const [showImpactPreview, setShowImpactPreview] = React.useState(false);

  if (!currentPolicy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <p className="text-lg font-medium mb-2">No policy selected</p>
          <p className="text-sm">Select a policy from the list or create a new one</p>
        </div>
      </div>
    );
  }

  const isReadOnly = currentPolicy.status !== 'draft' && currentPolicy.status !== 'review';

  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      BubbleMenu,
      ActorMention,
    ],
    content: currentPolicy.sections[0]?.content || '<p>Start writing your policy...</p>',
    editorProps: {
      attributes: {
        class: 'prose-policy focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      if (currentPolicy.sections[0]) {
        const updatedSections = [...currentPolicy.sections];
        updatedSections[0] = { ...updatedSections[0], content: editor.getHTML() };
        updatePolicy(currentPolicy.id, { sections: updatedSections });
      } else {
        updatePolicy(currentPolicy.id, {
          sections: [{ id: 's1', title: 'Main', content: editor.getHTML(), order: 1 }],
        });
      }
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePolicy(currentPolicy.id, { title: e.target.value });
  };

  const handleExtract = () => {
    if (!editor || isReadOnly) return;
    const selection = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );
    setPendingClauseText(selection);
    editor.chain().focus().setHighlight({ color: '#f59e0b' }).run();
  };

  const handleClosePendingClause = () => {
    setPendingClauseText('');
    editor?.chain().focus().unsetHighlight().run();
  };

  const handlePublish = () => {
    // Show impact preview before publishing
    setShowImpactPreview(true);
  };

  const handleApprovePublish = () => {
    // Save current version to history before publishing
    if (currentPolicy) {
      saveVersion(currentPolicy.id, { ...currentPolicy });
    }
    onPublish(currentPolicy.id, currentPolicy.version);
    editor?.setEditable(false);
    setShowImpactPreview(false);
  };

  const handleRevisePolicy = () => {
    setShowImpactPreview(false);
    // Focus back on editor for revisions
  };

  const handleShowRedline = () => {
    const prevVersion = getPreviousVersion(currentPolicy.id);
    if (prevVersion) {
      setShowRedlineView(true);
    } else {
      alert('No previous version available for comparison');
    }
  };

  const handleAddObligation = (obligation: Omit<Obligation, 'id'>) => {
    onAddObligation(currentPolicy.id, obligation);
    // Change highlight to green after successful extraction
    editor?.chain().focus().unsetHighlight().run();
    editor?.chain().focus().setHighlight({ color: '#22c55e' }).run();
  };

  const handleUpdateObligation = (obligationId: string, updates: Partial<Obligation>) => {
    onUpdateObligation(currentPolicy.id, obligationId, updates);
  };

  // Sync content if it changes externally
  useEffect(() => {
    if (
      editor &&
      currentPolicy.sections[0]?.content &&
      editor.getHTML() !== currentPolicy.sections[0].content
    ) {
      if (editor.getText() === '') {
        editor.commands.setContent(currentPolicy.sections[0].content);
      }
    }
    editor?.setEditable(!isReadOnly);
  }, [currentPolicy.id, editor, isReadOnly]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Policy Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Back to list"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <input
              type="text"
              value={currentPolicy.title}
              onChange={handleTitleChange}
              readOnly={isReadOnly}
              placeholder="Policy Title"
              className={`bg-transparent text-lg font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 -ml-2 border border-transparent ${
                !isReadOnly && 'hover:border-slate-700'
              }`}
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="uppercase font-bold tracking-wider">{currentPolicy.documentType}</span>
              <span>•</span>
              <span>v{currentPolicy.version}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-2 ${
                  currentPolicy.status === 'active'
                    ? 'bg-green-900/30 text-green-400 border border-green-900/50'
                    : currentPolicy.status === 'review'
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentPolicy.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isReadOnly && (
            <>
              {getPreviousVersion(currentPolicy.id) && (
                <button
                  onClick={handleShowRedline}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors border border-slate-700"
                  title="Compare with previous version"
                >
                  <GitCompare size={16} /> Compare
                </button>
              )}
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors">
                <Save size={16} /> Save Draft
              </button>
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded border border-blue-900/50 transition-colors"
              >
                Publish
              </button>
            </>
          )}
          {isReadOnly && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 border border-slate-700 rounded cursor-not-allowed opacity-75">
              Published (Read Only)
            </div>
          )}
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden bg-bg-canvas">
        {/* Document Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          {!isReadOnly && editor && (
            <div className="flex items-center gap-1 bg-slate-900 border-b border-slate-800 px-4 py-2 shrink-0">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('bold') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('italic') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Heading 1"
              >
                <Heading1 size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('bulletList') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                  editor.isActive('codeBlock') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                }`}
                title="Code Block"
              >
                <Code size={16} />
              </button>
            </div>
          )}

          {/* Editor Content */}
          <div className="flex-1 overflow-auto bg-slate-950">
            <div className="max-w-4xl mx-auto p-8">
              {editor && !isReadOnly && <ClauseHighlighter editor={editor} onExtract={handleExtract} />}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Obligations Sidecar */}
        <ObligationsSidecar
          policy={currentPolicy}
          isReadOnly={isReadOnly}
          pendingClauseText={pendingClauseText}
          onAddObligation={handleAddObligation}
          onUpdateObligation={handleUpdateObligation}
          onClosePendingClause={handleClosePendingClause}
        />
      </div>

      {/* Redline View Modal */}
      {showRedlineView && (
        <div className="fixed inset-0 z-50 bg-black">
          <RedlineView
            currentVersion={currentPolicy}
            previousVersion={getPreviousVersion(currentPolicy.id)!}
            onClose={() => setShowRedlineView(false)}
          />
        </div>
      )}

      {/* Impact Preview Modal */}
      {showImpactPreview && (
        <ImpactPreviewPanel
          policy={currentPolicy}
          onApprove={handleApprovePublish}
          onRevise={handleRevisePolicy}
          onCancel={() => setShowImpactPreview(false)}
        />
      )}
    </div>
  );
};

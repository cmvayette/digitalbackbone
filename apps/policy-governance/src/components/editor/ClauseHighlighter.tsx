import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { ShieldCheck } from 'lucide-react';

interface ClauseHighlighterProps {
    editor: Editor;
    onExtract: () => void;
}

export const ClauseHighlighter: React.FC<ClauseHighlighterProps> = ({ editor, onExtract }) => {
    if (!editor) return null;

    return (

        <BubbleMenu
            editor={editor}

            shouldShow={({ from, to }: { from: number; to: number }) => {
                // Only show if selection is non-empty
                return from !== to;
            }}
        >
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex items-center p-1 gap-1">
                <button
                    onClick={onExtract}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded"
                >
                    <ShieldCheck size={14} />
                    Extract Obligation
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-slate-700 ${editor.isActive('bold') ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                >
                    B
                </button>
            </div>
        </BubbleMenu>
    );
};

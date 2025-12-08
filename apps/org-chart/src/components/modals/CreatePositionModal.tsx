import { X } from 'lucide-react';
import { useState } from 'react';

interface CreatePositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, billetCode: string) => void;
    parentName: string;
}

export function CreatePositionModal({ isOpen, onClose, onSubmit, parentName }: CreatePositionModalProps) {
    const [title, setTitle] = useState('');
    const [billetCode, setBilletCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(title, billetCode);
        onClose();
        setTitle('');
        setBilletCode('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-panel border border-border-color rounded-lg shadow-2xl w-[400px] overflow-hidden">
                <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-surface">
                    <h3 className="font-bold text-text-primary">Add Position</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-sm text-text-secondary">
                        Creating new position in <span className="text-accent-orange font-bold">{parentName}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Position Title</label>
                        <input
                            type="text"
                            className="w-full bg-bg-canvas border border-border-color rounded p-2 text-text-primary focus:border-accent-orange outline-none"
                            placeholder="e.g. Operations Officer"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Billet Code / MOS</label>
                        <input
                            type="text"
                            className="w-full bg-bg-canvas border border-border-color rounded p-2 text-text-primary focus:border-accent-orange outline-none"
                            placeholder="e.g. 0203 / 11A"
                            value={billetCode}
                            onChange={e => setBilletCode(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded border border-border-color text-text-primary hover:bg-bg-surface">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 rounded bg-accent-blue text-bg-panel font-bold hover:bg-blue-400">
                            Create Position
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

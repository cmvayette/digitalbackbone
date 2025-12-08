import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, roleCode: string) => void;
    parentName: string;
}

export function CreatePositionModal({ isOpen, onClose, onSubmit, parentName }: CreatePositionModalProps) {
    const [title, setTitle] = useState('');
    const [roleCode, setRoleCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !roleCode) {
            toast.error('Please fill in all fields');
            return;
        }
        onSubmit(title, roleCode);
        onClose();
        setTitle('');
        setRoleCode('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-panel border border-border-color rounded-lg shadow-xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-bg-surface px-4 py-3 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-text-primary font-bold text-sm uppercase tracking-wide">Add Position</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div className="text-sm text-text-secondary mb-2">
                        Adding position to <span className="text-accent-orange font-bold">{parentName}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">Position Title</label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Operations Officer"
                            className="bg-bg-canvas border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:border-accent-orange outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">Billet Code</label>
                        <input
                            type="text"
                            value={roleCode}
                            onChange={(e) => setRoleCode(e.target.value)}
                            placeholder="e.g. 1110"
                            className="bg-bg-canvas border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:border-accent-orange outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 rounded text-sm font-medium text-text-secondary hover:bg-bg-surface transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded text-sm font-bold bg-accent-orange text-bg-panel hover:bg-orange-400 transition-colors"
                        >
                            Create Position
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

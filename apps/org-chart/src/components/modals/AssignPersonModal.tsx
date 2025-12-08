import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface AssignPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, rank: string) => void;
    positionTitle: string;
}

export function AssignPersonModal({ isOpen, onClose, onSubmit, positionTitle }: AssignPersonModalProps) {
    const [name, setName] = useState('');
    const [rank, setRank] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !rank) {
            toast.error('Please fill in all fields');
            return;
        }
        onSubmit(name, rank);
        onClose();
        setName('');
        setRank('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-panel border border-border-color rounded-lg shadow-xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-bg-surface px-4 py-3 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-text-primary font-bold text-sm uppercase tracking-wide">Assign Person</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div className="text-sm text-text-secondary mb-2">
                        Assigning to position <span className="text-accent-blue font-bold">{positionTitle}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">Person Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="bg-bg-canvas border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:border-accent-blue outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">Rank</label>
                        <input
                            type="text"
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                            placeholder="e.g. LT"
                            className="bg-bg-canvas border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:border-accent-blue outline-none"
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
                            className="px-4 py-2 rounded text-sm font-bold bg-accent-blue text-bg-panel hover:bg-blue-400 transition-colors"
                        >
                            Assign
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

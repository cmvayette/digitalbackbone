import { X } from 'lucide-react';
import { useState } from 'react';

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
        onSubmit(name, rank);
        onClose();
        setName('');
        setRank('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-panel border border-border-color rounded-lg shadow-2xl w-[400px] overflow-hidden">
                <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-surface">
                    <h3 className="font-bold text-text-primary">Assign Member</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-sm text-text-secondary">
                        Filling position: <span className="text-accent-blue font-bold">{positionTitle}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Member Name</label>
                        <input
                            type="text"
                            className="w-full bg-bg-canvas border border-border-color rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase">Rank / Grade</label>
                        <input
                            type="text"
                            className="w-full bg-bg-canvas border border-border-color rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                            placeholder="e.g. O-3 / GS-12"
                            value={rank}
                            onChange={e => setRank(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded border border-border-color text-text-primary hover:bg-bg-surface">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 rounded bg-accent-blue text-bg-panel font-bold hover:bg-blue-400">
                            Confirm Assignment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

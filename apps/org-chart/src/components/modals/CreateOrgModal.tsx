import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, uic: string) => void;
    parentName: string;
}

export function CreateOrgModal({ isOpen, onClose, onSubmit, parentName }: CreateOrgModalProps) {
    const [name, setName] = useState('');
    const [uic, setUic] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !uic) {
            toast.error('Please fill in all fields');
            return;
        }
        onSubmit(name, uic);
        onClose();
        setName('');
        setUic('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-panel border border-border-color rounded-lg shadow-xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-bg-surface px-4 py-3 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-text-primary font-bold text-sm uppercase tracking-wide">Add Sub-Unit</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div className="text-sm text-text-secondary mb-2">
                        Adding new unit under <span className="text-accent-orange font-bold">{parentName}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">Unit Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Supply Alpha"
                            className="bg-bg-canvas border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:border-accent-orange outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary uppercase">UIC / Code</label>
                        <input
                            type="text"
                            value={uic}
                            onChange={(e) => setUic(e.target.value)}
                            placeholder="e.g. SUP-A"
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
                            Create Unit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

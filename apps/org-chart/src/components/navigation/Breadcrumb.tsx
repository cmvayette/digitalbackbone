import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
    id: string;
    label: string;
}

interface BreadcrumbProps {
    path: BreadcrumbItem[];
    onNavigate: (id: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    if (path.length === 0) return null;

    return (
        <div className="flex items-center gap-1 text-sm bg-bg-panel/90 backdrop-blur border border-border-color px-3 py-1.5 rounded-full shadow-lg">
            <button
                onClick={() => onNavigate(path[0].id)}
                className="p-1 hover:bg-bg-surface rounded text-text-secondary hover:text-text-primary transition-colors"
                title="Go to Root"
            >
                <Home size={14} />
            </button>

            {path.slice(1).map((item, index) => {
                const isLast = index === path.length - 2; // -2 because slice excludes first item, so this array is 1 shorter than path

                return (
                    <div key={item.id} className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                        <ChevronRight size={14} className="text-text-secondary opacity-50" />
                        <button
                            onClick={() => onNavigate(item.id)}
                            className={clsx(
                                "max-w-[150px] truncate px-1.5 py-0.5 rounded transition-colors",
                                isLast
                                    ? "font-bold text-text-primary cursor-default"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
                            )}
                            disabled={isLast}
                        >
                            {item.label}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

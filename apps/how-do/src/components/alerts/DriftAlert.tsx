import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ArrowRight } from 'lucide-react';
import { DriftIssue, DriftType } from '../../hooks/useDriftDetection';

interface DriftAlertProps {
    issues: DriftIssue[];
    onFix?: (issue: DriftIssue) => void;
}

export const DriftAlert: React.FC<DriftAlertProps> = ({ issues, onFix }) => {
    if (issues.length === 0) return null;

    const highSeverity = issues.filter(i => i.severity === 'high');
    const mediumSeverity = issues.filter(i => i.severity === 'medium');

    return (
        <div className="bg-amber-900/20 border-b border-amber-900/50 p-3 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-900/30 rounded-lg shrink-0">
                    <AlertTriangle className="text-amber-500" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-200 mb-1">
                        Governance Drift Detected
                    </h3>
                    <p className="text-xs text-amber-400/80 mb-3">
                        This process has drifted from current organizational policy.
                        {highSeverity.length > 0 && ` ${highSeverity.length} critical issues.`}
                    </p>

                    <div className="space-y-2">
                        {issues.slice(0, 3).map((issue, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-amber-950/40 rounded p-2 border border-amber-900/30">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {issue.type === DriftType.Deprecated ? (
                                        <AlertOctagon size={14} className="text-red-400 shrink-0" />
                                    ) : (
                                        <Info size={14} className="text-blue-400 shrink-0" />
                                    )}
                                    <span className="text-xs text-slate-300 truncate">{issue.message}</span>
                                </div>
                                {onFix && (
                                    <button
                                        onClick={() => onFix(issue)}
                                        className="text-[10px] font-bold text-amber-500 hover:text-amber-300 flex items-center gap-1 ml-2 whitespace-nowrap"
                                    >
                                        FIX <ArrowRight size={10} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {issues.length > 3 && (
                            <div className="text-[10px] text-center text-amber-500/60 italic pt-1">
                                + {issues.length - 3} more issues
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

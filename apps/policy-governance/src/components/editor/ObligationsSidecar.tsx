import React, { useState } from 'react';
import { ListChecks, AlertTriangle, Users, Plus, CheckSquare, List, X } from 'lucide-react';
import type { Obligation, PolicyDocument } from '../../types/policy';
import { ObligationComposer } from './ObligationComposer';
import { useExternalProcessData } from '@som/api-client';
import { HolonType, type Process } from '@som/shared-types';

type SidecarTab = 'obligations' | 'linter' | 'actors';

interface ObligationsSidecarProps {
  policy: PolicyDocument;
  isReadOnly: boolean;
  pendingClauseText: string;
  onAddObligation: (obligation: Omit<Obligation, 'id'>) => void;
  onUpdateObligation: (obligationId: string, updates: Partial<Obligation>) => void;
  onClosePendingClause: () => void;
  onHighlightObligation?: (obligationId: string) => void;
}

export const ObligationsSidecar: React.FC<ObligationsSidecarProps> = ({
  policy,
  isReadOnly,
  pendingClauseText,
  onAddObligation,
  onUpdateObligation,
  onClosePendingClause,
  onHighlightObligation,
}) => {
  const [activeTab, setActiveTab] = useState<SidecarTab>('obligations');
  const [showComposer, setShowComposer] = useState(false);
  const { getProcessById, addProcess } = useExternalProcessData({ mode: 'mock' });

  // Auto-open composer when pendingClauseText is set
  React.useEffect(() => {
    if (pendingClauseText) {
      setShowComposer(true);
      setActiveTab('obligations');
    }
  }, [pendingClauseText]);

  const TabButton: React.FC<{ tab: SidecarTab; icon: React.ReactNode; label: string; count?: number }> = ({
    tab,
    icon,
    label,
    count,
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all flex-1 border-b-2 ${
        activeTab === tab
          ? 'border-blue-500 text-blue-400 bg-blue-900/10'
          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono ${
          activeTab === tab ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-800 text-slate-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const handleSaveObligation = (obl: Omit<Obligation, 'id'>) => {
    onAddObligation(obl);
    setShowComposer(false);
    onClosePendingClause();
  };

  const handleCancelComposer = () => {
    setShowComposer(false);
    onClosePendingClause();
  };

  const handleSuggestProcess = (obligation: Obligation) => {
    const newProcess: Process = {
      id: `proc-sug-${Date.now()}`,
      type: HolonType.Process,
      createdAt: new Date(),
      createdBy: 'policy-gov',
      status: 'draft' as const,
      sourceDocuments: [policy.id],
      properties: {
        name: `Process: ${obligation.statement.substring(0, 40)}...`,
        description: `Derived from obligation: ${obligation.statement}`,
        inputs: [],
        outputs: [],
        estimatedDuration: 0,
        steps: [],
      },
    };
    addProcess(newProcess);
    onUpdateObligation(obligation.id, { suggestedProcessId: newProcess.id });
  };

  // Extract unique actors from obligations
  const uniqueActors = React.useMemo(() => {
    const actorMap = new Map();
    policy.obligations.forEach((obl) => {
      if (!actorMap.has(obl.actor.id)) {
        actorMap.set(obl.actor.id, {
          ...obl.actor,
          obligationCount: 0,
        });
      }
      actorMap.get(obl.actor.id).obligationCount++;
    });
    return Array.from(actorMap.values());
  }, [policy.obligations]);

  // Mock linter warnings (in real impl, this would come from a service)
  const linterWarnings = React.useMemo(() => {
    const warnings: Array<{ id: string; severity: 'error' | 'warning'; message: string; suggestion?: string }> = [];

    // Simple regex-based checks
    const content = policy.sections[0]?.content || '';

    if (content.match(/as soon as possible/i)) {
      warnings.push({
        id: 'w1',
        severity: 'warning',
        message: 'Ambiguous phrasing detected: "as soon as possible"',
        suggestion: 'Replace with specific timeframe (e.g., "within 72 hours")',
      });
    }

    if (content.match(/appropriate|timely|as needed/i)) {
      warnings.push({
        id: 'w2',
        severity: 'warning',
        message: 'Vague terms detected: "appropriate", "timely", or "as needed"',
        suggestion: 'Define specific criteria or timeframes',
      });
    }

    return warnings;
  }, [policy.sections]);

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 shrink-0">
        <TabButton
          tab="obligations"
          icon={<ListChecks size={14} />}
          label="Obligations"
          count={policy.obligations.length}
        />
        <TabButton
          tab="linter"
          icon={<AlertTriangle size={14} />}
          label="Linter"
          count={linterWarnings.length}
        />
        <TabButton tab="actors" icon={<Users size={14} />} label="Actors" count={uniqueActors.length} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Obligations Tab */}
        {activeTab === 'obligations' && (
          <>
            {!isReadOnly && (
              <button
                onClick={() => setShowComposer(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors"
              >
                <Plus size={16} /> Add Obligation
              </button>
            )}

            {showComposer && (
              <div className="border border-blue-900/50 rounded-lg p-4 bg-blue-900/10 shadow-xl">
                {pendingClauseText && (
                  <div className="mb-3 bg-amber-900/20 text-amber-300 text-xs p-2 rounded border border-amber-900/50 italic">
                    Extracting from: "{pendingClauseText.substring(0, 60)}..."
                  </div>
                )}
                <ObligationComposer
                  initialStatement={pendingClauseText}
                  onSave={handleSaveObligation}
                  onCancel={handleCancelComposer}
                />
              </div>
            )}

            <div className="space-y-3">
              {policy.obligations.map((obl) => {
                const linkedProcess = obl.suggestedProcessId ? getProcessById(obl.suggestedProcessId) : undefined;

                return (
                  <div
                    key={obl.id}
                    onClick={() => onHighlightObligation?.(obl.id)}
                    className="bg-blue-900/10 border border-blue-900/50 rounded-lg p-3 hover:bg-blue-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <ListChecks size={16} className="text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
                          OBL-{obl.id.substring(0, 6)}
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed">{obl.statement}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500 font-mono">Actor:</span>
                        <span className="font-mono text-blue-400">{obl.actor.name}</span>
                      </span>
                      {obl.deadline && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">•</span>
                          <span>{obl.deadline}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          obl.criticality === 'high'
                            ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                            : obl.criticality === 'medium'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {obl.criticality}
                      </span>

                      {linkedProcess ? (
                        <div className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50 flex items-center gap-1">
                          <CheckSquare size={12} />
                          <span className="font-mono">{linkedProcess.properties.name.substring(0, 20)}...</span>
                        </div>
                      ) : (
                        !isReadOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuggestProcess(obl);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 flex items-center gap-1"
                          >
                            <List size={12} /> Link Process
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {policy.obligations.length === 0 && !showComposer && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium mb-1">No obligations yet</p>
                  <p className="text-xs">Highlight text in the document to extract obligations</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Linter Tab */}
        {activeTab === 'linter' && (
          <div className="space-y-3">
            {linterWarnings.map((warning) => (
              <div
                key={warning.id}
                className={`rounded-lg p-3 border ${
                  warning.severity === 'error'
                    ? 'bg-red-900/20 border-red-900/50'
                    : 'bg-amber-900/20 border-amber-900/50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    className={`${warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'} mt-0.5 shrink-0`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 mb-1">{warning.message}</p>
                    {warning.suggestion && (
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="font-bold">Suggestion:</span> {warning.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {linterWarnings.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <CheckSquare size={32} className="mx-auto mb-2 opacity-50 text-green-400" />
                <p className="font-medium mb-1 text-green-400">All checks passed!</p>
                <p className="text-xs">No governance issues detected</p>
              </div>
            )}
          </div>
        )}

        {/* Actors Tab */}
        {activeTab === 'actors' && (
          <div className="space-y-3">
            {uniqueActors.map((actor) => (
              <div
                key={actor.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Users size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-mono text-blue-400 font-bold">{actor.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{actor.type}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs font-bold font-mono">
                    {actor.obligationCount}
                  </span>
                </div>

                {actor.uic && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">UIC:</span> <span className="font-mono">{actor.uic}</span>
                  </div>
                )}
                {actor.billetCode && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Billet:</span> <span className="font-mono">{actor.billetCode}</span>
                  </div>
                )}
              </div>
            ))}

            {uniqueActors.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium mb-1">No actors assigned</p>
                <p className="text-xs">Actors will appear as obligations are created</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { diffSentences, Change } from 'diff';
import { AlertTriangle, Info, ChevronDown, ChevronRight, Users, FileText } from 'lucide-react';
import type { PolicyDocument, Obligation } from '../../types/policy';

interface RedlineViewProps {
  currentVersion: PolicyDocument;
  previousVersion: PolicyDocument;
  onClose: () => void;
}

interface ObligationChange {
  type: 'added' | 'removed' | 'modified';
  obligation: Obligation;
  previousObligation?: Obligation;
  affectedActors: string[];
  impactSummary: string;
}

export const RedlineView: React.FC<RedlineViewProps> = ({
  currentVersion,
  previousVersion,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline');
  const [showImpactPanel, setShowImpactPanel] = useState(true);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  // Compute text differences
  const textDiff = useMemo(() => {
    const oldText = previousVersion.sections[0]?.content || '';
    const newText = currentVersion.sections[0]?.content || '';

    // Strip HTML tags for comparison
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

    return diffSentences(stripHtml(oldText), stripHtml(newText));
  }, [previousVersion, currentVersion]);

  // Analyze obligation changes
  const obligationChanges = useMemo((): ObligationChange[] => {
    const changes: ObligationChange[] = [];
    const prevObligations = new Map(previousVersion.obligations.map(o => [o.id, o]));
    const currObligations = new Map(currentVersion.obligations.map(o => [o.id, o]));

    // Find added obligations
    currentVersion.obligations.forEach(obl => {
      if (!prevObligations.has(obl.id)) {
        changes.push({
          type: 'added',
          obligation: obl,
          affectedActors: [obl.actor.name],
          impactSummary: `New obligation assigned to ${obl.actor.name}`,
        });
      } else {
        // Check for modifications
        const prevObl = prevObligations.get(obl.id)!;
        if (
          prevObl.statement !== obl.statement ||
          prevObl.actor.id !== obl.actor.id ||
          prevObl.criticality !== obl.criticality
        ) {
          changes.push({
            type: 'modified',
            obligation: obl,
            previousObligation: prevObl,
            affectedActors: [
              obl.actor.name,
              ...(prevObl.actor.id !== obl.actor.id ? [prevObl.actor.name] : []),
            ],
            impactSummary: prevObl.actor.id !== obl.actor.id
              ? `Reassigned from ${prevObl.actor.name} to ${obl.actor.name}`
              : 'Obligation statement or criticality changed',
          });
        }
      }
    });

    // Find removed obligations
    previousVersion.obligations.forEach(obl => {
      if (!currObligations.has(obl.id)) {
        changes.push({
          type: 'removed',
          obligation: obl,
          affectedActors: [obl.actor.name],
          impactSummary: `Obligation removed from ${obl.actor.name}`,
        });
      }
    });

    return changes;
  }, [previousVersion, currentVersion]);

  // Calculate impact statistics
  const impactStats = useMemo(() => {
    const actorImpact = new Map<string, { added: number; removed: number; modified: number }>();

    obligationChanges.forEach(change => {
      change.affectedActors.forEach(actorName => {
        if (!actorImpact.has(actorName)) {
          actorImpact.set(actorName, { added: 0, removed: 0, modified: 0 });
        }
        const stats = actorImpact.get(actorName)!;
        stats[change.type]++;
      });
    });

    return {
      totalChanges: obligationChanges.length,
      addedCount: obligationChanges.filter(c => c.type === 'added').length,
      removedCount: obligationChanges.filter(c => c.type === 'removed').length,
      modifiedCount: obligationChanges.filter(c => c.type === 'modified').length,
      affectedActors: Array.from(actorImpact.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        totalImpact: stats.added + stats.removed + stats.modified,
      })),
    };
  }, [obligationChanges]);

  const toggleChangeExpanded = (changeId: string) => {
    setExpandedChanges(prev => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  const renderDiffText = (changes: Change[]) => {
    return changes.map((part, index) => {
      if (part.added) {
        return (
          <span key={index} className="diff-added">
            {part.value}
          </span>
        );
      }
      if (part.removed) {
        return (
          <span key={index} className="diff-removed">
            {part.value}
          </span>
        );
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-canvas">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            Version Comparison: v{previousVersion.version} → v{currentVersion.version}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review changes and impact before finalizing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('inline')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'inline'
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inline
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diff View */}
        <div className="flex-1 overflow-auto p-6">
          {/* Impact Summary Banner */}
          {impactStats.totalChanges > 0 && (
            <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-amber-400 text-sm mb-2">Impact Analysis</p>
                  <p className="text-sm text-slate-300 mb-3">
                    This revision will affect <strong className="text-white">{impactStats.affectedActors.length} actors</strong> across{' '}
                    <strong className="text-white">{impactStats.totalChanges} obligation changes</strong>:
                  </p>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-slate-300">
                        <strong className="text-green-400">{impactStats.addedCount}</strong> Added
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span className="text-slate-300">
                        <strong className="text-red-400">{impactStats.removedCount}</strong> Removed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">
                        <strong className="text-yellow-400">{impactStats.modifiedCount}</strong> Modified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Diff */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Document Changes</h3>

            {viewMode === 'inline' ? (
              <div className="prose prose-policy text-sm leading-relaxed">
                {renderDiffText(textDiff)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Previous Version</p>
                  <div className="bg-slate-950 border border-slate-800 rounded p-4 prose prose-policy text-sm">
                    <div dangerouslySetInnerHTML={{ __html: previousVersion.sections[0]?.content || '' }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Current Version</p>
                  <div className="bg-slate-950 border border-slate-800 rounded p-4 prose prose-policy text-sm">
                    <div dangerouslySetInnerHTML={{ __html: currentVersion.sections[0]?.content || '' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Impact Panel */}
        {showImpactPanel && (
          <div className="w-96 border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase">Obligation Changes</h3>
                <button
                  onClick={() => setShowImpactPanel(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Hide
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {obligationChanges.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <Info size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No obligation changes detected</p>
                </div>
              ) : (
                obligationChanges.map((change, index) => {
                  const changeId = `change-${index}`;
                  const isExpanded = expandedChanges.has(changeId);

                  return (
                    <div
                      key={changeId}
                      className={`rounded-lg border ${
                        change.type === 'added'
                          ? 'bg-green-900/10 border-green-900/50'
                          : change.type === 'removed'
                          ? 'bg-red-900/10 border-red-900/50'
                          : 'bg-yellow-900/10 border-yellow-900/50'
                      }`}
                    >
                      <button
                        onClick={() => toggleChangeExpanded(changeId)}
                        className="w-full p-3 text-left hover:bg-black/20 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {isExpanded ? (
                            <ChevronDown size={16} className="mt-0.5 shrink-0 text-slate-400" />
                          ) : (
                            <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  change.type === 'added'
                                    ? 'bg-green-900/50 text-green-400'
                                    : change.type === 'removed'
                                    ? 'bg-red-900/50 text-red-400'
                                    : 'bg-yellow-900/50 text-yellow-400'
                                }`}
                              >
                                {change.type}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                OBL-{change.obligation.id.substring(0, 6)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">
                              {change.obligation.statement}
                            </p>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-800/50 pt-2">
                          <div className="text-xs">
                            <p className="text-slate-500 font-bold uppercase mb-1">Impact</p>
                            <p className="text-slate-300">{change.impactSummary}</p>
                          </div>

                          <div className="text-xs">
                            <p className="text-slate-500 font-bold uppercase mb-1">Affected Actors</p>
                            <div className="flex flex-wrap gap-1">
                              {change.affectedActors.map(actor => (
                                <span
                                  key={actor}
                                  className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]"
                                >
                                  {actor}
                                </span>
                              ))}
                            </div>
                          </div>

                          {change.type === 'modified' && change.previousObligation && (
                            <div className="text-xs">
                              <p className="text-slate-500 font-bold uppercase mb-1">Changes</p>
                              {change.previousObligation.statement !== change.obligation.statement && (
                                <div className="mb-2">
                                  <p className="text-slate-400 mb-0.5">Statement:</p>
                                  <p className="text-red-400 line-through text-[11px]">
                                    {change.previousObligation.statement}
                                  </p>
                                  <p className="text-green-400 text-[11px]">{change.obligation.statement}</p>
                                </div>
                              )}
                              {change.previousObligation.criticality !== change.obligation.criticality && (
                                <div>
                                  <p className="text-slate-400 mb-0.5">Criticality:</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-400 line-through">
                                      {change.previousObligation.criticality}
                                    </span>
                                    <span>→</span>
                                    <span className="text-green-400">{change.obligation.criticality}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Actor Impact Summary */}
              {impactStats.affectedActors.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Actor Impact Summary</h4>
                  <div className="space-y-2">
                    {impactStats.affectedActors
                      .sort((a, b) => b.totalImpact - a.totalImpact)
                      .map(actor => (
                        <div
                          key={actor.name}
                          className="bg-slate-800 border border-slate-700 rounded p-2 text-xs"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Users size={12} className="text-blue-400" />
                            <span className="font-mono text-blue-400 font-bold">{actor.name}</span>
                          </div>
                          <div className="flex gap-3 text-[10px] text-slate-400">
                            {actor.added > 0 && <span className="text-green-400">+{actor.added}</span>}
                            {actor.removed > 0 && <span className="text-red-400">-{actor.removed}</span>}
                            {actor.modified > 0 && <span className="text-yellow-400">~{actor.modified}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

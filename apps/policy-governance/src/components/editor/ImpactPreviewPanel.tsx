import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, Activity, CheckCircle, X, AlertCircle } from 'lucide-react';
import type { PolicyDocument, Obligation } from '../../types/policy';

interface ActorCapacity {
  actorId: string;
  actorName: string;
  currentObligations: number;
  newObligations: number;
  projectedLoad: number; // percentage
  capacityStatus: 'healthy' | 'at-risk' | 'critical';
  riskFactors: string[];
}

interface PolicyConflict {
  id: string;
  description: string;
  severity: 'warning' | 'error';
  conflictingPolicyId?: string;
  suggestion?: string;
}

interface ImpactPreviewPanelProps {
  policy: PolicyDocument;
  onApprove: () => void;
  onRevise: () => void;
  onCancel: () => void;
}

export const ImpactPreviewPanel: React.FC<ImpactPreviewPanelProps> = ({
  policy,
  onApprove,
  onRevise,
  onCancel,
}) => {
  // Mock capacity data (in real app, fetch from org-chart + existing obligations)
  const actorCapacities = useMemo((): ActorCapacity[] => {
    const capacityMap = new Map<string, ActorCapacity>();

    policy.obligations.forEach(obl => {
      if (!capacityMap.has(obl.actor.id)) {
        // Mock current load (in real app, query existing obligations)
        const currentObligations = Math.floor(Math.random() * 30) + 15;
        const newObligations = 1;
        const maxCapacity = 50; // Mock capacity threshold
        const projectedLoad = Math.round(((currentObligations + newObligations) / maxCapacity) * 100);

        let capacityStatus: 'healthy' | 'at-risk' | 'critical' = 'healthy';
        const riskFactors: string[] = [];

        if (projectedLoad > 90) {
          capacityStatus = 'critical';
          riskFactors.push('Capacity exceeded');
          riskFactors.push('High burnout risk');
        } else if (projectedLoad > 70) {
          capacityStatus = 'at-risk';
          riskFactors.push('Approaching capacity limit');
        }

        if (obl.criticality === 'high') {
          riskFactors.push('High-priority obligation');
        }

        capacityMap.set(obl.actor.id, {
          actorId: obl.actor.id,
          actorName: obl.actor.name,
          currentObligations,
          newObligations,
          projectedLoad,
          capacityStatus,
          riskFactors,
        });
      } else {
        const capacity = capacityMap.get(obl.actor.id)!;
        capacity.newObligations++;
        const maxCapacity = 50;
        capacity.projectedLoad = Math.round(
          ((capacity.currentObligations + capacity.newObligations) / maxCapacity) * 100
        );

        if (capacity.projectedLoad > 90) {
          capacity.capacityStatus = 'critical';
          if (!capacity.riskFactors.includes('Capacity exceeded')) {
            capacity.riskFactors.push('Capacity exceeded');
          }
        } else if (capacity.projectedLoad > 70) {
          capacity.capacityStatus = 'at-risk';
        }
      }
    });

    return Array.from(capacityMap.values()).sort((a, b) => b.projectedLoad - a.projectedLoad);
  }, [policy.obligations]);

  // Detect potential conflicts
  const conflicts = useMemo((): PolicyConflict[] => {
    const detected: PolicyConflict[] = [];

    // Simple conflict detection (in real app, use NLP/LLM)
    const obligationText = policy.obligations.map(o => o.statement.toLowerCase()).join(' ');

    // Check for ambiguous language
    if (obligationText.includes('as soon as possible') || obligationText.includes('timely')) {
      detected.push({
        id: 'c1',
        description: 'Ambiguous timeframe detected in obligation statements',
        severity: 'warning',
        suggestion: 'Replace with specific deadlines (e.g., "within 72 hours")',
      });
    }

    // Check for undefined actors
    if (obligationText.includes('appropriate staff') || obligationText.includes('designated personnel')) {
      detected.push({
        id: 'c2',
        description: 'Undefined actor references detected',
        severity: 'error',
        suggestion: 'Specify exact position or organization unit',
      });
    }

    // Check for overlapping responsibilities (mock)
    const actorObligationCounts = new Map<string, number>();
    policy.obligations.forEach(obl => {
      actorObligationCounts.set(obl.actor.id, (actorObligationCounts.get(obl.actor.id) || 0) + 1);
    });

    actorObligationCounts.forEach((count, actorId) => {
      if (count > 5) {
        const actorName = policy.obligations.find(o => o.actor.id === actorId)?.actor.name || 'Unknown';
        detected.push({
          id: `overlap-${actorId}`,
          description: `${actorName} has ${count} new obligations - potential workload concentration`,
          severity: 'warning',
          suggestion: 'Consider distributing obligations across multiple actors',
        });
      }
    });

    return detected;
  }, [policy.obligations]);

  const overallStats = useMemo(() => {
    const criticalActors = actorCapacities.filter(a => a.capacityStatus === 'critical').length;
    const atRiskActors = actorCapacities.filter(a => a.capacityStatus === 'at-risk').length;
    const totalNewWork = actorCapacities.reduce((sum, a) => sum + a.newObligations, 0);
    const avgLoad = Math.round(
      actorCapacities.reduce((sum, a) => sum + a.projectedLoad, 0) / actorCapacities.length
    );

    const criticalConflicts = conflicts.filter(c => c.severity === 'error').length;

    let operationalViability: 'viable' | 'at-risk' | 'not-viable' = 'viable';
    if (criticalActors > 0 || criticalConflicts > 0) {
      operationalViability = 'not-viable';
    } else if (atRiskActors > actorCapacities.length * 0.3 || avgLoad > 75) {
      operationalViability = 'at-risk';
    }

    return {
      criticalActors,
      atRiskActors,
      totalNewWork,
      avgLoad,
      operationalViability,
    };
  }, [actorCapacities, conflicts]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Activity size={24} className="text-blue-400" />
                Impact Preview: "{policy.title}"
              </h2>
              <p className="text-sm text-slate-400">
                Review operational impact before publishing this policy
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overall Status Banner */}
          <div
            className={`rounded-lg p-4 border ${
              overallStats.operationalViability === 'viable'
                ? 'bg-green-900/20 border-green-900/50'
                : overallStats.operationalViability === 'at-risk'
                ? 'bg-amber-900/20 border-amber-900/50'
                : 'bg-red-900/20 border-red-900/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {overallStats.operationalViability === 'viable' ? (
                <CheckCircle size={24} className="text-green-400 mt-0.5" />
              ) : (
                <AlertTriangle size={24} className="text-amber-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg mb-2">
                  {overallStats.operationalViability === 'viable' && (
                    <span className="text-green-400">Operationally Viable</span>
                  )}
                  {overallStats.operationalViability === 'at-risk' && (
                    <span className="text-amber-400">At Risk - Review Recommended</span>
                  )}
                  {overallStats.operationalViability === 'not-viable' && (
                    <span className="text-red-400">Not Viable - Revisions Required</span>
                  )}
                </p>
                <p className="text-sm text-slate-300 mb-3">
                  This policy will create <strong className="text-white">{overallStats.totalNewWork} new obligations</strong>{' '}
                  across <strong className="text-white">{actorCapacities.length} actors</strong>. Average projected workload:{' '}
                  <strong className="text-white">{overallStats.avgLoad}%</strong>
                </p>
                {(overallStats.criticalActors > 0 || overallStats.atRiskActors > 0) && (
                  <div className="flex gap-4 text-xs">
                    {overallStats.criticalActors > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-400" />
                        <span className="text-red-400">
                          <strong>{overallStats.criticalActors}</strong> actors at critical capacity
                        </span>
                      </div>
                    )}
                    {overallStats.atRiskActors > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-400" />
                        <span className="text-amber-400">
                          <strong>{overallStats.atRiskActors}</strong> actors at risk
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Capacity Forecast */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Capacity Forecast
            </h3>
            <div className="space-y-3">
              {actorCapacities.map(actor => (
                <div
                  key={actor.actorId}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-400" />
                      <span className="font-mono text-sm text-blue-400 font-bold">{actor.actorName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        actor.capacityStatus === 'healthy'
                          ? 'bg-green-900/50 text-green-400'
                          : actor.capacityStatus === 'at-risk'
                          ? 'bg-amber-900/50 text-amber-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}
                    >
                      {actor.capacityStatus}
                    </span>
                  </div>

                  {/* Workload Bar */}
                  <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${
                        actor.projectedLoad > 90
                          ? 'bg-red-500'
                          : actor.projectedLoad > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(actor.projectedLoad, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">
                      Current: {actor.currentObligations} obligations | New: +{actor.newObligations}
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        actor.projectedLoad > 90
                          ? 'text-red-400'
                          : actor.projectedLoad > 70
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {actor.projectedLoad}%
                    </span>
                  </div>

                  {actor.riskFactors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {actor.riskFactors.map((factor, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px]"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Policy Conflicts */}
          {conflicts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Detected Issues ({conflicts.length})
              </h3>
              <div className="space-y-2">
                {conflicts.map(conflict => (
                  <div
                    key={conflict.id}
                    className={`rounded-lg p-3 border ${
                      conflict.severity === 'error'
                        ? 'bg-red-900/20 border-red-900/50'
                        : 'bg-amber-900/20 border-amber-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          conflict.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-slate-200 mb-1">{conflict.description}</p>
                        {conflict.suggestion && (
                          <p className="text-xs text-slate-400">
                            <strong>Suggestion:</strong> {conflict.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="text-xs text-slate-400">
            {overallStats.operationalViability === 'not-viable' ? (
              <p>
                <AlertCircle size={14} className="inline text-red-400 mr-1" />
                Critical issues detected - publishing not recommended
              </p>
            ) : (
              <p>Review complete - proceed with publishing or make revisions</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onRevise}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 rounded font-bold transition-colors"
            >
              Revise Policy
            </button>
            <button
              onClick={onApprove}
              disabled={overallStats.operationalViability === 'not-viable'}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                overallStats.operationalViability === 'not-viable'
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Approve & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

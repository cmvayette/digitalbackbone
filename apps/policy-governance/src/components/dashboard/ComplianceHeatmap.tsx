import React, { useState } from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { SidebarPanel } from '@som/ui-components';
import { Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Obligation } from '../../types/policy';

interface HeatmapCell {
  department: string;
  domain: string;
  obligationCount: number;
  status: 'compliant' | 'at-risk' | 'critical';
  obligations: Obligation[];
}

// Mock departments (in real app, fetch from org-chart API)
const mockDepartments = [
  { id: '1', name: 'Engineering', uic: 'ENG-001' },
  { id: '2', name: 'Logistics', uic: 'LOG-001' },
  { id: '3', name: 'Admin', uic: 'ADM-001' },
  { id: '4', name: 'IT (J6)', uic: 'J6-001' },
  { id: '5', name: 'Operations', uic: 'OPS-001' },
];

// Policy domains
const policyDomains = ['Security', 'HR', 'Finance', 'Operations', 'Compliance'];

export const ComplianceHeatmap: React.FC = () => {
  const { policies } = usePolicyStore();
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Build heatmap data
  const heatmapData = React.useMemo(() => {
    const data: HeatmapCell[][] = [];

    mockDepartments.forEach((dept) => {
      const row: HeatmapCell[] = [];

      policyDomains.forEach((domain) => {
        // Find all obligations for this department and domain
        const obligations = policies.flatMap(p => p.obligations).filter(obl => {
          // Simple matching logic (in real app, use proper org-chart linking)
          const actorMatches = obl.actor.name.toLowerCase().includes(dept.name.toLowerCase());
          // Domain matching would use policy metadata or tags
          return actorMatches;
        });

        // Determine status
        let status: 'compliant' | 'at-risk' | 'critical' = 'compliant';
        if (obligations.length === 0) {
          status = 'compliant';
        } else {
          const highCritCount = obligations.filter(o => o.criticality === 'high').length;
          const unmappedCount = obligations.filter(o => !o.linkedProcessId && !o.suggestedProcessId).length;

          if (highCritCount > 2 || unmappedCount > 3) {
            status = 'critical';
          } else if (highCritCount > 0 || unmappedCount > 0) {
            status = 'at-risk';
          }
        }

        row.push({
          department: dept.name,
          domain,
          obligationCount: obligations.length,
          status,
          obligations,
        });
      });

      data.push(row);
    });

    return data;
  }, [policies]);

  const getCellColor = (status: 'compliant' | 'at-risk' | 'critical') => {
    switch (status) {
      case 'compliant':
        return 'bg-emerald-900/30 border-emerald-900/50 hover:bg-emerald-900/40';
      case 'at-risk':
        return 'bg-amber-900/30 border-amber-900/50 hover:bg-amber-900/40';
      case 'critical':
        return 'bg-red-900/30 border-red-900/50 hover:bg-red-900/40';
    }
  };

  const getTextColor = (status: 'compliant' | 'at-risk' | 'critical') => {
    switch (status) {
      case 'compliant':
        return 'text-emerald-400';
      case 'at-risk':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
    }
  };

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell);
    setIsPanelOpen(true);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Compliance Heatmap</h2>
            <p className="text-sm text-slate-400">
              Departmental compliance across policy domains
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-900/30 border border-emerald-900/50"></div>
              <span className="text-slate-400">Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-900/30 border border-amber-900/50"></div>
              <span className="text-slate-400">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-900/30 border border-red-900/50"></div>
              <span className="text-slate-400">Critical</span>
            </div>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase font-bold text-slate-500 sticky left-0 bg-slate-950 z-10">
                    Department
                  </th>
                  {policyDomains.map((domain) => (
                    <th
                      key={domain}
                      className="px-4 py-3 text-xs uppercase font-bold text-slate-500 text-center min-w-[120px]"
                    >
                      {domain}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, deptIndex) => (
                  <tr
                    key={mockDepartments[deptIndex].id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200 sticky left-0 bg-slate-900 z-10">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-blue-400" />
                        <span>{mockDepartments[deptIndex].name}</span>
                      </div>
                    </td>
                    {row.map((cell, domainIndex) => (
                      <td key={domainIndex} className="px-2 py-2">
                        <button
                          onClick={() => handleCellClick(cell)}
                          className={`w-full h-16 rounded flex flex-col items-center justify-center
                                    cursor-pointer transition-all hover:scale-105 border
                                    ${getCellColor(cell.status)}`}
                        >
                          <span className={`text-lg font-bold ${getTextColor(cell.status)}`}>
                            {cell.obligationCount}
                          </span>
                          <span className={`text-[10px] font-mono uppercase tracking-wider ${getTextColor(cell.status)}`}>
                            {cell.status}
                          </span>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Compliant Cells</p>
              <p className="text-2xl font-bold text-emerald-400">
                {heatmapData.flat().filter(c => c.status === 'compliant').length}
              </p>
            </div>
          </div>

          <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={24} className="text-amber-400" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">At Risk</p>
              <p className="text-2xl font-bold text-amber-400">
                {heatmapData.flat().filter(c => c.status === 'at-risk').length}
              </p>
            </div>
          </div>

          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-400" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Critical</p>
              <p className="text-2xl font-bold text-red-400">
                {heatmapData.flat().filter(c => c.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCell && (
        <SidebarPanel
          open={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          title={`${selectedCell.department} - ${selectedCell.domain}`}
          subtitle={`${selectedCell.obligationCount} obligations`}
          width="md"
        >
          <div className="space-y-4">
            {/* Status Badge */}
            <div
              className={`rounded-lg p-4 border ${
                selectedCell.status === 'compliant'
                  ? 'bg-emerald-900/20 border-emerald-900/50'
                  : selectedCell.status === 'at-risk'
                  ? 'bg-amber-900/20 border-amber-900/50'
                  : 'bg-red-900/20 border-red-900/50'
              }`}
            >
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
              <p
                className={`text-lg font-bold uppercase ${
                  selectedCell.status === 'compliant'
                    ? 'text-emerald-400'
                    : selectedCell.status === 'at-risk'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {selectedCell.status}
              </p>
            </div>

            {/* Obligations List */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Obligations</h3>
              <div className="space-y-2">
                {selectedCell.obligations.map((obl) => (
                  <div
                    key={obl.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-750 transition-colors"
                  >
                    <p className="text-sm text-slate-200 mb-2">{obl.statement}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono">{obl.actor.name}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          obl.criticality === 'high'
                            ? 'bg-red-900/30 text-red-400'
                            : obl.criticality === 'medium'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {obl.criticality}
                      </span>
                    </div>
                  </div>
                ))}

                {selectedCell.obligations.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-50 text-emerald-400" />
                    <p>No obligations for this department/domain combination</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-700">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors">
                Map Obligations to Processes
              </button>
            </div>
          </div>
        </SidebarPanel>
      )}
    </>
  );
};

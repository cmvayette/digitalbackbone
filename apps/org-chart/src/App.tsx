import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GraphCanvas } from './components/graph/GraphCanvas';
import type { Node, Edge } from '@xyflow/react';
// import { useOrgStore } from './store/orgStore'; // Removed
import { useExternalOrgData } from '@som/api-client';
import { getLayoutedElements } from './utils/layout';
import { useMemo, useState } from 'react';
import { SidebarPanel } from './components/sidebar/SidebarPanel';
import { DiscoveryBar } from './components/discovery/DiscoveryBar';
import { useGraphNavigation } from './hooks/useGraphNavigation';
import type { SearchResult } from './hooks/useSearch';
import { Breadcrumb } from './components/navigation/Breadcrumb';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster, toast } from 'sonner';

const queryClient = new QueryClient();

// Inner component to access ReactFlow Context
function OrgChartContent() {
  const { organizations } = useExternalOrgData({ mode: 'real' });

  const [viewMode, setViewMode] = useState<'reporting' | 'mission'>('reporting');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Navigation Hook (MUST be inside ReactFlowProvider)
  const { focusNode } = useGraphNavigation();

  // Derived State (Layout)
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (organizations.length === 0) return { nodes: [], edges: [] };

    // Transform Domain Data to React Flow Nodes/Edges
    const nodes: Node[] = organizations.map(org => ({
      id: org.id,
      type: 'organization', // Matches GraphCanvas nodeTypes
      data: {
        label: org.name,
        properties: org.properties || {}
      },
      position: { x: 0, y: 0 }
    }));

    const edges: Edge[] = organizations
      .filter(org => org.parentId)
      .map(org => ({
        id: `e-${org.parentId}-${org.id}`,
        source: org.parentId!,
        target: org.id,
        type: 'smoothstep'
      }));

    // Apply Layout
    return getLayoutedElements(nodes, edges, 'TB', viewMode);
  }, [organizations, viewMode]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // focusNode(node.id); // Disabled per user request: "All that should happen is the side panel inspector bar should appear."
  };

  const handleSearchResult = (result: SearchResult) => {
    const node = layoutedNodes.find(n => n.id === result.id);
    if (node) {
      setSelectedNode(node);
      focusNode(result.id);
    } else {
      toast.error(`Node "${result.label}" found but not loaded in current view.`);
      // Future: fetch and load node into graph
    }
  };

  const getBreadcrumbPath = (nodeId: string | null): SearchResult[] => {
    if (!nodeId) return [];
    const path: SearchResult[] = [];
    let currentId = nodeId;

    while (currentId) {
      const node = layoutedNodes.find(n => n.id === currentId);
      if (!node) break;

      path.unshift({
        id: node.id,
        label: (node.data.label as string) || 'Unknown',
        type: node.type as any,
      });

      // Traverse up using domain properties
      // @ts-ignore - we know properties exists from our mapper
      currentId = node.data.properties?.parentId;

      if (path.length > 10) break; // Safety
    }

    return path;
  };

  const breadcrumbPath = getBreadcrumbPath(selectedNode?.id || null);

  return (
    <div className="flex h-screen w-screen bg-bg-canvas text-text-primary font-ui overflow-hidden relative selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="flex-1 relative z-0 flex flex-col">
        {/* Top Center Overlay */}
        <div className="absolute top-4 left-0 right-0 pointer-events-none flex justify-center z-10 px-4">
          <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-2xl">
            <DiscoveryBar
              onResultSelect={handleSearchResult}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              clientOptions={{ mode: 'real' }}
            />
            {/* Breadcrumb below search */}
            {breadcrumbPath.length > 1 && (
              <Breadcrumb
                path={breadcrumbPath.map(p => ({ id: p.id, label: p.label }))}
                onNavigate={(id) => {
                  const node = layoutedNodes.find(n => n.id === id);
                  if (node) onNodeClick({} as any, node);
                }}
              />
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <GraphCanvas
            initialNodes={layoutedNodes}
            initialEdges={layoutedEdges}
            onNodeClick={onNodeClick}
            viewMode={viewMode}
          />
        </div>
      </main>

      {/* Side Panel Partition - separated by 1px border */}
      {selectedNode && (
        <div className="w-[400px] border-l border-slate-800 bg-bg-panel/95 backdrop-blur-md relative z-20 shadow-2xl shadow-slate-950/50">
          <SidebarPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}

      {/* Notifications */}
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        <OrgChartContent />
      </ReactFlowProvider>
    </QueryClientProvider>
  )
}

export default App;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GraphCanvas } from './components/graph/GraphCanvas';
import type { Node, Edge } from '@xyflow/react';
// import { useOrgStore } from './store/orgStore'; // Removed
import { useExternalOrgData } from '@som/api-client';
import { getLayoutedElements } from './utils/layout';
import { useEffect, useState } from 'react';
import { SidebarPanel } from './components/sidebar/SidebarPanel';
import { DiscoveryBar } from './components/discovery/DiscoveryBar';
import { useGraphNavigation } from './hooks/useGraphNavigation';
import type { SearchResult } from './hooks/useSearch';
import { Breadcrumb } from './components/navigation/Breadcrumb';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

// Inner component to access ReactFlow Context
function OrgChartContent() {
  const { organizations } = useExternalOrgData({ mode: 'mock' });
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([]);
  const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = useState<'reporting' | 'mission'>('reporting');



  // Navigation Hook (MUST be inside ReactFlowProvider)
  const { focusNode } = useGraphNavigation();

  useEffect(() => {
    if (organizations.length > 0) {
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
      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(nodes, edges, 'TB', viewMode);
      setLayoutedNodes(layoutNodes);
      setLayoutedEdges(layoutEdges);
    }
  }, [organizations, viewMode]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // focusNode(node.id); // Disabled per user request: "All that should happen is the side panel inspector bar should appear."
  };

  const handleSearchResult = (result: SearchResult) => {
    setSelectedNode(result.node);
    focusNode(result.id);
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
        node: node
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
    <div className="flex h-screen w-screen bg-bg-canvas text-text-primary font-ui overflow-hidden relative">
      <main className="flex-1 relative z-0">
        <GraphCanvas
          initialNodes={layoutedNodes}
          initialEdges={layoutedEdges}
          onNodeClick={onNodeClick}
          viewMode={viewMode}
        />

        {/* Top Center Overlay */}
        <div className="absolute top-4 left-0 right-0 pointer-events-none flex justify-center z-10 px-4">
          <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-2xl">
            <DiscoveryBar
              nodes={layoutedNodes}
              onResultSelect={handleSearchResult}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
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
      </main>

      {/* Side Panel */}
      <SidebarPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />

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

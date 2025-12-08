import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraphCanvas } from './components/graph/GraphCanvas'
import type { Node, Edge } from '@xyflow/react'
import { useOrgStructure } from './hooks/useOrgStructure'
import { getLayoutedElements } from './utils/layout'
import { useEffect, useState } from 'react'

const queryClient = new QueryClient()

import { SidebarPanel } from './components/sidebar/SidebarPanel';

import { DiscoveryBar } from './components/discovery/DiscoveryBar';
import { useGraphNavigation } from './hooks/useGraphNavigation';
import type { SearchResult } from './hooks/useSearch';
import { Breadcrumb } from './components/navigation/Breadcrumb';
import { ReactFlowProvider } from '@xyflow/react';
import { Toaster } from 'sonner';

// Inner component to access ReactFlow Context
function OrgChartContent() {
  const { data, isLoading } = useOrgStructure('org-root');
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([]);
  const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Navigation Hook (MUST be inside ReactFlowProvider)
  const { focusNode } = useGraphNavigation();

  useEffect(() => {
    if (data && data.nodes.length > 0) {
      const { nodes, edges } = getLayoutedElements(data.nodes, data.edges, 'TB');
      setLayoutedNodes(nodes);
      setLayoutedEdges(edges);
    }
  }, [data]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    focusNode(node.id);
  };

  const handleSearchResult = (result: SearchResult) => {
    setSelectedNode(result.node);
    focusNode(result.id);
  };

  return (
    <div className="flex h-screen w-screen bg-bg-canvas text-text-primary font-ui overflow-hidden">
  // Calculate Breadcrumb Path
  const getBreadcrumbPath = (nodeId: string | null): SearchResult[] => {
    if (!nodeId) return [];
      const path: SearchResult[] = [];
      let currentId = nodeId;

      // Basic parent traversal - this relies on data.properties.parentOrg
      // We could also traverse edges, but node properties are easier if maintained.
      // NOTE: This assumes tree structure. 
      // Since we don't have a fast lookup map for all nodes by ID in this component (only passed to ReactFlow),
      // we might need to rely on the layoutedNodes provided to ReactFlowProvider? 
      // Actually, useNodes() inside OrgChartContent can access them!

      // Let's implement this inside OrgChartContent where useNodes() is available? 
      // ...Wait, App component has `layoutedNodes`.

      while(currentId) {
        const node = layoutedNodes.find(n => n.id === currentId);
      if (!node) break;

      path.unshift({
        id: node.id,
      label: (node.data.label as string) || 'Unknown',
      type: node.type as any,
      node: node // Include the node itself for convenience
        });

      // Traverse up
      currentId = (node.data.properties as any)?.parentOrg;
        // Safety break for cycles
        if (path.length > 10) break;
    }

      return path;
  };

      const breadcrumbPath = getBreadcrumbPath(selectedNode?.id || null);

      return (
      <div className="w-screen h-screen bg-bg-canvas text-text-primary flex relative overflow-hidden font-sans">
        <main className="flex-1 relative z-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-text-secondary">Loading...</div>
          ) : (
            <GraphCanvas
              initialNodes={layoutedNodes}
              initialEdges={layoutedEdges}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          )}

          {/* Top Center Overlay */}
          <div className="absolute top-4 left-0 right-0 pointer-events-none flex justify-center z-10 px-4">
            <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-2xl">
              <DiscoveryBar nodes={layoutedNodes} onResultSelect={handleSearchResult} />
              {/* Breadcrumb below search */}
              {breadcrumbPath.length > 1 && (
                <Breadcrumb
                  path={breadcrumbPath.map(p => ({ id: p.id, label: p.label }))}
                  onNavigate={(id) => {
                    const node = layoutedNodes.find(n => n.id === id);
                    if (node) handleNodeClick({} as any, node); // Reuse handler
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

      export default App

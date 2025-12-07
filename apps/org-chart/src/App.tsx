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
import { ReactFlowProvider } from '@xyflow/react';

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
      <main className="flex-1 relative h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-text-secondary">Loading...</div>
        ) : (
          <GraphCanvas
            initialNodes={layoutedNodes}
            initialEdges={layoutedEdges}
            onNodeClick={onNodeClick}
          />
        )}

        {/* Discovery Bar */}
        <DiscoveryBar nodes={layoutedNodes} onResultSelect={handleSearchResult} />
      </main>
      <SidebarPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
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

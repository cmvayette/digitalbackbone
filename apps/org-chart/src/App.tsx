import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraphCanvas } from './components/graph/GraphCanvas'
import type { Node, Edge } from '@xyflow/react'
import { useOrgStructure } from './hooks/useOrgStructure'
import { getLayoutedElements } from './utils/layout'
import { useEffect, useState } from 'react'

const queryClient = new QueryClient()

import { SidebarPanel } from './components/sidebar/SidebarPanel';

function OrgChartApp() {
  // 1. Fetch Data (Hardcoded Root ID for now)
  const { data, isLoading } = useOrgStructure('org-root');

  // 2. State for Layouted Elements
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([]);
  const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([]);

  // 3. Selection State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // 4. Run Layout when data arrives
  useEffect(() => {
    if (data && data.nodes.length > 0) {
      const { nodes, edges } = getLayoutedElements(
        data.nodes,
        data.edges,
        'TB' // Top-to-Bottom
      );
      setLayoutedNodes(nodes);
      setLayoutedEdges(edges);
    }
  }, [data]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onCloseSidebar = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex h-screen w-screen bg-bg-canvas text-text-primary font-ui overflow-hidden">

      {/* Main Canvas Area */}
      <main className="flex-1 relative h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-text-secondary">
            Loading Structure...
          </div>
        ) : (
          <GraphCanvas
            initialNodes={layoutedNodes}
            initialEdges={layoutedEdges}
            onNodeClick={onNodeClick}
          />
        )}

        {/* Discovery Bar Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[400px] h-12 bg-bg-panel border border-border-color rounded-lg shadow-lg flex items-center px-4 z-50">
          <span className="text-text-secondary text-sm">Search organizations, people, positions...</span>
        </div>
      </main>

      {/* Side Panel */}
      <SidebarPanel selectedNode={selectedNode} onClose={onCloseSidebar} />

    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrgChartApp />
    </QueryClientProvider>
  )
}

export default App

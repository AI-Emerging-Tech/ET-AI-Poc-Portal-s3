'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, 
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Node,
  Edge,
  BackgroundVariant,
  NodeToolbar,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { 
    id: 'embed', 
    data: { 
      label: 'Embedding',
      description: 'Creating vector embeddings for source code analysis' 
    }, 
    position: { x: 50, y: 50 } 
  },
  { 
    id: 'initialize', 
    data: { 
      label: 'Initialize',
      description: 'Setting up the migration environment' 
    }, 
    position: { x: 50, y: 150 } 
  },
  { 
    id: 'analyze', 
    data: { 
      label: 'Analyze',
      description: 'Analyzing source code structure and dependencies' 
    }, 
    position: { x: 275, y: 100 } 
  },
  { 
    id: 'document', 
    data: { 
      label: 'Document',
      description: 'Documenting code patterns and architecture' 
    }, 
    position: { x: 475, y: 100 } 
  },
  { 
    id: 'human_review_analysis', 
    data: { 
      label: 'Human Review Analysis',
      description: 'Human verification of the analysis' 
    }, 
    position: { x: 375, y: -50 } 
  },
  { 
    id: 'plan', 
    data: { 
      label: 'Plan',
      description: 'Planning migration strategy and steps' 
    }, 
    position: { x: 675, y: 100 } 
  },
  { 
    id: 'human_review_plan', 
    data: { 
      label: 'Human Review Plan',
      description: 'Human verification of the migration plan' 
    }, 
    position: { x: 775, y: 250 } 
  },
  { 
    id: 'execute', 
    data: { 
      label: 'Execute',
      description: 'Executing the code migration' 
    }, 
    position: { x: 875, y: 100 } 
  },
  { 
    id: 'refactor', 
    data: { 
      label: 'Refactor',
      description: 'Refactoring generated code to follow best practices' 
    }, 
    position: { x: 1075, y: 100 } 
  },
  { 
    id: 'human_review_implementation', 
    data: { 
      label: 'Human Review Implementation',
      description: 'Human verification of the migrated code' 
    }, 
    position: { x: 1075, y: -50 } 
  },
  { 
    id: 'test', 
    data: { 
      label: 'Test',
      description: 'Testing the migrated codebase' 
    }, 
    position: { x: 1275, y: 100 } 
  },
  // { 
  //   id: 'integrate', 
  //   data: { 
  //     label: 'Integrate',
  //     description: 'Integrating the migrated code' 
  //   }, 
  //   position: { x: 1100, y: 100 } 
  // },
  { 
    id: 'finalize', 
    data: { 
      label: 'Finalize',
      description: 'Finalizing the migration' 
    }, 
    position: { x: 1475, y: 100 } 
  },
];

const initialEdges = [
  { 
    id: 'embed-analyze', 
    source: 'embed', 
    target: 'analyze', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'initialize-analyze', 
    source: 'initialize', 
    target: 'analyze', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'analyze-document', 
    source: 'analyze', 
    target: 'document', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'human_review_analysis-analyze', 
    source: 'human_review_analysis', 
    target: 'analyze', 
    sourceHandle: 'left',
    targetHandle: 'top',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'refine',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'document-human_review_analysis', 
    source: 'document', 
    target: 'human_review_analysis', 
    sourceHandle: 'topSource',
    targetHandle: 'bottom',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'human_review_analysis-plan', 
    source: 'human_review_analysis', 
    target: 'plan', 
    sourceHandle: 'right',
    targetHandle: 'top',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'approved',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'human_review_plan-plan', 
    source: 'human_review_plan', 
    target: 'plan', 
    sourceHandle: 'left',
    targetHandle: 'bottom',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'refine',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'plan-human_review_plan', 
    source: 'plan', 
    target: 'human_review_plan', 
    sourceHandle: 'right',
    targetHandle: 'top',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'human_review_plan-execute', 
    source: 'human_review_plan', 
    target: 'execute', 
    sourceHandle: 'right',
    targetHandle: 'bottom',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'approved',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'execute-refactor', 
    source: 'execute', 
    target: 'refactor', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'refactor-human_review_implementation', 
    source: 'refactor', 
    target: 'human_review_implementation', 
    sourceHandle: 'topSource',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'human_review_implementation-refactor', 
    source: 'human_review_implementation', 
    target: 'refactor', 
    sourceHandle: 'bottomSource',
    targetHandle: 'right',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'refine',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'human_review_implementation-test', 
    source: 'human_review_implementation', 
    target: 'test', 
    sourceHandle: 'right',
    targetHandle: 'top',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    label: 'approved',
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelStyle: { fill: '#666', fontWeight: 500, fontSize: 12 }
  },
  { 
    id: 'test-finalize', 
    source: 'test', 
    target: 'finalize', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'integrate-finalize', 
    source: 'integrate', 
    target: 'finalize', 
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  },
];

// Custom node component to handle active, completed, paused states
function CustomNode({ data, isConnectable, selected }: any) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Handle style for better visualization
  const handleStyle = { 
    width: 8, 
    height: 8, 
    background: '#555', 
    opacity: 0.7
  };
  
  return (
    <>
      <NodeToolbar 
        isVisible={showTooltip} 
        position={Position.Top}
        className="bg-white p-2 rounded shadow-md border text-sm text-gray-700"
      >
        {data.description}
      </NodeToolbar>
      
      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, top: '50%' }}
        isConnectable={isConnectable}
      />
      
      {/* Right handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, top: '50%' }}
        isConnectable={isConnectable}
      />
      
      {/* Top handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="topSource"
        style={{ ...handleStyle, left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, left: '50%' }}
        isConnectable={isConnectable}
      />
      
      {/* Bottom handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottomSource"
        style={{ ...handleStyle, left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, left: '50%' }}
        isConnectable={isConnectable}
      />
      
      <div 
        className={`p-3 rounded-md border shadow-sm text-center transition-all duration-200 ${
          selected ? 'ring-2 ring-blue-400 shadow-md' : ''
        } ${
          data.status === 'active' ? 'bg-blue-100 border-blue-500 font-semibold' : 
          data.status === 'completed' ? 'bg-green-100 border-green-500' : 
          data.status === 'paused' ? 'bg-yellow-100 border-yellow-500' : 
          'bg-white border-gray-300'
        }`}
        style={{ 
          minWidth: 120,
          minHeight: 40,
          fontSize: '0.9rem'
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div>
          <span className="text-gray-700">
            {data.label}
          </span>
          {data.status === 'active' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </>
  );
}

// Define the node types
const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowGraphProps {
  currentPhase: string;
  endPhase: string;
}

// Custom CSS for React Flow
const flowStyles = {
  background: '#f8fafc',
  width: '100%',
  height: 500,
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem'
};

export default function WorkflowGraph({ currentPhase, endPhase }: WorkflowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  // Parse comma-separated phases
  const activePhases = useMemo(() => {
    return currentPhase ? currentPhase.split(',').map(phase => phase.trim()) : [];
  }, [currentPhase]);
  
  const workflowOrder = useMemo(() => 
    ['embed', 'initialize', 'analyze', 'document', 'human_review_analysis', 'plan', 'human_review_plan', 'execute', 'refactor', 'test', 'integrate', 'finalize', "completed"]
  , []);

  // Get node status (active, completed, paused)
  const getNodeStatus = useCallback((nodeId: string) => {
    if (!currentPhase) return '';
    if (activePhases.includes(nodeId)) return 'active';
    // For multiple phases, use the furthest one in the workflow for completion check
    const activeWorkflowPhases = activePhases.filter(phase => workflowOrder.includes(phase));
    const furthestPhaseIndex = activeWorkflowPhases.length > 0 
      ? Math.max(...activeWorkflowPhases.map(phase => workflowOrder.indexOf(phase)))
      : -1;
    
    const nodeIndex = workflowOrder.indexOf(nodeId);

    // If node is before current in the workflow, it's completed
    if (furthestPhaseIndex > -1 && nodeIndex > -1 && nodeIndex < furthestPhaseIndex) {
      return 'completed';
    }
    
    // Handle human review special cases
    if (activePhases.includes('human_review_analysis') && nodeId === 'analyze') {
      return 'paused';
    }
    if (activePhases.includes('human_review_plan') && nodeId === 'plan') {
      return 'paused';
    }
    if (activePhases.includes('human_review_implementation') && nodeId === 'refactor') {
      return 'paused';
    }
    
    return '';
  }, [currentPhase, activePhases, workflowOrder]);
  
  // Get edge status (active, completed)
  const getEdgeStatus = useCallback((source: string, target: string) => {
    if (!currentPhase) return '';
    if (currentPhase === 'completed') {
      return 'completed';
    }
    // Find the index of the nodes in the workflow
    const fromIndex = workflowOrder.indexOf(source);
    const toIndex = workflowOrder.indexOf(target);
    
    // For multiple active phases, use the furthest one in the workflow for completion check
    const activeWorkflowPhases = activePhases.filter(phase => workflowOrder.includes(phase));
    const furthestPhaseIndex = activeWorkflowPhases.length > 0 
      ? Math.max(...activeWorkflowPhases.map(phase => workflowOrder.indexOf(phase)))
      : -1;
    
    // Edge is active if it's connecting to one of the current phases
    if (activePhases.includes(target)) return 'active';
    
    // Handle special cases for human review phases
    if (source === 'document' && target === 'human_review_analysis' && activePhases.includes('human_review_analysis')) {
      return 'active';
    }
    if (source === 'plan' && target === 'human_review_plan' && activePhases.includes('human_review_plan')) {
      return 'active';
    }
    if (source === 'refactor' && target === 'human_review_implementation' && activePhases.includes('human_review_implementation')) {
      return 'active';
    }
    if (source.startsWith('human_review_')) {
      const reviewPhase = source.replace('human_review_', '');
      // if (lastPhase === reviewPhase && activePhases.includes(reviewPhase)) {
      //   return 'active';
      // }
    }
    
    // Edge is completed if both nodes are before the furthest active phase
    if (fromIndex > -1 && toIndex > -1 && furthestPhaseIndex > -1 && 
        fromIndex < furthestPhaseIndex && toIndex < furthestPhaseIndex) {
      return 'completed';
    }
    
    return '';
  }, [currentPhase, activePhases, workflowOrder]);

  // Process nodes and edges based on current phase - only once on mount and when dependencies change
  useEffect(() => {
    // Update nodes with status
    const updatedNodes = initialNodes.map(node => ({
      ...node,
      type: 'custom', // Use custom node for all nodes
      data: {
        ...node.data,
        status: getNodeStatus(node.id)
      }
    }));
    const lastNodeIndex = updatedNodes.findIndex(node => node.id === endPhase);
    
    // Update edges with status
    const updatedEdges = initialEdges.map(edge => {
      const status = getEdgeStatus(edge.source, edge.target);
      return {
        ...edge,
        animated: status === 'active',
        style: {
          stroke: status === 'active' ? '#3b82f6' : 
                 status === 'completed' ? '#10b981' : 
                 '#d1d5db',
          strokeWidth: status === 'active' ? 3 : 
                      status === 'completed' ? 2 : 1.5,
        },
        labelBgStyle: {
          fill: status === 'active' ? '#dbeafe' : 
                status === 'completed' ? '#dcfce7' : 
                '#f3f4f6',
          fillOpacity: 0.9
        }
      };
    });

    setNodes(updatedNodes.slice(0, lastNodeIndex + 1));
    setEdges(updatedEdges);
    
  }, [currentPhase, getNodeStatus, getEdgeStatus, endPhase]); // Only depend on things that should trigger a re-render

  // Focus on current phase when it changes - separately from node/edge updates
  const centerViewOnCurrentPhase = useCallback(() => {
    if (currentPhase && reactFlowInstance && nodes.length > 0) {
      // If multiple phases, center on the first one
      const phaseToCenter = activePhases[0];
      const currentNode = nodes.find(node => node.id === phaseToCenter);
      
      if (currentNode) {
        // Center view on current node
        reactFlowInstance.setCenter(
          currentNode.position.x + 100, 
          currentNode.position.y + 50, 
          { duration: 800 }
        );
      }
    }
  }, [nodes, reactFlowInstance, currentPhase, activePhases]);

  // Only call centerViewOnCurrentPhase when dependencies change
  useEffect(() => {
    if (nodes.length > 0) {
      centerViewOnCurrentPhase();
    }
  }, [centerViewOnCurrentPhase, nodes.length]);

  const getCurrentNodeDescription = useCallback(() => {
    if (!currentPhase) return null;
    
    // For multiple phases, show the first one
    const primaryPhase = activePhases[0];
    const node = initialNodes.find(n => n.id === primaryPhase);
    if (!node) return null;
    
    // If there are multiple active phases, indicate this
    const hasMultiplePhases = activePhases.length > 1;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
        <h4 className="font-semibold text-blue-800">
          Current Phase: {node.data.label}
          {hasMultiplePhases && <span className="text-sm font-normal ml-2">(+ {activePhases.length - 1} parallel phases)</span>}
        </h4>
        <p className="text-sm text-blue-700">{node.data.description}</p>
      </div>
    );
  }, [currentPhase, activePhases]);

  // Memoize the ReactFlow component to prevent unnecessary re-renders
  const reactFlowComponent = useMemo(() => (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      colorMode={'dark'}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onInit={setReactFlowInstance}
      fitView
      attributionPosition='top-right'
      nodesConnectable={false}
      nodesDraggable={false}
    >
      <Controls />
      <MiniMap 
        nodeStrokeWidth={3}
        nodeColor={(node) => {
          if (node.data?.status === 'active') return '#3b82f6';
          if (node.data?.status === 'completed') return '#10b981';
          if (node.data?.status === 'paused') return '#eab308';
          return '#d1d5db';
        }}
      />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  ), [nodes, edges, onNodesChange, onEdgesChange]);

  return (
    <div className="workflow-graph">
      {/* Current phase description */}
      {getCurrentNodeDescription()}
      
      {/* React Flow component */}
      <div style={flowStyles}>
        {reactFlowComponent}
      </div>
    </div>
  );
}

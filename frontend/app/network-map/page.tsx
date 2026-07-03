"use client";
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  Node as FlowNode,
  Edge as FlowEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network,
  Server,
  Router as RouterIcon,
  Activity,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Search,
  Wifi,
} from "lucide-react";
import { networkApi } from "@/lib/api";

type NodeType = "core" | "distribution" | "access" | "server" | "router" | "firewall" | "wireless";

interface DeviceNode {
  id: string;
  label: string;
  type: NodeType;
  ip?: string;
  status: "up" | "down";
  organization?: string;
  x?: number;
  y?: number;
}

interface DeviceLink {
  source: string;
  target: string;
  status: "up" | "down";
  utilization?: number;
}

// 1. Custom Node Component
const CustomNetworkNode = memo(({ data }: { data: any }) => {
  const isDown = data.status === "down";
  const isSelected = data.selected;

  let colorClass = "bg-slate-500 fill-slate-500 text-slate-500 border-slate-500";
  if (isDown) colorClass = "bg-rose-600 fill-rose-600 text-rose-600 border-rose-500";
  else if (data.type === "core") colorClass = "bg-blue-600 fill-blue-600 text-blue-600 border-blue-500";
  else if (data.type === "router") colorClass = "bg-indigo-600 fill-indigo-600 text-indigo-600 border-indigo-500";
  else if (data.type === "distribution") colorClass = "bg-purple-600 fill-purple-600 text-purple-600 border-purple-500";
  else if (data.type === "firewall") colorClass = "bg-rose-500 fill-rose-500 text-rose-500 border-rose-500";
  else if (data.type === "wireless") colorClass = "bg-amber-500 fill-amber-500 text-amber-500 border-amber-500";
  else if (data.type === "server") colorClass = "bg-teal-600 fill-teal-600 text-teal-600 border-teal-500";
  else colorClass = "bg-sky-500 fill-sky-500 text-sky-500 border-sky-500";

  const iconMap: Record<string, React.ReactNode> = {
    core: <RouterIcon className="w-5 h-5 text-white" />,
    router: <RouterIcon className="w-4 h-4 text-white" />,
    distribution: <Network className="w-4 h-4 text-white" />,
    firewall: <ShieldCheck className="w-3.5 h-3.5 text-white" />,
    wireless: <Wifi className="w-3.5 h-3.5 text-white" />,
    server: <Server className="w-3.5 h-3.5 text-white" />,
    access: <Network className="w-3.5 h-3.5 text-white" />,
  };

  return (
    <div className="relative flex flex-col items-center group">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Node Circle */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-slate-950 transition-all duration-300 shadow-lg
          ${isDown ? "border-rose-500 shadow-rose-950/40" : "border-slate-800 hover:border-slate-600"}
          ${isSelected ? "ring-4 ring-blue-500/50 scale-105" : ""}
        `}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClass.split(" ")[0]} border border-white/20`}>
          {iconMap[data.type] || <Network className="w-3.5 h-3.5 text-white" />}
        </div>

        {/* Pulse effect if Down */}
        {isDown && (
          <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-70 pointer-events-none" />
        )}
      </div>

      {/* Expanded/Collapsed Badge */}
      {data.type === "distribution" && (
        <span
          className={`absolute top-0 right-0 w-4 h-4 rounded-full border border-slate-950 flex items-center justify-center text-[9px] font-black text-white shadow-md select-none pointer-events-none
            ${data.isExpanded ? "bg-amber-500" : "bg-blue-500"}
          `}
        >
          {data.isExpanded ? "−" : "+"}
        </span>
      )}

      {/* Label Text */}
      <div className="mt-2 text-center max-w-[130px] pointer-events-none select-none">
        <p className="text-[10px] font-black text-slate-200 group-hover:text-white truncate drop-shadow-md">
          {data.type === "distribution" && data.organization
            ? data.organization.replace("คณะ", "")
            : data.label.split(".")[0]}
        </p>
        {data.ip && (
          <p className="text-[8px] text-slate-500 font-mono mt-0.5 truncate">{data.ip}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});
CustomNetworkNode.displayName = "CustomNetworkNode";

const nodeTypes = {
  customNode: CustomNetworkNode,
};

// 2. Inner Component with React Flow Context access
function NetworkTopologyFlow() {
  const router = useRouter();
  const { zoomIn, zoomOut, setViewport } = useReactFlow();

  const [rawNodes, setRawNodes] = useState<DeviceNode[]>([]);
  const [rawLinks, setRawLinks] = useState<DeviceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<DeviceNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "up" | "down">("all");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "org">("none");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  // Compute node coordinates using concentric tree layout
  const computeCoordinates = useCallback((devices: DeviceNode[], links: DeviceLink[], expanded: Set<string>, orgFilter: string) => {
    const cx = 600;
    const cy = 400;

    // Filter node visibility
    const isNodeVisible = (node: DeviceNode): boolean => {
      if (orgFilter !== "all") {
        if (node.type === "core") return true;
        if (node.organization !== orgFilter) return false;
      }
      if (node.type === "core" || node.type === "distribution") return true;

      // Find connection to parent
      const parentLink = links.find((l) => l.target === node.id);
      if (!parentLink) return true;

      const parentNode = devices.find((n) => n.id === parentLink.source);
      if (parentNode && parentNode.type === "distribution") {
        return expanded.has(parentNode.id);
      }
      return true;
    };

    // Calculate layout coordinates
    const coreNodes = devices.filter((n) => n.type === "core");
    const distNodes = devices.filter((n) => n.type === "distribution" && isNodeVisible(n));
    const accessNodes = devices.filter((n) => (n.type === "access" || n.type === "server" || n.type === "router" || n.type === "firewall" || n.type === "wireless") && isNodeVisible(n));

    // 1. Core Nodes
    coreNodes.forEach((node, i) => {
      if (coreNodes.length === 1) {
        node.x = cx;
        node.y = cy;
      } else {
        const offset = 80;
        const angle = (i * 2 * Math.PI) / coreNodes.length;
        node.x = cx + Math.cos(angle) * offset;
        node.y = cy + Math.sin(angle) * offset;
      }
    });

    // 2. Distribution Nodes
    const distRadius = 260;
    distNodes.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / distNodes.length;
      node.x = cx + Math.cos(angle) * distRadius;
      node.y = cy + Math.sin(angle) * distRadius;
    });

    // 3. Position Access Nodes grouped by parent
    const parentMap = new Map<string, DeviceNode[]>();
    links.forEach((link) => {
      const parent = devices.find((n) => n.id === link.source);
      const child = devices.find((n) => n.id === link.target && isNodeVisible(n));
      if (parent && child && (parent.type === "distribution" || parent.type === "core")) {
        const list = parentMap.get(parent.id) ?? [];
        list.push(child);
        parentMap.set(parent.id, list);
      }
    });

    parentMap.forEach((children, parentId) => {
      const parent = devices.find((n) => n.id === parentId);
      if (!parent || parent.x === undefined || parent.y === undefined) return;

      const parentAngle = Math.atan2(parent.y - cy, parent.x - cx);
      const childRadiusOffset = 130;

      children.forEach((child, i) => {
        const arcWidth = Math.PI / 2.5; // Wider spread (about 72 degrees)
        const startAngle = parentAngle - arcWidth / 2;
        const angleStep = children.length > 1 ? arcWidth / (children.length - 1) : 0;
        const childAngle = startAngle + i * angleStep;

        // Stagger access nodes to prevent overlapping in dense groups
        const staggerOffset = i % 2 === 0 ? 0 : 55;
        const dynamicOffset = childRadiusOffset + staggerOffset;

        child.x = parent.x! + Math.cos(childAngle) * dynamicOffset;
        child.y = parent.y! + Math.sin(childAngle) * dynamicOffset;
      });
    });

    // Handle generic access nodes (connected directly to core)
    const genericAccess = accessNodes.filter(
      (n) => !links.some((l) => l.target === n.id && devices.some((pn) => pn.id === l.source && pn.type === "distribution"))
    );
    
    // Distribute unassigned generic nodes across multiple concentric rings to avoid overlap
    const genericCount = genericAccess.length;
    let placedNodes = 0;
    let ringIndex = 0;

    while (placedNodes < genericCount) {
      // Start rings at radius 260, expanding outwards by 100px per ring
      const radius = 260 + ringIndex * 100;
      
      // Calculate how many nodes can fit in this ring assuming each needs ~70px of arc length
      const maxNodesInThisRing = Math.floor((2 * Math.PI * radius) / 70) || 1;
      
      const nodesToPlace = Math.min(maxNodesInThisRing, genericCount - placedNodes);
      
      for (let i = 0; i < nodesToPlace; i++) {
        const node = genericAccess[placedNodes + i];
        // Stagger each ring slightly to avoid straight lines
        const staggerAngle = (ringIndex % 2 === 0) ? 0 : (Math.PI / nodesToPlace);
        const angle = (i * 2 * Math.PI) / nodesToPlace + staggerAngle;
        
        node.x = cx + Math.cos(angle) * radius;
        node.y = cy + Math.sin(angle) * radius;
      }
      
      placedNodes += nodesToPlace;
      ringIndex++;
    }

    // Generate React Flow Nodes
    const flowNodes: FlowNode[] = devices
      .filter(isNodeVisible)
      .map((node) => ({
        id: node.id,
        type: "customNode",
        position: { x: node.x ?? cx, y: node.y ?? cy },
        data: {
          label: node.label,
          type: node.type,
          ip: node.ip,
          status: node.status,
          organization: node.organization,
          isExpanded: expanded.has(node.id),
        },
      }));

    // Generate React Flow Edges
    const flowEdges: FlowEdge[] = links
      .filter((link) => {
        const sourceNode = devices.find((n) => n.id === link.source);
        const targetNode = devices.find((n) => n.id === link.target);
        return sourceNode && targetNode && isNodeVisible(sourceNode) && isNodeVisible(targetNode);
      })
      .map((link) => {
        const isDown = link.status === "down";
        const utilization = link.utilization ?? 0;

        // Bandwidth utilization colors (Weathermap style)
        let strokeColor = "#475569"; // Under 10% (Grey)
        if (isDown) {
          strokeColor = "#ef4444"; // Red for Down links
        } else if (utilization >= 80) {
          strokeColor = "#f43f5e"; // Pinkish Red (Over 80%)
        } else if (utilization >= 50) {
          strokeColor = "#f59e0b"; // Orange/Yellow (50-80%)
        } else if (utilization >= 10) {
          strokeColor = "#10b981"; // Green (10-50%)
        }

        return {
          id: `edge-${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          animated: !isDown && utilization > 10,
          style: {
            stroke: strokeColor,
            strokeWidth: isDown ? 2.5 : (utilization >= 80 ? 3 : (utilization >= 50 ? 2 : 1.5)),
          },
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  // Load live data from topology API
  const loadTopology = useCallback(() => {
    setLoading(true);
    setError(false);
    networkApi
      .getTopology()
      .then((r) => {
        if (r.success && r.data) {
          setRawNodes(r.data.nodes);
          setRawLinks(r.data.links);
          computeCoordinates(r.data.nodes, r.data.links, expandedNodes, selectedOrgFilter);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [computeCoordinates, expandedNodes, selectedOrgFilter]);

  useEffect(() => {
    loadTopology();
  }, []);

  // Update layout when expansion state or organization filter changes
  useEffect(() => {
    if (rawNodes.length > 0) {
      computeCoordinates(rawNodes, rawLinks, expandedNodes, selectedOrgFilter);
    }
  }, [expandedNodes, selectedOrgFilter, rawNodes, rawLinks, computeCoordinates]);

  // Automatic expansion of filtered organization
  useEffect(() => {
    if (selectedOrgFilter !== "all") {
      const targetNode = rawNodes.find(
        (n) => n.type === "distribution" && n.organization === selectedOrgFilter
      );
      if (targetNode) {
        setExpandedNodes(new Set([targetNode.id]));
      }
    }
  }, [selectedOrgFilter, rawNodes]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, flowNode: FlowNode) => {
      const match = rawNodes.find((n) => n.id === flowNode.id);
      if (match) {
        setSelectedNode(match);
        if (match.type === "distribution") {
          toggleNodeExpansion(match.id);
        }
      }
    },
    [rawNodes]
  );

  const resetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 400 });
  };

  const organizations = Array.from(
    new Set(rawNodes.map((n) => n.organization).filter(Boolean))
  ) as string[];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Network Map Main Window */}
      <div className="flex-1 card p-0 flex flex-col relative overflow-hidden bg-slate-900 border border-slate-800">
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
          <button
            onClick={() => zoomIn({ duration: 300 })}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomOut({ duration: 300 })}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all text-xs font-bold"
            title="Reset View"
          >
            Reset
          </button>
          <button
            onClick={loadTopology}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Faculty Filter Dropdown */}
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">
              ทุกคณะ/หน่วยงานทั้งหมด
            </option>
            {organizations.sort().map((org) => (
              <option key={org} value={org} className="bg-slate-900 text-slate-200">
                {org}
              </option>
            ))}
          </select>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl text-xs text-slate-300 space-y-2 backdrop-blur max-w-xs shadow-xl pointer-events-auto">
          <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5 border-b border-slate-700 pb-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> แผนผังเครือข่ายระดับโครงสร้าง
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <RouterIcon className="w-3.5 h-3.5 text-blue-500" /> Core Router
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-purple-500" /> Dist Switch
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-sky-500" /> Access Switch
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-teal-500" /> Server Node
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Firewall
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-amber-500" /> Wireless WLC
            </div>
          </div>
          <div className="border-t border-slate-700/80 pt-2 flex justify-between gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>ออนไลน์ (Up)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block" />
              <span>ขัดข้อง (Down)</span>
            </div>
          </div>
          
          <div className="border-t border-slate-700/80 pt-2 space-y-1">
            <p className="font-bold text-[10px] text-slate-400">อัตราการใช้งานลิงก์ (Weathermap)</p>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500 inline-block" /> สูงมาก (&gt;80%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block" /> ปานกลาง (50-80%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> ต่ำ (10-50%)</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-500 inline-block" /> ไม่มีโหลด (&lt;10%)</div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-1">
            คลิกที่โหนดคณะเพื่อกาง/หุบสวิตช์ย่อยออกได้
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-semibold animate-pulse">
              กำลังโหลดแผนผังเครือข่าย...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
            <div className="text-center">
              <p className="text-slate-200 font-extrabold">ดึงข้อมูลเครือข่ายล้มเหลว</p>
              <p className="text-slate-500 text-xs mt-1">
                กรุณาลองใหม่อีกครั้ง หรือตรวจสอบสิทธิ์การเข้าถึง LibreNMS API
              </p>
            </div>
            <button
              onClick={loadTopology}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              โหลดอีกครั้ง
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2.5}
            >
              <Background color="#334155" gap={16} size={1} />
              <MiniMap
                bgColor="#0f172a"
                nodeColor={(node) => {
                  if (node.data?.status === "down") return "#ef4444";
                  if (node.data?.type === "core") return "#2563eb";
                  if (node.data?.type === "distribution") return "#8b5cf6";
                  return "#475569";
                }}
                maskColor="rgba(15, 23, 42, 0.6)"
                style={{ height: 100, width: 150 }}
              />
            </ReactFlow>
          </div>
        )}
      </div>

      {/* Side Detail Inspector Panel */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="card p-5 flex flex-col flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {selectedNode ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Back to List Button */}
              <button
                onClick={() => setSelectedNode(null)}
                className="mb-4 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                &larr; กลับไปหน้ารายการ
              </button>

              {/* Panel Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 break-all pr-2">
                    {selectedNode.label}
                  </h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
                    {selectedNode.type} Node
                  </span>
                </div>
              </div>

              {/* Status Section */}
              <div
                className={`p-4 rounded-xl border mb-5 flex items-center justify-between ${
                  selectedNode.status === "up"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full animate-ping ${
                      selectedNode.status === "up" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="font-bold text-xs uppercase">สถานะอุปกรณ์</span>
                </div>
                <span className="font-mono text-sm font-extrabold uppercase">
                  {selectedNode.status === "up" ? "ONLINE" : "DOWN / ERROR"}
                </span>
              </div>

              {/* Node Specifications */}
              <div className="space-y-3 text-xs flex-1">
                {selectedNode.ip && (
                  <div>
                    <span className="text-slate-400 block font-semibold">IP Address</span>
                    <span className="text-slate-700 dark:text-slate-200 font-mono font-bold text-sm">
                      {selectedNode.ip}
                    </span>
                  </div>
                )}
                {selectedNode.organization && (
                  <div>
                    <span className="text-slate-400 block font-semibold">หน่วยงานที่สังกัด</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">
                      {selectedNode.organization}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-semibold">
                    ระดับชั้นโครงสร้าง (Layer)
                  </span>
                  <span className="text-slate-700 dark:text-slate-200 capitalize font-bold">
                    {selectedNode.type === "core" && "แกนหลัก (Core Layer)"}
                    {selectedNode.type === "distribution" && "กระจายสัญญาณ (Distribution)"}
                    {selectedNode.type === "access" && "ปลายทางเข้าถึง (Access Layer)"}
                  </span>
                </div>
              </div>

              {/* Action */}
              {selectedNode.organization && (
                <button
                  onClick={() => router.push(`/organizations`)}
                  className="w-full mt-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all"
                >
                  <span>ดูคะแนนความปลอดภัยของคณะ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-blue-500" />
                รายการอุปกรณ์ ({rawNodes.length})
              </h3>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่ออุปกรณ์ หรือ IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-3 text-xs font-bold text-center">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`py-1.5 rounded-lg transition-colors ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setStatusFilter("up")}
                  className={`py-1.5 rounded-lg transition-colors ${
                    statusFilter === "up" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setStatusFilter("down")}
                  className={`py-1.5 rounded-lg transition-colors ${
                    statusFilter === "down" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Offline
                </button>
              </div>

              {/* Grouping Selection */}
              <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-slate-400">
                <span>จัดกลุ่มตาม:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setGroupBy("none")}
                    className={`px-2 py-0.5 rounded transition-all ${
                      groupBy === "none"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ไม่มี
                  </button>
                  <button
                    onClick={() => setGroupBy("type")}
                    className={`px-2 py-0.5 rounded transition-all ${
                      groupBy === "type"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ประเภท
                  </button>
                  <button
                    onClick={() => setGroupBy("org")}
                    className={`px-2 py-0.5 rounded transition-all ${
                      groupBy === "org"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    หน่วยงาน
                  </button>
                </div>
              </div>

              {/* Scrollable Device List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const filtered = rawNodes.filter((n) => {
                    const matchesSearch =
                      n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (n.ip ?? "").includes(searchTerm);
                    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        ไม่พบอุปกรณ์ที่ตรงตามเงื่อนไข
                      </div>
                    );
                  }

                  const renderItem = (n: DeviceNode) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {n.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {n.ip ?? "No IP"}
                        </p>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          n.status === "up" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                    </div>
                  );

                  if (groupBy === "type") {
                    const coreNodes = filtered.filter((n) => n.type === "core");
                    const distNodes = filtered.filter((n) => n.type === "distribution");
                    const accessNodes = filtered.filter(
                      (n) => n.type === "access" || n.type === "server"
                    );

                    return (
                      <div className="space-y-4">
                        {coreNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-blue-500 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">
                              Core Layer ({coreNodes.length})
                            </h4>
                            <div className="space-y-2">{coreNodes.map(renderItem)}</div>
                          </div>
                        )}
                        {distNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-purple-500 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">
                              Distribution Layer ({distNodes.length})
                            </h4>
                            <div className="space-y-2">{distNodes.map(renderItem)}</div>
                          </div>
                        )}
                        {accessNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-teal-500 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">
                              Access Layer ({accessNodes.length})
                            </h4>
                            <div className="space-y-2">{accessNodes.map(renderItem)}</div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (groupBy === "org") {
                    const orgGroups = new Map<string, DeviceNode[]>();
                    filtered.forEach((n) => {
                      const key = n.organization ?? "ไม่ระบุสังกัด (Unassigned)";
                      const list = orgGroups.get(key) ?? [];
                      list.push(n);
                      orgGroups.set(key, list);
                    });

                    return (
                      <div className="space-y-4">
                        {Array.from(orgGroups.entries())
                          .sort((a, b) => {
                            if (a[0].includes("ไม่ระบุ")) return 1;
                            if (b[0].includes("ไม่ระบุ")) return -1;
                            return a[0].localeCompare(b[0]);
                          })
                          .map(([org, items]) => (
                            <div key={org}>
                              <h4 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2 flex justify-between">
                                <span>{org}</span>
                                <span className="font-mono text-slate-400">({items.length})</span>
                              </h4>
                              <div className="space-y-2">{items.map(renderItem)}</div>
                            </div>
                          ))}
                      </div>
                    );
                  }

                  return filtered.map(renderItem);
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap with ReactFlowProvider to enable useReactFlow hooks
export default function NetworkMapPage() {
  return (
    <ReactFlowProvider>
      <NetworkTopologyFlow />
    </ReactFlowProvider>
  );
}

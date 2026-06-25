"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Network, Server, Router, HelpCircle, Activity, ZoomIn, ZoomOut, RefreshCw, AlertTriangle, ShieldCheck, ChevronRight, X, Search } from "lucide-react";
import { networkApi } from "@/lib/api";

type NodeType = "core" | "distribution" | "access" | "server";

interface Node {
  id: string;
  label: string;
  type: NodeType;
  ip?: string;
  status: "up" | "down";
  organization?: string;
  // Computed coordinates for rendering
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  status: "up" | "down";
}

export default function NetworkMapPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "up" | "down">("all");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "org">("none");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");

  // SVG Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const loadTopology = () => {
    setLoading(true);
    setError(false);
    networkApi.getTopology()
      .then((r) => {
        if (r.success && r.data) {
          computeCoordinates(r.data.nodes, r.data.links);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTopology();
  }, []);

  // Compute node coordinates dynamically using a concentric tree layout
  const computeCoordinates = (rawNodes: Node[], rawLinks: Link[]) => {
    const width = 1200;
    const height = 800;
    const cx = width / 2;
    const cy = height / 2;

    const coreNodes = rawNodes.filter((n) => n.type === "core");
    const distNodes = rawNodes.filter((n) => n.type === "distribution");
    const accessNodes = rawNodes.filter((n) => n.type === "access" || n.type === "server");

    // 1. Position Core Nodes in the absolute center
    coreNodes.forEach((node, i) => {
      if (coreNodes.length === 1) {
        node.x = cx;
        node.y = cy;
      } else {
        const offset = 60;
        const angle = (i * 2 * Math.PI) / coreNodes.length;
        node.x = cx + Math.cos(angle) * offset;
        node.y = cy + Math.sin(angle) * offset;
      }
    });

    // 2. Position Distribution (Faculty) Nodes in a circle around the center
    const distRadius = 220;
    distNodes.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / distNodes.length;
      node.x = cx + Math.cos(angle) * distRadius;
      node.y = cy + Math.sin(angle) * distRadius;
    });

    // 3. Position Access Nodes near their respective parent Distribution Nodes
    // Group access nodes by their parent node
    const parentMap = new Map<string, Node[]>();
    rawLinks.forEach((link) => {
      const parent = rawNodes.find((n) => n.id === link.source);
      const child = rawNodes.find((n) => n.id === link.target);
      if (parent && child && (parent.type === "distribution" || parent.type === "core") && (child.type === "access" || child.type === "server")) {
        const list = parentMap.get(parent.id) ?? [];
        list.push(child);
        parentMap.set(parent.id, list);
      }
    });

    parentMap.forEach((children, parentId) => {
      const parent = rawNodes.find((n) => n.id === parentId);
      if (!parent || parent.x === undefined || parent.y === undefined) return;

      // Find the angle of the parent from center
      const parentAngle = Math.atan2(parent.y - cy, parent.x - cx);
      const childRadiusOffset = 110;

      children.forEach((child, i) => {
        // Distribute children in a small fan arc extending outwards from parent
        const arcWidth = Math.PI / 4; // 45 degree spread
        const startAngle = parentAngle - arcWidth / 2;
        const angleStep = children.length > 1 ? arcWidth / (children.length - 1) : 0;
        const childAngle = startAngle + i * angleStep;

        child.x = parent.x! + Math.cos(childAngle) * childRadiusOffset;
        child.y = parent.y! + Math.sin(childAngle) * childRadiusOffset;
      });
    });

    // Handle generic access nodes (connected directly to core)
    const genericAccess = accessNodes.filter((n) => !rawLinks.some((l) => l.target === n.id && rawNodes.find((pn) => pn.id === l.source && pn.type === "distribution")));
    const genericRadius = 380;
    genericAccess.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / (genericAccess.length || 1) + Math.PI / 8;
      node.x = cx + Math.cos(angle) * genericRadius;
      node.y = cy + Math.sin(angle) * genericRadius;
    });

    setNodes(rawNodes);
    setLinks(rawLinks);
  };

  // Zoom & Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoom = (factor: number) => {
    setScale((prev) => Math.max(0.4, Math.min(3, prev * factor)));
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Toggle node children expansion
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

  // Automatically expand the selected faculty's node when filtered
  useEffect(() => {
    if (selectedOrgFilter !== "all") {
      const targetNode = nodes.find(n => n.type === "distribution" && n.organization === selectedOrgFilter);
      if (targetNode) {
        setExpandedNodes(new Set([targetNode.id]));
      }
    }
  }, [selectedOrgFilter, nodes]);

  // Check if a node should be visible
  const isNodeVisible = (node: Node): boolean => {
    // If filtering by organization/faculty
    if (selectedOrgFilter !== "all") {
      if (node.type === "core") return true;
      if (node.organization !== selectedOrgFilter) return false;
    }

    if (node.type === "core" || node.type === "distribution") return true;

    // Find the link connecting this node to its parent
    const link = links.find((l) => l.target === node.id);
    if (!link) return true; // Show orphan nodes

    // If parent is a distribution node, only show if parent is expanded
    const parentNode = nodes.find((n) => n.id === link.source);
    if (parentNode && parentNode.type === "distribution") {
      return expandedNodes.has(parentNode.id);
    }

    return true;
  };

  // Filter visible items
  const visibleNodes = nodes.filter(isNodeVisible);
  const visibleLinks = links.filter((link) => {
    const sourceNode = nodes.find((n) => n.id === link.source);
    const targetNode = nodes.find((n) => n.id === link.target);
    return sourceNode && targetNode && isNodeVisible(sourceNode) && isNodeVisible(targetNode);
  });

  const organizations = Array.from(
    new Set(nodes.map((n) => n.organization).filter(Boolean))
  ) as string[];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Network Map Main Window */}
      <div className="flex-1 card p-0 flex flex-col relative overflow-hidden bg-slate-900 border border-slate-800">
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
          <button onClick={() => zoom(1.2)} className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => zoom(0.8)} className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={resetView} className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all text-xs font-bold" title="Reset View">
            Reset
          </button>
          <button onClick={loadTopology} className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all" title="Refresh Live Data">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Faculty Filter Dropdown */}
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur transition-all text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">ทุกคณะ/หน่วยงานทั้งหมด</option>
            {organizations.sort().map((org) => (
              <option key={org} value={org} className="bg-slate-900 text-slate-200">
                {org}
              </option>
            ))}
          </select>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl text-xs text-slate-300 space-y-2 backdrop-blur max-w-xs shadow-xl">
          <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5 border-b border-slate-700 pb-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> แผนผังเครือข่ายระดับโครงสร้าง
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5"><Router className="w-3.5 h-3.5 text-blue-400" /> Core Router</div>
            <div className="flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-purple-400" /> Dist Switch</div>
            <div className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-teal-400" /> Access Node</div>
            <div className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Server/Other</div>
          </div>
          <div className="border-t border-slate-700/80 pt-2 flex justify-between gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>ออนไลน์ (Up)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
              <span>ขัดข้อง (Down)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">คลิกที่โหนดคณะเพื่อกาง/หุบสวิตช์ย่อยออกได้</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-semibold animate-pulse">กำลังโหลดแผนผังเครือข่าย...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
            <div className="text-center">
              <p className="text-slate-200 font-extrabold">ดึงข้อมูลเครือข่ายล้มเหลว</p>
              <p className="text-slate-500 text-xs mt-1">กรุณาลองใหม่อีกครั้ง หรือตรวจสอบสิทธิ์การเข้าถึง LibreNMS API</p>
            </div>
            <button onClick={loadTopology} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              โหลดอีกครั้ง
            </button>
          </div>
        ) : (
          <svg
            className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background glowing circle for central node */}
            <circle cx={600} cy={400} r={420} fill="url(#glow)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
              {/* Lines / Links */}
              {visibleLinks.map((link, i) => {
                const sNode = nodes.find((n) => n.id === link.source);
                const tNode = nodes.find((n) => n.id === link.target);
                if (!sNode || !tNode || sNode.x === undefined || tNode.x === undefined) return null;

                const isDown = link.status === "down";

                return (
                  <line
                    key={i}
                    x1={sNode.x}
                    y1={sNode.y}
                    x2={tNode.x}
                    y2={tNode.y}
                    stroke={isDown ? "#f43f5e" : "#475569"}
                    strokeWidth={isDown ? 2.5 : 1.5}
                    strokeDasharray={isDown ? "4 4" : "0"}
                    className="transition-all"
                  />
                );
              })}

              {/* Nodes */}
              {visibleNodes.map((node) => {
                if (node.x === undefined || node.y === undefined) return null;

                const isDown = node.status === "down";
                const isSelected = selectedNode?.id === node.id;
                const isExpanded = expandedNodes.has(node.id);

                // Node type colors
                let colorClass = "bg-blue-500 fill-blue-500";
                if (node.type === "core") colorClass = "bg-blue-600 fill-blue-600";
                else if (node.type === "distribution") colorClass = "bg-purple-600 fill-purple-600";
                else if (node.type === "access") colorClass = isDown ? "bg-red-500 fill-red-500" : "bg-teal-500 fill-teal-500";

                const radius = node.type === "core" ? 22 : node.type === "distribution" ? 18 : 12;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                      if (node.type === "distribution") {
                        toggleNodeExpansion(node.id);
                      }
                    }}
                  >
                    {/* Glowing outer ring if selected */}
                    {isSelected && (
                      <circle
                        r={radius + 8}
                        className="fill-transparent stroke-blue-400 stroke-2 animate-ping opacity-60"
                      />
                    )}

                    {/* Outer Ring */}
                    <circle
                      r={radius + 4}
                      className="fill-slate-950 stroke-slate-800 group-hover:stroke-slate-600 transition-colors"
                      strokeWidth={1.5}
                    />

                    {/* Main Node Circle */}
                    <circle
                      r={radius}
                      className={`${colorClass} stroke-white`}
                      strokeWidth={1.5}
                    />

                    {/* Inner status dot for distribution and core */}
                    {node.type !== "access" && (
                      <circle
                        r={4}
                        fill={isDown ? "#f43f5e" : "#10b981"}
                        className="animate-pulse"
                      />
                    )}

                    {/* Expanded/Collapsed indicator for Distribution Switch */}
                    {node.type === "distribution" && (
                      <circle
                        r={5}
                        cx={radius}
                        cy={-radius}
                        fill={isExpanded ? "#f59e0b" : "#3b82f6"}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    )}

                    {/* Label Text */}
                    <text
                      y={radius + 18}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-slate-300 group-hover:fill-white font-mono select-none drop-shadow-md"
                    >
                      {node.type === "distribution" && node.organization
                        ? node.organization.replace("คณะ", "")
                        : node.label.split(".")[0]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Side Detail Inspector Panel */}
      <div className="w-80 flex flex-col gap-4">
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
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 break-all pr-2">{selectedNode.label}</h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
                    {selectedNode.type} Node
                  </span>
                </div>
              </div>

              {/* Status Section */}
              <div className={`p-4 rounded-xl border mb-5 flex items-center justify-between ${
                selectedNode.status === 'up'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${selectedNode.status === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="font-bold text-xs uppercase">สถานะอุปกรณ์</span>
                </div>
                <span className="font-mono text-sm font-extrabold uppercase">
                  {selectedNode.status === 'up' ? 'ONLINE' : 'DOWN / ERROR'}
                </span>
              </div>

              {/* Node Specifications */}
              <div className="space-y-3 text-xs flex-1">
                {selectedNode.ip && (
                  <div>
                    <span className="text-slate-400 block font-semibold">IP Address</span>
                    <span className="text-slate-700 dark:text-slate-200 font-mono font-bold text-sm">{selectedNode.ip}</span>
                  </div>
                )}
                {selectedNode.organization && (
                  <div>
                    <span className="text-slate-400 block font-semibold">หน่วยงานที่สังกัด</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedNode.organization}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-semibold">ระดับชั้นโครงสร้าง (Layer)</span>
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
                รายการอุปกรณ์ ({nodes.length})
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
                  className={`py-1.5 rounded-lg transition-colors ${statusFilter === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setStatusFilter("up")}
                  className={`py-1.5 rounded-lg transition-colors ${statusFilter === "up" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Online
                </button>
                <button
                  onClick={() => setStatusFilter("down")}
                  className={`py-1.5 rounded-lg transition-colors ${statusFilter === "down" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Offline
                </button>
              </div>

              {/* Grouping Selection */}
              <div className="flex items-center justify-between mb-3 text-[11px] font-bold text-slate-400">
                <span>จัดกลุ่มตาม:</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setGroupBy("none")} className={`px-2 py-0.5 rounded transition-all ${groupBy === 'none' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>ไม่มี</button>
                  <button onClick={() => setGroupBy("type")} className={`px-2 py-0.5 rounded transition-all ${groupBy === 'type' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>ประเภท</button>
                  <button onClick={() => setGroupBy("org")} className={`px-2 py-0.5 rounded transition-all ${groupBy === 'org' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>หน่วยงาน</button>
                </div>
              </div>

              {/* Scrollable Device List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const filtered = nodes.filter((n) => {
                    const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase()) || (n.ip ?? "").includes(searchTerm);
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

                  const renderItem = (n: Node) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{n.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{n.ip ?? "No IP"}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${n.status === "up" ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                  );

                  if (groupBy === "type") {
                    const coreNodes = filtered.filter(n => n.type === 'core');
                    const distNodes = filtered.filter(n => n.type === 'distribution');
                    const accessNodes = filtered.filter(n => n.type === 'access' || n.type === 'server');

                    return (
                      <div className="space-y-4">
                        {coreNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-blue-500 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">Core Layer ({coreNodes.length})</h4>
                            <div className="space-y-2">{coreNodes.map(renderItem)}</div>
                          </div>
                        )}
                        {distNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-purple-500 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">Distribution Layer ({distNodes.length})</h4>
                            <div className="space-y-2">{distNodes.map(renderItem)}</div>
                          </div>
                        )}
                        {accessNodes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-extrabold uppercase text-teal-500 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-2">Access Layer ({accessNodes.length})</h4>
                            <div className="space-y-2">{accessNodes.map(renderItem)}</div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (groupBy === "org") {
                    const orgGroups = new Map<string, Node[]>();
                    filtered.forEach(n => {
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

                  // Flat list (no grouping)
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

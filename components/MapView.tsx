
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Task, URGENCY_CONFIG, UrgencyLevel } from '../types';
import { Plus, CheckCircle2, Navigation2, MapPin, Trash2, ChevronDown } from 'lucide-react';

interface MapViewProps {
  tasks: Task[];
  onMapClick: (lat: number, lng: number) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateUrgency: (taskId: string, newUrgency: UrgencyLevel) => void;
}

const MapView: React.FC<MapViewProps> = ({ tasks, onMapClick, onComplete, onDelete, onUpdateUrgency }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
  const [zoom, setZoom] = useState(12);
  const longPressTimer = useRef<number | null>(null);

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([22.3193, 114.1694], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    const onMoveOrZoom = () => {
      setZoom(map.getZoom());
    };
    map.on('zoomend moveend', onMoveOrZoom);

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    map.on('mousedown touchstart', (e: any) => {
      const latlng = (e as L.LeafletMouseEvent).latlng;
      if (!latlng) return;
      longPressTimer.current = window.setTimeout(() => {
        onMapClick(latlng.lat, latlng.lng);
        longPressTimer.current = null;
      }, 600);
    });

    const cancelLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    map.on('mouseup touchend mousemove touchmove dragstart', cancelLongPress);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    const map = mapRef.current;
    const layerGroup = markersRef.current;
    layerGroup.clearLayers();

    // --- "Mother" Node Clustering Logic ---
    // 聚类阈值（像素）：在这个距离内的点会被归纳到同一个“母节点”下
    // 修改：缩小阈值到 10px，让点更难聚合
    const CLUSTER_PX = 10; 
    
    // MotherNodes 数组存储所有的聚合中心
    const motherNodes: { tasks: Task[], center: L.LatLng }[] = [];

    tasks.forEach(task => {
      const taskLatLng = L.latLng(task.location.lat, task.location.lng);
      const currentPoint = map.project(taskLatLng, zoom);
      
      let foundMother = false;
      
      // 尝试寻找现有的“母节点”
      for (const mother of motherNodes) {
        const motherPoint = map.project(mother.center, zoom);
        const dist = currentPoint.distanceTo(motherPoint);
        
        if (dist < CLUSTER_PX) {
          mother.tasks.push(task);
          foundMother = true;
          break;
        }
      }

      // 如果没有找到合适的“母节点”，则创建一个新的（它可能目前只有一个子节点）
      if (!foundMother) {
        motherNodes.push({ tasks: [task], center: taskLatLng });
      }
    });

    // 渲染所有节点
    motherNodes.forEach(mother => {
      if (mother.tasks.length > 1) {
        // --- 渲染“母节点” (Mother Node / Cluster) ---
        const motherIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="relative flex items-center justify-center w-12 h-12 transition-transform active:scale-95 group">
              <!-- 母体光环 -->
              <div class="absolute inset-0 bg-[#0EC0A6]/30 rounded-full animate-ping opacity-20"></div>
              <!-- 母体核心 -->
              <div class="relative w-11 h-11 rounded-full bg-[#0EC0A6] border-4 border-white shadow-xl flex items-center justify-center z-10">
                <span class="text-white text-base font-black tracking-tighter">${mother.tasks.length}</span>
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        L.marker(mother.center, { icon: motherIcon })
          .addTo(layerGroup)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            // 点击母节点，聚焦并放大以查看子节点
            map.flyTo(mother.center, map.getZoom() + 2);
          });

      } else {
        // --- 渲染独立节点 (Individual Node) ---
        const task = mother.tasks[0];
        const config = URGENCY_CONFIG[task.urgency];
        const isNextWeek = task.urgency === UrgencyLevel.NEXT_WEEK;
        
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex flex-col items-center group">
              <div class="w-5 h-5 rounded-full border-2 ${isNextWeek ? 'border-black' : 'border-white'} shadow-lg ${config.color} ${config.borderColor} transition-transform group-hover:scale-110" 
                   style="background-color: ${config.dotColor}">
              </div>
              <div class="mt-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-100/50 text-[11px] font-medium text-gray-800 whitespace-nowrap max-w-[140px] truncate opacity-90 group-hover:opacity-100 transition-opacity">
                ${task.name}
              </div>
            </div>
          `,
          iconSize: [120, 50],
          iconAnchor: [60, 10]
        });

        L.marker([task.location.lat, task.location.lng], { icon })
          .addTo(layerGroup)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedTaskId(task.id);
            setShowUrgencyMenu(false);
          });
      }
    });
  }, [tasks, zoom]);

  const centerOnUser = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
    });
  };

  return (
    <div className="relative w-full h-full bg-[#f8f9fa]">
      <div ref={containerRef} className="w-full h-full" />

      {selectedTask && (
        <div className="absolute inset-0 flex items-end justify-center z-[1000] bg-black/20 backdrop-blur-[2px] pointer-events-none p-4 pb-24">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-7 w-full max-w-[340px] pointer-events-auto animate-in slide-in-from-bottom-10 duration-500 border border-white/20">
            <div className="flex justify-between items-start mb-6">
              <div className="relative">
                <button
                  onClick={() => setShowUrgencyMenu(!showUrgencyMenu)}
                  className={`text-[11px] font-medium px-4 py-2 rounded-full ${URGENCY_CONFIG[selectedTask.urgency].color} ${URGENCY_CONFIG[selectedTask.urgency].textColor} flex items-center gap-2 shadow-sm border ${selectedTask.urgency === UrgencyLevel.NEXT_WEEK ? 'border-black' : 'border-transparent'}`}
                >
                  {URGENCY_CONFIG[selectedTask.urgency].label}
                  <ChevronDown size={12} className={`transition-transform duration-300 ${showUrgencyMenu ? 'rotate-180' : ''}`} />
                </button>
                {showUrgencyMenu && (
                  <div className="absolute top-full left-0 mt-3 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-2 w-[180px] flex flex-col gap-1 z-[60] animate-in fade-in zoom-in-95 duration-200">
                    {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          onUpdateUrgency(selectedTask.id, level);
                          setShowUrgencyMenu(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] transition-colors hover:bg-gray-100/50 ${selectedTask.urgency === level ? 'bg-[#0EC0A6]/10 text-[#0EC0A6]' : 'text-gray-500'}`}
                      >
                         <div className={`w-3 h-3 rounded-full border ${URGENCY_CONFIG[level].borderColor} ${URGENCY_CONFIG[level].color}`} />
                         <span>{URGENCY_CONFIG[level].label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if(confirm('删除此任务？')) { onDelete(selectedTask.id); setSelectedTaskId(null); } }} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-400">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setSelectedTaskId(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0EC0A6] text-white shadow-lg shadow-[#0EC0A6]/30">
                 <MapPin size={28} />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-2xl text-gray-900 leading-tight truncate font-medium">{selectedTask.name}</h4>
                <p className="text-[11px] text-gray-400 mt-1">创建于 {new Date(selectedTask.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <button
              onClick={() => { onComplete(selectedTask.id); setSelectedTaskId(null); }}
              className="w-full py-6 bg-[#0EC0A6] hover:bg-[#0B9985] text-white rounded-[1.75rem] flex items-center justify-center gap-3 text-[15px] font-medium transition-all shadow-xl shadow-[#0EC0A6]/20 active:scale-[0.98]"
            >
              <CheckCircle2 size={20} />
              标记为已完成
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-6 right-6 flex flex-col gap-4 z-[500]">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-3xl p-1.5 border border-white/50 flex flex-col overflow-hidden">
          <button onClick={() => mapRef.current?.zoomIn()} className="w-12 h-12 flex items-center justify-center hover:bg-white/50 text-gray-800 transition-colors">
            <Plus size={24} />
          </button>
          <div className="h-[1px] bg-gray-200/50 mx-3" />
          <button onClick={() => mapRef.current?.zoomOut()} className="w-12 h-12 flex items-center justify-center hover:bg-white/50 text-gray-800 transition-colors">
            <div className="w-4 h-[2px] bg-current" />
          </button>
        </div>
        <button onClick={centerOnUser} className="w-14 h-14 bg-white/80 backdrop-blur-lg shadow-xl rounded-full flex items-center justify-center text-[#0EC0A6] border border-white/50 transition-all active:scale-90">
          <Navigation2 size={28} fill="currentColor" />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-8 py-3.5 rounded-full text-white text-[11px] font-medium tracking-wide border border-white/10 shadow-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-[#0EC0A6] rounded-full animate-pulse shadow-[0_0_10px_#0EC0A6]" />
          <span>长按地图新增事项</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;

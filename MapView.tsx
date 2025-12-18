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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
  const [zoom, setZoom] = useState(12);
  const longPressTimer = useRef<number | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Fix: Remove 'tap' property because it is not recognized in current Leaflet MapOptions types
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([22.3193, 114.1694], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => setZoom(map.getZoom()));

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

    map.on('mouseup touchend mousemove touchmove dragstart', () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 聚类算法实现
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    const map = mapRef.current;
    const layerGroup = markersRef.current;
    layerGroup.clearLayers();

    // 聚类距离阀值（像素）
    const clusterDistance = 50; 
    const clusters: { tasks: Task[], center: L.LatLng }[] = [];

    tasks.forEach(task => {
      const taskLatLng = L.latLng(task.location.lat, task.location.lng);
      const taskPos = map.latLngToLayerPoint(taskLatLng);
      
      let foundCluster = false;
      for (const cluster of clusters) {
        const clusterPos = map.latLngToLayerPoint(cluster.center);
        const dist = taskPos.distanceTo(clusterPos);
        
        if (dist < clusterDistance) {
          cluster.tasks.push(task);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({ tasks: [task], center: taskLatLng });
      }
    });

    // 绘制聚类点或单体点
    clusters.forEach(cluster => {
      if (cluster.tasks.length > 1) {
        // 绘制聚合点
        // 获取该组中最紧急的等级作为聚合点颜色
        const urgencyOrder = [UrgencyLevel.TOMORROW, UrgencyLevel.TWO_DAYS, UrgencyLevel.THIS_WEEK, UrgencyLevel.NEXT_WEEK];
        const mostUrgent = cluster.tasks.reduce((prev, curr) => {
          return urgencyOrder.indexOf(curr.urgency) < urgencyOrder.indexOf(prev) ? curr.urgency : prev;
        }, cluster.tasks[0].urgency);
        
        const config = URGENCY_CONFIG[mostUrgent];

        const clusterIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-xl animate-in zoom-in duration-300" 
                 style="background-color: ${config.dotColor}; color: white;">
              <span class="text-sm font-black">${cluster.tasks.length}</span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        L.marker(cluster.center, { icon: clusterIcon })
          .addTo(layerGroup)
          .on('click', () => {
            map.flyTo(cluster.center, map.getZoom() + 2);
          });
      } else {
        // 绘制单个任务点
        const task = cluster.tasks[0];
        const config = URGENCY_CONFIG[task.urgency];
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex flex-col items-center group animate-in fade-in duration-300">
              <div class="w-[14px] h-[14px] rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 ${config.color} ${config.borderColor}" 
                   style="background-color: ${config.dotColor}">
                ${task.urgency === UrgencyLevel.NEXT_WEEK ? '<div class="w-[4px] h-[4px] rounded-full border border-black"></div>' : ''}
              </div>
              <div class="mt-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 text-[9px] font-black text-gray-800 whitespace-nowrap max-w-[100px] truncate">
                ${task.name}
              </div>
            </div>
          `,
          iconSize: [80, 40],
          iconAnchor: [40, 7]
        });

        L.marker([task.location.lat, task.location.lng], { icon })
          .addTo(layerGroup)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedTask(task);
            setShowUrgencyMenu(false);
          });
      }
    });
  }, [tasks, zoom]);

  // 同步选中的任务状态
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      } else {
        setSelectedTask(null);
      }
    }
  }, [tasks]);

  const centerOnUser = () => {
    if (!mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
    }, (err) => {
      console.warn("Geolocation error:", err);
    });
  };

  return (
    <div className="relative w-full h-full bg-[#f8f9fa]">
      <div ref={containerRef} className="w-full h-full" />

      {/* Selected Task Bubble */}
      {selectedTask && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/10 backdrop-blur-[1px] pointer-events-none p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 w-full max-w-[320px] pointer-events-auto animate-in zoom-in-95 duration-300 relative border border-gray-100">
            
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="relative">
                <button
                  onClick={() => setShowUrgencyMenu(!showUrgencyMenu)}
                  className={`text-[10px] font-black px-4 py-1.5 rounded-full ${URGENCY_CONFIG[selectedTask.urgency].color} text-white uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-sm`}
                >
                  {URGENCY_CONFIG[selectedTask.urgency].label}
                  <ChevronDown size={10} strokeWidth={4} className={`transition-transform duration-200 ${showUrgencyMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUrgencyMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-[160px] flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 z-[60]">
                    {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          onUpdateUrgency(selectedTask.id, level);
                          setShowUrgencyMenu(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black transition-colors hover:bg-gray-50 ${selectedTask.urgency === level ? 'bg-gray-50 text-teal-600' : 'text-gray-500'}`}
                      >
                         <div className={`w-2.5 h-2.5 rounded-full border ${URGENCY_CONFIG[level].color} ${URGENCY_CONFIG[level].borderColor}`} />
                         <span>{URGENCY_CONFIG[level].label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if(window.confirm('确定要删除这个事项吗？')) {
                        onDelete(selectedTask.id);
                        setSelectedTask(null);
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 ${URGENCY_CONFIG[selectedTask.urgency].color} text-white shadow-lg`}>
                 <MapPin size={24} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-gray-900 text-2xl leading-none truncate w-full tracking-tight">{selectedTask.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5 tracking-wider">Created {new Date(selectedTask.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onComplete(selectedTask.id);
                setSelectedTask(null);
              }}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black transition-all shadow-xl shadow-teal-100 active:scale-95"
            >
              <CheckCircle2 size={18} />
              完成并归档
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-[500]">
        <div className="bg-white/95 backdrop-blur shadow-2xl rounded-[1.5rem] p-1.5 border border-white flex flex-col">
          <button 
            onClick={() => mapRef.current?.zoomIn()}
            className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-colors rounded-xl"
          >
            <Plus size={22} />
          </button>
          <div className="h-[1px] bg-gray-100 mx-3 my-1" />
          <button 
            onClick={() => mapRef.current?.zoomOut()}
            className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-colors rounded-xl"
          >
            <div className="w-4 h-0.5 bg-current" />
          </button>
        </div>
        
        <button 
          onClick={centerOnUser}
          className="w-14 h-14 bg-white/95 backdrop-blur shadow-2xl rounded-[1.5rem] flex items-center justify-center text-teal-600 border border-white hover:bg-white transition-all active:scale-90"
        >
          <Navigation2 size={28} fill="currentColor" />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-md px-8 py-3.5 rounded-full text-white text-[10px] font-black uppercase tracking-[0.25em] border border-white/10 shadow-2xl flex items-center gap-4">
          <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
          <span>长按地图添加任务</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
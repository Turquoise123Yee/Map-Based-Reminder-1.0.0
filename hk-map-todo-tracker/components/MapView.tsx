
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
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Hong Kong with minimalist tiles
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      tap: true // For mobile support
    }).setView([22.3193, 114.1694], 12);

    // Minimalist "Pure" basemap from CartoDB (Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    // Interaction: Long press to create
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Custom long press for touch/click consistency
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

  // Sync markers and fit bounds on tasks change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    // 1. Sync markers
    // Remove markers that are no longer in tasks
    Object.keys(markersRef.current).forEach(id => {
      if (!tasks.find(t => t.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    tasks.forEach(task => {
      const config = URGENCY_CONFIG[task.urgency];
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center group">
            <div class="w-[13px] h-[13px] rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${config.color} ${config.borderColor}" style="background-color: ${config.dotColor}">
              ${task.urgency === 'NEXT_WEEK' ? '<div class="w-[4px] h-[4px] rounded-full border border-black"></div>' : ''}
            </div>
            <div class="mt-1 px-1 py-0.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 text-[8px] font-bold text-gray-800 whitespace-nowrap max-w-[80px] truncate">
              ${task.name}
            </div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 7] // Anchored at center
      });

      if (markersRef.current[task.id]) {
        markersRef.current[task.id].setLatLng([task.location.lat, task.location.lng]);
        markersRef.current[task.id].setIcon(icon);
      } else {
        const marker = L.marker([task.location.lat, task.location.lng], { icon })
          .addTo(map)
          .on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            setSelectedTask(task);
            setShowUrgencyMenu(false); // Reset menu when opening new task
          });
        markersRef.current[task.id] = marker;
      }
    });

    // 2. Auto-fit bounds
    // Runs every time tasks change (add/remove/update) or component mounts
    const markers = Object.values(markersRef.current);
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      try {
        // Do not auto-fit if user is interacting with a selected task to prevent jumping
        if (!selectedTask) {
           // Optional: You might want to disable auto-fit on every update if it's annoying
           // map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
        }
      } catch (e) {
        console.warn("Could not fit bounds", e);
      }
    }
  }, [tasks, selectedTask]); // added selectedTask to deps to prevent unwanted moves

  // When tasks update, update the selected task reference if it exists
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      } else {
        setSelectedTask(null); // Task was deleted
      }
    }
  }, [tasks]);

  const centerOnUser = () => {
    if (!mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
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
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[300px] pointer-events-auto animate-in zoom-in-90 duration-300 relative">
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              {/* Urgency Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowUrgencyMenu(!showUrgencyMenu)}
                  className={`text-[10px] font-black px-3 py-1 rounded-full ${URGENCY_CONFIG[selectedTask.urgency].color} text-white uppercase tracking-wider flex items-center gap-1 hover:brightness-110 transition-all`}
                >
                  {URGENCY_CONFIG[selectedTask.urgency].label}
                  <ChevronDown size={10} strokeWidth={4} className={`transition-transform duration-200 ${showUrgencyMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUrgencyMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 w-[140px] flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200 z-[60]">
                    {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          onUpdateUrgency(selectedTask.id, level);
                          setShowUrgencyMenu(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors hover:bg-gray-50 ${selectedTask.urgency === level ? 'bg-gray-50' : ''}`}
                      >
                         <div className={`w-2 h-2 rounded-full border ${URGENCY_CONFIG[level].color} ${URGENCY_CONFIG[level].borderColor}`} />
                         <span className="text-gray-700">{URGENCY_CONFIG[level].label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions: Delete & Close */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    if(window.confirm('Delete this task?')) {
                        onDelete(selectedTask.id);
                        setSelectedTask(null);
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${URGENCY_CONFIG[selectedTask.urgency].color} text-white`}>
                 <MapPin size={20} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-gray-800 text-xl leading-none truncate w-full">{selectedTask.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Created at {new Date(selectedTask.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onComplete(selectedTask.id);
                setSelectedTask(null);
              }}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-xl active:scale-95"
            >
              <CheckCircle2 size={16} />
              DONE & ARCHIVE
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-[500]">
        <div className="bg-white/90 backdrop-blur shadow-xl rounded-2xl p-1 border border-white flex flex-col">
          <button 
            onClick={() => mapRef.current?.zoomIn()}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-colors rounded-xl"
          >
            <Plus size={20} />
          </button>
          <div className="h-[1px] bg-gray-100 mx-2 my-0.5" />
          <button 
            onClick={() => mapRef.current?.zoomOut()}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-colors rounded-xl"
          >
            <div className="w-3 h-0.5 bg-current" />
          </button>
        </div>
        
        <button 
          onClick={centerOnUser}
          className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-teal-600 border border-white hover:bg-white transition-all active:scale-90"
        >
          <Navigation2 size={24} fill="currentColor" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping" />
          <span>Long press to add task</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;


import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Task, URGENCY_CONFIG } from '../types';
import { Map as MapIcon, List, Calendar, MapPin, CheckCircle, Filter, Download, Upload, Trash2 } from 'lucide-react';

interface ArchivePageProps {
  completedTasks: Task[];
  onExport: () => void;
  onImport: (file: File) => void;
  onDelete: (taskId: string) => void;
}

type FilterType = 'all' | 'today' | 'week' | 'month';

const ArchivePage: React.FC<ArchivePageProps> = ({ completedTasks, onExport, onImport, onDelete }) => {
  const [view, setView] = useState<'map' | 'list'>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorting
  const sortedTasks = [...completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  // --- Filtering Logic ---
  const getFilteredTasks = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Calculate start of week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const weekStart = new Date(now.setDate(diff)).setHours(0,0,0,0);
    
    // Reset now for month calc
    const nowForMonth = new Date();
    const monthStart = new Date(nowForMonth.getFullYear(), nowForMonth.getMonth(), 1).getTime();

    return sortedTasks.filter(task => {
      const t = task.completedAt || 0;
      if (filter === 'all') return true;
      if (filter === 'today') return t >= todayStart;
      if (filter === 'week') return t >= weekStart;
      if (filter === 'month') return t >= monthStart;
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // --- Helper for Date Range Strings ---
  const getDateRangeLabel = (type: FilterType) => {
    const now = new Date();
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    
    if (type === 'today') {
      return `今天 (${fmt(now)})`;
    }
    if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `本周 (${fmt(start)} - ${fmt(end)})`;
    }
    if (type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `本月 (${fmt(start)} - ${fmt(end)})`;
    }
    return '全部历史';
  };

  // --- Helper for List Grouping (Month + Week) ---
  const getGroupTitle = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    
    // Calculate Week of Month
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const weekNum = Math.ceil((date.getDate() + firstDayWeekday) / 7);

    return `${month}月 第${weekNum}周`;
  };

  // --- Map Effect ---
  useEffect(() => {
    if (view === 'map' && mapContainerRef.current) {
      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([22.3193, 114.1694], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
        }).addTo(map);

        mapRef.current = map;
      }
      
      const map = mapRef.current;
      map.eachLayer((layer) => {
         if (layer instanceof L.Marker) {
             layer.remove();
         }
      });

      const group = L.featureGroup();
      filteredTasks.forEach(task => {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="flex flex-col items-center">
              <div class="w-[13px] h-[13px] bg-gray-400 rounded-full border-2 border-white shadow-md"></div>
              <div class="mt-1 px-1 py-0.5 bg-white/80 rounded text-[8px] font-bold text-gray-400 whitespace-nowrap">${task.name}</div>
            </div>
          `,
          iconSize: [60, 30],
          iconAnchor: [30, 7]
        });
        L.marker([task.location.lat, task.location.lng], { icon })
          .bindPopup(`
            <div class="p-2">
              <div class="font-black text-gray-800">${task.name}</div>
              <div class="text-[10px] text-gray-400 font-bold uppercase mt-1">Completed ${new Date(task.completedAt!).toLocaleDateString()}</div>
            </div>
          `)
          .addTo(group);
      });

      if (filteredTasks.length > 0) {
        group.addTo(map);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }

    return () => {
      if (mapRef.current && view !== 'map') {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [view, filter, completedTasks]);

  let lastGroupTitle = '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImport(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-6 bg-white border-b sticky top-0 z-10 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              History
            </h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Archived Tasks</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={onExport}
               className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:text-[#0EC0A6] hover:bg-[#0EC0A6]/10 transition-colors"
               title="备份数据"
             >
               <Download size={18} />
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:text-[#0EC0A6] hover:bg-[#0EC0A6]/10 transition-colors"
               title="恢复数据"
             >
               <Upload size={18} />
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               accept=".json" 
               className="hidden" 
             />
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setView('list')}
            className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              view === 'list' ? 'bg-white shadow-sm text-teal-600 scale-100' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={16} />
            LIST VIEW
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              view === 'map' ? 'bg-white shadow-sm text-teal-600 scale-100' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon size={16} />
            MAP VIEW
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {view === 'list' ? (
          <div className="p-6 pb-24">
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <p className="font-black text-sm uppercase tracking-widest">No archives found</p>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const groupTitle = getGroupTitle(task.completedAt || 0);
                const showHeader = groupTitle !== lastGroupTitle;
                lastGroupTitle = groupTitle;

                return (
                  <React.Fragment key={task.id}>
                    {showHeader && (
                      <div className="text-gray-400 font-black text-xs uppercase tracking-wider mt-6 mb-3 px-1 sticky top-0 bg-gray-50/95 backdrop-blur py-2 z-10 w-full">
                        {groupTitle}
                      </div>
                    )}
                    <div className="bg-white rounded-[2rem] p-5 mb-4 shadow-sm border border-gray-100 flex gap-5 transition-all hover:shadow-md hover:translate-y-[-2px]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${URGENCY_CONFIG[task.urgency].color} text-white shadow-inner`}>
                        <CheckCircle size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-gray-900 text-lg leading-tight flex-1 break-words">{task.name}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[8px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 font-black tracking-tighter">ARCHIVED</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('确认删除此归档记录？')) onDelete(task.id);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-y-1.5 text-[11px] font-bold text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{new Date(task.completedAt || 0).toLocaleDateString()} at {new Date(task.completedAt || 0).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="truncate">{task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        ) : (
          <div className="w-full h-full relative">
             <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-teal-600">
                  <Filter size={14} />
                </div>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="appearance-none bg-white/95 backdrop-blur pl-9 pr-8 py-2.5 rounded-2xl border border-white shadow-xl text-sm font-black text-gray-700 outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer hover:bg-white min-w-[160px]"
                >
                  <option value="all">显示全部</option>
                  <option value="today">{getDateRangeLabel('today')}</option>
                  <option value="week">{getDateRangeLabel('week')}</option>
                  <option value="month">{getDateRangeLabel('month')}</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-400"></div>
                </div>
              </div>
            </div>

            <div ref={mapContainerRef} className="w-full h-full" />
            
            <div className="absolute bottom-6 left-6 z-[500] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-2xl animate-in slide-in-from-bottom-2">
              <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${filteredTasks.length > 0 ? 'bg-teal-500 animate-pulse' : 'bg-gray-300'}`} />
                {filteredTasks.length} Archived Points
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;

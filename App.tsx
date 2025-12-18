
import React, { useState, useEffect } from 'react';
import { Task, UrgencyLevel, GeoLocation } from './types';
import MapView from './components/MapView';
import ArchivePage from './components/ArchivePage';
import TaskListView from './components/TaskListView';
import TaskModal from './components/TaskModal';
import { getSmartTaskAdvice } from './services/geminiService';
import { MapPin, History, Sparkles, LayoutList } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'home' | 'list' | 'archive'>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<GeoLocation | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  // 关键修复：增加 isLoaded 状态，防止初始空数组覆盖本地存储
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedTasks = localStorage.getItem('hk_map_tasks');
        const savedArchive = localStorage.getItem('hk_map_archive');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedArchive) setCompletedTasks(JSON.parse(savedArchive));
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // 只有当数据加载完毕后，才允许写入 LocalStorage
    if (!isLoaded) return;
    localStorage.setItem('hk_map_tasks', JSON.stringify(tasks));
    localStorage.setItem('hk_map_archive', JSON.stringify(completedTasks));
  }, [tasks, completedTasks, isLoaded]);

  const handleMapClick = (lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setModalOpen(true);
  };

  const addTask = async (name: string, urgency: UrgencyLevel) => {
    if (!pendingLocation) return;
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      name,
      urgency,
      location: pendingLocation,
      createdAt: Date.now(),
      isCompleted: false,
    };
    setTasks([...tasks, newTask]);
    setModalOpen(false);
    setPendingLocation(null);

    setLoadingAdvice(true);
    const advice = await getSmartTaskAdvice(name);
    setAiAdvice(advice);
    setLoadingAdvice(false);
    setTimeout(() => setAiAdvice(null), 10000);
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    setCompletedTasks([{ ...task, isCompleted: true, completedAt: Date.now() }, ...completedTasks]);
  };

  const deleteTask = (taskId: string) => setTasks(tasks.filter(t => t.id !== taskId));
  
  const deleteCompletedTask = (taskId: string) => {
    setCompletedTasks(completedTasks.filter(t => t.id !== taskId));
  };

  const updateTaskUrgency = (taskId: string, newUrgency: UrgencyLevel) => {
    setTasks(tasks.map(t => (t.id === taskId ? { ...t, urgency: newUrgency } : t)));
  };

  const updateTaskDetails = (taskId: string, updates: { urgency: UrgencyLevel; note?: string }) => {
    setTasks(tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  // 数据备份模块
  const handleExportData = () => {
    const data = {
      tasks,
      completedTasks,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anny-todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        if (data.tasks && Array.isArray(data.tasks)) setTasks(data.tasks);
        if (data.completedTasks && Array.isArray(data.completedTasks)) setCompletedTasks(data.completedTasks);
        alert('数据恢复成功！');
      } catch (err) {
        alert('文件格式错误，无法恢复。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto bg-[#F2F2F7] relative overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-xl px-6 py-5 pt-[calc(1.25rem+env(safe-area-inset-top))] border-b border-gray-100 flex items-center justify-between relative z-20 shrink-0">
        <div className="w-10"></div>
        <h1 className="text-2xl font-black text-[#0EC0A6] tracking-tight">Anny's Todo</h1>
        <div className="w-10 flex justify-end">
          {tasks.length > 0 && (
            <div className="bg-[#0EC0A6] text-white text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-[#0EC0A6]/20">
              {tasks.length}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-white">
        {activePage === 'home' && (
          <MapView 
            tasks={tasks} 
            onMapClick={handleMapClick} 
            onComplete={completeTask}
            onDelete={deleteTask}
            onUpdateUrgency={updateTaskUrgency}
          />
        )}
        
        {activePage === 'list' && (
          <TaskListView
            tasks={tasks}
            onComplete={completeTask}
            onUpdateTask={updateTaskDetails}
          />
        )}

        {activePage === 'archive' && (
          <ArchivePage 
            completedTasks={completedTasks} 
            onExport={handleExportData}
            onImport={handleImportData}
            onDelete={deleteCompletedTask}
          />
        )}

        {/* AI Insight Overlay - Only on Map */}
        {(aiAdvice || loadingAdvice) && activePage === 'home' && (
          <div className="absolute top-6 left-6 right-6 z-40">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl p-5 rounded-[2rem] flex gap-4 items-center animate-in slide-in-from-top-6 duration-700">
              <div className="w-10 h-10 bg-[#0EC0A6] rounded-2xl flex items-center justify-center text-white shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] font-medium text-[#0EC0A6] mb-0.5 uppercase tracking-wider">Smart Advice</div>
                <div className="text-[13px] text-gray-700 leading-snug truncate">
                  {loadingAdvice ? "Gemini 正在思考..." : aiAdvice}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex justify-between items-center z-20 shrink-0">
        <button
          onClick={() => setActivePage('home')}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${activePage === 'home' ? 'text-[#0EC0A6]' : 'text-gray-300'}`}
        >
          <MapPin size={26} fill={activePage === 'home' ? 'currentColor' : 'none'} strokeWidth={activePage === 'home' ? 1.5 : 2} />
          <span className="text-[11px] font-medium">地图</span>
        </button>

        <button
          onClick={() => setActivePage('list')}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${activePage === 'list' ? 'text-[#0EC0A6]' : 'text-gray-300'}`}
        >
          <LayoutList size={26} strokeWidth={2} />
          <span className="text-[11px] font-medium">清单</span>
        </button>

        <button
          onClick={() => setActivePage('archive')}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${activePage === 'archive' ? 'text-[#0EC0A6]' : 'text-gray-300'}`}
        >
          <History size={26} strokeWidth={2} />
          <span className="text-[11px] font-medium">历史</span>
        </button>
      </nav>

      {modalOpen && pendingLocation && (
        <TaskModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={() => { setModalOpen(false); setPendingLocation(null); }}
          onSave={addTask}
        />
      )}
    </div>
  );
};

export default App;

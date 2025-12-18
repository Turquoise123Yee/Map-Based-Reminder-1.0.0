
import React, { useState, useEffect } from 'react';
import { Task, UrgencyLevel, GeoLocation } from './types';
import MapView from './components/MapView';
import ArchivePage from './components/ArchivePage';
import TaskModal from './components/TaskModal';
import { getSmartTaskAdvice } from './services/geminiService';
import { MapPin, History, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'home' | 'archive'>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<GeoLocation | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const savedTasks = localStorage.getItem('hk_map_tasks');
    const savedArchive = localStorage.getItem('hk_map_archive');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedArchive) setCompletedTasks(JSON.parse(savedArchive));
  }, []);

  useEffect(() => {
    localStorage.setItem('hk_map_tasks', JSON.stringify(tasks));
    localStorage.setItem('hk_map_archive', JSON.stringify(completedTasks));
  }, [tasks, completedTasks]);

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
  const updateTaskUrgency = (taskId: string, newUrgency: UrgencyLevel) => {
    setTasks(tasks.map(t => (t.id === taskId ? { ...t, urgency: newUrgency } : t)));
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto bg-[#F2F2F7] relative overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-xl px-6 py-5 pt-[calc(1.25rem+env(safe-area-inset-top))] border-b border-gray-100 flex items-center justify-between relative z-20 shrink-0">
        <div className="w-10"></div>
        {/* 恢复为绿色加粗版标题 */}
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
        {activePage === 'home' ? (
          <MapView 
            tasks={tasks} 
            onMapClick={handleMapClick} 
            onComplete={completeTask}
            onDelete={deleteTask}
            onUpdateUrgency={updateTaskUrgency}
          />
        ) : (
          <ArchivePage completedTasks={completedTasks} />
        )}

        {/* AI Insight Overlay - iOS Card Style */}
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

      <nav className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-10 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex justify-around items-center z-20 shrink-0">
        <button
          onClick={() => setActivePage('home')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activePage === 'home' ? 'text-[#0EC0A6]' : 'text-gray-300'}`}
        >
          <MapPin size={26} fill={activePage === 'home' ? 'currentColor' : 'none'} strokeWidth={activePage === 'home' ? 1.5 : 2} />
          <span className="text-[11px] font-medium">地图事项</span>
        </button>

        <button
          onClick={() => setActivePage('archive')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activePage === 'archive' ? 'text-[#0EC0A6]' : 'text-gray-300'}`}
        >
          <History size={26} strokeWidth={2} />
          <span className="text-[11px] font-medium">归档历史</span>
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

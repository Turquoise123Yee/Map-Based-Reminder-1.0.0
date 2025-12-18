
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

  // Load from local storage
  useEffect(() => {
    const savedTasks = localStorage.getItem('hk_map_tasks');
    const savedArchive = localStorage.getItem('hk_map_archive');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedArchive) setCompletedTasks(JSON.parse(savedArchive));
  }, []);

  // Save to local storage
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

    // Get AI advice for the new task
    setLoadingAdvice(true);
    const advice = await getSmartTaskAdvice(name);
    setAiAdvice(advice);
    setLoadingAdvice(false);
    
    // Clear advice after 10 seconds
    setTimeout(() => setAiAdvice(null), 10000);
  };

  const completeTask = (taskId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const completedTask: Task = {
      ...task,
      isCompleted: true,
      completedAt: Date.now(),
    };

    setTasks(tasks.filter(t => t.id !== taskId));
    setCompletedTasks([completedTask, ...completedTasks]);
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const updateTaskUrgency = (taskId: string, newUrgency: UrgencyLevel) => {
    setTasks(tasks.map(t => (t.id === taskId ? { ...t, urgency: newUrgency } : t)));
  };

  return (
    // 使用 h-[100dvh] 代替 h-screen 以适应移动端动态工具栏
    <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto bg-white shadow-2xl relative overflow-hidden">
      {/* Header - 加入 pt-safe 确保不被刘海屏遮挡 */}
      <header className="bg-white px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b flex items-center justify-center relative z-20 shrink-0">
        <h1 className="text-2xl font-black text-teal-600 tracking-tight absolute left-1/2 -translate-x-1/2">Anny's to do</h1>
        
        <div className="absolute right-6 flex items-center gap-2">
          {tasks.length > 0 && (
            <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
              {tasks.length}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
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

        {/* AI Insight Overlay */}
        {(aiAdvice || loadingAdvice) && activePage === 'home' && (
          <div className="absolute top-4 left-4 right-4 z-40">
            <div className="bg-white/90 backdrop-blur-md border border-teal-100 shadow-xl p-4 rounded-2xl flex gap-4 items-start animate-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-teal-600 rounded-xl text-white">
                <Sparkles size={16} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-teal-600 mb-1 uppercase tracking-tighter">Gemini 智能建议</div>
                <div className="text-sm text-gray-700 leading-snug font-medium">
                  {loadingAdvice ? (
                    <div className="flex gap-1 py-1">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ) : aiAdvice}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar - 增加底部的安全区域占位 */}
      <nav className="bg-white border-t px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-around items-center z-20 shrink-0">
        <button
          onClick={() => setActivePage('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activePage === 'home' ? 'text-teal-600 scale-110' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MapPin size={24} fill={activePage === 'home' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-bold">地图首页</span>
        </button>

        <button
          onClick={() => setActivePage('archive')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activePage === 'archive' ? 'text-teal-600 scale-110' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <History size={24} />
          <span className="text-[10px] font-bold">归档记录</span>
        </button>
      </nav>

      {/* Modal */}
      {modalOpen && pendingLocation && (
        <TaskModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={() => {
            setModalOpen(false);
            setPendingLocation(null);
          }}
          onSave={addTask}
        />
      )}
    </div>
  );
};

export default App;

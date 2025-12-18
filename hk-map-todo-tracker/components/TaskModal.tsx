
import React, { useState } from 'react';
import { UrgencyLevel, URGENCY_CONFIG } from '../types';
import { X, Send } from 'lucide-react';

interface TaskModalProps {
  onClose: () => void;
  onSave: (name: string, urgency: UrgencyLevel) => void;
  lat: number;
  lng: number;
}

const TaskModal: React.FC<TaskModalProps> = ({ onClose, onSave, lat, lng }) => {
  const [name, setName] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.TOMORROW);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-black text-gray-900 text-2xl tracking-tight">新建待办事项</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Add New Task to Map</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <X size={28} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-5 space-y-5 bg-white">
          <div className="space-y-2">
            {/* Kept text-xl */}
            <label className="text-xl font-black text-gray-500 uppercase tracking-widest px-1">事件名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="要去哪里做什么？"
              className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-teal-500 focus:ring-0 outline-none transition-all text-gray-800 text-lg font-bold placeholder:text-gray-300 shadow-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            {/* Kept text-xl */}
            <label className="text-xl font-black text-gray-500 uppercase tracking-widest px-1">紧急程度</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgency(level)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    urgency === level 
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg' 
                    : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border ${URGENCY_CONFIG[level].color} ${URGENCY_CONFIG[level].borderColor}`} />
                  {/* Kept text-lg */}
                  <span className="text-lg font-black uppercase tracking-tighter truncate">{URGENCY_CONFIG[level].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-300 flex items-center gap-2 justify-center bg-gray-50/50 py-1.5 rounded-xl">
             GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </div>

        <div className="p-5 bg-white border-t border-gray-50 flex gap-3">
          <button
            onClick={onClose}
            // Kept text-xl, reduced py
            className="flex-1 py-3 text-gray-400 font-black text-xl uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => name.trim() && onSave(name, urgency)}
            disabled={!name.trim()}
            // Kept text-xl, reduced py
            className="flex-1 py-3 bg-teal-600 text-white font-black text-xl uppercase tracking-[0.1em] rounded-2xl hover:bg-teal-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-100 active:scale-95"
          >
            <Send size={24} />
            保存事项
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

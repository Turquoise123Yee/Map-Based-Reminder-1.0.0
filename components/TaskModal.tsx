
import React, { useState } from 'react';
import { UrgencyLevel, URGENCY_CONFIG } from '../types';
import { X, Send, Sparkles } from 'lucide-react';

interface TaskModalProps {
  onClose: () => void;
  onSave: (name: string, urgency: UrgencyLevel) => void;
  lat: number;
  lng: number;
}

const TaskModal: React.FC<TaskModalProps> = ({ onClose, onSave, lat, lng }) => {
  const [name, setName] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.TOMORROW);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), urgency);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-5 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-[360px] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/40">
        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl text-gray-900 font-medium tracking-tight">新增事项</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 block font-medium">任务描述</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：在中环买咖啡..."
                className="w-full bg-gray-50/50 border-0 border-b-2 border-gray-100 focus:border-[#0EC0A6] focus:ring-0 text-lg py-3 px-0 transition-all placeholder:text-gray-300 font-normal"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-4 block font-medium">执行周期</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => {
                  const active = urgency === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
                        active 
                          ? 'border-[#0EC0A6] bg-[#0EC0A6]/5 text-[#0EC0A6]' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${active ? 'bg-[#0EC0A6] scale-110 shadow-[0_0_8px_rgba(14,192,166,0.4)]' : 'bg-gray-200'}`} />
                      <span className="text-[13px] font-normal">{URGENCY_CONFIG[level].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-4.5 bg-[#0EC0A6] disabled:bg-gray-200 text-white rounded-[1.75rem] flex items-center justify-center gap-3 text-[16px] font-medium transition-all shadow-xl shadow-[#0EC0A6]/20 active:scale-[0.98] group"
              >
                <span>保存并添加</span>
                <Send size={18} className="group-active:translate-x-1 transition-transform" />
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-[#0EC0A6]/60">
                <Sparkles size={14} />
                <span className="text-[10px] tracking-wide font-medium">GEMINI AI 将为你提供智能建议</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

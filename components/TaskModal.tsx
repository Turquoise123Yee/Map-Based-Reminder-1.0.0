
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

  // 移除 useEffect 中的强制 focus 逻辑，避免移动端软键盘交互冲突

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), urgency);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-5 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-[360px] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/40">
        <div className="px-8 pt-8 pb-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl text-gray-900 font-medium tracking-tight">新增事项</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 block font-medium">任务描述</label>
              {/* Chrome 风格圆角框：默认灰边，聚焦绿边 */}
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：在中环买咖啡..."
                className="w-full bg-white border-2 border-gray-200 rounded-full focus:border-[#0EC0A6] focus:ring-0 text-[15px] py-4 px-6 transition-all placeholder:text-gray-300 font-normal shadow-sm outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-4 block font-medium">执行周期</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => {
                  const active = urgency === level;
                  const config = URGENCY_CONFIG[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
                        active 
                          ? `${level === UrgencyLevel.NEXT_WEEK ? 'border-black' : 'border-[#0EC0A6]'} bg-[#0EC0A6]/5 text-[#0EC0A6]` 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border ${config.borderColor} ${config.color} ${active ? 'scale-110 shadow-sm' : ''}`} />
                      <span className={`text-[13px] font-normal ${active && level === UrgencyLevel.NEXT_WEEK ? 'text-black' : ''}`}>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-6 bg-[#0EC0A6] disabled:bg-gray-200 text-white rounded-[1.75rem] flex items-center justify-center gap-3 text-[16px] font-medium transition-all shadow-xl shadow-[#0EC0A6]/20 active:scale-[0.98] group"
              >
                <span>保存并添加</span>
                <Send size={18} className="group-active:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

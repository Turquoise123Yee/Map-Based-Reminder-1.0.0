
import React, { useState, useEffect } from 'react';
import { UrgencyLevel, URGENCY_CONFIG, Task } from '../types';
import { X, Save, AlignLeft } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, updates: { urgency: UrgencyLevel; note?: string }) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSave }) => {
  const [urgency, setUrgency] = useState<UrgencyLevel>(task.urgency);
  const [note, setNote] = useState<string>(task.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, { urgency, note: note.trim() });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-5 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-[360px] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/40">
        <div className="px-8 pt-8 pb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl text-gray-900 font-medium tracking-tight truncate pr-4">{task.name}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 紧急度选择 */}
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 block font-medium">修改优先级</label>
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

            {/* 备注输入 */}
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-medium">
                <AlignLeft size={12} />
                备注 / 详情
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="添加一些细节..."
                rows={3}
                className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#0EC0A6] rounded-3xl p-4 text-[14px] text-gray-700 transition-all placeholder:text-gray-300 outline-none resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-5 bg-[#0EC0A6] hover:bg-[#0B9985] text-white rounded-[1.75rem] flex items-center justify-center gap-3 text-[16px] font-medium transition-all shadow-xl shadow-[#0EC0A6]/20 active:scale-[0.98]"
              >
                <Save size={18} />
                <span>保存修改</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;

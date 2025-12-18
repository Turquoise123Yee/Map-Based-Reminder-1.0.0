
import React, { useState } from 'react';
import { Task, UrgencyLevel, URGENCY_CONFIG } from '../types';
import { Check, Edit2, Inbox } from 'lucide-react';
import EditTaskModal from './EditTaskModal';

interface TaskListViewProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: { urgency: UrgencyLevel; note?: string }) => void;
}

// 紧急度排序权重
const URGENCY_WEIGHT = {
  [UrgencyLevel.TOMORROW]: 0,
  [UrgencyLevel.TWO_DAYS]: 1,
  [UrgencyLevel.THIS_WEEK]: 2,
  [UrgencyLevel.NEXT_WEEK]: 3,
};

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onComplete, onUpdateTask }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 排序：先按紧急度，再按创建时间倒序
  const sortedTasks = [...tasks].sort((a, b) => {
    const weightDiff = URGENCY_WEIGHT[a.urgency] - URGENCY_WEIGHT[b.urgency];
    if (weightDiff !== 0) return weightDiff;
    return b.createdAt - a.createdAt;
  });

  const handleSaveEdit = (taskId: string, updates: { urgency: UrgencyLevel; note?: string }) => {
    onUpdateTask(taskId, updates);
    setEditingTask(null);
  };

  return (
    <div className="h-full w-full bg-[#F2F2F7] overflow-y-auto pb-safe">
      <div className="p-6 pb-24 space-y-4">
        <div className="pl-2 mb-4">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Todo List</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {sortedTasks.length} Pending Tasks
          </p>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Inbox size={32} />
            </div>
            <p className="font-black text-sm uppercase tracking-widest">No tasks yet</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const config = URGENCY_CONFIG[task.urgency];
            const isNextWeek = task.urgency === UrgencyLevel.NEXT_WEEK;

            return (
              <div
                key={task.id}
                onClick={() => setEditingTask(task)}
                className="group relative bg-white rounded-[1.5rem] p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_-12px_rgba(0,0,0,0.15)] transition-all active:scale-[0.98] border border-transparent hover:border-gray-100 cursor-pointer flex items-start gap-4"
              >
                {/* 交互圆点：点击完成 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发卡片编辑
                    onComplete(task.id);
                  }}
                  className={`mt-1 w-6 h-6 rounded-full border-2 ${isNextWeek ? 'border-gray-300' : 'border-transparent'} flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-90`}
                  style={{ backgroundColor: isNextWeek ? 'white' : config.dotColor }}
                >
                  <Check size={12} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[16px] font-medium text-gray-900 leading-snug truncate pr-2">
                      {task.name}
                    </h3>
                    {/* 编辑图标，仅装饰，暗示可点击 */}
                    <Edit2 size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                  
                  {/* 备注显示 */}
                  {task.note && (
                    <p className="mt-1.5 text-[12px] text-gray-400 font-medium leading-relaxed line-clamp-2">
                      {task.note}
                    </p>
                  )}

                  {/* 紧急度标签 */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-md bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border border-gray-100`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default TaskListView;

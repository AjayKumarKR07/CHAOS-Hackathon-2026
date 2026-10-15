import React from 'react';
import { Calendar, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function TaskCard({ task, onStatusChange, onDelete }) {
  const priorityStyles = {
    URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const statusIcons = {
    TODO: Clock,
    IN_PROGRESS: AlertTriangle,
    DONE: CheckCircle2,
  };

  const StatusIcon = statusIcons[task.status] || Clock;

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-4 sm:p-5 flex flex-col justify-between border border-white/10 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
              priorityStyles[task.priority] || priorityStyles.MEDIUM
            }`}
          >
            {task.priority} Priority
          </span>

          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs bg-navy-950 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        <h3 className={`text-base font-semibold mb-1 text-white ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h3>

        {task.description && (
          <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(task.created_at).toLocaleDateString()}</span>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

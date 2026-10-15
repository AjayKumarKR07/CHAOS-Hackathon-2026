import React, { useState } from 'react';
import { FileText, Trash2, Calendar, Copy, Check } from 'lucide-react';

export function NoteCard({ note, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-4 sm:p-5 flex flex-col justify-between border border-white/10 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold font-mono">
            <FileText className="w-3.5 h-3.5" />
            <span>NOTE #{note.id}</span>
          </div>

          <button
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
            title="Copy Note Content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <h3 className="text-base font-semibold text-white mb-2 line-clamp-1">
          {note.title}
        </h3>

        <div className="text-xs text-slate-300 font-normal leading-relaxed whitespace-pre-wrap line-clamp-4 bg-navy-950/40 p-2.5 rounded-lg border border-white/5 mb-3">
          {note.content}
        </div>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(note.created_at).toLocaleDateString()}</span>
        </div>

        <button
          onClick={() => onDelete(note.id)}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete Note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

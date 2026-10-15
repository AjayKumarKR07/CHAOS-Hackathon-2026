import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Loader2, X } from 'lucide-react';
import { noteService } from '../services/noteService';
import { NoteCard } from '../components/NoteCard';

export function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New note state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await noteService.getNotes();
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await noteService.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(`Error deleting note: ${err.message}`);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await noteService.createNote({
        title: title.trim(),
        content: content.trim(),
      });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      loadNotes();
    } catch (err) {
      alert(`Error creating note: ${err.message}`);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-violet-400" />
            <span>Notes Repository</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Documentation, execution findings, and daily briefing notes persisted by JARVIS
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-xl p-3 border border-white/10 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by keyword or content..."
          className="w-full pl-8 pr-4 py-1.5 rounded-lg bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-violet-400" />
          <p className="text-xs">Loading notes from MongoDB Atlas...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">No notes found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? 'No notes matched your search query.'
              : 'Add a new note or request JARVIS to log meeting notes and summaries.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white">Create New Note</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Note Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Infrastructure Deployment Notes"
                  required
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note markdown or text here..."
                  rows={5}
                  required
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm resize-none font-sans"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-navy-800 text-slate-300 hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-bold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

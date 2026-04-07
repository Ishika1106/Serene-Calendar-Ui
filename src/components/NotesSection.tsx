'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Download, Search, X } from 'lucide-react';
import { Note, formatDate } from '@/lib/calendar-utils';

interface NotesSectionProps {
  selectedStart: Date | null;
  selectedEnd: Date | null;
}

const STORAGE_KEY = 'forest-calendar-notes';

export default function NotesSection({ selectedStart, selectedEnd }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'date'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed.map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          date: n.date ? new Date(n.date) : null,
        })));
      } catch (e) {
        console.error('Failed to parse notes:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      date: activeTab === 'date' ? selectedStart : null,
      content: newNote.trim(),
      createdAt: new Date(),
    };
    
    setNotes([...notes, note]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const deleteAllNotes = () => {
    if (confirm('Delete all notes?')) {
      setNotes([]);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    
    setNotes(notes.map(n => 
      n.id === editingId ? { ...n, content: editContent.trim() } : n
    ));
    setEditingId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const exportNotes = () => {
    const generalNotes = notes.filter(n => !n.date);
    const dateNotes = notes.filter(n => n.date);

    let content = '=============================================================\n';
    content += '                 SERENE CALENDAR - NOTES\n';
    content += '=============================================================\n\n';

    if (generalNotes.length > 0) {
      content += '-------------------------------------------------------------\n';
      content += '                      MONTHLY NOTES\n';
      content += '-------------------------------------------------------------\n\n';
      
      const groupedByMonth: Record<string, Note[]> = {};
      generalNotes.forEach(note => {
        const date = new Date(note.createdAt);
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        if (!groupedByMonth[key]) groupedByMonth[key] = [];
        groupedByMonth[key].push(note);
      });

      Object.keys(groupedByMonth).sort().reverse().forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        content += monthName + '\n';
        content += '-------------------------------------\n';
        groupedByMonth[monthKey].forEach((note, idx) => {
          const noteDate = new Date(note.createdAt);
          content += '  ' + (idx + 1) + '. ' + note.content + '\n';
          content += '     Created: ' + noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '\n\n';
        });
      });
    }

    if (dateNotes.length > 0) {
      content += '\n-------------------------------------------------------------\n';
      content += '                    SELECTED DATE NOTES\n';
      content += '-------------------------------------------------------------\n\n';

      dateNotes.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
      
      let currentDate = '';
      dateNotes.forEach((note, idx) => {
        const noteDateStr = note.date ? formatDate(note.date) : '';
        if (noteDateStr !== currentDate) {
          currentDate = noteDateStr;
          content += noteDateStr + '\n';
          content += '-------------------------------------\n';
        }
        content += '  * ' + note.content + '\n\n';
      });
    }

    if (generalNotes.length === 0 && dateNotes.length === 0) {
      content += 'No notes to export.\n';
    }

    content += '\n=============================================================\n';
    content += 'Exported on: ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '\n';

    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'serene-calendar-notes-' + dateStr + '.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredNotes = () => {
    let filtered: Note[] = [];
    
    if (activeTab === 'general') {
      filtered = notes.filter(n => !n.date);
    } else {
      if (selectedStart && selectedEnd) {
        filtered = notes.filter(n => {
          if (!n.date) return false;
          return n.date >= selectedStart && n.date <= selectedEnd;
        });
      } else if (selectedStart) {
        filtered = notes.filter(n => n.date?.toDateString() === selectedStart.toDateString());
      }
    }
    
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredNotes = getFilteredNotes();
  const getDateLabel = function() {
    if (!selectedStart) return 'Select dates';
    if (selectedEnd) return formatDate(selectedStart) + ' - ' + formatDate(selectedEnd);
    return formatDate(selectedStart);
  };
  const dateLabel = getDateLabel();

  return (
    <div className="relative">
      {/* Header with tabs and actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${
              activeTab === 'general' 
                ? 'bg-white/20 text-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab('date')}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${
              activeTab === 'date' 
                ? 'bg-white/20 text-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            Selected
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-all ${showSearch ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Search notes"
          >
            {showSearch ? <X size={16} /> : <Search size={16} />}
          </button>
          <button
            onClick={exportNotes}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            title="Export notes"
          >
            <Download size={16} />
          </button>
          <button
            onClick={deleteAllNotes}
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10"
            title="Delete all notes"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Search input */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm"
          />
        </motion.div>
      )}

      {/* Date label */}
      {activeTab === 'date' && selectedStart && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-3 py-2 rounded-lg text-sm text-white/70 bg-white/5"
        >
          {dateLabel}
        </motion.div>
      )}

      {/* Notes content */}
      <div 
        className="min-h-[150px] p-2 rounded-lg"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.05) 31px, rgba(255,255,255,0.05) 32px)',
        }}
      >
        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            placeholder={activeTab === 'general' ? 'Write a note...' : 'Note for selected dates...'}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm backdrop-blur-sm focus:outline-none focus:bg-white/20 transition-all duration-300"
          />
          <motion.button
            onClick={addNote}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-all duration-300"
          >
            <Plus size={18} />
          </motion.button>
        </div>

        {/* Notes list */}
        <div className="space-y-1">
          <AnimatePresence>
            {filteredNotes.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">
                {searchQuery ? 'No matching notes found' : activeTab === 'general' ? 'No notes yet' : 'No notes for selected dates'}
              </p>
            ) : (
              filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-white/40 text-lg leading-none mt-0.5">•</span>
                  
                  {editingId === note.id ? (
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 min-w-[100px] px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-sm"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs text-white/50 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-sm text-white/80 break-words">{note.content}</p>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                        <button
                          onClick={() => startEdit(note)}
                          className="text-xs px-2 py-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs px-2 py-1 text-white/40 hover:text-red-400 rounded hover:bg-white/10"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notes count */}
      <div className="text-center mt-2 text-white/40 text-xs">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
    </div>
  );
}
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Download, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Note, formatDate } from '@/lib/calendar-utils';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { downloadNotesAsText } from '@/lib/exportNotes';

interface NotesSectionProps {
  selectedStart: Date | null;
  selectedEnd: Date | null;
}

const STORAGE_KEY = 'serene-calendar-notes';

export default function NotesSection({ selectedStart, selectedEnd }: NotesSectionProps) {
  const [notes, setNotes] = useLocalStorage<Note[]>(STORAGE_KEY, []);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'date'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewNoteId, setPreviewNoteId] = useState<string | null>(null);

  // Parse dates when notes are loaded
  useEffect(() => {
    setNotes(prev => prev.map(n => ({
      ...n,
      createdAt: new Date(n.createdAt),
      date: n.date ? new Date(n.date) : null,
    })));
  }, []);

  const addNote = useCallback(() => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      date: activeTab === 'date' ? selectedStart : null,
      content: newNote.trim(),
      createdAt: new Date(),
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote('');
  }, [newNote, activeTab, selectedStart, setNotes]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);

  const deleteAllNotes = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteAll = useCallback(() => {
    setNotes([]);
    setShowDeleteConfirm(false);
  }, [setNotes]);

  const cancelDeleteAll = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const startEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editContent.trim()) return;
    
    setNotes(prev => prev.map(n => 
      n.id === editingId ? { ...n, content: editContent.trim() } : n
    ));
    setEditingId(null);
    setEditContent('');
  }, [editingId, editContent, setNotes]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent('');
  }, []);

  const exportNotes = useCallback(() => {
    downloadNotesAsText(notes);
  }, [notes]);

  const getFilteredNotes = useCallback(() => {
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
  }, [notes, activeTab, selectedStart, selectedEnd, searchQuery]);

  const filteredNotes = getFilteredNotes();
  
  const dateLabel = (() => {
    if (!selectedStart) return 'Select dates';
    if (selectedEnd) return formatDate(selectedStart) + ' - ' + formatDate(selectedEnd);
    return formatDate(selectedStart);
  })();

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
            aria-label={showSearch ? "Close search" : "Search notes"}
          >
            {showSearch ? <X size={16} /> : <Search size={16} />}
          </button>
          <button
            onClick={exportNotes}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            aria-label="Export notes"
          >
            <Download size={16} />
          </button>
          <button
            onClick={deleteAllNotes}
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10"
            aria-label="Delete all notes"
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
                        aria-label="Save note"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs text-white/50 hover:text-white"
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {previewNoteId === note.id ? (
                        <div className="flex-1 text-sm text-white/90 prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              code({node, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                const isInline = !match;
                                return !isInline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: '0.5rem 0', borderRadius: '0.5rem', fontSize: '0.75rem' } as React.CSSProperties}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-white/10 px-1 py-0.5 rounded text-yellow-300" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {note.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="flex-1 text-sm text-white/80 break-words">{note.content}</p>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                        <button
                          onClick={() => setPreviewNoteId(previewNoteId === note.id ? null : note.id)}
                          className="text-xs px-2 py-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                          aria-label={previewNoteId === note.id ? "Edit note" : "Preview note"}
                        >
                          {previewNoteId === note.id ? 'Edit' : 'Preview'}
                        </button>
                        <button
                          onClick={() => startEdit(note)}
                          className="text-xs px-2 py-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                          aria-label="Edit note"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs px-2 py-1 text-white/40 hover:text-red-400 rounded hover:bg-white/10"
                          aria-label="Delete note"
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

      {/* Delete confirmation modal - mobile responsive */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelDeleteAll}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-white mb-2">Delete All Notes?</h3>
              <p className="text-white/60 text-sm mb-4">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteAll}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white"
                  aria-label="Cancel delete all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAll}
                  className="px-4 py-2 text-sm bg-red-500/80 hover:bg-red-500 text-white rounded-lg"
                  aria-label="Confirm delete all notes"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
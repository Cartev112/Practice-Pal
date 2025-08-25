import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Routine } from '../../types/routineTypes';
import { Exercise } from '../../types/exerciseTypes';

interface AddRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  routine?: Routine | null;
}

import { apiUrl } from '../../utils/api';
const API_EXERCISES = apiUrl('/exercises');
const API_ROUTINES = apiUrl('/routines');

const AddRoutineModal: React.FC<AddRoutineModalProps> = ({ isOpen, onClose, onSaveSuccess, routine }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [durations, setDurations] = useState<Record<string, string>>({});
  
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (routine) {
        setTitle(routine.title);
        setDescription(routine.description || '');
        const ids = (routine.exerciseIds || []).map((e: any) => (typeof e === 'string' ? e : e.id));
        setSelectedIds(ids);
        // extract durations if provided
        const durs: Record<string,string> = {};
        (routine.exerciseIds || []).forEach((e: any)=>{
          if(typeof e === 'object' && e.id){
            durs[e.id] = e.duration || '';
          }
        });
        setDurations(durs);
      } else {
        setTitle('');
        setDescription('');
        setSelectedIds([]);
      }
      setSearch('');
    }
  }, [isOpen, routine]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_EXERCISES);
        const data: Exercise[] = await res.json();
        setExercises(data);
      } catch (e) {
        setError('Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    if (!id) return;
    // Only add if not already selected (avoids removing during reorder)
    if (!selectedIds.includes(id)) {
      toggleSelect(id);
    }
    
  };

  const handleDragOverLegacy = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDurationChange = (id: string, val: string) => {
    setDurations(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    const endpoint = routine ? `${API_ROUTINES}/${routine.id}` : API_ROUTINES;
    const method = routine ? 'PUT' : 'POST';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, exerciseIds: selectedIds.map(id => ({ id, duration: durations[id] || '' })) }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaveSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setSelectedIds([]);
    } catch {
      setError('Error saving routine');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const searchLower = search.toLowerCase();
  const filtered = exercises.filter(ex => {
    if (ex.title.toLowerCase().includes(searchLower)) return true;
    if (Array.isArray(ex.tags)) {
      return ex.tags.some(t => t.toLowerCase().includes(searchLower));
    }
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-6xl h-[90vh] rounded-lg bg-gray-900 p-6 shadow-xl overflow-hidden flex flex-col text-white">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Add Routine</h2>
        {error && <p className="mb-2 text-red-500">{error}</p>}
        
        <div className="mb-4 flex flex-1 gap-4 overflow-hidden">
          {/* Left panel: inputs + exercise search/list */}
          <div className="flex-1 overflow-y-auto rounded-md border p-2 border-gray-700">
            <input
              className="mb-3 w-full rounded-md border px-3 py-2 bg-gray-800 border-gray-700 text-white"
              placeholder="Routine title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="mb-4 w-full min-h-[80px] rounded-md border px-3 py-2 bg-gray-800 border-gray-700 text-white"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="mb-3 flex items-center space-x-2">
              <input
                className="flex-1 rounded-md border px-3 py-2 bg-gray-800 border-gray-700 text-white"
                placeholder="Search exercises..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {loading ? (
              <p className="text-center text-gray-400">Loading exercises...</p>
            ) : (
              filtered.map(ex => (
                <div
                  key={ex.id}
                  draggable
                  onDragStart={e => handleDragStart(e, ex.id)}
                  className="mb-2 rounded-md border p-2 shadow-sm border-gray-700 bg-gray-800 hover:bg-gray-750 cursor-grab"
                >
                  <p className="font-medium text-white">{ex.title}</p>
                  {ex.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{ex.description}</p>
                  )}
                  <button
                    className="mt-1 text-xs text-indigo-400 hover:underline"
                    onClick={() => toggleSelect(ex.id)}
                  >
                    {selectedIds.includes(ex.id) ? 'Remove' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Selected exercises (routine) */}
          <div
            className="flex-1 overflow-y-auto rounded-md border p-2 border-gray-700 bg-gray-800"
            onDrop={handleDrop} onDragOver={handleDragOverLegacy}
          >
            {selectedIds.length === 0 ? (
              <p className="text-center text-gray-400">Drag exercises here to add to routine</p>
            ) : (
              <DragDropContext
                onDragEnd={(result: DropResult) => {
                  const { destination, source } = result;
                  if (!destination) return;
                  if (destination.index === source.index) return;
                  const newOrder = Array.from(selectedIds);
                  const [removed] = newOrder.splice(source.index, 1);
                  newOrder.splice(destination.index, 0, removed);
                  setSelectedIds(newOrder);
                }}
              >
                <Droppable droppableId="routine-list">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {selectedIds.map((id, idx) => {
                const ex = exercises.find(e => e.id === id);
                if (!ex) return null;
                return (
                  <Draggable key={id} draggableId={id} index={idx}>
                    {(provided) => (
                      <div
                        draggable={false}
                        title="Drag to reorder"
                        className="mb-2 flex justify-between rounded-md border p-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors"
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                      >
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{ex.title}</p>
                          {ex.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{ex.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="min"
                            value={durations[id] || ''}
                            onChange={e => handleDurationChange(id, e.target.value)}
                            className="w-16 rounded-md border px-1 py-0.5 text-sm dark:bg-gray-600 dark:text-white text-gray-800"
                          />
                          <button
                            aria-label="Remove"
                            title="Remove"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => toggleSelect(id)}
                          >
                            ❌
                          </button>
                        </div>
                        
                      </div>
                    )}
                  </Draggable>
                );
              })}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="rounded-md bg-gray-300 px-4 py-2 hover:bg-gray-400 dark:bg-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoutineModal;

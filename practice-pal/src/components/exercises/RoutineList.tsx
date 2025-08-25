import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AddRoutineModal from './AddRoutineModal';
import { Routine } from '../../types/routineTypes';
import { Exercise } from '../../types/exerciseTypes';

const API_ROUTINES = apiUrl('/routines');
import { apiUrl } from '../../utils/api';
const API_EXERCISES = apiUrl('/exercises');

const RoutineList: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [allTags, setAllTags] = useState<string[]>(['All']);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTINES);
      if (!res.ok) throw new Error('Failed to fetch routines');
      const data: Routine[] = await res.json();
      setRoutines(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
    (async () => {
      try {
        const res = await fetch(API_EXERCISES);
        const ex: Exercise[] = await res.json();
        setExerciseMap(Object.fromEntries(ex.map(e => [e.id, e])));
      } catch {/* ignore */}
    })();
  }, []);

  // Build derived categories/tags from the exercises used in routines
  useEffect(() => {
    // Collect categories and tags from all exercises referenced by routines
    const catSet = new Set<string>();
    const tagSet = new Set<string>();
    for (const r of routines) {
      for (const item of r.exerciseIds) {
        const ex = exerciseMap[item.id];
        if (!ex) continue;
        if (ex.category) catSet.add(ex.category);
        (ex.tags || []).forEach(t => tagSet.add(t));
      }
    }
    setCategories(['All', ...Array.from(catSet).sort()]);
    setAllTags(['All', ...Array.from(tagSet).sort()]);
  }, [routines, exerciseMap]);

  const deleteRoutine = async (id: string) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      const res = await fetch(`${API_ROUTINES}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      fetchRoutines();
    } catch {
      setError('Error deleting routine');
    }
  };

  const filteredRoutines = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let result = routines.filter(r =>
      r.title.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
    );

    if (selectedCategory !== 'All') {
      result = result.filter(r =>
        r.exerciseIds.some(item => exerciseMap[item.id]?.category === selectedCategory)
      );
    }
    if (selectedTag !== 'All') {
      result = result.filter(r =>
        r.exerciseIds.some(item => (exerciseMap[item.id]?.tags || []).includes(selectedTag))
      );
    }
    return result;
  }, [routines, searchTerm, selectedCategory, selectedTag, exerciseMap]);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow flex-1 min-h-0 flex flex-col">
      {/* Tabs: Exercises | Routines */}
      <div className="flex items-center justify-between mb-4">
        <nav className="flex items-center gap-2">
          <NavLink
            to="/exercises"
            className={({ isActive }) =>
              `text-xl font-semibold px-3 py-1 rounded-md transition-colors ${
                isActive ? 'bg-indigo-700 text-white' : 'hover:bg-indigo-700/60'
              }`
            }
          >
            Exercises
          </NavLink>
          <NavLink
            to="/routines"
            className={({ isActive }) =>
              `text-xl font-semibold px-3 py-1 rounded-md transition-colors ${
                isActive ? 'bg-indigo-700 text-white' : 'hover:bg-indigo-700/60'
              }`
            }
          >
            Routines
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className="px-3 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
          >
            ← Home
          </NavLink>
          <button
            onClick={() => {setEditingRoutine(null);setModalOpen(true);}}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            + Add Routine
          </button>
        </div>
      </div>
      {/* Section Title */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg">Available Routines</h3>
      </div>

      {/* Search and Filter Controls (mirrors ExerciseList) */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search routines..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-600 bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-600 bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={e => setSelectedTag(e.target.value)}
          className="px-3 py-2 border border-gray-600 bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {allTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-center text-gray-400">Loading routines...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && (
        <ul className="space-y-2 overflow-y-auto flex-1">
          {filteredRoutines.length ? (
            filteredRoutines.map(r => (
              <li key={r.id} className="flex items-start justify-between rounded-md bg-gray-700 p-3">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  {r.description && <p className="text-sm text-gray-300">{r.description}</p>}
                  <p className="mt-1 text-xs">
                    Exercises: {r.exerciseIds.map(item => exerciseMap[item.id]?.title || item.id).join(', ')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    aria-label="Edit"
                    title="Edit"
                    className="text-yellow-300 hover:text-yellow-400"
                    onClick={() => {setEditingRoutine(r);setModalOpen(true);}}
                  >
                    ✏️
                  </button>
                  <button
                    aria-label="Delete"
                    title="Delete"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => deleteRoutine(r.id)}
                  >
                    ❌
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p className="flex-grow text-center text-gray-400">No routines found.</p>
          )}
        </ul>
      )}

      <AddRoutineModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRoutine(null);
        }}
        onSaveSuccess={() => {
          fetchRoutines();
          setModalOpen(false);
          setEditingRoutine(null);
        }}
        routine={editingRoutine}
      />
    </div>
  );
};

export default RoutineList;

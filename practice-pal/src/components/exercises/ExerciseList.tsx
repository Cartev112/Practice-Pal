import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import AddExerciseModal from './AddExerciseModal'; // Import the modal
import { Exercise } from '../../types/exerciseTypes'; // Import shared type

interface ExerciseListProps {
  onSelectExercise: (exercise: Exercise) => void;
}

import { apiUrl } from '../../utils/api';
const API_URL = apiUrl('/exercises');

const ExerciseList: React.FC<ExerciseListProps> = ({ onSelectExercise }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [allTags, setAllTags] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null); // State for exercise being edited

  // Fetch exercises from the API
  const fetchExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Exercise[] = await response.json();
      setExercises(data);

      // Extract unique categories and tags
      const uniqueCategories = ['All', ...new Set(data.map(ex => ex.category))];
      setCategories(uniqueCategories);

      const tagsFlat = data.flatMap(ex => ex.tags || []);
      const uniqueTags = ['All', ...new Set(tagsFlat)];
      setAllTags(uniqueTags);

    } catch (e) {
      console.error("Failed to fetch exercises:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Filter exercises based on search term and category
  useEffect(() => {
    let filtered = exercises;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    if (selectedTag !== 'All') {
      filtered = filtered.filter(ex => (ex.tags || []).includes(selectedTag));
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ex =>
          ex.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          ex.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          (ex.tags || []).some(t => t.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, selectedCategory, selectedTag]);

  // Handlers for modal actions
  const handleOpenModal = (exercise: Exercise | null = null) => {
    setEditingExercise(exercise); // Set null for adding, exercise object for editing
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExercise(null); // Clear editing state
  };

  // Save or Update Exercise
  const handleSaveExercise = async (exerciseData: Omit<Exercise, 'id'> | Exercise) => {
    const method = 'id' in exerciseData ? 'PUT' : 'POST';
    const url = 'id' in exerciseData ? `${API_URL}/${exerciseData.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${method === 'POST' ? 'add' : 'update'} exercise`);
      }

      // Refetch exercises to update the list
      fetchExercises(); 
      handleCloseModal(); // Close modal on success

    } catch (error) {
      console.error('Error saving exercise:', error);
      setError(error instanceof Error ? error.message : 'Could not save exercise');
      // Optionally, keep the modal open on error
    }
  };

  // --- Delete Exercise --- (Optional but good to have)
  const handleDeleteExercise = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete exercise');
        }
        // Refetch exercises after successful deletion
        fetchExercises();
    } catch (error) {
        console.error('Error deleting exercise:', error);
        setError(error instanceof Error ? error.message : 'Could not delete exercise');
    }
};

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
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            + Add Exercise
          </button>
        </div>
      </div>
      
      {/* Section Title */}
      <div className="mb-4">
        <h3 className="text-lg">Available Exercises</h3>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search exercises..."
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

      {/* Exercise List */}
      {isLoading && <p className="text-center text-gray-400">Loading exercises...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {!isLoading && !error && (
        <ul className="space-y-2 overflow-y-auto flex-1">
          {filteredExercises.length > 0 ? (
            filteredExercises.map(exercise => (
              <li
                key={exercise.id}
                className="p-3 bg-gray-700 rounded-md hover:bg-gray-600 cursor-pointer flex justify-between items-center"
              >
                <div onClick={() => onSelectExercise(exercise)} className="flex-1"> {/* Make text clickable */}
                  <span className="font-medium">{exercise.title}</span>
                  <p className="text-sm text-gray-400 truncate">{exercise.description}</p>
                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {exercise.tags.map(tag => (
                        <span key={tag} className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Edit and Delete Buttons */}
                <div className="flex space-x-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(exercise); }} // Prevent triggering onSelectExercise
                        className="text-sm text-blue-400 hover:text-blue-300 p-1"
                        aria-label={`Edit ${exercise.title}`}
                    >
                        Edit
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteExercise(exercise.id); }}
                        className="text-sm text-red-400 hover:text-red-300 p-1"
                        aria-label={`Delete ${exercise.title}`}
                    >
                        Delete
                    </button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-center text-gray-400">No exercises found.</p>
          )}
        </ul>
      )}
      
      {/* Render the Modal */}
      <AddExerciseModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveExercise}
        initialData={editingExercise} // Pass data for editing, or null for adding
      />
    </div>
  );
};

export default ExerciseList;
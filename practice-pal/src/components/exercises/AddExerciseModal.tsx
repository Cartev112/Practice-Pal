import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../../types/exerciseTypes'; // Import shared type
import SheetMusicEditorModal from '../sheetmusic/SheetMusicEditorModal'; // Import the new modal

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Omit<Exercise, 'id'> | Exercise) => void; // Use imported Exercise type, allow omitting ID for new
  initialData?: Exercise | null; // For editing existing exercises (optional)
}

// Define a default exercise state conforming to the Exercise type (without id)
const defaultExerciseState: Omit<Exercise, 'id'> = {
  title: '',
  description: '',
  tempo: 120,
  timeSignature: [4, 4],
  notes: [],
  tags: [],
  category: 'Custom',
};

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  // State now uses Omit<Exercise, 'id'> | Exercise to handle both add/edit cases correctly
  const [exercise, setExercise] = useState<Omit<Exercise, 'id'> | Exercise>(defaultExerciseState);
  const [notesString, setNotesString] = useState('');
  const [tagsString, setTagsString] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSheetMusicEditorOpen, setIsSheetMusicEditorOpen] = useState(false); // State for sheet music modal

  useEffect(() => {
    // Reset when modal opens or initialData changes
    if (initialData) {
      const safeNotes = Array.isArray(initialData.notes) ? initialData.notes : [];
      const safeTags = Array.isArray(initialData.tags) ? initialData.tags : [];
      // Coerce timeSignature
      let safeTS: [number, number] = [4, 4];
      const ts = (initialData as any).timeSignature;
      if (Array.isArray(ts) && ts.length === 2) {
        const a = Number(ts[0]);
        const b = Number(ts[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) safeTS = [a, b];
      } else if (typeof ts === 'string' && ts.includes('/')) {
        const parts = ts.split('/');
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) safeTS = [a, b];
      }
      const safeTempo = Number((initialData as any).tempo);
      const tempoNum = Number.isNaN(safeTempo) ? 120 : safeTempo;
      const safeTitle = typeof initialData.title === 'string' ? initialData.title : '';
      const safeDesc = typeof initialData.description === 'string' ? initialData.description : '';

      setExercise({
        ...(initialData as Exercise),
        title: safeTitle,
        description: safeDesc,
        tempo: tempoNum,
        timeSignature: safeTS,
        notes: safeNotes,
        tags: safeTags,
      });
      setNotesString(safeNotes.join(', '));
      setTagsString(safeTags.join(', '));
    } else {
      setExercise(defaultExerciseState);
      setNotesString('');
      setTagsString('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Ensure tempo is parsed as number
    const processedValue = name === 'tempo' ? parseInt(value, 10) || 0 : value;
    
    setExercise(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleTimeSignatureChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) return; // Basic validation

    setExercise(prev => {
      const newTimeSignature: [number, number] = [...prev.timeSignature];
      newTimeSignature[index] = numValue;
      return { ...prev, timeSignature: newTimeSignature };
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotesString(e.target.value);
    // Basic parsing - split by comma, trim whitespace
    const notesArray = e.target.value.split(',').map(note => note.trim()).filter(note => note !== '');
    setExercise(prev => ({ ...prev, notes: notesArray }));
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsString(e.target.value);
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setExercise(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation if needed
    onSave(exercise);
    onClose(); // Close modal after saving
  };

  // Handler to open the sheet music editor
  const handleOpenSheetMusicEditor = () => {
    setIsSheetMusicEditorOpen(true);
  };

  // Handler to close the sheet music editor
  const handleCloseSheetMusicEditor = () => {
    setIsSheetMusicEditorOpen(false);
    // Potentially handle saving/updating notes from editor here in the future
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setImportError(null);
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:3001/import/musescore', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Import failed with status ${res.status}`);
      const data = await res.json();
      if (!data.notes || !Array.isArray(data.notes)) throw new Error('Invalid response');
      setNotesString(data.notes.join(', '));
      setExercise(prev => ({ ...prev, notes: data.notes }));
    } catch (err: any) {
      setImportError(err.message || 'MusicXML import error');
    } finally {
      setImportLoading(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Added dark mode background and text color */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full text-gray-900 dark:text-gray-100">
        {/* Added dark mode text color */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{initialData ? 'Edit Exercise' : 'Add New Exercise'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            {/* Added dark mode text color */}
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={exercise.title}
              onChange={handleChange}
              required
              // Added dark mode styles for input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-4">
            {/* Added dark mode text color */}
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={exercise.description}
              onChange={handleChange}
              rows={3}
              // Added dark mode styles for textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              {/* Added dark mode text color */}
              <label htmlFor="tempo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tempo (BPM)</label>
              <input
                type="number"
                id="tempo"
                name="tempo"
                value={exercise.tempo}
                onChange={handleChange}
                min="30"
                max="300"
                required
                // Added dark mode styles for input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              {/* Added dark mode text color */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Signature</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={exercise.timeSignature[0]}
                  onChange={(e) => handleTimeSignatureChange(0, e.target.value)}
                  min="1"
                  // Added dark mode styles for input
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {/* Added dark mode text color */}
                <span className="text-gray-500 dark:text-gray-400">/</span>
                <input
                  type="number"
                  value={exercise.timeSignature[1]}
                  onChange={(e) => handleTimeSignatureChange(1, e.target.value)}
                  min="1" // Denominator usually 2, 4, 8, 16
                  // Added dark mode styles for input
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            {/* Added dark mode text color */}
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (comma-separated, e.g., C4, E4, G4)</label>
            <input
              type="text"
              id="notes"
              name="notes"
              value={notesString}
              onChange={handleNotesChange}
              placeholder="C4, D4, E4, F4, G4"
              // Added dark mode styles for input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {/* Button to open sheet music editor - updated onClick */}
            <button
              type="button"
              onClick={handleOpenSheetMusicEditor} // Use handler to open sheet music modal
              className="mt-2 px-3 py-1.5 inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                {/* Simple Treble Clef Path - you might want a better one */}
                <path fillRule="evenodd" d="M12.906 2.334c-.11.074-.23.11-.354.11-.124 0-.244-.036-.354-.11C11.19 1.64 10 2.75 10 4.255V10c0 .414.336.75.75.75s.75-.336.75-.75V5.78c.46-.237.897-.54 1.298-.897.39-.346.735-.73.998-1.134.263-.404.43-1.013.43-1.643 0-.31-.04-.594-.12-.836a1.63 1.63 0 0 0-.096-.21zm-3.812 0c.11.074.23.11.354.11.124 0 .244-.036.354-.11C10.81 1.64 12 2.75 12 4.255V15.75c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.54c-1.018.36-1.96.98-2.688 1.785-.573.635-1.01 1.42-1.01 2.255 0 .834.437 1.62 1.01 2.255.728.805 1.67 1.425 2.688 1.785v.46a.75.75 0 0 1-1.5 0v-.46C8.27 19.48 7 18.09 7 16.25c0-.834.437-1.62 1.01-2.255.728-.805 1.67-1.425 2.688-1.785V5.78c-.46-.237-.897-.54-1.298-.897-.39-.346-.735-.73-.998-1.134-.263-.404-.43-1.013-.43-1.643 0-.31.04-.594.12-.836.017-.05.04-.1.065-.15.01-.018.02-.037.031-.056z" clipRule="evenodd" />
              </svg>
              Edit Notation
            </button>
            <button
              type="button"
              onClick={handleImportClick} // import musicxml
              className="mt-2 px-3 py-1.5 inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                {/* Simple Treble Clef Path - you might want a better one */}
                <path fillRule="evenodd" d="M12.906 2.334c-.11.074-.23.11-.354.11-.124 0-.244-.036-.354-.11C11.19 1.64 10 2.75 10 4.255V10c0 .414.336.75.75.75s.75-.336.75-.75V5.78c.46-.237.897-.54 1.298-.897.39-.346.735-.73.998-1.134.263-.404.43-1.013.43-1.643 0-.31-.04-.594-.12-.836a1.63 1.63 0 0 0-.096-.21zm-3.812 0c.11.074.23.11.354.11.124 0 .244-.036.354-.11C10.81 1.64 12 2.75 12 4.255V15.75c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.54c-1.018.36-1.96.98-2.688 1.785-.573.635-1.01 1.42-1.01 2.255 0 .834.437 1.62 1.01 2.255.728.805 1.67 1.425 2.688 1.785v.46a.75.75 0 0 1-1.5 0v-.46C8.27 19.48 7 18.09 7 16.25c0-.834.437-1.62 1.01-2.255.728-.805 1.67-1.425 2.688-1.785V5.78c-.46-.237-.897-.54-1.298-.897-.39-.346-.735-.73-.998-1.134-.263-.404-.43-1.013-.43-1.643 0-.31.04-.594.12-.836.017-.05.04-.1.065-.15.01-.018.02-.037.031-.056z" clipRule="evenodd" />
              </svg>
              Import MusicXML
            </button>
          </div>
          
          <div className="mb-4">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={tagsString}
              onChange={handleTagsChange}
              placeholder="arpeggio, warm-up, jazz"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="mb-6">
            {/* Added dark mode text color */}
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={exercise.category}
              onChange={handleChange}
              // Added dark mode styles for input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              // Added dark mode styles for cancel button
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              // Added dark mode styles for submit button
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              {initialData ? 'Save Changes' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Render Sheet Music Editor Modal */}
      <SheetMusicEditorModal 
        isOpen={isSheetMusicEditorOpen}
        onClose={handleCloseSheetMusicEditor}
      />
    </div>
  );
};

export default AddExerciseModal;

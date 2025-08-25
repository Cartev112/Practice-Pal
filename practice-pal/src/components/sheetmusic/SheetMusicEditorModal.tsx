import React, { useRef, useEffect, useState } from 'react';
import { Renderer, Stave } from 'vexflow';

interface SheetMusicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Add props for passing notation data in/out later
}

const SheetMusicEditorModal: React.FC<SheetMusicEditorModalProps> = ({ isOpen, onClose }) => {
  const vexflowContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const contextRef = useRef<any | null>(null);
  const staveRef = useRef<Stave | null>(null);

  // --- Editor State ---
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('q'); // Default to quarter note
  const [selectedAccidental, setSelectedAccidental] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  // --- Hover/Interaction State ---
  const [hoverNoteKey, setHoverNoteKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vexflowContainerRef.current) {
      const container = vexflowContainerRef.current;

      // Clear previous render if any
      container.innerHTML = '';
      rendererRef.current = null;

      // Calculate padding (Tailwind p-6 typically maps to 1.5rem = 24px)
      const padding = 24;
      const horizontalPadding = padding * 2;
      const verticalPadding = padding * 2;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Available drawing area dimensions
      const availableWidth = containerWidth - horizontalPadding;
      const availableHeight = containerHeight - verticalPadding;

      // Initialize Renderer
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      rendererRef.current = renderer;

      // Configure renderer size to fit available drawing area
      renderer.resize(availableWidth, availableHeight);

      // Store context in ref
      contextRef.current = renderer.getContext();
      contextRef.current.setFont('Arial', 10);

      // Create and store stave in ref
      const staveX = 10;
      const staveY = 10;
      const staveWidth = availableWidth - staveX - 10;
      const stave = new Stave(staveX, staveY, staveWidth);
      staveRef.current = stave;

      // Add a clef and time signature.
      stave.addClef('treble').addTimeSignature('4/4');

      // Connect it to the rendering context and draw!
      stave.setContext(contextRef.current).draw();

    } else if (!isOpen && vexflowContainerRef.current) {
      // Clear container when modal closes
      vexflowContainerRef.current.innerHTML = '';
      rendererRef.current = null;
      contextRef.current = null;
      staveRef.current = null;
    }

  }, [isOpen]);

  // Direct mapping for Treble Clef based on VexFlow's downward line number (rounded to 0.5)
  // lineNumber 0 = F5 (top line), 4 = E4 (bottom line)
  // musicalLine 0 = E4 (bottom line), 4 = F5 (top line)
  const noteMap: { [key: number]: { key: string, octave: number, musicalLine: number } } = {
    // Lines
    0: { key: 'f', octave: 5, musicalLine: 4 },    // Top line
    1: { key: 'd', octave: 5, musicalLine: 3 },    // Middle line
    2: { key: 'b', octave: 4, musicalLine: 2 },    // Line above bottom
    3: { key: 'g', octave: 4, musicalLine: 1 },    // Line below middle
    4: { key: 'e', octave: 4, musicalLine: 0 },    // Bottom line
    // Spaces
    0.5: { key: 'e', octave: 5, musicalLine: 3.5 }, // Space above middle
    1.5: { key: 'c', octave: 5, musicalLine: 2.5 }, // Space below middle
    2.5: { key: 'a', octave: 4, musicalLine: 1.5 }, // Space above bottom
    3.5: { key: 'f', octave: 4, musicalLine: 0.5 }, // Space below bottom
    // Optionally add ledger lines later
    // -0.5: { key: 'g', octave: 5, musicalLine: 4.5 }, // Space above top line
    // -1.0: { key: 'a', octave: 5, musicalLine: 5.0 }, // Ledger line above
    // 4.5: { key: 'd', octave: 4, musicalLine: -0.5 }, // Space below bottom line
    // 5.0: { key: 'c', octave: 4, musicalLine: -1.0 }, // Ledger line below
  };

  const getNoteInfoForTrebleClef = (roundedLineNumber: number): { key: string, octave: number, musicalLine: number } | null => {
      return noteMap[roundedLineNumber] || null;
  };

  // --- Event Handlers ---
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !vexflowContainerRef.current || !staveRef.current) {
        console.log('Hover ignored: Editing disabled or refs not ready');
        setHoverNoteKey(null);
        return;
    }
    
    console.log('handleMouseMove - isEditing:', isEditing); // Log 1
    const stave = staveRef.current;
    const container = vexflowContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left - container.clientLeft; // x position within the element.
    const mouseYInContainer = event.clientY - rect.top - container.clientTop; // y relative to container
    const yRelativeToStave = mouseYInContainer - stave.getY(); // Adjust y to be relative to stave's top

    console.log('Mouse Coords:', { containerY: mouseYInContainer, staveY: yRelativeToStave }); // Log 2 Updated

    // Use VexFlow to find the note corresponding to the Y position
    const lineNumber = stave.getLineForY(yRelativeToStave); // Use adjusted y
    const roundedLineNumber = Math.round(lineNumber * 2) / 2; // Round to nearest 0.5 (0=top, 4=bottom)
    // *** Adjust by -0.5 because it's registering one note too low ***
    const adjustedLookupLineNumber = roundedLineNumber - 1;
    const noteInfo = getNoteInfoForTrebleClef(adjustedLookupLineNumber);

    console.log('Line Number Adjustment:', { lineNumber, roundedLineNumber, adjustedLookupLineNumber });
    console.log('VexFlow Results:', { noteInfo }); // Log 3a Updated

    if (!noteInfo) {
        console.log('No valid note props found for this Y');
        setHoverNoteKey(null);
        return;
    }

    const noteKey = `${noteInfo.key}/${noteInfo.octave}`; // e.g., c/4
    setHoverNoteKey(noteKey);

    // Get the actual Y coordinate for the center of that note line/space
    // *** Revert to using musicalLine (0=bottom, 4=top) for getYForNote ***
    console.log(`Passing musicalLine to getYForNote: ${noteInfo.musicalLine}`);
    const snappedYRelativeToStave = stave.getYForNote(noteInfo.musicalLine);
    console.log(`Result from getYForNote(${noteInfo.musicalLine}): ${snappedYRelativeToStave}`);

    // Convert back to container-relative Y for positioning the absolute element
    const snappedYInContainer = stave.getY() + snappedYRelativeToStave;

    console.log('Stave Properties:', { staveY: stave.getY(), spacing: stave.getSpacingBetweenLines() }); // Log Stave Info
    console.log('Line Numbers:', { vexLine: lineNumber, roundedVexLine: roundedLineNumber, musicalLine: noteInfo.musicalLine }); // Log Line Numbers
    console.log('Snapped Y:', { relativeToStave: snappedYRelativeToStave, inContainer: snappedYInContainer }); // Log Snapped Y

    // TODO: Implement horizontal snapping
    const snappedX = x; // For now, just use the raw mouse X

    console.log('Final Hover State:', { hoverNoteKey: noteKey, finalGhostPos: { x: snappedX, y: snappedYInContainer } }); // Log Final Position

  };

  const handleMouseLeave = () => {
      setHoverNoteKey(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !vexflowContainerRef.current || !staveRef.current) {
        console.log('[Click] Ignored: Editing disabled or refs not ready.');
        return;
    }
    // Only activate for the first note (if selectionRect is already defined, do nothing)
    if (selectionRect) {
        return;
    }
    const stave = staveRef.current;
    const container = vexflowContainerRef.current;
    const rect = container.getBoundingClientRect();

    // Compute container-relative coordinates
    const x = event.clientX - rect.left - container.clientLeft;
    const mouseYInContainer = event.clientY - rect.top - container.clientTop;
    const yRelativeToStave = mouseYInContainer - stave.getY();

    // Get the VexFlow line number and adjust
    const lineNumber = stave.getLineForY(yRelativeToStave);
    const roundedLineNumber = Math.round(lineNumber * 2) / 2;
    const adjustedLookupLineNumber = roundedLineNumber - 1;
    const noteInfo = getNoteInfoForTrebleClef(adjustedLookupLineNumber);

    if (!noteInfo) {
        console.log('[Click] No valid note information found.');
        return;
    }

    console.log(`[Click] Selected note: ${noteInfo.key}/${noteInfo.octave}`);
    const snappedYRelativeToStave = stave.getYForNote(noteInfo.musicalLine);
    const snappedYInContainer = stave.getY() + snappedYRelativeToStave;

    // Duration mapping: width fraction of measure
    const durationMapping: Record<string, number> = { 'w': 1, 'h': 2, 'q': 4, '8': 8, '16': 16 };
    const denom = durationMapping[selectedDuration] || 4; // default to quarter note if not set
    const rectWidth = stave.getWidth() / denom;
    const rectHeight = stave.getSpacingBetweenLines();
    const rectX = stave.getX();
    const rectY = snappedYInContainer - rectHeight / 2;

    setSelectionRect({ x: rectX, y: rectY, width: rectWidth, height: rectHeight });
    console.log('[Click] Selection rectangle set:', { x: rectX, y: rectY, width: rectWidth, height: rectHeight });
  };

  // --- End Event Handlers ---

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60]">
      {/* Modal Container - 75% width */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-3/4 h-5/6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sheet Music Editor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar Area */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center space-x-2">
          {/* Edit Toggle Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded ${isEditing ? 'bg-indigo-200 dark:bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500`}
            title={isEditing ? "Disable Editing" : "Enable Editing"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
          {/* Note Duration Buttons */}
          <div className="duration-buttons">
            {['w', 'h', 'q', '8', '16'].map((dur) => (
              <button
                key={dur}
                className={selectedDuration === dur ? 'selected' : ''}
                onClick={() => setSelectedDuration(dur)}
              >
                {dur.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Note Accidental Buttons */}
          <div className="accidental-buttons">
            {['#', 'b', 'n'].map((acc) => (
              <button
                key={acc}
                className={selectedAccidental === acc ? 'selected' : ''}
                onClick={() => setSelectedAccidental(acc)}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - VexFlow Container */}
        <div
          ref={vexflowContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="flex-grow p-6 overflow-hidden w-full h-full relative bg-white dark:bg-gray-800"
        >
          {/* VexFlow SVG will be rendered here */}
          {selectionRect && (
            <div
              className="absolute border-2 border-red-500 pointer-events-none"
              style={{
                left: `${selectionRect.x}px`,
                top: `${selectionRect.y}px`,
                width: `${selectionRect.width}px`,
                height: `${selectionRect.height}px`
              }}
            />
          )}
        </div>

        {/* Footer (Optional) */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose} // For now, just closes
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-offset-gray-800"
          >
            Save Notation
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicEditorModal;

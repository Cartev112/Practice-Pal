import express, { Request, Response } from 'express';
import multer from 'multer';
import { parseStringPromise } from 'xml2js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to convert a MusicXML pitch object to a note string, e.g. C#4
function pitchToNote(pitch: any): string {
  if (!pitch || !pitch.step || !pitch.octave) return '';
  const step: string = pitch.step[0];
  const alter: number = pitch.alter ? parseInt(pitch.alter[0], 10) : 0;
  const octave: string = pitch.octave[0];
  const accidental = alter === 1 ? '#' : alter === -1 ? 'b' : '';
  return `${step}${accidental}${octave}`;
}

// POST /import/musescore – accepts a MusicXML file and returns extracted note list
router.post('/musescore', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const xml = req.file.buffer.toString('utf8');
    const result = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
    });

    const score = result['score-partwise'] || result['score-timewise'];
    if (!score) {
      return res.status(400).json({ error: 'Invalid MusicXML format' });
    }

    // Traverse measures -> notes
    const parts = Array.isArray(score.part) ? score.part : [score.part];
    const notes: string[] = [];

    parts.forEach((part: any) => {
      const measures = Array.isArray(part.measure) ? part.measure : [part.measure];
      measures.forEach((measure: any) => {
        const measureNotes = Array.isArray(measure.note) ? measure.note : [measure.note];
        measureNotes.forEach((note: any) => {
          if (note.rest) return; // skip rests
          const noteStr = pitchToNote(note.pitch);
          if (noteStr) notes.push(noteStr);
        });
      });
    });

    res.json({ notes });
  } catch (err) {
    console.error('MusicXML parse error:', err);
    res.status(500).json({ error: 'Failed to parse MusicXML' });
  }
});

export default router;

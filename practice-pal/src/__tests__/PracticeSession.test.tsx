import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PracticePage from '../pages/PracticePage';

// --- Utility mocks ---------------------------------------------------------
// Mock global fetch to avoid network calls
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ) as unknown as typeof fetch;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

// Dummy setup data used by mocked SessionSetupPanel
const DUMMY_SETUP = {
  metronomeTempo: 120,
  adaptiveTempo: false,
  mode: 'single',
  exerciseId: 'ex-1',
} as any;

// --- Component mocks -------------------------------------------------------
vi.mock('../components/practice/SessionSetupPanel', () => ({
  default: ({ onStart }: { onStart: (d: any) => void }) => {
    // Immediately trigger onStart with dummy data
    React.useEffect(() => {
      onStart(DUMMY_SETUP);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mock-setup" />;
  },
  __esModule: true,
}));

vi.mock('../components/practice/LiveControlsBar', () => ({
  default: () => <div data-testid="mock-live-controls" />, __esModule: true,
}));
vi.mock('../components/practice/AccuracyGraph', () => ({
  default: () => <div data-testid="mock-accuracy-graph" />, __esModule: true,
}));
vi.mock('../components/practice/AccuracyGauge', () => ({
  default: () => <div data-testid="mock-accuracy-gauge" />, __esModule: true,
}));
vi.mock('../components/practice/AdaptiveTempoGauge', () => ({
  default: () => <div data-testid="mock-adaptive-tempo" />, __esModule: true,
}));
vi.mock('../components/practice/FretboardVisual', () => ({
  default: () => <div data-testid="mock-fretboard" />, __esModule: true,
}));
vi.mock('../components/practice/ExerciseProgressList', () => ({
  default: () => <div data-testid="mock-progress-list" />, __esModule: true,
}));
vi.mock('../components/practice/SessionSummaryModal', () => ({
  default: () => <div data-testid="mock-summary-modal" />, __esModule: true,
}));

// MetronomeComponent mock – immediately starts and notifies parent
vi.mock('../components/audio/MetronomeComponent', () => ({
  default: ({ onMetronomeStart, onPlayingChange }: { onMetronomeStart: (t: number) => void; onPlayingChange: (b: boolean) => void }) => {
    React.useEffect(() => {
      const now = Date.now();
      onMetronomeStart(now);
      onPlayingChange(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mock-metronome" />;
  },
  __esModule: true,
}));

// PitchDetection mock – does nothing
vi.mock('../components/audio/PitchDetection', () => ({
  default: () => <div data-testid="mock-pitch" />, __esModule: true,
}));

// AudioInputComponent mock – feeds alternating loud/quiet frames
vi.mock('../components/audio/AudioInputComponent', () => {
  return {
    __esModule: true,
    default: ({ onAudioData, isRecording }: { onAudioData: (d: Float32Array) => void; isRecording: boolean }) => {
      const toggleRef = React.useRef(false);
      React.useEffect(() => {
        if (!isRecording) return;
        const id = setInterval(() => {
          // Create a frame: alternating between silence and loud signal
          const loud = toggleRef.current;
          toggleRef.current = !toggleRef.current;
          const data = new Float32Array(2048).fill(loud ? 0.4 : 0);
          onAudioData(data);
        }, 50); // 20 fps
        return () => clearInterval(id);
      }, [isRecording, onAudioData]);
      return <div data-testid="mock-audio-input" />;
    },
  };
});

// --- The test --------------------------------------------------------------

describe('Practice session integration', () => {
  it('updates Rhythm Analysis score in response to dummy audio onsets', async () => {
    render(<PracticePage />);

    // Advance timers to allow mocked components to initialize and audio to stream
    await act(async () => {
      vi.advanceTimersByTime(3000); // 3 seconds should be enough for several onsets
    });

    // We expect the rhythm score element to show non-zero value
    const scoreEl = await screen.findByText(/Rhythm Score/i);
    // The sibling span should eventually not be "0%". We query for any xxx% other than 0%.
    const percentEl = scoreEl.nextSibling as HTMLElement | null;
    expect(percentEl).toBeTruthy();
    if (percentEl) {
      // Remove the percent sign and parse
      const value = parseInt(percentEl.textContent?.replace('%', '') || '0', 10);
      expect(value).toBeGreaterThan(0);
    }
  });
});

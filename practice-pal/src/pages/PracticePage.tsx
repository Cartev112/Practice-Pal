import React, { useEffect, useState, useRef } from 'react';
import SessionSetupPanel, { SessionSetupData } from '../components/practice/SessionSetupPanel';
import LiveControlsBar from '../components/practice/LiveControlsBar';
import AccuracyGraph from '../components/practice/AccuracyGraph';
import AccuracyGauge from '../components/practice/AccuracyGauge';
import AdaptiveTempoGauge from '../components/practice/AdaptiveTempoGauge';
import MetronomeComponent from '../components/audio/MetronomeComponent';
import { useMetronome } from '../contexts/MetronomeContext';
import RhythmAnalysis from '../components/audio/RhythmAnalysis';
import AudioInputComponent from '../components/audio/AudioInputComponent';
import PitchDetection from '../components/audio/PitchDetection';
import FretboardVisual from '../components/practice/FretboardVisual';
import { useNavigate } from 'react-router-dom';
import SessionSummaryModal, { Summary } from '../components/practice/SessionSummaryModal';
import ExerciseProgressList, { ProgressItem } from '../components/practice/ExerciseProgressList';
import { Routine } from '../types/routineTypes';

interface PracticePageProps {
  tempo?: number;
  isPlaying?: boolean;
  isRecording?: boolean;
  onTempoChange?: (tempo: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onAudioData?: (data: Float32Array) => void;
  onStartPractice?: () => void;
  onEndPractice?: (session: any) => void;
  onDiscardPractice?: () => void;
  currentSessionData?: any;
}

import { apiUrl } from '../utils/api';

const API_ROUTINES = apiUrl('/routines');
const API_EXERCISES = apiUrl('/exercises');

const freqToMidi = (freq: number): number => Math.round(69 + 12 * Math.log2(freq / 440));

const PracticePage: React.FC<PracticePageProps> = () => {
  const navigate = useNavigate();
  // Reuse the original HomePage logic (copied verbatim)
  // stage: 'setup' | 'running' | 'finished'
  const [stage, setStage] = useState<'setup' | 'running' | 'finished'>('setup');
  // refs to keep latest inside interval
  const progRef = useRef<ProgressItem[]>([]);
  const currentIdxRef = useRef(0);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const exerciseElapsedRef = useRef(0);

  const [exercises, setExercises] = useState<{ id: string; title: string }[]>([]);
  const [setupData, setSetupData] = useState<SessionSetupData | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [pitchAcc, setPitchAcc] = useState<number[]>([]);
  const [rhythmAcc, setRhythmAcc] = useState<number[]>([]);
  const [rhythmOffset, setRhythmOffset] = useState<number>(0);
  const { tempo, setTempo, isPlaying: isMetronomePlaying, startEpoch: metStartTime, togglePlay } = useMetronome();
  const [midiNote, setMidiNote] = useState<number | undefined>(undefined);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // event refs
  const pitchEventsRef = useRef<{timestamp:number, freq:number}[]>([]);
  const rhythmEventsRef = useRef<{timestamp:number, deviation:number}[]>([]);
  // summary modal state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const MAX_ACC_POINTS = 240;

  // fetch routines & exercises
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rRes, eRes] = await Promise.all([fetch(API_ROUTINES), fetch(API_EXERCISES)]);
        if (rRes.ok) {
          const data = await rRes.json();
          setRoutines(data);
        }
        if (eRes.ok) {
          const data = await eRes.json();
          setExercises(data.map((d: any) => ({ id: d.id, title: d.title })));
        }
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchData();
  }, []);

  // adaptive tempo logic
  useEffect(()=>{
    if(!setupData?.adaptiveTempo) return;
    if(pitchAcc.length<8) return; // wait for some data points
    const recent = pitchAcc.slice(-8);
    const avg = recent.reduce((a,b)=>a+b,0)/recent.length;
    if(avg > (setupData.accuracyThreshold||90)){
      setTempo(prev=> Math.min(prev+2, 240));
    }
  },[pitchAcc, setupData]);

  const handleStart = (data: SessionSetupData) => {
    setSetupData(data);
    setTempo(data.metronomeTempo);
    if(!isMetronomePlaying) togglePlay();
    setSessionStart(Date.now());
    // TODO initialize PracticeSessionManager, metronome etc.
    // Build exercise progress list
    let prog: ProgressItem[] = [];
    if (data.mode === 'single' && data.exerciseId) {
      const ex = exercises.find(e => e.id === data.exerciseId);
      prog = [
        {
          id: data.exerciseId,
          title: ex?.title || 'Exercise',
          durationSec: 0,
          current: true,
          completed: false,
          elapsedSec: 0,
        },
      ];
    } else if (data.mode === 'routine' && data.routineId) {
      const routine = routines.find(r => r.id === data.routineId);
      if (routine) {
        prog = routine.exerciseIds.map((ei, idx) => {
          const ex = exercises.find(e => e.id === ei.id);
          return {
            id: ei.id,
            title: ex?.title || `Exercise ${idx + 1}`,
            durationSec: (Number(ei.duration) || 0) * 60,
            current: idx === 0,
            completed: false,
            elapsedSec: idx === 0 ? 0 : undefined,
          } as ProgressItem;
        });
      }
    }
    setProgress(prog);
    // refs for interval closure
    progRef.current = prog;
    currentIdxRef.current = 0;
    setPitchAcc([]);
    setRhythmAcc([]);
    setPaused(false);
    pausedRef.current = false;
    // start interval for dummy updates + progress advance
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;

      // synthetic demo data if no audio
      setPitchAcc(arr => {
        const next = [...arr, Math.floor(Math.random() * 101)];
        return next.length > MAX_ACC_POINTS ? next.slice(-MAX_ACC_POINTS) : next;
      });

      setRhythmAcc(arr => {
        const next = [...arr, Math.floor(Math.random() * 101)];
        return next.length > MAX_ACC_POINTS ? next.slice(-MAX_ACC_POINTS) : next;
      });
      // retain existing demo: comment out when live pitch in
      // setMidiNote(40 + Math.floor(Math.random() * 25));

      // progress timing
      exerciseElapsedRef.current += 0.25;
      const next = exerciseElapsedRef.current;
      const currentItem = progRef.current[currentIdxRef.current];
      // update elapsedSec for current item every tick
      if (currentItem) {
        setProgress(list =>
          list.map((item, idx) =>
            idx === currentIdxRef.current ? { ...item, elapsedSec: next } : item
          )
        );
      }
      if (currentItem && currentItem.durationSec > 0 && next >= currentItem.durationSec) {
        // mark current complete and advance
        setProgress(list =>
          list.map((item, idx) => {
            if (idx === currentIdxRef.current) return { ...item, current: false, completed: true, elapsedSec: item.durationSec };
            if (idx === currentIdxRef.current + 1) return { ...item, current: true, elapsedSec: 0 };
            return item;
          })
        );
        currentIdxRef.current += 1;
        exerciseElapsedRef.current = 0;
        return;
      }
    }, 50);
    setStage('running');
  };

  const stopInterval = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const handleFinish = async () => {
    stopInterval();
    setStage('finished');
    // persist session to backend
    if(sessionStart){
      const sessionPayload = {
        id: crypto.randomUUID(),
        startTime: sessionStart,
        endTime: Date.now(),
        duration: Date.now() - sessionStart,
        tempo,
        timeSignature: '4/4',
      };
      let savedId = '';
      try {
        const res = await fetch(apiUrl('/sessions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionPayload),
        });
        if(res.ok){ const d = await res.json(); savedId = d.id || sessionPayload.id; }
        // send events bulk
        if(savedId){
          await fetch(apiUrl(`/sessions/${savedId}/pitch-events`),{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(pitchEventsRef.current)});
          await fetch(apiUrl(`/sessions/${savedId}/rhythm-events`),{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rhythmEventsRef.current)});
        }
      } catch(err){
        console.error('Failed to save session', err);
      }
    }

    // compute and show summary regardless of save result
    if(sessionStart){
      const avgPitch = pitchAcc.length ? pitchAcc.reduce((a,b)=>a+b,0)/pitchAcc.length : 0;
      const avgDev = rhythmAcc.length ? rhythmAcc.reduce((a,b)=>a+b,0)/rhythmAcc.length : 0;
      setSummary({ duration: Date.now() - sessionStart, avgPitchAcc: avgPitch, avgRhythmDev: avgDev, tempoStart: setupData?.metronomeTempo ?? tempo, tempoEnd: tempo });
      setSummaryOpen(true);
    }
  };

  const handleDiscard = () => {
    stopInterval();
    setStage('setup');
    setSetupData(null);
    navigate('/');
  };

  // Clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-gray-900 text-white">
      {stage === 'setup' && (
        <div className="flex flex-1 items-center justify-center">
          <SessionSetupPanel
            routines={routines}
            exercises={exercises}
            onStart={handleStart}
            onCancel={() => handleDiscard()}
          />
        </div>
      )}

      {stage === 'running' && (
        <div className="flex w-full flex-col flex-grow space-y-4">
          <LiveControlsBar
            elapsed={Math.floor((sessionStart ? Date.now() - sessionStart : 0) / 1000)}
            tempo={tempo}
            isPaused={paused}
            metronomePlaying={isMetronomePlaying && !paused}
            onPauseToggle={() => {
              setPaused(p => {
                pausedRef.current = !p;
                return !p;
              });
            }}
            onFinish={handleFinish}
            onDiscard={handleDiscard}
          />
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] lg:grid-cols-[2fr_1fr] gap-6 flex-grow">
            {/* Left side */}
            <div className="flex flex-col space-y-4">
              <AccuracyGraph pitchAcc={pitchAcc} rhythmAcc={rhythmAcc} />
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-100">Exercise Queue</h3>
                <ExerciseProgressList items={progress} />
              </div>
            </div>
            {/* Right side */}
            <div className="flex flex-col space-y-4 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AccuracyGauge offsetMs={rhythmOffset} />
                <AdaptiveTempoGauge bpm={tempo} targetBpm={setupData?.metronomeTempo ?? tempo} />
              </div>
              <FretboardVisual midiNote={midiNote} />
            </div>
          </div>

          {/* hidden audio processing components */}
          <div className="hidden">
            <AudioInputComponent onAudioData={setAudioData} isRecording={!paused} />
            <PitchDetection
              audioData={audioData}
              isRecording={!paused}
              onPitchDetected={(evt) => {
                if(sessionStart && evt.frequency){
                  pitchEventsRef.current.push({timestamp: Date.now()-sessionStart, freq: evt.frequency});
                }
                if (evt.frequency) {
                  const midi = freqToMidi(evt.frequency);
                  setMidiNote(midi);
                }
              }}
            />

            {/* rhythm analysis */}
            <RhythmAnalysis
              isRecording={!paused}
              tempo={tempo}
              timeSignature={[4,4]}
              audioData={audioData}
              onRhythmEvent={(evt)=>{
                if(evt.deviation !== null){
                  const dev = evt.deviation;
                  if(sessionStart){ rhythmEventsRef.current.push({timestamp: Date.now()-sessionStart, deviation: dev}); }
                  setRhythmOffset(dev);
                  setRhythmAcc(prev => {
                    const next = [...prev, dev];
                    return next.length > MAX_ACC_POINTS ? next.slice(-MAX_ACC_POINTS) : next;
                  });
                }
              }}
              isPlaying={isMetronomePlaying && !paused}
              metronomeStartTime={metStartTime}
            />

            {/* metronome audio */}
            <MetronomeComponent
              timeSignature={[4,4]}
              onMetronomeStart={()=>{/* start epoch handled in context */}}
            />
          </div>
        </div>
      )}

      {stage === 'finished' && (
        <>
          <SessionSummaryModal open={summaryOpen} summary={summary} onClose={()=>{setSummaryOpen(false); navigate('/');}} />
          <div className="flex w-full flex-col items-center justify-center p-4 space-y-4">
          
        </div>
        </>
       )}
    </div>
  );
};

export default PracticePage;

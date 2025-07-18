'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Header from '@/components/app/header';
import ScorePanel from '@/components/app/score-panel';
import TimerControl from '@/components/app/timer-control';
import RefereeControls from '@/components/app/referee-controls';
import AdvantageDisplay from '@/components/app/advantage-display';
import { analyzeAdvantage, type AdvantageAnalyzerOutput } from '@/ai/flows/advantage-analyzer';

type Action = {
  type: 'score' | 'penalty';
  team: 'red' | 'blue';
  points: number;
  refereeId: number;
};

type Referee = {
  id: number;
  status: 'connected' | 'disconnected';
  lastSeen: number;
};

type ScoreEvent = {
  team: 'red' | 'blue';
  points: number;
  timestamp: number;
};

const ROUND_DURATION = 120; // 2 minutes
const TOTAL_ROUNDS = 3;
const REFEREE_TIMEOUT = 5000; // 5 seconds
const ADVANTAGE_CHECK_INTERVAL = 10000; // 10 seconds

export default function TapScoreHubPage() {
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [history, setHistory] = useState<Action[]>([]);
  const [referees, setReferees] = useState<Referee[]>([
    { id: 1, status: 'disconnected', lastSeen: 0 },
    { id: 2, status: 'disconnected', lastSeen: 0 },
    { id: 3, status: 'disconnected', lastSeen: 0 },
  ]);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [advantageResult, setAdvantageResult] = useState<AdvantageAnalyzerOutput | null>(null);
  const [isAdvantageLoading, setIsAdvantageLoading] = useState(false);

  const synth = useRef<any>(null);

  useEffect(() => {
    import('tone').then(Tone => {
      synth.current = new Tone.Synth().toDestination();
    });
  }, []);

  const playSound = useCallback((note: string) => {
    if (synth.current) {
      synth.current.triggerAttackRelease(note, '8n');
    }
  }, []);

  const handleTimerToggle = useCallback(() => {
    setIsTimerRunning(prev => !prev);
    if (!matchStartTime) {
      setMatchStartTime(Date.now());
    }
  }, [matchStartTime]);

  const resetRound = useCallback(() => {
    setTimeRemaining(ROUND_DURATION);
    setIsTimerRunning(false);
  }, []);

  const resetMatch = useCallback(() => {
    resetRound();
    setRedScore(0);
    setBlueScore(0);
    setCurrentRound(1);
    setHistory([]);
    setScoreEvents([]);
    setMatchStartTime(null);
    setAdvantageResult(null);
  }, [resetRound]);
  
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    
    if (lastAction.team === 'red') {
      setRedScore(s => Math.max(0, s - lastAction.points));
    } else {
      setBlueScore(s => Math.max(0, s - lastAction.points));
    }

    setHistory(h => h.slice(0, -1));
    setScoreEvents(se => se.slice(0, -1));

  }, [history]);

  const handleRefereeAction = useCallback((refereeId: number, team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (!isTimerRunning) return;

    const action: Action = { refereeId, team, points, type };
    const scoreEvent: ScoreEvent = { team, points, timestamp: Date.now() };
    
    if (team === 'red') {
      setRedScore(s => s + points);
    } else {
      setBlueScore(s => s + points);
    }

    playSound('C4');
    setHistory(h => [...h, action]);
    setScoreEvents(se => [...se, scoreEvent]);

    setReferees(prevReferees => prevReferees.map(ref => 
      ref.id === refereeId ? { ...ref, status: 'connected', lastSeen: Date.now() } : ref
    ));
  }, [isTimerRunning, playSound]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const timerInterval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime > 1) {
          return prevTime - 1;
        }
        // End of round
        playSound('G5');
        setIsTimerRunning(false);
        if (currentRound < TOTAL_ROUNDS) {
          setTimeout(() => {
            setCurrentRound(r => r + 1);
            resetRound();
          }, 3000);
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, currentRound, playSound, resetRound]);
  
  useEffect(() => {
    const refereeCheckInterval = setInterval(() => {
      const now = Date.now();
      setReferees(prevReferees => prevReferees.map(ref => {
        if (ref.status === 'connected' && now - ref.lastSeen > REFEREE_TIMEOUT) {
          return { ...ref, status: 'disconnected' };
        }
        return ref;
      }));
    }, 1000);

    return () => clearInterval(refereeCheckInterval);
  }, []);

  useEffect(() => {
    if (!isTimerRunning) return;

    const runAdvantageAnalysis = async () => {
      if (!matchStartTime) return;
      
      setIsAdvantageLoading(true);
      const timeElapsedSeconds = (Date.now() - matchStartTime) / 1000;

      const calculateRate = (team: 'red' | 'blue') => {
        if (timeElapsedSeconds < 1) return 1.0;
        const teamPoints = scoreEvents.filter(e => e.team === team).reduce((sum, e) => sum + e.points, 0);
        return (teamPoints / timeElapsedSeconds) * 60;
      };

      const redScoringRate = calculateRate('red');
      const blueScoringRate = calculateRate('blue');

      try {
        const result = await analyzeAdvantage({
          redScore,
          blueScore,
          redScoringRate,
          blueScoringRate,
          timeRemainingSeconds: timeRemaining
        });
        setAdvantageResult(result);
      } catch (error) {
        console.error("Error analyzing advantage:", error);
        setAdvantageResult(null);
      } finally {
        setIsAdvantageLoading(false);
      }
    };
    
    runAdvantageAnalysis();

    const advantageInterval = setInterval(runAdvantageAnalysis, ADVANTAGE_CHECK_INTERVAL);
    return () => clearInterval(advantageInterval);
  }, [isTimerRunning, redScore, blueScore, timeRemaining, matchStartTime, scoreEvents]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 font-body">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row gap-4 mt-4 relative">
        <ScorePanel team="red" score={redScore} />
        <ScorePanel team="blue" score={blueScore} />

        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <Card className="w-full max-w-md lg:max-w-lg p-4 flex flex-col gap-4 bg-card/80 backdrop-blur-sm pointer-events-auto">
            <CardContent className="p-0 flex-grow flex flex-col justify-between gap-4">
              <TimerControl
                timeRemaining={timeRemaining}
                isTimerRunning={isTimerRunning}
                currentRound={currentRound}
                totalRounds={TOTAL_ROUNDS}
                onToggleTimer={handleTimerToggle}
                onResetMatch={resetMatch}
                onUndo={handleUndo}
                canUndo={history.length > 0}
              />
              <AdvantageDisplay result={advantageResult} isLoading={isAdvantageLoading} />
              <RefereeControls referees={referees} onAction={handleRefereeAction} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

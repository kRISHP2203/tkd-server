'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import ScorePanel from '@/components/app/score-panel';
import TimerControl from '@/components/app/timer-control';
import JudgeControls from '@/components/app/judge-controls';

type Action = {
  type: 'score' | 'penalty';
  team: 'red' | 'blue';
  points: number;
};

const ROUND_DURATION = 120; // 2 minutes
const TOTAL_ROUNDS = 3;

export default function TapScoreHubPage() {
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [history, setHistory] = useState<Action[]>([]);
  
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
  }, []);

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

  }, [history]);

  const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (!isTimerRunning) return;

    const action: Action = { team, points, type };
    
    if (team === 'red') {
      setRedScore(s => s + points);
    } else {
      setBlueScore(s => s + points);
    }

    playSound('C4');
    setHistory(h => [...h, action]);

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
  

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 font-body">
      <main className="flex-grow flex flex-col md:flex-row gap-4 relative pb-40">
        <ScorePanel team="red" score={redScore} />
        <ScorePanel team="blue" score={blueScore} />

        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <Card className="w-48 h-48 p-2 flex flex-col gap-2 bg-card/80 backdrop-blur-sm pointer-events-auto">
            <CardContent className="p-0 flex-grow flex flex-col justify-center gap-2">
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
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <JudgeControls onAction={handleJudgeAction} />
      </footer>
    </div>
  );
}

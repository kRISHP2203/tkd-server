
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import ScorePanel from '@/components/app/score-panel';
import TimerControl from '@/components/app/timer-control';
import JudgeControls from '@/components/app/judge-controls';
import type { GameSettings } from '@/components/app/game-options-dialog';
import GameOptionsDialog from '@/components/app/game-options-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


type Action = {
  type: 'score' | 'penalty';
  team: 'red' | 'blue';
  points: number;
};

type MatchState = 'idle' | 'running' | 'paused' | 'between_rounds' | 'finished';

const defaultSettings: GameSettings = {
  roundTime: 120, // 2 minutes
  totalRounds: 3,
  leadPoints: 20,
  restTime: 30,
  maxGamJeom: 5,
};

export default function TapScoreHubPage() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [redPenalties, setRedPenalties] = useState(0);
  const [bluePenalties, setBluePenalties] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(settings.roundTime);
  const [restTimeRemaining, setRestTimeRemaining] = useState(settings.restTime);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [history, setHistory] = useState<Action[]>([]);
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  
  const synth = useRef<any>(null);
  const { toast } = useToast()

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        if (matchState === 'idle') {
          setTimeRemaining(parsedSettings.roundTime);
          setRestTimeRemaining(parsedSettings.restTime);
        }
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
  }, [matchState]);

  const handleSettingsSave = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (matchState === 'idle') {
      setTimeRemaining(newSettings.roundTime);
      setRestTimeRemaining(newSettings.restTime);
    }
    setIsOptionsDialogOpen(false);
  };


  useEffect(() => {
    import('tone').then(Tone => {
      if (Tone && Tone.Synth) {
        synth.current = new Tone.Synth().toDestination();
      }
    });
  }, []);

  const playSound = useCallback((note: string, delay?: number) => {
    if (synth.current) {
      if (synth.current.context.state !== 'running') {
        synth.current.context.resume();
      }
      // Immediately stop any currently playing note before starting a new one.
      // This is the most robust way to prevent scheduling conflicts.
      synth.current.triggerRelease();
      synth.current.triggerAttack(note, delay);
    }
  }, []);

  const handleTimerToggle = useCallback(() => {
    setIsTimerRunning(prev => {
      const newIsRunning = !prev;
      if (newIsRunning) {
        if (matchState === 'idle' || matchState === 'paused') {
          setMatchState('running');
        } else if (matchState === 'between_rounds') {
          setRestTimeRemaining(0); // Manually start next round
        }
      } else {
        if(matchState === 'running') {
          setMatchState('paused');
        }
      }
      return newIsRunning;
    });
  }, [matchState]);

  const resetRound = useCallback(() => {
    setTimeRemaining(settings.roundTime);
    setRestTimeRemaining(settings.restTime);
    setIsTimerRunning(false);
  }, [settings.roundTime, settings.restTime]);

  const resetMatch = useCallback(() => {
    resetRound();
    setRedScore(0);
    setBlueScore(0);
    setRedPenalties(0);
    setBluePenalties(0);
    setCurrentRound(1);
    setHistory([]);
    setMatchState('idle');
    toast({ title: "Match Reset", description: "The match has been reset to its initial state." });
  }, [resetRound, toast]);
  
  const handleEndMatch = useCallback((winner: string) => {
    setIsTimerRunning(false);
    setMatchState('finished');
    if (synth.current) {
        playSound('A5');
    }
  }, [playSound]);
  
  const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (matchState === 'running' || matchState === 'finished') return;

    const action: Action = { team, points, type };
    
    if (type === 'score') {
      if (team === 'red') {
        setRedScore(s => Math.max(0, s + points));
      } else {
        setBlueScore(s => Math.max(0, s + points));
      }
    } else if (type === 'penalty') {
      // 'team' is the team that receives the point/whose opponent gets the penalty
      if (team === 'red') { // Blue team gets penalty
        setBluePenalties(p => {
            const newPenalties = Math.max(0, p + points);
            if(newPenalties >= settings.maxGamJeom) handleEndMatch('Hong (Red)');
            return newPenalties;
        });
        setRedScore(s => Math.max(0, s + points));
      } else { // Red team gets penalty
        setRedPenalties(p => {
            const newPenalties = Math.max(0, p + points);
            if (newPenalties >= settings.maxGamJeom) handleEndMatch('Chong (Blue)');
            return newPenalties;
        });
        setBlueScore(s => Math.max(0, s + points));
      }
    }

    playSound('C4');
    setHistory(h => [...h, action]);

  }, [matchState, playSound, settings.maxGamJeom, handleEndMatch]);

  useEffect(() => {
    if (matchState === 'finished') {
        let winner = '';
        if (redScore > blueScore) winner = 'Hong (Red)';
        else if (blueScore > redScore) winner = 'Chong (Blue)';
        else winner = 'Nobody';

        toast({
            title: "Match Over!",
            description: `${winner} wins!`,
            duration: 5000,
        });
    }
  }, [matchState, redScore, blueScore, toast]);


  useEffect(() => {
    if (isTimerRunning && matchState === 'running') {
      if (redScore - blueScore >= settings.leadPoints) {
        handleEndMatch('Hong (Red)');
      } else if (blueScore - redScore >= settings.leadPoints) {
        handleEndMatch('Chong (Blue)');
      }
    }
  }, [redScore, blueScore, isTimerRunning, matchState, settings.leadPoints, handleEndMatch]);
  
  const startNextRound = useCallback(() => {
    if (currentRound < settings.totalRounds) {
        setCurrentRound(r => r + 1);
        resetRound();
        setMatchState('between_rounds');
    } else {
        handleEndMatch('Nobody');
    }
  }, [currentRound, settings.totalRounds, resetRound, handleEndMatch]);
  
  // Handles the rest period timer
  useEffect(() => {
    if (matchState !== 'between_rounds') {
      return;
    }
    
    toast({
      title: `Round Over`,
      description: `Get ready! The next round will begin in ${settings.restTime} seconds.`,
    });

    const timerInterval = setInterval(() => {
      setRestTimeRemaining(prevTime => {
        if (prevTime > 1) {
          return prevTime - 1;
        }
        
        // End of rest period
        clearInterval(timerInterval);
        setMatchState('running');
        setIsTimerRunning(true);
        resetRound();
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [matchState, settings.restTime, toast, resetRound]);

  // Handles the main round timer
  useEffect(() => {
    if (!isTimerRunning || matchState !== 'running') {
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime > 1) {
          return prevTime - 1;
        }
        
        // End of round
        playSound('G5');
        setIsTimerRunning(false);
        startNextRound();
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, playSound, startNextRound, matchState]);

  const isFinished = matchState === 'finished';
  const redWinner = isFinished && redScore > blueScore;
  const blueWinner = isFinished && blueScore > redScore;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        
        <main className="flex-grow flex flex-col md:flex-row relative">
          
            <div className="absolute top-4 right-4 z-10">
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-6 w-6 text-foreground/80" />
                </Button>
              </Link>
            </div>
          
          <ScorePanel team="red" score={redScore} penalties={redPenalties} isWinner={redWinner} />
          <ScorePanel team="blue" score={blueScore} penalties={bluePenalties} isWinner={blueWinner} />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
            <Card className="w-48 p-2 flex flex-col gap-2 bg-card/80 backdrop-blur-sm pointer-events-auto">
              <CardContent className="p-0 flex-grow flex flex-col justify-center gap-2">
                <TimerControl
                  timeRemaining={timeRemaining}
                  isTimerRunning={isTimerRunning}
                  currentRound={currentRound}
                  totalRounds={settings.totalRounds}
                  onToggleTimer={handleTimerToggle}
                  matchState={matchState}
                />
              </CardContent>
            </Card>
            {matchState === 'between_rounds' && (
              <Card className="mt-2 w-auto px-4 py-1 bg-background/90 backdrop-blur-sm pointer-events-auto">
                <p className="text-sm font-medium text-foreground">
                  Rest: {formatTime(restTimeRemaining)}
                </p>
              </Card>
            )}
          </div>
        </main>
        {(matchState === 'paused' || matchState === 'idle' || matchState === 'between_rounds' || matchState === 'finished') && (
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-sm">
                <JudgeControls onAction={handleJudgeAction} onResetMatch={resetMatch} onOpenOptions={() => setIsOptionsDialogOpen(true)} />
            </footer>
        )}
      </div>
      <GameOptionsDialog 
        isOpen={isOptionsDialogOpen}
        onOpenChange={setIsOptionsDialogOpen}
        initialSettings={settings}
        onSave={handleSettingsSave}
      />
    </>
  );
}

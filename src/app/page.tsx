'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import ScorePanel from '@/components/app/score-panel';
import TimerControl from '@/components/app/timer-control';
import JudgeControls from '@/components/app/judge-controls';
import SettingsDialog from '@/components/app/settings-dialog';

export type GameSettings = {
  roundTime: number;
  totalRounds: number;
  leadPoints: number;
  restTime: number;
  maxGamJeom: number;
};

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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [history, setHistory] = useState<Action[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>('idle');
  
  const synth = useRef<any>(null);
  const { toast } = useToast()

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setTimeRemaining(parsedSettings.roundTime);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
  }, []);


  useEffect(() => {
    import('tone').then(Tone => {
      if (Tone && Tone.Synth) {
        synth.current = new Tone.Synth().toDestination();
      }
    });
  }, []);

  const playSound = useCallback((note: string) => {
    if (synth.current && synth.current.context.state === 'running') {
      // Stop any previous sound before starting a new one to avoid overlapping notes error.
      synth.current.triggerRelease();
      synth.current.triggerAttackRelease(note, '8n');
    }
  }, []);

  const handleTimerToggle = useCallback(() => {
    setIsTimerRunning(prev => {
      const newIsRunning = !prev;
      if (newIsRunning) {
        setMatchState('running');
      } else {
        setMatchState('paused');
      }
      return newIsRunning;
    });
  }, []);

  const resetRound = useCallback(() => {
    setTimeRemaining(settings.roundTime);
    setIsTimerRunning(false);
  }, [settings.roundTime]);

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
    playSound('A5');
  }, [playSound]);
  
  const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (matchState === 'running') return;

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
    if (isTimerRunning) {
      if (redScore - blueScore >= settings.leadPoints) {
        handleEndMatch('Hong (Red)');
      } else if (blueScore - redScore >= settings.leadPoints) {
        handleEndMatch('Chong (Blue)');
      }
    }
  }, [redScore, blueScore, isTimerRunning, settings.leadPoints, handleEndMatch]);
  
  const startNextRound = useCallback(() => {
    if (currentRound < settings.totalRounds) {
        setMatchState('between_rounds');
        setCurrentRound(r => r + 1);
        resetRound();
    } else {
        setMatchState('finished');
        setIsTimerRunning(false);
    }
  }, [currentRound, settings.totalRounds, resetRound]);
  
  useEffect(() => {
      if (matchState === 'between_rounds') {
          toast({
              title: `Starting Round ${currentRound}`,
              description: `Get ready! The next round will begin in ${settings.restTime} seconds.`,
          });
          const timer = setTimeout(() => {
            setMatchState('running');
            setIsTimerRunning(true);
          }, settings.restTime * 1000);
          return () => clearTimeout(timer);
      }
  }, [matchState, currentRound, settings.restTime, toast]);

  useEffect(() => {
    if (!isTimerRunning || matchState === 'finished') {
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

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if(matchState === 'idle') {
      setTimeRemaining(newSettings.roundTime);
    }
    try {
      localStorage.setItem('gameSettings', JSON.stringify(newSettings));
      toast({ title: "Settings Saved", description: "Your new match rules have been applied." });
    } catch (error) {
      toast({ title: "Error Saving Settings", description: "Could not save settings to local storage.", variant: "destructive" });
    }
    setIsSettingsOpen(false);
  };
  

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <main className="flex-grow flex flex-col md:flex-row relative">
          <ScorePanel team="red" score={redScore} penalties={redPenalties} />
          <ScorePanel team="blue" score={blueScore} penalties={bluePenalties} />

          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
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
          </div>
        </main>
        {(matchState === 'paused' || matchState === 'idle' || matchState === 'between_rounds') && (
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-sm">
                <JudgeControls onAction={handleJudgeAction} onResetMatch={resetMatch} onOpenSettings={() => setIsSettingsOpen(true)} />
            </footer>
        )}
      </div>
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </>
  );
}

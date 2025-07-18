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
};

type Action = {
  type: 'score' | 'penalty';
  team: 'red' | 'blue';
  points: number;
};

const defaultSettings: GameSettings = {
  roundTime: 120, // 2 minutes
  totalRounds: 3,
  leadPoints: 20,
  restTime: 30
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
    toast({ title: "Match Reset", description: "The match has been reset to its initial state." });
  }, [resetRound, toast]);
  
  const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (!isTimerRunning) return;

    const action: Action = { team, points, type };
    
    if (type === 'score') {
      if (team === 'red') {
        setRedScore(s => Math.max(0, s + points));
      } else {
        setBlueScore(s => Math.max(0, s + points));
      }
    } else if (type === 'penalty') {
      // 'team' is the team that receives the point, so the other team gets the penalty
      if (team === 'red') { // Blue team gets penalty
        setBluePenalties(p => p + 1);
        setRedScore(s => s + points);
      } else { // Red team gets penalty
        setRedPenalties(p => p + 1);
        setBlueScore(s => s + points);
      }
    }

    playSound('C4');
    setHistory(h => [...h, action]);

  }, [isTimerRunning, playSound]);

  const handleEndMatch = useCallback((winner: string) => {
    setIsTimerRunning(false);
    playSound('A5');
    toast({
      title: "Match Over!",
      description: `${winner} wins by point lead!`,
      duration: 5000
    });
  }, [playSound, toast]);

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
    setCurrentRound(r => r + 1);
    resetRound();
    toast({
        title: `Starting Round ${currentRound + 1}`,
        description: `Get ready! The next round will begin in ${settings.restTime} seconds.`,
    });
    setTimeout(() => {
      setIsTimerRunning(true);
    }, settings.restTime * 1000);
  }, [currentRound, resetRound, settings.restTime, toast]);


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
        if (currentRound < settings.totalRounds) {
          startNextRound();
        } else {
            toast({ title: "Match Over", description: "The final round has concluded." });
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, currentRound, playSound, resetRound, settings.totalRounds, startNextRound, toast]);

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setTimeRemaining(newSettings.roundTime);
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
                />
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-sm">
            <JudgeControls onAction={handleJudgeAction} onResetMatch={resetMatch} onOpenSettings={() => setIsSettingsOpen(true)} />
        </footer>
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


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

type MatchState = 'idle' | 'running' | 'paused' | 'round_over' | 'between_rounds' | 'finished';

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
  const [redWins, setRedWins] = useState(0);
  const [blueWins, setBlueWins] = useState(0);
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
  const isPlaying = useRef(false); // Ref to track if a sound is currently playing
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
    if (synth.current && !isPlaying.current) {
        if (synth.current.context.state !== 'running') {
            synth.current.context.resume();
        }
        isPlaying.current = true;
        synth.current.triggerAttackRelease(note, '8n', delay);
        // Use Tone.js's Transport to schedule the release of the lock.
        // This is more reliable than setTimeout for audio contexts.
        import('tone').then(Tone => {
            Tone.Transport.scheduleOnce(() => {
                isPlaying.current = false;
            }, Tone.now() + 0.2); // Release lock after 200ms
        });
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

  const resetRoundState = useCallback(() => {
    setRedScore(0);
    setBlueScore(0);
    setRedPenalties(0);
    setBluePenalties(0);
    setHistory([]);
    setTimeRemaining(settings.roundTime);
  }, [settings.roundTime]);


  const resetMatch = useCallback(() => {
    resetRoundState();
    setRestTimeRemaining(settings.restTime);
    setRedWins(0);
    setBlueWins(0);
    setCurrentRound(1);
    setMatchState('idle');
    setIsTimerRunning(false);
    toast({ title: "Match Reset", description: "The match has been reset to its initial state." });
  }, [resetRoundState, settings.restTime, toast]);
  
  const handleEndMatch = useCallback((winner: string) => {
    setIsTimerRunning(false);
    setMatchState('finished');
    if (synth.current) {
        playSound('A5');
    }
    toast({
        title: "Match Over!",
        description: `${winner} wins!`,
        duration: 5000,
    });
  }, [playSound, toast]);

  const handleEndRound = useCallback((reason: 'time' | 'lead' | 'penalties', leadingTeam?: 'red' | 'blue') => {
    if (matchState === 'round_over' || matchState === 'finished') return;
  
    playSound('G5');
    setIsTimerRunning(false);
  
    let roundWinner: 'red' | 'blue' | 'tie' | 'none' = 'none';

    if (reason === 'penalties' && leadingTeam) {
      roundWinner = leadingTeam;
    } else if (reason === 'lead' && leadingTeam) {
      roundWinner = leadingTeam;
    } else if (reason === 'time') {
      if (redScore > blueScore) {
        roundWinner = 'red';
      } else if (blueScore > redScore) {
        roundWinner = 'blue';
      } else {
        roundWinner = 'tie';
      }
    }
  
    if (roundWinner === 'red') {
      setRedWins(w => w + 1);
    } else if (roundWinner === 'blue') {
      setBlueWins(w => w + 1);
    } else if (roundWinner === 'tie') {
      setRedWins(w => w + 1);
      setBlueWins(w => w + 1);
    }

    setMatchState('round_over');
  }, [playSound, matchState, redScore, blueScore]);
  
  const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
    if (matchState !== 'running' && matchState !== 'paused' && matchState !== 'idle') return;

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
            if(newPenalties >= settings.maxGamJeom) {
              handleEndRound('penalties', 'red');
            }
            return newPenalties;
        });
        setRedScore(s => Math.max(0, s + points));
      } else { // Red team gets penalty
        setRedPenalties(p => {
            const newPenalties = Math.max(0, p + points);
            if (newPenalties >= settings.maxGamJeom) {
              handleEndRound('penalties', 'blue');
            }
            return newPenalties;
        });
        setBlueScore(s => Math.max(0, s + points));
      }
    }

    playSound('C4');
    setHistory(h => [...h, action]);

  }, [matchState, playSound, settings.maxGamJeom, handleEndRound]);

  useEffect(() => {
    if (isTimerRunning && matchState === 'running') {
      if (redScore - blueScore >= settings.leadPoints) {
        handleEndRound('lead', 'red');
      } else if (blueScore - redScore >= settings.leadPoints) {
        handleEndRound('lead', 'blue');
      }
    }
  }, [redScore, blueScore, isTimerRunning, matchState, settings.leadPoints, handleEndRound]);
  
  const startNextRound = useCallback(() => {
    if (currentRound >= settings.totalRounds || redWins > settings.totalRounds / 2 || blueWins > settings.totalRounds / 2) {
      let winner = 'Nobody';
      if (redWins > blueWins) winner = 'Hong (Red)';
      else if (blueWins > redWins) winner = 'Chong (Blue)';
      else { // Tie-breaker if win counts are equal
        if (redScore > blueScore) winner = 'Hong (Red)';
        else if (blueScore > redScore) winner = 'Chong (Blue)';
      }
      handleEndMatch(winner);
    } else {
      setCurrentRound(r => r + 1);
      resetRoundState();
      setRestTimeRemaining(settings.restTime);
      setMatchState('between_rounds');
    }
  }, [currentRound, settings.totalRounds, resetRoundState, handleEndMatch, redScore, blueScore, settings.restTime, redWins, blueWins]);
  
  // Effect to handle the end of a round and transition to the next
  useEffect(() => {
    if (matchState === 'round_over') {
      const timer = setTimeout(() => {
        startNextRound();
      }, 2000); // 2-second pause before starting rest period
      return () => clearTimeout(timer);
    }
  }, [matchState, startNextRound]);


  // Handles the rest period timer
  useEffect(() => {
    if (matchState !== 'between_rounds') {
      return;
    }
    
    toast({
      title: `Round ${currentRound-1} Over`,
      description: `Get ready! Round ${currentRound} will begin in ${settings.restTime} seconds.`,
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
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [matchState, settings.restTime, toast, currentRound]);

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
        handleEndRound('time');
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, playSound, matchState, handleEndRound]);

  const isFinished = matchState === 'finished';
  const redWinner = isFinished && redWins > blueWins;
  const blueWinner = isFinished && blueWins > redWins;

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
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/settings">
                    <Settings className="h-6 w-6 text-foreground/80" />
                  </Link>
                </Button>
            </div>
          
          <ScorePanel team="red" score={redScore} wins={redWins} penalties={redPenalties} isWinner={redWinner} />
          <ScorePanel team="blue" score={blueScore} wins={blueWins} penalties={bluePenalties} isWinner={blueWinner} />

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
              <Card className="mt-2 w-auto px-4 py-1 bg-white backdrop-blur-sm pointer-events-auto">
                <p className="text-sm font-medium text-black">
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

    


'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSettings } from '@/components/app/game-options-dialog';
import { useToast } from "@/hooks/use-toast";

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

export function useMatchEngine() {
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
    const isPlaying = useRef(false);
    const { toast } = useToast();
  
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
          import('tone').then(Tone => {
              Tone.Transport.scheduleOnce(() => {
                  isPlaying.current = false;
              }, Tone.now() + 0.2); 
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
            setRestTimeRemaining(0);
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
        if (team === 'red') {
          setBluePenalties(p => {
              const newPenalties = Math.max(0, p + points);
              if(newPenalties >= settings.maxGamJeom) {
                handleEndRound('penalties', 'red');
              }
              return newPenalties;
          });
          setRedScore(s => Math.max(0, s + points));
        } else { 
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
        else { 
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
    
    useEffect(() => {
      if (matchState === 'round_over') {
        const timer = setTimeout(() => {
          startNextRound();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [matchState, startNextRound]);
  
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
          clearInterval(timerInterval);
          setMatchState('running');
          setIsTimerRunning(true);
          return 0;
        });
      }, 1000);
  
      return () => clearInterval(timerInterval);
    }, [matchState, settings.restTime, toast, currentRound]);
  
    useEffect(() => {
      if (!isTimerRunning || matchState !== 'running') {
        return;
      }
  
      const timerInterval = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime > 1) {
            return prevTime - 1;
          }
          handleEndRound('time');
          return 0;
        });
      }, 1000);
  
      return () => clearInterval(timerInterval);
    }, [isTimerRunning, playSound, matchState, handleEndRound]);

    return {
        settings,
        redScore,
        blueScore,
        redWins,
        blueWins,
        redPenalties,
        bluePenalties,
        timeRemaining,
        restTimeRemaining,
        isTimerRunning,
        currentRound,
        history,
        matchState,
        isOptionsDialogOpen,
        setIsOptionsDialogOpen,
        handleSettingsSave,
        handleTimerToggle,
        resetMatch,
        handleJudgeAction,
    };
}


'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSettings } from '@/components/app/game-options-dialog';
import { useToast } from "@/hooks/use-toast";

type Action = {
  type: 'score' | 'penalty';
  team: 'red' | 'blue';
  points: number;
};

type MatchState = 'idle' | 'running' | 'paused' | 'between_rounds' | 'finished';
type Winner = 'red' | 'blue' | 'tie' | 'none';

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
    const [matchWinner, setMatchWinner] = useState<Winner>('none');
    
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
            isPlaying.current = true;
            if (synth.current.context.state !== 'running') {
                synth.current.context.resume();
            }
            synth.current.triggerAttackRelease(note, '8n', delay);
            import('tone').then(Tone => {
                Tone.Transport.scheduleOnce(() => {
                    isPlaying.current = false;
                }, Tone.now() + 0.2); 
            });
        }
    }, []);
  
    const handleTimerToggle = useCallback(() => {
      if (matchState === 'finished') return;
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
      setMatchWinner('none');
      toast({ title: "Match Reset", description: "The match has been reset to its initial state." });
    }, [resetRoundState, settings.restTime, toast]);
    
    const handleEndMatch = useCallback((winner: Winner) => {
        setIsTimerRunning(false);
        setMatchState('finished');
        setMatchWinner(winner);
        if (synth.current) {
            playSound('A5');
        }
        toast({
            title: "Match Over!",
            description: winner !== 'none' && winner !== 'tie' ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!` : "It's a tie!",
            duration: 5000,
        });

        // 25-second system cool-down and automatic restart
        setTimeout(() => {
            resetMatch();
        }, 25000);

    }, [playSound, toast, resetMatch]);
  
    const handleEndRound = useCallback((reason: 'time' | 'lead' | 'penalties', winningTeam?: 'red' | 'blue') => {
      if (matchState !== 'running') return;

      playSound('G5');
      setIsTimerRunning(false);
      
      let roundWinner: Winner = 'none';
  
      if (reason === 'penalties' && winningTeam) {
          roundWinner = winningTeam;
      } else if (reason === 'lead' && winningTeam) {
          roundWinner = winningTeam;
      } else if (reason === 'time') {
          if (redScore > blueScore) {
              roundWinner = 'red';
          } else if (blueScore > redScore) {
              roundWinner = 'blue';
          } else {
              roundWinner = 'tie';
          }
      }
      
      if (roundWinner === 'red') setRedWins(w => w + 1);
      if (roundWinner === 'blue') setBlueWins(w => w + 1);
      if (roundWinner === 'tie') {
          setRedWins(w => w + 1);
          setBlueWins(w => w + 1);
      }

      setMatchState('between_rounds');

    }, [matchState, playSound, redScore, blueScore]);
    
    const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => {
      if (matchState === 'finished' || matchState === 'between_rounds') return;
  
      const action: Action = { team, points, type };
      
      if (type === 'score') {
        if (team === 'red') {
          setRedScore(s => Math.max(0, s + points));
        } else {
          setBlueScore(s => Math.max(0, s + points));
        }
      } else if (type === 'penalty') {
        if (points > 0) { // Increasing a penalty
          if (team === 'red') {
            const newPenalties = redPenalties + 1;
            setRedPenalties(newPenalties);
            setBlueScore(s => s + 1);
            if (newPenalties >= settings.maxGamJeom) {
              handleEndRound('penalties', 'blue');
              return;
            }
          } else { // team is blue
            const newPenalties = bluePenalties + 1;
            setBluePenalties(newPenalties);
            setRedScore(s => s + 1);
            if (newPenalties >= settings.maxGamJeom) {
              handleEndRound('penalties', 'red');
              return;
            }
          }
        } else if (points < 0) { // Decreasing a penalty
          if (team === 'red') {
            if (redPenalties > 0) {
              setRedPenalties(p => p - 1);
              setBlueScore(s => Math.max(0, s - 1));
            }
          } else { // team is blue
            if (bluePenalties > 0) {
              setBluePenalties(p => p - 1);
              setRedScore(s => Math.max(0, s - 1));
            }
          }
        }
      }
  
      playSound('C4');
      setHistory(h => [...h, action]);
  
    }, [matchState, playSound, settings.maxGamJeom, handleEndRound, redPenalties, bluePenalties, redScore, blueScore]);
  
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
      const roundsNeededToWin = Math.ceil(settings.totalRounds / 2);
      
      if (redWins >= roundsNeededToWin && redWins > blueWins) {
          handleEndMatch('red');
          return;
      }
      if (blueWins >= roundsNeededToWin && blueWins > redWins) {
          handleEndMatch('blue');
          return;
      }
      
      if (currentRound >= settings.totalRounds) {
          let winner: Winner = 'tie';
          if (redWins > blueWins) winner = 'red';
          else if (blueWins > redWins) winner = 'blue';
          handleEndMatch(winner);
      } else {
        setCurrentRound(r => r + 1);
        resetRoundState();
        setRestTimeRemaining(settings.restTime);
        setMatchState('paused'); 
        toast({
          title: `Round ${currentRound + 1} will begin shortly.`,
          description: `Get ready!`,
        });
      }
    }, [currentRound, settings.totalRounds, resetRoundState, handleEndMatch, settings.restTime, redWins, blueWins, toast]);
    
    useEffect(() => {
      if (matchState === 'between_rounds') {
        const timer = setTimeout(() => {
          startNextRound();
        }, 2000); 
        return () => clearTimeout(timer);
      }
    }, [matchState, startNextRound]);
  
    useEffect(() => {
      if (matchState !== 'paused' || restTimeRemaining <= 0 || currentRound <= 1) return;

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
      
    }, [matchState, restTimeRemaining, currentRound]);
  
    useEffect(() => {
      if (!isTimerRunning || matchState !== 'running') {
        return;
      }
  
      const timerInterval = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            handleEndRound('time');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
  
      return () => clearInterval(timerInterval);
    }, [isTimerRunning, matchState, handleEndRound]);

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
        matchWinner,
        handleSettingsSave,
        handleTimerToggle,
        resetMatch,
        handleJudgeAction,
    };
}

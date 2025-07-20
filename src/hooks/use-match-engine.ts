
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

// Define a global WebSocket instance
let ws: WebSocket | null = null;

const connectWebSocket = () => {
  // Avoid creating multiple connections
  if (ws && ws.readyState < 2) { // 0=CONNECTING, 1=OPEN
    return;
  }

  ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('✅ UI connected to WebSocket server');
  };

  ws.onclose = () => {
    console.log('🔌 UI disconnected from WebSocket server');
    // Optional: try to reconnect
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    // console.error('WebSocket error:', error);
    ws?.close(); // Ensure connection is closed on error
  };
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
    const [roundWinner, setRoundWinner] = useState<Winner>('none');
    
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
  
    // Connect to the WebSocket server
    useEffect(() => {
      connectWebSocket();

      const handleMessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data.toString());
           if (message.action && message.team && message.points !== undefined) {
             // Received a valid action from the server, update the score
            handleJudgeAction(message.team, message.points, message.action, true);
          }
        } catch (e) {
          console.error('Error parsing message from server:', e);
        }
      };

      ws?.addEventListener('message', handleMessage);

      // Clean up the listener when the component unmounts
      return () => {
        ws?.removeEventListener('message', handleMessage);
      };
    }, []); // handleJudgeAction is stable due to useCallback

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

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        // Do not trigger if user is typing in an input field
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.code === 'Space') {
          event.preventDefault();
          handleTimerToggle();
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleTimerToggle]);
  
    const resetRoundState = useCallback(() => {
      setRedScore(0);
      setBlueScore(0);
      setRedPenalties(0);
      setBluePenalties(0);
      setHistory([]);
      setTimeRemaining(settings.roundTime);
      setRoundWinner('none');
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
        setTimeout(() => {
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

            setTimeout(() => {
                resetMatch();
            }, 5000);
        }, 0);
    }, [playSound, toast, resetMatch]);
  
    const handleEndRound = useCallback((reason: 'time' | 'lead' | 'penalties', penalizedTeam?: 'red' | 'blue') => {
      playSound('G5');
      setIsTimerRunning(false);
      
      let winnerOfRound: Winner = 'none';
  
      if (reason === 'penalties') {
          winnerOfRound = penalizedTeam === 'red' ? 'blue' : 'red';
      } else if (reason === 'lead') {
          winnerOfRound = redScore > blueScore ? 'red' : 'blue';
      } else if (reason === 'time') {
          if (redScore > blueScore) {
              winnerOfRound = 'red';
          } else if (blueScore > redScore) {
              winnerOfRound = 'blue';
          } else { 
              if (redPenalties < bluePenalties) {
                winnerOfRound = 'red';
              } else if (bluePenalties < redPenalties) {
                winnerOfRound = 'blue';
              } else {
                winnerOfRound = 'tie'; 
              }
          }
      }
      
      let newRedWins = redWins;
      let newBlueWins = blueWins;

      if (winnerOfRound === 'red') {
          newRedWins++;
          setRedWins(newRedWins);
      } else if (winnerOfRound === 'blue') {
          newBlueWins++;
          setBlueWins(newBlueWins);
      }
      
      setRoundWinner(winnerOfRound);
      
      const roundsNeededToWin = 2;
      if (newRedWins >= roundsNeededToWin || newBlueWins >= roundsNeededToWin) {
          handleEndMatch(newRedWins > newBlueWins ? 'red' : 'blue');
          return;
      }
      
      if (currentRound >= settings.totalRounds) {
          let finalWinner: Winner = 'tie';
          if (newRedWins > newBlueWins) finalWinner = 'red';
          else if (newBlueWins > newRedWins) finalWinner = 'blue';
          handleEndMatch(finalWinner);
      } else {
         setMatchState('between_rounds');
      }

    }, [
        redScore, blueScore, redPenalties, bluePenalties,
        settings.totalRounds, redWins, blueWins, playSound, handleEndMatch, currentRound
    ]);
    
    const handleJudgeAction = useCallback((team: 'red' | 'blue', points: number, type: 'score' | 'penalty', fromRemote: boolean = false) => {
      if (matchState === 'finished' || matchState === 'between_rounds') return;
      
      // If the action is from the local UI, broadcast it.
      if (!fromRemote && ws && ws.readyState === WebSocket.OPEN) {
          const message = {
              action: type,
              team,
              points,
              source: 'judge_control' // Differentiate from referee signals
          };
          ws.send(JSON.stringify(message));
      }
  
      const action: Action = { team, points, type };
      
      if (type === 'score') {
        if (team === 'red') {
          setRedScore(s => Math.max(0, s + points));
        } else {
          setBlueScore(s => Math.max(0, s + points));
        }
      } else if (type === 'penalty') {
          if (team === 'red') {
              const newPenalties = redPenalties + points;
              if (newPenalties < 0) return;
              setRedPenalties(newPenalties);

              if (points > 0) setBlueScore(s => s + 1);
              else setBlueScore(s => Math.max(0, s - 1));

              if (newPenalties >= settings.maxGamJeom) {
                  handleEndRound('penalties', 'red');
                  return; 
              }
          } else { // blue team
              const newPenalties = bluePenalties + points;
              if (newPenalties < 0) return;
              setBluePenalties(newPenalties);
              
              if (points > 0) setRedScore(s => s + 1);
              else setRedScore(s => Math.max(0, s - 1));

              if (newPenalties >= settings.maxGamJeom) {
                  handleEndRound('penalties', 'blue');
                  return; 
              }
          }
      }
  
      playSound('C4');
      setHistory(h => [...h, action]);
  
    }, [matchState, playSound, settings.maxGamJeom, handleEndRound, redPenalties, bluePenalties]);
  
    useEffect(() => {
      if (isTimerRunning && matchState === 'running') {
        if (Math.abs(redScore - blueScore) >= settings.leadPoints) {
          handleEndRound('lead');
        }
      }
    }, [redScore, blueScore, isTimerRunning, matchState, settings.leadPoints, handleEndRound]);
    
    const startNextRound = useCallback(() => {
      setCurrentRound(r => r + 1);
      resetRoundState();
      setRestTimeRemaining(settings.restTime);
      setMatchState('paused'); 
      toast({
        title: `Round ${currentRound + 1} Starting...`,
        description: `Get ready!`,
      });
    }, [currentRound, settings.restTime, resetRoundState, toast]);
    
    useEffect(() => {
        if (matchState === 'between_rounds' && matchWinner === 'none') {
            const timer = setTimeout(() => {
                if (currentRound < settings.totalRounds) {
                    startNextRound();
                }
            }, settings.restTime * 1000);

            return () => clearTimeout(timer);
        }
    }, [matchState, matchWinner, currentRound, settings.totalRounds, settings.restTime, startNextRound]);
  
    useEffect(() => {
      if (matchState === 'between_rounds' && restTimeRemaining > 0) {
        const timerInterval = setInterval(() => {
            setRestTimeRemaining(prevTime => {
            if (prevTime > 1) {
                return prevTime - 1;
            }
            clearInterval(timerInterval);
            return 0;
            });
        }, 1000);
        return () => clearInterval(timerInterval);
      }
    }, [matchState, restTimeRemaining]);
  
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
        roundWinner,
        handleSettingsSave,
        handleTimerToggle,
        resetMatch,
        handleJudgeAction,
    };
}

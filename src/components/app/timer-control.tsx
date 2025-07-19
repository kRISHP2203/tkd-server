
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Pause, Play } from 'lucide-react';
import React from 'react';

interface TimerControlProps {
  timeRemaining: number;
  isTimerRunning: boolean;
  currentRound: number;
  totalRounds: number;
  onToggleTimer: () => void;
  matchState: 'idle' | 'running' | 'paused' | 'between_rounds' | 'finished';
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const TimerControl = ({
  timeRemaining,
  isTimerRunning,
  currentRound,
  totalRounds,
  onToggleTimer,
  matchState,
}: TimerControlProps) => {

  return (
    <Card className="bg-transparent border-0 shadow-none text-center">
      <CardContent className="p-1 flex flex-col items-center gap-2">
        <div className="font-headline font-bold text-5xl text-foreground/90 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
        <CardDescription className="text-base">
          Round {currentRound} / {totalRounds}
        </CardDescription>
        <div className="flex justify-center gap-1 w-full">
          <Button
            size="icon"
            onClick={onToggleTimer}
            className="text-xs h-8 w-8"
            disabled={matchState === 'between_rounds' || matchState === 'finished'}
          >
            {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TimerControl);

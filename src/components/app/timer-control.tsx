'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, RotateCcw, Undo } from 'lucide-react';

interface TimerControlProps {
  timeRemaining: number;
  isTimerRunning: boolean;
  currentRound: number;
  totalRounds: number;
  onToggleTimer: () => void;
  onResetMatch: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function TimerControl({
  timeRemaining,
  isTimerRunning,
  currentRound,
  totalRounds,
  onToggleTimer,
  onResetMatch,
  onUndo,
  canUndo,
}: TimerControlProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-transparent border-0 shadow-none text-center">
      <CardHeader className="p-1">
        <CardTitle className="font-headline text-lg">Match Control</CardTitle>
        <CardDescription className="text-xs">Round {currentRound} of {totalRounds}</CardDescription>
      </CardHeader>
      <CardContent className="p-1 flex flex-col items-center gap-2">
        <div className="font-headline font-bold text-5xl text-foreground/90 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
        <div className="grid grid-cols-3 gap-1 w-full">
          <Button
            size="sm"
            onClick={onToggleTimer}
            className="text-xs"
          >
            {isTimerRunning ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
            {isTimerRunning ? 'Pause' : 'Start'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            className="text-xs"
          >
            <Undo className="mr-1 h-3 w-3" />
            Undo
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onResetMatch}
            className="text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

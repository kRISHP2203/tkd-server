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
    <Card className="bg-background/50 text-center">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Match Control</CardTitle>
        <CardDescription>Round {currentRound} of {totalRounds}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="font-headline font-bold text-8xl text-foreground/90 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-sm">
          <Button
            size="lg"
            onClick={onToggleTimer}
            className="lg:col-span-1"
          >
            {isTimerRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isTimerRunning ? 'Pause' : 'Start'}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            className="lg:col-span-1"
          >
            <Undo className="mr-2 h-5 w-5" />
            Undo
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={onResetMatch}
            className="col-span-2 lg:col-span-1"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

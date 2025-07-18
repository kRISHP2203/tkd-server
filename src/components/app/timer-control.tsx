
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play } from 'lucide-react';

interface TimerControlProps {
  timeRemaining: number;
  isTimerRunning: boolean;
  currentRound: number;
  totalRounds: number;
  onToggleTimer: () => void;
}

export default function TimerControl({
  timeRemaining,
  isTimerRunning,
  currentRound,
  totalRounds,
  onToggleTimer,
}: TimerControlProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-transparent border-0 shadow-none text-center">
      <CardContent className="p-1 flex flex-col items-center gap-2">
        <div className="font-headline font-bold text-5xl text-foreground/90 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
        <CardDescription className="text-xs">
          {currentRound} ({totalRounds})
        </CardDescription>
        <div className="flex justify-center gap-1 w-full">
          <Button
            size="icon"
            onClick={onToggleTimer}
            className="text-xs h-8 w-8"
          >
            {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

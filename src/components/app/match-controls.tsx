
'use client';

import { Card, CardContent } from '@/components/ui/card';
import JudgeControls from '@/components/app/judge-controls';
import TimerControl from '@/components/app/timer-control';

interface MatchControlsProps {
    timeRemaining: number;
    isTimerRunning: boolean;
    currentRound: number;
    totalRounds: number;
    onToggleTimer: () => void;
    matchState: 'idle' | 'running' | 'paused' | 'between_rounds' | 'finished';
    restTimeRemaining: number;
    onAction: (team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => void;
    onResetMatch: () => void;
    onOpenOptions: () => void;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function MatchControls({
    timeRemaining,
    isTimerRunning,
    currentRound,
    totalRounds,
    onToggleTimer,
    matchState,
    restTimeRemaining,
    onAction,
    onResetMatch,
    onOpenOptions
}: MatchControlsProps) {

    return (
        <>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                <Card className="w-48 p-2 flex flex-col gap-2 bg-card/80 backdrop-blur-sm pointer-events-auto">
                <CardContent className="p-0 flex-grow flex flex-col justify-center gap-2">
                    <TimerControl
                    timeRemaining={timeRemaining}
                    isTimerRunning={isTimerRunning}
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    onToggleTimer={onToggleTimer}
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
            {(matchState === 'paused' || matchState === 'idle' || matchState === 'between_rounds' || matchState === 'finished') && (
                <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-sm">
                    <JudgeControls onAction={onAction} onResetMatch={onResetMatch} onOpenOptions={onOpenOptions} />
                </footer>
            )}
        </>
    )
}

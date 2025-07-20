
'use client';

import React from 'react';
import { Settings, History } from 'lucide-react';
import Link from 'next/link';

import { useMatchEngine } from '@/hooks/use-match-engine';
import MatchControls from '@/components/app/match-controls';
import ScorePanel from '@/components/app/score-panel';
import GameOptionsDialog from '@/components/app/game-options-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function MatchManager() {
  const {
    matchState,
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
    settings,
    isOptionsDialogOpen,
    matchWinner,
    roundWinner,
    handleJudgeAction,
    resetMatch,
    handleTimerToggle,
    handleSettingsSave,
    setIsOptionsDialogOpen
  } = useMatchEngine();
  
  const { isLoading } = useAuth();
  const isFinished = matchState === 'finished';
  const isBetweenRounds = matchState === 'between_rounds';

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p className="text-muted-foreground">Loading...</p>
        </div>
    )
  }

  return (
    <>
      <main className="flex-grow flex flex-col md:flex-row relative">
        {matchState !== 'running' && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/history">
                <History className="h-6 w-6 text-foreground/80" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-6 w-6 text-foreground/80" />
              </Link>
            </Button>
          </div>
        )}

        <ScorePanel 
          team="red" 
          score={redScore} 
          wins={redWins} 
          penalties={redPenalties} 
          isWinner={(isFinished && matchWinner === 'red') || (isBetweenRounds && roundWinner === 'red')}
        />
        <ScorePanel 
          team="blue" 
          score={blueScore} 
          wins={blueWins} 
          penalties={bluePenalties} 
          isWinner={(isFinished && matchWinner === 'blue') || (isBetweenRounds && roundWinner === 'blue')}
        />

        <MatchControls 
          timeRemaining={timeRemaining}
          isTimerRunning={isTimerRunning}
          currentRound={currentRound}
          totalRounds={settings.totalRounds}
          onToggleTimer={handleTimerToggle}
          matchState={matchState}
          restTimeRemaining={restTimeRemaining}
          onAction={handleJudgeAction}
          onResetMatch={resetMatch}
          onOpenOptions={() => setIsOptionsDialogOpen(true)}
          matchWinner={matchWinner}
        />

      </main>
      <GameOptionsDialog 
        isOpen={isOptionsDialogOpen}
        onOpenChange={setIsOptionsDialogOpen}
        initialSettings={settings}
        onSave={handleSettingsSave}
      />
    </>
  );
}

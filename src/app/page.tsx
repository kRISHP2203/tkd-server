
'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import Link from 'next/link';

import { useMatchEngine } from '@/hooks/use-match-engine';
import MatchControls from '@/components/app/match-controls';
import ScorePanel from '@/components/app/score-panel';
import GameOptionsDialog from '@/components/app/game-options-dialog';
import { Button } from '@/components/ui/button';

export default function TapScoreHubPage() {
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
    handleJudgeAction,
    resetMatch,
    handleTimerToggle,
    handleSettingsSave,
    setIsOptionsDialogOpen
  } = useMatchEngine();

  const isFinished = matchState === 'finished';
  
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

          <ScorePanel team="red" score={redScore} wins={redWins} penalties={redPenalties} isWinner={isFinished && matchWinner === 'red'} />
          <ScorePanel team="blue" score={blueScore} wins={blueWins} penalties={bluePenalties} isWinner={isFinished && matchWinner === 'blue'} />

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

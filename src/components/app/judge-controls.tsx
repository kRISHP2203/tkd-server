
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React from 'react';

interface JudgeControlsProps {
  onAction: (team: 'red' | 'blue', points: number, type: 'score' | 'penalty', scoreType?: 'body' | 'head') => void;
  onResetMatch: () => void;
  onOpenOptions: () => void;
}

const ActionButton = ({ team, points, onAction, children, scoreType, type = 'score' }: { team: 'red' | 'blue'; points: number; onAction: JudgeControlsProps['onAction']; children: React.ReactNode, scoreType?: 'body' | 'head', type?: 'score' | 'penalty' }) => (
    <Button
      size="sm"
      variant={team === 'red' ? 'destructive' : 'default'}
      className="flex-1"
      onClick={() => onAction(team, points, type, scoreType)}
    >
      {children}
    </Button>
  );

  const PenaltyButton = ({ team, onAction, children }: { team: 'red' | 'blue'; onAction: JudgeControlsProps['onAction']; children: React.ReactNode }) => (
    <Button
      size="sm"
      variant="outline"
      className="flex-1"
      onClick={() => onAction(team, 1, 'penalty')}
    >
      {children}
    </Button>
  );

const JudgeControls = ({ onAction, onResetMatch, onOpenOptions }: JudgeControlsProps) => {
  return (
    <Card className="bg-transparent border-0 shadow-none max-w-5xl mx-auto">
      <CardContent className="p-2 flex items-center justify-between gap-4 rounded-lg border bg-card/80">
        <Button
            variant="outline"
            onClick={onResetMatch}
            size="sm"
          >
            Restart Game
        </Button>

        {/* Red Team Controls */}
        <div className="flex items-center gap-3">
            <span className="font-bold font-headline text-destructive text-sm">RED</span>
            <div className="flex items-center gap-1">
                <ActionButton team="red" points={2} onAction={onAction} scoreType="body">Body</ActionButton>
                <ActionButton team="red" points={3} onAction={onAction} scoreType="head">Head</ActionButton>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
                <span className='text-sm font-medium mr-1'>Gam-jeom</span>
                <PenaltyButton team="red" onAction={onAction}>+1</PenaltyButton>
            </div>
        </div>

        {/* Blue Team Controls */}
        <div className="flex items-center gap-3">
            <span className="font-bold font-headline text-primary text-sm">BLUE</span>
            <div className="flex items-center gap-1">
                <ActionButton team="blue" points={2} onAction={onAction} scoreType="body">Body</ActionButton>
                <ActionButton team="blue" points={3} onAction={onAction} scoreType="head">Head</ActionButton>
            </div>
            <Separator orientation="vertical" className="h-6" />
             <div className="flex items-center gap-1">
                <span className='text-sm font-medium mr-1'>Gam-jeom</span>
                <PenaltyButton team="blue" onAction={onAction}>+1</PenaltyButton>
            </div>
        </div>
        <Button
            variant="outline"
            onClick={onOpenOptions}
            size="sm"
          >
            Game Options
        </Button>
      </CardContent>
    </Card>
  );
}

export default React.memo(JudgeControls);

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';

interface JudgeControlsProps {
  onAction: (team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => void;
  onResetMatch: () => void;
  onOpenOptions: () => void;
}

const ActionButton = ({ team, points, onAction, children, type = 'score' }: { team: 'red' | 'blue'; points: number; onAction: JudgeControlsProps['onAction']; children: React.ReactNode, type?: 'score' | 'penalty' }) => (
    <Button
      size="sm"
      variant={team === 'red' ? 'destructive' : 'default'}
      className="flex-1"
      onClick={() => onAction(team, points, type)}
    >
      {children}
    </Button>
  );

  const PenaltyButton = ({ team, points, onAction, children }: { team: 'red' | 'blue'; points: number; onAction: JudgeControlsProps['onAction']; children: React.ReactNode }) => (
    <Button
      size="sm"
      variant="outline"
      className="flex-1"
      onClick={() => onAction(team, points, 'penalty')}
    >
      {children}
    </Button>
  );

export default function JudgeControls({ onAction, onResetMatch, onOpenOptions }: JudgeControlsProps) {
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
                <ActionButton team="red" points={1} onAction={onAction}>+1</ActionButton>
                <ActionButton team="red" points={-1} onAction={onAction}>-1</ActionButton>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
                <span className='text-sm font-medium mr-1'>Gam-jeom</span>
                <PenaltyButton team="blue" points={1} onAction={onAction}>+1</PenaltyButton>
                <PenaltyButton team="blue" points={-1} onAction={onAction}>-1</PenaltyButton>
            </div>
        </div>

        {/* Blue Team Controls */}
        <div className="flex items-center gap-3">
            <span className="font-bold font-headline text-primary text-sm">BLUE</span>
            <div className="flex items-center gap-1">
                <ActionButton team="blue" points={1} onAction={onAction}>+1</ActionButton>
                <ActionButton team="blue" points={-1} onAction={onAction}>-1</ActionButton>
            </div>
            <Separator orientation="vertical" className="h-6" />
             <div className="flex items-center gap-1">
                <span className='text-sm font-medium mr-1'>Gam-jeom</span>
                <PenaltyButton team="red" points={1} onAction={onAction}>+1</PenaltyButton>
                <PenaltyButton team="red" points={-1} onAction={onAction}>-1</PenaltyButton>
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

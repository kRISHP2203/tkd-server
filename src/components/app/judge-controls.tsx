'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface JudgeControlsProps {
  onAction: (team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => void;
  onResetMatch: () => void;
}

const ActionButton = ({ team, points, onAction, children }: { team: 'red' | 'blue'; points: number; onAction: JudgeControlsProps['onAction']; children: React.ReactNode }) => (
    <Button
      size="sm"
      variant={team === 'red' ? 'destructive' : 'default'}
      className="flex-1"
      onClick={() => onAction(team, points, 'score')}
    >
      {children}
    </Button>
  );

export default function JudgeControls({ onAction, onResetMatch }: JudgeControlsProps) {
  return (
    <Card className="bg-transparent border-0 shadow-none max-w-4xl mx-auto">
      <CardContent className="p-2 flex items-center justify-between gap-4 rounded-lg border bg-card/80">
        <Button
            variant="outline"
            onClick={onResetMatch}
            size="sm"
          >
            Restart Game
        </Button>

        <div className="flex items-center justify-center gap-4">
            {/* Red Team Controls */}
            <div className="flex items-center gap-3">
                <span className="font-bold font-headline text-destructive text-sm">RED</span>
                <div className="flex items-center gap-1">
                    <ActionButton team="red" points={1} onAction={onAction}>+1</ActionButton>
                    <ActionButton team="red" points={-1} onAction={onAction}>-1</ActionButton>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <Button size="sm" variant="outline" onClick={() => onAction('blue', 1, 'penalty')}>gam-jeom</Button>
            </div>

            <Separator orientation="vertical" className="h-10" />

            {/* Blue Team Controls */}
            <div className="flex items-center gap-3">
                <span className="font-bold font-headline text-primary text-sm">BLUE</span>
                <div className="flex items-center gap-1">
                    <ActionButton team="blue" points={1} onAction={onAction}>+1</ActionButton>
                    <ActionButton team="blue" points={-1} onAction={onAction}>-1</ActionButton>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <Button size="sm" variant="outline" onClick={() => onAction('red', 1, 'penalty')}>gam-jeom</Button>
            </div>
        </div>

        <div className="w-8"></div>
      </CardContent>
    </Card>
  );
}

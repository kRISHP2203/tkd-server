'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface JudgeControlsProps {
  onAction: (team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => void;
}

const ScoreButton = ({ team, points, onAction }: { team: 'red' | 'blue'; points: number; onAction: JudgeControlsProps['onAction'] }) => (
  <Button
    size="sm"
    variant={team === 'red' ? 'destructive' : 'default'}
    className="flex-1"
    onClick={() => onAction(team, points, 'score')}
  >
    +{points}
  </Button>
);

export default function JudgeControls({ onAction }: JudgeControlsProps) {
  return (
    <Card className="bg-transparent border-0 shadow-none max-w-4xl mx-auto">
      <CardContent className="p-2 flex items-center justify-center gap-4 rounded-lg border bg-card">
        {/* Red Team Controls */}
        <div className="flex items-center gap-3">
            <span className="font-bold font-headline text-destructive text-sm">RED</span>
            <div className="flex items-center gap-1">
                <ScoreButton team="red" points={1} onAction={onAction} />
                <ScoreButton team="red" points={2} onAction={onAction} />
                <ScoreButton team="red" points={3} onAction={onAction} />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" variant="outline" onClick={() => onAction('blue', 1, 'penalty')}>Penalty</Button>
        </div>

        <Separator orientation="vertical" className="h-10" />

        {/* Blue Team Controls */}
        <div className="flex items-center gap-3">
             <span className="font-bold font-headline text-primary text-sm">BLUE</span>
             <div className="flex items-center gap-1">
                <ScoreButton team="blue" points={1} onAction={onAction} />
                <ScoreButton team="blue" points={2} onAction={onAction} />
                <ScoreButton team="blue" points={3} onAction={onAction} />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" variant="outline" onClick={() => onAction('red', 1, 'penalty')}>Penalty</Button>
        </div>
      </CardContent>
    </Card>
  );
}

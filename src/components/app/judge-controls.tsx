'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-center font-headline text-lg">Judge Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Red Team Controls */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-3 rounded-lg border bg-card">
            <span className="col-span-2 font-bold font-headline text-destructive text-sm">Red Team</span>
            <p className="text-sm font-semibold text-right">Score</p>
            <div className="flex items-center gap-2">
                <ScoreButton team="red" points={1} onAction={onAction} />
                <ScoreButton team="red" points={2} onAction={onAction} />
                <ScoreButton team="red" points={3} onAction={onAction} />
            </div>
            <p className="text-sm font-semibold text-right">Penalty</p>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onAction('blue', 1, 'penalty')}>Blue +1</Button>
        </div>

        {/* Blue Team Controls */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-3 rounded-lg border bg-card">
            <span className="col-span-2 font-bold font-headline text-primary text-sm">Blue Team</span>
            <p className="text-sm font-semibold text-right">Score</p>
            <div className="flex items-center gap-2">
                <ScoreButton team="blue" points={1} onAction={onAction} />
                <ScoreButton team="blue" points={2} onAction={onAction} />
                <ScoreButton team="blue" points={3} onAction={onAction} />
            </div>
             <p className="text-sm font-semibold text-right">Penalty</p>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onAction('red', 1, 'penalty')}>Red +1</Button>
        </div>
      </CardContent>
    </Card>
  );
}

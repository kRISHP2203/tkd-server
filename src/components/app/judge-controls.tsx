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
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-center font-headline text-lg">Judge Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Red Team Controls */}
        <div className="flex flex-col gap-3 p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between text-sm">
                <span className="font-bold font-headline text-destructive">Red Team</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold w-12">Score</p>
                <ScoreButton team="red" points={1} onAction={onAction} />
                <ScoreButton team="red" points={2} onAction={onAction} />
                <ScoreButton team="red" points={3} onAction={onAction} />
            </div>
             <div className="flex items-center gap-2">
                <p className="text-sm font-semibold w-12">Penalty</p>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onAction('blue', 1, 'penalty')}>Blue +1</Button>
            </div>
        </div>

        {/* Blue Team Controls */}
        <div className="flex flex-col gap-3 p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between text-sm">
                <span className="font-bold font-headline text-primary">Blue Team</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold w-12">Score</p>
                <ScoreButton team="blue" points={1} onAction={onAction} />
                <ScoreButton team="blue" points={2} onAction={onAction} />
                <ScoreButton team="blue" points={3} onAction={onAction} />
            </div>
             <div className="flex items-center gap-2">
                <p className="text-sm font-semibold w-12">Penalty</p>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onAction('red', 1, 'penalty')}>Red +1</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

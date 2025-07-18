'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Referee = {
  id: number;
  status: 'connected' | 'disconnected';
  lastSeen: number;
};

interface RefereeControlsProps {
  referees: Referee[];
  onAction: (refereeId: number, team: 'red' | 'blue', points: number, type: 'score' | 'penalty') => void;
}

const ScoreButton = ({ team, points, refereeId, onAction }: { team: 'red' | 'blue'; points: number; refereeId: number; onAction: RefereeControlsProps['onAction'] }) => (
  <Button
    size="sm"
    variant={team === 'red' ? 'destructive' : 'default'}
    className="flex-1"
    onClick={() => onAction(refereeId, team, points, 'score')}
  >
    +{points}
  </Button>
);

export default function RefereeControls({ referees, onAction }: RefereeControlsProps) {
  return (
    <Card className="bg-background/50">
      <CardHeader>
        <CardTitle className="text-center font-headline text-lg">Referee Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {referees.map(ref => (
          <div key={ref.id} className="flex flex-col gap-3 p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold font-headline">Referee {ref.id}</span>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ref.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span className="capitalize text-muted-foreground">{ref.status}</span>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-center font-semibold text-destructive">Red</p>
              <div className="flex gap-2">
                <ScoreButton team="red" points={1} refereeId={ref.id} onAction={onAction} />
                <ScoreButton team="red" points={2} refereeId={ref.id} onAction={onAction} />
                <ScoreButton team="red" points={3} refereeId={ref.id} onAction={onAction} />
              </div>
               <Button size="sm" variant="outline" onClick={() => onAction(ref.id, 'blue', 1, 'penalty')}>Penalty</Button>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-center font-semibold text-primary">Blue</p>
              <div className="flex gap-2">
                <ScoreButton team="blue" points={1} refereeId={ref.id} onAction={onAction} />
                <ScoreButton team="blue" points={2} refereeId={ref.id} onAction={onAction} />
                <ScoreButton team="blue" points={3} refereeId={ref.id} onAction={onAction} />
              </div>
               <Button size="sm" variant="outline" onClick={() => onAction(ref.id, 'red', 1, 'penalty')}>Penalty</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

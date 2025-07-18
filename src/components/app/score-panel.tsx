'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScorePanelProps {
  team: 'red' | 'blue';
  score: number;
  penalties: number;
}

export default function ScorePanel({ team, score, penalties }: ScorePanelProps) {
  const [prevScore, setPrevScore] = useState(score);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (score !== prevScore) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 500);
      setPrevScore(score);
      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  const teamName = team === 'red' ? 'Hong' : 'Chong';
  const isRed = team === 'red';
  
  const panelClasses = cn(
    'flex-grow flex flex-col transition-all duration-300 border-0 rounded-none',
    isRed ? 'bg-destructive' : 'bg-primary'
  );

  const textClasses = cn(
    isRed ? 'text-destructive-foreground' : 'text-primary-foreground'
  );

  const titleClasses = cn(
    'font-headline text-4xl md:text-5xl font-bold',
    textClasses
  );

  const scoreClasses = cn(
    'font-headline font-bold text-7xl md:text-9xl transition-transform duration-200 ease-out',
    isRed ? 'text-destructive-foreground/90' : 'text-primary-foreground/90',
    shouldAnimate && 'scale-110'
  );

  return (
    <Card className={panelClasses}>
      <CardHeader>
        <CardTitle className={titleClasses}>
          {teamName}
        </CardTitle>
        <CardDescription className={cn(textClasses, 'text-lg font-medium')}>
          Gam-jeom: {penalties}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        <div className={scoreClasses}>
          {score}
        </div>
      </CardContent>
    </Card>
  );
}

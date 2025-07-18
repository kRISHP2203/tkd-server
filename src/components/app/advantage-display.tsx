'use client';

import type { AdvantageAnalyzerOutput } from '@/ai/flows/advantage-analyzer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface AdvantageDisplayProps {
  result: AdvantageAnalyzerOutput | null;
  isLoading: boolean;
}

export default function AdvantageDisplay({ result, isLoading }: AdvantageDisplayProps) {
  if (isLoading && !result) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!result || result.advantageTeam === 'none' || !result.handicapRecommendation) {
    return (
      <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">
        <p>No significant advantage detected.</p>
      </div>
    );
  }

  const teamColor = result.advantageTeam === 'red' ? 'text-destructive' : 'text-primary';
  const teamName = result.advantageTeam.charAt(0).toUpperCase() + result.advantageTeam.slice(1);

  return (
    <Alert className="bg-card">
      <Lightbulb className="h-4 w-4" />
      <AlertTitle className={`font-headline ${teamColor}`}>
        {teamName} Team has a significant advantage!
      </AlertTitle>
      <AlertDescription>
        <span className="font-semibold">Recommendation:</span> {result.handicapRecommendation}
      </AlertDescription>
    </Alert>
  );
}

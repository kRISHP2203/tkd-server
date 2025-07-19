
'use client';

import React from 'react';
import MatchManager from '@/components/app/match-manager';

export default function TapScoreHubPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <MatchManager />
    </div>
  );
}

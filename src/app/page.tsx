
'use client';

import React, { useState } from 'react';
import MatchManager from '@/components/app/match-manager';
import ImmersiveModePrompt from '@/components/app/immersive-mode-prompt';

export default function TapScoreHubPage() {
  const [isImmersive, setIsImmersive] = useState(false);

  const handleEnterImmersive = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
      setIsImmersive(true);
    } catch (error) {
      console.error("Failed to enter immersive mode:", error);
      // Fallback for browsers that don't support one or both APIs
      setIsImmersive(true);
    }
  };

  if (!isImmersive) {
    return <ImmersiveModePrompt onEnter={handleEnterImmersive} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <MatchManager />
    </div>
  );
}


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
      setIsImmersive(true); // Still proceed to app even if fullscreen fails
    }
  };

  if (isImmersive) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <MatchManager />
        </div>
    );
  }

  return <ImmersiveModePrompt onEnter={handleEnterImmersive} />;
}

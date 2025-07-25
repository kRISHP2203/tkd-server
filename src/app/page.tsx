
'use client';

import React, { useState } from 'react';
import MatchManager from '@/components/app/match-manager';
import ImmersiveModePrompt from '@/components/app/immersive-mode-prompt';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TapScoreHubPage() {
  const [isImmersive, setIsImmersive] = useState(false);
  const isMobile = useIsMobile();

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
      // Fallback for browsers/devices that fail but still should show the app
      setIsImmersive(true); 
    }
  };

  // On desktop, we are already "immersive" in the sense that we don't need a prompt.
  // The isMobile check prevents a flash of the prompt on desktop.
  if (isMobile === false || isImmersive) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <MatchManager />
        </div>
    );
  }
  
  // Only render the prompt on mobile devices when not in immersive mode.
  if (isMobile) {
    return <ImmersiveModePrompt onEnter={handleEnterImmersive} />;
  }

  // Render nothing or a skeleton loader while determining the device type.
  return null;
}


'use client';

import React, { useState, useEffect } from 'react';
import MatchManager from '@/components/app/match-manager';
import ImmersiveModePrompt from '@/components/app/immersive-mode-prompt';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TapScoreHubPage() {
  const [isImmersive, setIsImmersive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      setIsImmersive(true);
    }
  };

  if (!isClient) {
    // Wait for client-side hydration to avoid mismatched content
    return null; 
  }

  if (isMobile && !isImmersive) {
    return <ImmersiveModePrompt onEnter={handleEnterImmersive} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <MatchManager />
    </div>
  );
}

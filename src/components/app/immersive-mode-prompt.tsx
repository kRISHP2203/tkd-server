
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Expand } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MatchManager from './match-manager';

interface ImmersiveModePromptProps {
  onEnter: () => void;
}

export default function ImmersiveModePrompt({ onEnter }: ImmersiveModePromptProps) {
  const isMobile = useIsMobile();
  
  // To avoid hydration mismatch, we need to ensure we don't render the mobile-only view on the server.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isMobile) {
    // On desktop or during server-side rendering, we want to bypass the prompt.
    // The parent component (`page.tsx`) should handle this by setting `isImmersive` to true immediately.
    // The `useEffect` here was causing the "Fullscreen request denied" error on desktop.
    // We rely on the parent component's logic to handle this now.
    useEffect(() => {
        onEnter();
    }, [onEnter]);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="max-w-md">
        <Smartphone className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">Enter Fullscreen Match Mode</h1>
        <p className="text-muted-foreground mb-6">
          For the best experience on your mobile device, please enter fullscreen landscape mode.
        </p>
        <Button onClick={onEnter} size="lg">
          <Expand className="mr-2 h-5 w-5" />
          Enter Fullscreen
        </Button>
      </div>
    </div>
  );
}

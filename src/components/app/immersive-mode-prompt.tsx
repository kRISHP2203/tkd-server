
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Expand } from 'lucide-react';

interface ImmersiveModePromptProps {
  onEnter: () => void;
}

export default function ImmersiveModePrompt({ onEnter }: ImmersiveModePromptProps) {
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

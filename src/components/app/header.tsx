'use client';

import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-start text-left">
      <Shield className="h-8 w-8 mr-3 text-primary" />
      <h1 className="text-4xl font-headline font-bold tracking-tighter">
        TKD Wifi Server
      </h1>
    </header>
  );
}

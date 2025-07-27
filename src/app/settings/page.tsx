
'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Wifi, X, KeyRound, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Referee } from '@/components/app/settings/referee-connection-hub';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

const PremiumSettings = lazy(() => import('@/components/app/settings/premium-settings'));
const RefereeConnectionHub = lazy(() => import('@/components/app/settings/referee-connection-hub'));
const TroubleshootingGuide = lazy(() => import('@/components/app/settings/troubleshooting-guide'));

export type ConnectionMode = 'websocket' | 'udp';

export interface AppSettings {
  connectionMode: ConnectionMode;
  readonly serverPort: 8000;
  connectionTimeout: number;
  autoReconnect: boolean;
  broadcastScore: boolean;
  serverIp: string;
}

const defaultSettings: AppSettings = {
  connectionMode: 'websocket',
  serverPort: 8000,
  connectionTimeout: 5000,
  autoReconnect: true,
  broadcastScore: false,
  serverIp: '', // Default to empty to force user input
};

let ws: WebSocket | null = null;

const SettingsSkeleton = () => (
    <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
    </div>
);


export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [referees, setReferees] = useState<Referee[]>([]);
  const { toast } = useToast();
  const { licenseKey, deviceId, plan, maxReferees } = useAuth();
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>("premium");

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed, serverPort: 8000 });
      }
    } catch (e) {
      console.error("Could not load app settings", e);
    }
  }, []);
  
  const handleSaveSettings = () => {
    try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        toast({
            title: 'Settings Saved',
            description: 'Your connection settings have been saved.',
        });
    } catch(e) {
        toast({
            title: 'Error Saving Settings',
            description: 'Could not save settings to local storage.',
            variant: 'destructive',
        });
        console.error("Could not save settings", e);
    }
  };

  useEffect(() => {
    const connect = () => {
      if (ws && ws.readyState < 2) {
        return;
      }
      
      ws = new WebSocket('ws://localhost:8000');

      ws.onopen = () => {
        console.log('✅ Settings page connected to WebSocket server');
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'get_referees' }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString());
          if (message.action === 'referee_list') {
            setReferees(message.referees);
          } else if (message.error === 'MAX_REFEREES_REACHED') {
            toast({
              title: "Referee Limit Reached",
              description: `Your '${message.plan}' plan only allows for ${message.limit} referees.`,
              variant: 'destructive'
            });
          }
        } catch (e) {
          console.error('Error parsing message on settings page:', e);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Settings page disconnected from WebSocket server');
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      ws?.close();
    };
  }, [plan, toast]);


  const handleCopyIp = () => {
    if (settings.serverIp) {
      navigator.clipboard.writeText(`${settings.serverIp}:${settings.serverPort}`);
      toast({
        title: 'IP Address & Port Copied',
        description: `${settings.serverIp}:${settings.serverPort} has been copied to your clipboard.`,
      });
    } else {
      toast({
        title: 'No IP Address to Copy',
        description: `Please enter this device's IP address first.`,
        variant: 'destructive',
      });
    }
  };
  
  const handleResetConnections = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'reset_connections' }));
    }
    console.log('Resetting all referee connections...');
    toast({
      title: 'Connections Reset',
      description: 'All active referee connections have been cleared.',
      variant: 'destructive'
    });
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background p-4 font-body md:items-center">
      <Card className="w-full max-w-2xl relative">
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
            <X className="h-6 w-6" />
        </Link>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            <span>Connection & Settings</span>
          </CardTitle>
          <CardDescription>
            Manage connections, your license, and get help.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <Suspense fallback={<SettingsSkeleton />}>
            <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                <AccordionItem value="premium">
                    <AccordionTrigger className="px-6 text-lg">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-5 w-5" />
                            License & Plan
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                        <PremiumSettings />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="connections">
                    <AccordionTrigger className="px-6 text-lg">
                        <div className="flex items-center gap-3">
                            <Wifi className="h-5 w-5" />
                            Referee Connections
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                        <RefereeConnectionHub
                            settings={settings}
                            setSettings={setSettings}
                            onCopyIp={handleCopyIp}
                            onSaveSettings={handleSaveSettings}
                            referees={referees}
                            onResetConnections={handleResetConnections}
                            maxReferees={maxReferees}
                        />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="help">
                    <AccordionTrigger className="px-6 text-lg">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5" />
                            Troubleshooting & Help
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                        <TroubleshootingGuide />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

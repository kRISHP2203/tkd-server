
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Server, Wifi, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PremiumSettings from '@/components/app/settings/premium-settings';
import { useAuth } from '@/hooks/use-auth';
import type { Referee } from '@/components/app/settings/referee-connection-hub';
import RefereeConnectionHub from '@/components/app/settings/referee-connection-hub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ConnectionMode = 'websocket' | 'udp';

export interface AppSettings {
  connectionMode: ConnectionMode;
  readonly serverPort: 8080;
  connectionTimeout: number;
  autoReconnect: boolean;
  broadcastScore: boolean;
  serverIp: string;
}

const defaultSettings: AppSettings = {
  connectionMode: 'websocket',
  serverPort: 8080,
  connectionTimeout: 5000,
  autoReconnect: true,
  broadcastScore: false,
  serverIp: '', // Default to empty to force user input
};

let ws: WebSocket | null = null;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [referees, setReferees] = useState<Referee[]>([]);
  const { toast } = useToast();
  const { licenseKey, plan, deviceId, maxReferees } = useAuth();

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed, serverPort: 8080 });
      }
    } catch (e) {
      console.error("Could not load app settings", e);
    }
  }, []);

  useEffect(() => {
    const connect = () => {
      if (ws && ws.readyState < 2) {
        return;
      }
      
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('✅ Settings page connected to WebSocket server');
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'get_referees', licenseKey, deviceId }));
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
              description: `Your '${plan}' plan only allows for ${message.limit} referees.`,
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

      ws.onerror = (error) => {
        ws?.close();
      };
    };

    connect();

    return () => {
      ws?.close();
    };
  }, [licenseKey, deviceId, plan, toast]);

  const handleSave = () => {
    try {
      localStorage.setItem('appSettings', JSON.stringify({ ...settings, serverPort: 8080 }));
      toast({
        title: 'Settings Saved',
        description: 'Your new settings have been saved locally.',
      });
    } catch(e) {
      console.error("Failed to save settings", e);
      toast({
        title: 'Error saving settings',
        description: 'Could not save settings to local storage.',
        variant: 'destructive',
      });
    }
  };

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
        ws.send(JSON.stringify({ action: 'reset_connections', licenseKey }));
    }
    console.log('Resetting all referee connections...');
    toast({
      title: 'Connections Reset',
      description: 'All active referee connections have been cleared.',
      variant: 'destructive'
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-2xl relative">
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
        </Link>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            <span>Connection Settings</span>
          </CardTitle>
          <CardDescription>
            Configure the server, connected referees, and your premium plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <PremiumSettings />

          <RefereeConnectionHub
            settings={settings}
            setSettings={setSettings}
            onCopyIp={handleCopyIp}
            referees={referees}
            onResetConnections={handleResetConnections}
            maxReferees={maxReferees}
          />
          
          <Alert>
            <Server className="h-4 w-4" />
            <AlertTitle>Server Port Information</AlertTitle>
            <AlertDescription>
              The WebSocket server port is fixed at 8080 and cannot be changed here.
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="rules" className="w-full">
            <TabsList>
              <TabsTrigger value="rules">WT Rules & Regulations</TabsTrigger>
            </TabsList>
            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>World Taekwondo Competition Rules</CardTitle>
                  <CardDescription>
                    Official rules and interpretations will be displayed here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Content for the WT Rules & Regulations is currently being prepared and will be available in a future update.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button size="lg" className="w-full" onClick={handleSave}>
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

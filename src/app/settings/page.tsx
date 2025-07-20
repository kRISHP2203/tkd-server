
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Server, Wifi, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConnectionSettings from '@/components/app/settings/connection-settings';
import RefereeManagement, { Referee } from '@/components/app/settings/referee-management';

export type ConnectionMode = 'websocket' | 'udp';

export interface AppSettings {
  connectionMode: ConnectionMode;
  serverPort: number;
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

  useEffect(() => {
    // Function to establish WebSocket connection
    const connect = () => {
      // Avoid creating multiple connections
      if (ws && ws.readyState < 2) {
        return;
      }
      
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('✅ Settings page connected to WebSocket server');
        // Request referee list on connection
        ws?.send(JSON.stringify({ action: 'get_referees' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString());
          if (message.action === 'referee_list') {
            setReferees(message.referees);
          }
        } catch (e) {
          console.error('Error parsing message on settings page:', e);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Settings page disconnected from WebSocket server');
        // Optional: try to reconnect after a delay
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        // console.error('WebSocket error on settings page:', error);
        ws?.close(); // Ensure connection is closed on error
      };
    };

    connect();

    // Clean up the connection when the component unmounts
    return () => {
      ws?.close();
    };
  }, []);

  const handleSave = () => {
    // In a real app, this would trigger a server restart or re-initialization.
    console.log('Saving settings and restarting server...', settings);
    toast({
      title: 'Settings Saved',
      description: 'Your new settings have been saved. Server restart initiated.',
    });
  };

  const handleCopyIp = () => {
    if (settings.serverIp) {
      navigator.clipboard.writeText(settings.serverIp);
      toast({
        title: 'IP Address Copied',
        description: `${settings.serverIp} has been copied to your clipboard.`,
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
            Configure how the server connects with referee devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <ConnectionSettings 
            settings={settings}
            setSettings={setSettings}
            onCopyIp={handleCopyIp}
          />
          
          <RefereeManagement referees={referees} onResetConnections={handleResetConnections} />

          <Alert>
            <Server className="h-4 w-4" />
            <AlertTitle>Apply Changes</AlertTitle>
            <AlertDescription>
              To apply new network settings, the server needs to be restarted.
            </AlertDescription>
          </Alert>

          <Button size="lg" className="w-full" onClick={handleSave}>
            Save & Restart Server
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

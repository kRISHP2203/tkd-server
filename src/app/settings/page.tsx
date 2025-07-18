
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wifi, Users, Server, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ConnectionMode = 'websocket' | 'udp';

interface Referee {
  id: string;
  lastSeen: string;
}

interface AppSettings {
  connectionMode: ConnectionMode;
  serverPort: number;
  connectionTimeout: number;
  autoReconnect: boolean;
  broadcastScore: boolean;
  serverIp: string;
}

const defaultSettings: AppSettings = {
  connectionMode: 'websocket',
  serverPort: 9000,
  connectionTimeout: 5000,
  autoReconnect: true,
  broadcastScore: false,
  serverIp: '192.168.1.100', // Default placeholder
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const { toast } = useToast();

  // A mock list of referees for display purposes.
  const authorizedReferees: Referee[] = [
    { id: 'Referee-1', lastSeen: '2s ago' },
    { id: 'Referee-2', lastSeen: '10s ago' },
  ];

  const handleCopyIp = () => {
    navigator.clipboard.writeText(settings.serverIp);
    toast({
      title: 'IP Address Copied',
      description: `${settings.serverIp} has been copied to your clipboard.`,
    });
  };

  const handleSave = () => {
    // In a real app, this would trigger a server restart or re-initialization.
    console.log('Saving settings and restarting server...', settings);
    toast({
      title: 'Settings Saved',
      description: 'Your new settings have been saved. Server restart initiated.',
    });
  };
  
  const handleResetConnections = () => {
    console.log('Resetting all referee connections...');
    toast({
      title: 'Connections Reset',
      description: 'All active referee connections have been cleared.',
      variant: 'destructive'
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-2xl">
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
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Manual IP Configuration Required</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              For referees to connect, you must find this device's <strong>Local Network IP Address</strong> and enter it below. The server and all referee devices must be on the same WiFi network.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="server-ip">This Device's Local IP</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="server-ip"
                    type="text" 
                    value={settings.serverIp}
                    onChange={(e) => setSettings(s => ({ ...s, serverIp: e.target.value }))}
                    placeholder="e.g. 192.168.1.100" 
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyIp}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-port">Listening Port</Label>
                <Input 
                  id="server-port" 
                  type="number" 
                  value={settings.serverPort}
                  onChange={(e) => setSettings(s => ({ ...s, serverPort: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 9000" 
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground px-1">
                Referees should connect to the IP address and port configured above.
            </p>

            <Separator />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connection-mode">Connection Mode</Label>
                <Select
                  value={settings.connectionMode}
                  onValueChange={(value: ConnectionMode) => setSettings(s => ({ ...s, connectionMode: value }))}
                >
                  <SelectTrigger id="connection-mode">
                    <SelectValue placeholder="Select a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="websocket">WebSocket</SelectItem>
                    <SelectItem value="udp" disabled>UDP (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                    <Label htmlFor="connection-timeout">Timeout (ms)</Label>
                    <Input 
                        id="connection-timeout" 
                        type="number" 
                        value={settings.connectionTimeout}
                        onChange={(e) => setSettings(s => ({ ...s, connectionTimeout: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 5000" 
                    />
                </div>
            </div>

            <div className="flex items-center space-x-6 pt-2">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="auto-reconnect" 
                        checked={settings.autoReconnect}
                        onCheckedChange={(checked) => setSettings(s => ({ ...s, autoReconnect: checked }))}
                    />
                    <Label htmlFor="auto-reconnect">Auto-Reconnect</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="broadcast-score"
                        checked={settings.broadcastScore}
                        onCheckedChange={(checked) => setSettings(s => ({ ...s, broadcastScore: checked }))}
                    />
                    <Label htmlFor="broadcast-score">Broadcast Score</Label>
                </div>
            </div>
          </div>
          
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Authorized Referees</h3>
            <div className="space-y-2">
                {authorizedReferees.length > 0 ? (
                    authorizedReferees.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted">
                            <span className="font-mono">{ref.id}</span>
                            <span className="text-muted-foreground">Last seen: {ref.lastSeen}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No referees connected.</p>
                )}
            </div>
            <Separator />
            <Button variant="destructive" onClick={handleResetConnections} className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" /> Clear All Referee Connections
            </Button>
          </div>

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

    
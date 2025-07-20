
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy } from 'lucide-react';
import type { AppSettings, ConnectionMode } from '@/app/settings/page';

interface ConnectionSettingsProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    onCopyIp: () => void;
}

const ConnectionSettingsComponent = ({ settings, setSettings, onCopyIp }: ConnectionSettingsProps) => {
    return (
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
                    placeholder="e.g. 192.168.1.X" 
                    />
                    <Button variant="outline" size="icon" onClick={onCopyIp}>
                    <Copy className="h-4 w-4" />
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground px-1">
                    Find IP: Win (`ipconfig`) or Mac/Linux (`ifconfig`).
                </p>
                </div>
                <div className="space-y-2">
                <Label htmlFor="server-port">Listening Port</Label>
                <Input 
                    id="server-port" 
                    type="number" 
                    value={settings.serverPort}
                    onChange={(e) => setSettings(s => ({ ...s, serverPort: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g. 8080" 
                />
                 <p className="text-xs text-muted-foreground px-1 invisible">
                    Placeholder to maintain alignment.
                </p>
                </div>
            </div>

            <p className="text-sm text-muted-foreground px-1">
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
    );
};

const ConnectionSettings = React.memo(ConnectionSettingsComponent);
export default ConnectionSettings;

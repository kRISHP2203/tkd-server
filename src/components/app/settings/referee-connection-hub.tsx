
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, AlertTriangle, Users, Wifi } from 'lucide-react';
import type { AppSettings } from '@/app/settings/page';

export interface Referee {
    id: string;
    lastSeen: string;
    status: 'connected' | 'disconnected';
}

interface RefereeConnectionHubProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    onCopyIp: () => void;
    referees: Referee[];
    onResetConnections: () => void;
    maxReferees: number;
}

const RefereeConnectionHubComponent = ({
    settings,
    setSettings,
    onCopyIp,
    referees,
    onResetConnections,
    maxReferees,
}: RefereeConnectionHubProps) => {
    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Connect Referees
                </h3>
                <div className="text-sm font-medium text-muted-foreground">
                    <span className="font-bold text-foreground">{referees.length}</span> / {maxReferees === Infinity ? 'Unlimited' : maxReferees} Connected
                </div>
            </div>
            
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
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                        Find IP: Win (`ipconfig`) or Mac/Linux (`ifconfig`).
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="server-port">Connection Address</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="server-port" 
                            type="text" 
                            value={settings.serverIp ? `${settings.serverIp}:${settings.serverPort}` : ''}
                            readOnly
                            placeholder="Enter IP to see address" 
                        />
                        <Button variant="outline" size="icon" onClick={onCopyIp}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                     <p className="text-xs text-muted-foreground px-1">
                        Referees connect to this address.
                    </p>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-2 min-h-[100px]">
                 <h4 className="font-medium text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Active Connections</h4>
                {referees.length > 0 ? (
                    referees.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted">
                            <span className="font-mono">{ref.id.substring(0, 8)}...</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-muted-foreground">{ref.status}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center py-4">
                        <p>Waiting for referees to connect...</p>
                    </div>
                )}
            </div>

            <Separator />
            <Button variant="destructive" onClick={onResetConnections} className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" /> Clear All Referee Connections
            </Button>
        </div>
    );
};

const RefereeConnectionHub = React.memo(RefereeConnectionHubComponent);
export default RefereeConnectionHub;

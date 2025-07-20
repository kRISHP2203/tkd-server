
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users } from 'lucide-react';

export interface Referee {
    id: string;
    lastSeen: string; // lastSeen will be managed by the server in a future update
    status: 'connected' | 'disconnected';
}

interface RefereeManagementProps {
    referees: Referee[];
    onResetConnections: () => void;
}

const RefereeManagementComponent = ({ referees, onResetConnections }: RefereeManagementProps) => {
    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Connected Referees</h3>
            <div className="space-y-2 min-h-[100px]">
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
}

const RefereeManagement = React.memo(RefereeManagementComponent);
export default RefereeManagement;

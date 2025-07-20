
'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users } from 'lucide-react';

interface RefereeManagementProps {
    onResetConnections: () => void;
}

interface Referee {
    id: string;
    lastSeen: string;
}

const RefereeManagementComponent = ({ onResetConnections }: RefereeManagementProps) => {
    // A mock list of referees for display purposes.
    const authorizedReferees: Referee[] = [
        { id: 'Referee-1', lastSeen: '2s ago' },
        { id: 'Referee-2', lastSeen: '10s ago' },
    ];

    return (
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
            <Button variant="destructive" onClick={onResetConnections} className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" /> Clear All Referee Connections
            </Button>
        </div>
    );
}

const RefereeManagement = React.memo(RefereeManagementComponent);
export default RefereeManagement;

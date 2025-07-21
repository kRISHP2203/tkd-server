
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Network, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TroubleshootingGuide() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Connection & Troubleshooting</CardTitle>
                <CardDescription>
                    Follow these steps to resolve common connection issues.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                    <div className="flex items-center gap-2"><Network className="h-4 w-4" />Step 1: Check Network & IP</div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pl-2">
                    <p className="text-sm text-muted-foreground">Both the server device and all referee devices **must** be on the exact same Wi-Fi network.</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Verify the Wi-Fi network name is identical on all devices.</li>
                        <li>Enter the server's Local IP address from above into each referee app.</li>
                        <li>On Windows, find the IP by opening Command Prompt and typing `ipconfig`. Look for the "IPv4 Address".</li>
                        <li>On macOS, find the IP in System Settings &gt; Wi-Fi &gt; Details.</li>
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Step 2: Check Firewall Settings</div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pl-2">
                    <p className="text-sm text-muted-foreground">Firewalls can block connections. You must allow the app to accept incoming connections.</p>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Action Required on Windows/macOS</AlertTitle>
                        <AlertDescription>
                            You need to create an "inbound rule" for **Port 8080 (TCP)** in your firewall settings to allow referees to connect. If you are on a public network (like a hotel or airport), the network itself may block this connection.
                        </AlertDescription>
                    </Alert>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>
                    <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Common Problems</div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pl-2">
                        <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>**"I entered the IP but it won't connect."** - This is almost always a firewall issue. Double-check Step 2.</li>
                        <li>**"It worked at home but not at the venue."** - The venue's Wi-Fi may have "Client Isolation" enabled, which prevents devices from seeing each other. The best solution is to create your own Wi-Fi hotspot from a mobile phone or laptop and connect all devices to that hotspot.</li>
                        <li>**"The app crashes or freezes."** - Ensure you are using the latest version of the server and referee apps. Restart both applications.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>
            Manage general application settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the dark theme for the application.
              </p>
            </div>
            <Switch id="dark-mode" defaultChecked />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects" className="text-base">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable sound effects for scores and timers.
              </p>
            </div>
            <Switch id="sound-effects" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

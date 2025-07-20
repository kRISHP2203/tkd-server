
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Crown, Star } from 'lucide-react';

const PlanDetails = ({ plan, title, price, features, isCurrent }: { plan: string, title: string, price: string, features: string[], isCurrent: boolean }) => (
    <Card className={isCurrent ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {plan === 'basic' && <Star className="h-5 w-5 text-yellow-500" />}
            {plan === 'elite' && <Crown className="h-5 w-5 text-purple-500" />}
            {title}
          </CardTitle>
          {isCurrent && <Badge variant="default">Current Plan</Badge>}
        </div>
        <CardDescription>{price}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          {features.map((feature, index) => <li key={index}>{feature}</li>)}
        </ul>
      </CardContent>
    </Card>
);

export default function PremiumSettings() {
    const { licenseKey, plan, verifyAndSetLicense, isLoading } = useAuth();
    const [inputKey, setInputKey] = useState(licenseKey || '');
  
    const handleVerify = async () => {
        await verifyAndSetLicense(inputKey);
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                License & Plan Management
            </h3>
            
            <div className="space-y-2">
                <Label htmlFor="license-key">Your License Key</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="license-key"
                        type="text"
                        placeholder="Enter your license key"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button onClick={handleVerify} disabled={isLoading || !inputKey}>
                        {isLoading ? 'Verifying...' : 'Verify & Activate'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                    Your plan is determined by your license key.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
                <PlanDetails 
                    plan="basic"
                    title="Basic Plan"
                    price="₹5,999 Lifetime"
                    features={['Connect up to 4 referee devices', 'Use on 2 devices simultaneously']}
                    isCurrent={plan === 'basic'}
                />
                <PlanDetails 
                    plan="elite"
                    title="Elite Plan"
                    price="₹9,999 Lifetime"
                    features={['Connect up to 4 referee devices', 'Use on 6 devices simultaneously']}
                    isCurrent={plan === 'elite'}
                />
            </div>
             {plan === 'free' && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                    You are currently on the Free plan. Enter a valid license key to upgrade.
                </p>
            )}
        </div>
    );
}

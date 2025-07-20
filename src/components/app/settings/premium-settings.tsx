
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Crown, Star } from 'lucide-react';

const PlanDetails = ({
    plan,
    title,
    price,
    features,
    isCurrent,
    isDowngrade,
    onPurchase,
    isLoading,
}: {
    plan: 'basic' | 'elite';
    title: string;
    price: string;
    features: string[];
    isCurrent: boolean;
    isDowngrade: boolean;
    onPurchase: () => void;
    isLoading: boolean;
}) => (
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
        <CardFooter>
            <Button 
                className="w-full" 
                onClick={onPurchase}
                disabled={isCurrent || isDowngrade || isLoading}
            >
                {isLoading ? 'Processing...' : (isCurrent ? 'Active Plan' : (isDowngrade ? 'Active Plan is Higher' : 'Purchase'))}
            </Button>
        </CardFooter>
    </Card>
);

export default function PremiumSettings() {
    const { 
        licenseKey, 
        plan, 
        verifyAndSetLicense, 
        isLoading,
        purchaseBasicPlan,
        purchaseElitePlan
    } = useAuth();
    const [inputKey, setInputKey] = React.useState(licenseKey || '');

    React.useEffect(() => {
        setInputKey(licenseKey || '');
    }, [licenseKey]);
  
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
                        placeholder="Enter license key or purchase a plan below"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button onClick={handleVerify} disabled={isLoading || !inputKey}>
                        {isLoading ? 'Verifying...' : 'Verify & Activate'}
                    </Button>
                </div>
                {plan === 'free' && !inputKey && (
                    <p className="text-xs text-muted-foreground px-1">
                        You are on the Free plan. Purchase a plan to get a license key.
                    </p>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
                <PlanDetails 
                    plan="basic"
                    title="Basic Plan"
                    price="₹5,999 Lifetime"
                    features={['Up to 4 referee devices', 'Use on 2 devices simultaneously']}
                    isCurrent={plan === 'basic'}
                    isDowngrade={false}
                    onPurchase={purchaseBasicPlan}
                    isLoading={isLoading}
                />
                <PlanDetails 
                    plan="elite"
                    title="Elite Plan"
                    price="₹9,999 Lifetime"
                    features={['Up to 4 referee devices', 'Use on 6 devices simultaneously']}
                    isCurrent={plan === 'elite'}
                    isDowngrade={plan === 'basic'}
                    onPurchase={purchaseElitePlan}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}

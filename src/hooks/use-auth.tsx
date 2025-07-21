
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '@/lib/device';
import { 
    verifyLicense, 
    registerDeviceToLicense, 
    getPlanLimits,
} from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';

type Plan = 'free' | 'basic' | 'elite';

interface AuthContextType {
  licenseKey: string | null;
  deviceId: string | null;
  plan: Plan;
  maxDevices: number;
  maxReferees: number;
  isLoading: boolean;
  verifyAndSetLicense: (key: string) => Promise<void>;
  logout: () => void;
  purchasePlan: (plan: Plan, amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

declare global {
    interface Window {
        Razorpay: any;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [maxDevices, setMaxDevices] = useState(1);
  const [maxReferees, setMaxReferees] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const setFreePlan = useCallback(async () => {
    const limits = await getPlanLimits('free');
    setPlan('free');
    setMaxDevices(limits.maxDevices);
    setMaxReferees(limits.maxReferees);
    setLicenseKey(null);
    localStorage.removeItem('licenseKey');
  }, []);

  const verifyAndSetLicense = useCallback(async (key: string) => {
    if (!deviceId) return;
    setIsLoading(true);

    try {
        const licenseData = await verifyLicense(key);
        if (!licenseData) {
            throw new Error("Invalid license key. Please check and try again.");
        }

        const isAllowed = await registerDeviceToLicense(key, deviceId);
        if (!isAllowed) {
            throw new Error(`This license is active on its limit of ${licenseData.maxDevices} devices.`);
        }

        const limits = await getPlanLimits(licenseData.plan);
        setLicenseKey(key);
        setPlan(licenseData.plan);
        setMaxDevices(limits.maxDevices);
        setMaxReferees(limits.maxReferees);
        localStorage.setItem('licenseKey', key);
        toast({
            title: "License Activated!",
            description: `Successfully upgraded to the ${licenseData.plan} plan.`,
        });

    } catch (error: any) {
        await setFreePlan();
        toast({
            title: "Activation Failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [deviceId, toast, setFreePlan]);
  
  const purchasePlan = useCallback(async (plan: Plan, amount: number) => {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        toast({
            title: 'Payments Not Enabled',
            description: 'The payment gateway has not been configured by the administrator.',
            variant: 'destructive',
        });
        return;
    }
    
    if (!deviceId) {
        toast({ title: 'Error', description: 'Device ID not available. Cannot complete purchase.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);

    try {
        const res = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, plan, deviceId }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to create Razorpay order.');
        }
        
        const order = await res.json();

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'TKD WiFi Server',
            description: `Purchase ${plan} Plan`,
            order_id: order.id,
            handler: async function (response: any) {
                try {
                    const verificationRes = await fetch('/api/razorpay', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            plan,
                            deviceId,
                        }),
                    });

                    if (!verificationRes.ok) {
                        const errorData = await verificationRes.json();
                        throw new Error(errorData.error || 'Payment verification failed.');
                    }
                    
                    const verificationData = await verificationRes.json();
                    
                    if (verificationData.success) {
                        await verifyAndSetLicense(verificationData.licenseKey);
                    } else {
                        throw new Error('Payment verification failed on server.');
                    }
                } catch (error: any) {
                     toast({ title: 'Payment Error', description: error.message, variant: 'destructive' });
                } finally {
                    setIsLoading(false);
                }
            },
            prefill: {
                name: 'TKD Customer',
                email: 'customer@example.com',
                contact: '9999999999',
            },
            notes: {
                address: 'TKD WiFi Server Purchase'
            },
            theme: {
                color: '#3399cc'
            }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any){
            console.error(response.error.code);
            console.error(response.error.description);
            toast({
                title: 'Payment Failed',
                description: response.error.description,
                variant: 'destructive',
            });
            setIsLoading(false);
        });
        rzp.open();

    } catch (error: any) {
        toast({ title: 'Purchase Error', description: error.message, variant: 'destructive' });
        setIsLoading(false);
    }
  }, [deviceId, toast, verifyAndSetLicense]);

  useEffect(() => {
    const initAuth = async () => {
        setIsLoading(true);
        const id = getDeviceId();
        setDeviceId(id);
        
        const storedKey = localStorage.getItem('licenseKey');
        if (storedKey) {
            await verifyAndSetLicense(storedKey);
        } else {
            await setFreePlan();
        }
        setIsLoading(false);
    };
    initAuth();
  }, [verifyAndSetLicense, setFreePlan]);

  const logout = async () => {
    // In a real app, you'd call a backend function to deregister the device from the license
    await setFreePlan();
    toast({ title: "Logged Out", description: "Your license has been deactivated on this device." });
  };

  const value = {
    licenseKey,
    deviceId,
    plan,
    maxDevices,
    maxReferees,
    isLoading,
    verifyAndSetLicense,
    logout,
    purchasePlan,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

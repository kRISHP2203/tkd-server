
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '@/lib/device';
import { verifyLicense, registerDeviceToLicense, getPlanLimits } from '@/lib/auth-service';
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [maxDevices, setMaxDevices] = useState(1);
  const [maxReferees, setMaxReferees] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const setFreePlan = async () => {
    const limits = await getPlanLimits('free');
    setPlan('free');
    setMaxDevices(limits.maxDevices);
    setMaxReferees(limits.maxReferees);
    setLicenseKey(null);
    localStorage.removeItem('licenseKey');
  }

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
            throw new Error("This license is active on too many devices.");
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
  }, [deviceId, toast]);

  useEffect(() => {
    const deviceId = getDeviceId();
    setDeviceId(deviceId);

    const loadLicense = async () => {
      setIsLoading(true);
      try {
        const storedKey = localStorage.getItem('licenseKey');
        if (storedKey) {
          await verifyAndSetLicense(storedKey);
        } else {
            await setFreePlan();
        }
      } catch (error) {
        console.error("Error loading license:", error);
        await setFreePlan();
      } finally {
        setIsLoading(false);
      }
    };
    loadLicense();
  }, [verifyAndSetLicense]);

  const logout = async () => {
    await setFreePlan();
    // Here you would also call a backend function to deregister the device
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

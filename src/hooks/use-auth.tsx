
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '@/lib/device';
import { verifyLicense, registerDeviceToLicense, getPlanLimits, LicenseData } from '@/lib/auth-service';
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
            setPlan('free');
            setMaxDevices(1);
            setMaxReferees(1);
        }
      } catch (error) {
        console.error("Error loading license:", error);
        setLicenseKey(null);
        setPlan('free');
      } finally {
        setIsLoading(false);
      }
    };
    loadLicense();
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
            throw new Error("This license is active on too many devices.");
        }

        const limits = getPlanLimits(licenseData.plan);
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
        setLicenseKey(null);
        setPlan('free');
        setMaxDevices(1);
        setMaxReferees(1);
        localStorage.removeItem('licenseKey');
        toast({
            title: "Activation Failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [deviceId, toast]);

  const logout = () => {
    setLicenseKey(null);
    setPlan('free');
    setMaxDevices(1);
    setMaxReferees(1);
    localStorage.removeItem('licenseKey');
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

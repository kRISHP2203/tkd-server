
'use server';

import { v4 as uuidv4 } from 'uuid';

// This is a SIMULATED backend service.
// In a real application, this would be replaced with calls to a real backend like Firebase or Supabase.

const ADMIN_LICENSE_KEY = 'admin-master-key-unlimited';

export type Plan = 'free' | 'basic' | 'elite';

export interface LicenseData {
    licenseKey: string;
    plan: Plan;
    maxDevices: number;
    maxReferees: number;
    activeDevices: string[];
    createdAt: string;
}

// Mock database
const licenses: Record<string, LicenseData> = {
    'basic-key-1234-5678-9012-3456': {
        licenseKey: 'basic-key-1234-5678-9012-3456',
        plan: 'basic',
        maxDevices: 2,
        maxReferees: 4,
        activeDevices: [],
        createdAt: new Date().toISOString(),
    },
    'elite-key-9876-5432-1098-7654': {
        licenseKey: 'elite-key-9876-5432-1098-7654',
        plan: 'elite',
        maxDevices: 6,
        maxReferees: 4,
        activeDevices: [],
        createdAt: new Date().toISOString(),
    },
};

/**
 * Verifies if a license key is valid.
 * @param key The license key to verify.
 * @returns The license data if the key is valid, otherwise null.
 */
export async function verifyLicense(key: string): Promise<LicenseData | null> {
    console.log(`Verifying license: ${key}`);

    // Check for the hardcoded admin license key
    if (key === ADMIN_LICENSE_KEY) {
        console.log(`✅ Admin license key recognized. Granting full access.`);
        return {
            licenseKey: ADMIN_LICENSE_KEY,
            plan: 'elite',
            maxDevices: Infinity, // Unlimited devices
            maxReferees: Infinity, // Unlimited referees
            activeDevices: [],
            createdAt: new Date().toISOString(),
        };
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return licenses[key] || null;
}

/**
 * Registers a device to a license if there is space available.
 * @param key The license key.
 * @param deviceId The unique ID of the device.
 * @returns True if the device was successfully registered, false if the device limit was reached.
 */
export async function registerDeviceToLicense(key: string, deviceId: string): Promise<boolean> {
    // Admin license always allows registration
    if (key === ADMIN_LICENSE_KEY) {
        return true;
    }
    
    const license = await verifyLicense(key);
    if (!license) return false;

    // If device is already active, it's allowed
    if (license.activeDevices.includes(deviceId)) {
        console.log(`Device ${deviceId} already registered to license ${key}.`);
        return true;
    }

    // Check if the device limit has been reached
    if (license.activeDevices.length >= license.maxDevices) {
        console.error(`Device limit reached for license ${key}. Max: ${license.maxDevices}`);
        return false;
    }
    
    // Add the new device
    license.activeDevices.push(deviceId);
    console.log(`Device ${deviceId} successfully registered to license ${key}. Active devices:`, license.activeDevices);
    return true;
}

/**
 * Removes a device from the active list for a given license.
 * @param key The license key.
 * @param deviceId The unique ID of the device to remove.
 */
export async function removeDeviceFromLicense(key: string, deviceId: string) {
    const license = licenses[key];
    if (license) {
        const index = license.activeDevices.indexOf(deviceId);
        if (index > -1) {
            license.activeDevices.splice(index, 1);
            console.log(`Device ${deviceId} removed from license ${key}.`);
        }
    }
}


/**
 * Gets the plan limits for a given plan type.
 * @param plan The plan type.
 * @returns An object with maxDevices and maxReferees.
 */
export async function getPlanLimits(plan: Plan): Promise<{ maxDevices: number, maxReferees: number }> {
      switch (plan) {
          case 'basic':
              return { maxDevices: 2, maxReferees: 4 };
          case 'elite':
              return { maxDevices: 6, maxReferees: 4 };
          case 'free':
          default:
              return { maxDevices: 1, maxReferees: 1 };
      }
}

const generateSecureKey = (prefix: 'basic' | 'elite'): string => {
    const randomPart = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
    const segments = [
        randomPart.substring(0, 4),
        randomPart.substring(4, 8),
        randomPart.substring(8, 12),
        randomPart.substring(12, 16),
    ];
    return `${prefix}-key-${segments.join('-')}`;
}

/**
 * Simulates purchasing a Basic plan.
 * @param deviceId The ID of the device making the purchase.
 * @returns The newly generated license key.
 */
export async function purchaseBasicPlan(deviceId: string): Promise<string | null> {
    console.log(`Simulating Basic Plan purchase for device: ${deviceId}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment processing

    const newKey = generateSecureKey('basic');
    const newLicense: LicenseData = {
        licenseKey: newKey,
        plan: 'basic',
        maxDevices: 2,
        maxReferees: 4,
        activeDevices: [deviceId], // Automatically register the purchasing device
        createdAt: new Date().toISOString(),
    };

    licenses[newKey] = newLicense;
    console.log(`✅ Basic Plan purchased. New key: ${newKey}`);
    return newKey;
}

/**
 * Simulates purchasing an Elite plan.
 * @param deviceId The ID of the device making the purchase.
 * @returns The newly generated license key.
 */
export async function purchaseElitePlan(deviceId: string): Promise<string | null> {
    console.log(`Simulating Elite Plan purchase for device: ${deviceId}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment processing

    const newKey = generateSecureKey('elite');
    const newLicense: LicenseData = {
        licenseKey: newKey,
        plan: 'elite',
        maxDevices: 6,
        maxReferees: 4,
        activeDevices: [deviceId], // Automatically register the purchasing device
        createdAt: new Date().toISOString(),
    };

    licenses[newKey] = newLicense;
    console.log(`✅ Elite Plan purchased. New key: ${newKey}`);
    return newKey;
}


'use server';

// This is a SIMULATED backend service.
// In a real application, this would be replaced with calls to a real backend like Firebase or Supabase.

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
    'basic-key-123': {
        licenseKey: 'basic-key-123',
        plan: 'basic',
        maxDevices: 2,
        maxReferees: 4,
        activeDevices: [],
        createdAt: new Date().toISOString(),
    },
    'elite-key-456': {
        licenseKey: 'elite-key-456',
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

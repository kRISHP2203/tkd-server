
'use client';

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'deviceId';

/**
 * Gets a unique device ID from localStorage.
 * If one doesn't exist, it creates one and saves it.
 * @returns The unique device ID.
 */
export function getDeviceId(): string {
    if (typeof window === 'undefined') {
        return 'server';
    }

    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

import { COOK_LOGO_ICON_URL } from '../components/CookLogo.tsx';

// A simple service to handle browser notifications.

/**
 * Checks the current notification permission state.
 * @returns {NotificationPermission} 'granted', 'denied', or 'default'.
 */
export const getPermissionState = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};

/**
 * Requests permission from the user to show notifications.
 * @returns {Promise<NotificationPermission>} The permission granted by the user.
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.error('This browser does not support desktop notification');
        return 'denied';
    }
    // This promise-based syntax is supported in all modern browsers.
    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Schedules a local notification to be shown after a specified delay.
 * @param {string} title - The title of the notification.
 * @param {NotificationOptions} options - The body, icon, etc. for the notification.
 * @param {number} delayInMs - The delay in milliseconds before showing the notification.
 * @returns {number | null} The timeout ID for the scheduled notification, or null if permission is not granted.
 */
export const scheduleNotification = (title: string, options: NotificationOptions, delayInMs: number): number | null => {
    if (getPermissionState() !== 'granted') {
        console.warn('Notification permission is not granted. Cannot schedule notification.');
        return null;
    }

    if(delayInMs < 0) {
        console.error('Cannot schedule a notification in the past.');
        return null;
    }

    const timeoutId = setTimeout(() => {
        if (getPermissionState() === 'granted') {
            new Notification(title, { ...options, icon: COOK_LOGO_ICON_URL });
        }
    }, delayInMs);

    return timeoutId;
};

/**
 * Shows a test notification immediately.
 */
export const showTestNotification = () => {
    if (getPermissionState() === 'granted') {
        new Notification("Hello from Cook!", {
            body: "This is how you'll be notified about your cooking reminders.",
            icon: COOK_LOGO_ICON_URL, // Use a consistent icon
        });
    } else {
        console.warn("Cannot show test notification, permission not granted.");
    }
};

/**
 * Shows a notification immediately if permission is granted.
 * @param {string} title - The title of the notification.
 * @param {NotificationOptions} options - The body, icon, etc. for the notification.
 */
export const showNotificationNow = (title: string, options: NotificationOptions) => {
    if (getPermissionState() === 'granted') {
        new Notification(title, { ...options, icon: COOK_LOGO_ICON_URL });
    } else {
        console.warn('Notification permission is not granted. Cannot show notification.');
    }
};
// src/utils/notifications.ts

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notification');
        return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    return permission;
};

export const showNotification = (title: string, options: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        // We use a service worker registration to show the notification
        // This is best practice for PWAs
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                ...options,
                icon: options.icon || '/logo192.png', // Default icon
            });
        });
    }
};
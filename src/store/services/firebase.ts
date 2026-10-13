import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

/**
 * Returns a Messaging instance only when the browser supports FCM (avoids
 * `messaging/unsupported-browser` from eager `getMessaging()`).
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;
  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

export const getFCMToken = async (
  registration?: ServiceWorkerRegistration,
): Promise<string | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      return token;
    }
    console.warn('No FCM registration token available');
    return null;
  } catch (error) {
    console.warn('FCM getToken failed:', error);
    return null;
  }
};

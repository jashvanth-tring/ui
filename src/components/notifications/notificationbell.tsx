import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onMessage } from 'firebase/messaging';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaRegBell } from 'react-icons/fa';
import { getFirebaseMessaging } from '../../store/services/firebase';
import {
  getNotifications,
  markNotificationAsRead,
  StoredNotification,
} from '../../store/services/notifications';
import NotificationDropdown from './notificationdropdown';
import './notification.css';
import { useSelector } from 'react-redux';

type LiveNotification = {
  id: number;
  title: string;
  body: string;
  route: string;
};

function resolveRoute(notification: StoredNotification): string {
  return (
    notification.notification.route ||
    (notification.notification.candidateId
      ? `/candidate-profile/${notification.notification.candidateId}`
      : '/dashboard')
  );
}

export default function NotificationBell() {
    const currentUser = useSelector(
  (state: any) => state.authSelector?.user
);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shownIdsRef = useRef<Set<number>>(new Set());
  const [loadingNotificationId, setLoadingNotificationId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      return res.data.notifications || [];
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      return [];
    }
  }, []);

  // const goToNotification = useCallback(
  //   async (notification: StoredNotification) => {
  //     if (!notification.isRead) {
  //       await markNotificationAsRead(notification.notification.id);
  //     }
  //     const route = resolveRoute(notification);
  //     setOpen(false);
  //     setNotifications((prev) =>
  //       prev.map((item) =>
  //         item.notification.id === notification.notification.id
  //           ? { ...item, isRead: true, readAt: new Date().toISOString() }
  //           : item,
  //       ),
  //     );
  //     setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
  //     if (location.pathname !== route) {
  //       navigate(route);
  //     }
  //   },
  //   [location.pathname, navigate],
  // );

  const goToNotification = useCallback(
  async (notification: StoredNotification) => {
    try {
      setLoadingNotificationId(notification.notification.id);

      if (!notification.isRead) {
        await markNotificationAsRead(notification.notification.id);
      }

      const route = resolveRoute(notification);
const isUsersRoute = route === '/users';
const isAdmin = currentUser?.role?.id === 1;

if (isUsersRoute && !isAdmin) {
  // mark backend read
  if (!notification.isRead) {
    await markNotificationAsRead(
      notification.notification.id
    );
  }

  // loader animation
  await new Promise((resolve) =>
    setTimeout(resolve, 900)
  );

  // local read update
  setNotifications((prev) =>
    prev.map((item) =>
      item.notification.id ===
      notification.notification.id
        ? {
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          }
        : item
    )
  );

  setUnreadCount((prev) =>
    Math.max(
      0,
      prev - (notification.isRead ? 0 : 1)
    )
  );

  setOpen(false);
  return;
}

      // wait so animation becomes visible
    await new Promise((resolve) =>
      setTimeout(resolve, 900),
    );

      setNotifications((prev) =>
        prev.map((item) =>
          item.notification.id === notification.notification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - (notification.isRead ? 0 : 1)),
      );

      setOpen(false);

      if (location.pathname !== route) {
        navigate(route);
      }
    } finally {
      setLoadingNotificationId(null);
    }
  },
  [location.pathname, navigate,currentUser?.role],
);

  /**
   * Show an in-app foreground toast (no branding — per user request).
   * Only fires when the tab is active/visible because FCM `onMessage`
   * exclusively triggers in the foreground.
   */

  const showForegroundToast = useCallback(
  (live: LiveNotification) => {
    toast.custom(
      (t) => (
        <div
          onClick={() => {
            navigate(live.route);
            toast.dismiss(t.id);
          }}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: "12px",
            padding: "12px 36px 12px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            width: "320px",
            position: "relative",
            cursor: "pointer",
            opacity: t.visible ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "#EBF4FD",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              flexShrink: 0,
            }}
          >
            🔔
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: "13.5px", fontWeight: 500 }}>
              {live.title}
            </p>
            <p style={{ margin: "0 0 5px", fontSize: "12.5px", color: "#555" }}>
              {live.body}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // 👈 important (prevents navigation)
              toast.dismiss(t.id);
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ),
      {
        duration: 7000,
        position: "bottom-right",
      }
    );
  },
  [navigate]
);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Re-fetch notifications when the tab regains visibility.
   *
   * When the tab is in the background, FCM routes messages to the service
   * worker (`onBackgroundMessage`). The `onMessage` handler below never
   * fires, so the badge count stays stale. This listener ensures the
   * count is refreshed the moment the user switches back to the tab.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  /**
   * Listen for messages from the service worker.
   *
   * When a background FCM message arrives, the SW can post a message to
   * all clients so the badge count can be bumped immediately — even
   * before the user clicks the tab.
   */
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_NOTIFICATION') {
        // Optimistically bump the count, then sync with server
        setUnreadCount((prev) => prev + 1);
        setHasNewPulse(true);
        setTimeout(() => setHasNewPulse(false), 2000);
        setTimeout(() => {
          void fetchNotifications();
        }, 1200);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [fetchNotifications]);

  /**
   * FCM foreground listener.
   *
   * IMPORTANT: `onMessage` ONLY fires when the tab is in the foreground.
   * When the tab is hidden/minimized, FCM routes data-only messages to
   * the service worker's `onBackgroundMessage` which shows desktop
   * notifications. So we only need in-app toast logic here.
   */
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const messaging = await getFirebaseMessaging();
      if (cancelled || !messaging) return;

      unsubscribe = onMessage(messaging, async (payload) => {
        const notificationId = Number(payload.data?.notificationId || 0);
        if (notificationId && shownIdsRef.current.has(notificationId)) return;
        if (notificationId) shownIdsRef.current.add(notificationId);

        // ✅ INSTANTLY bump the badge count (optimistic update)
        setUnreadCount((prev) => prev + 1);

        // ✅ Show the toast IMMEDIATELY from the FCM payload data
        //    (no server round-trip needed — the payload has all the info)
        const live: LiveNotification = {
          id: notificationId || Date.now(),
          title: payload.data?.title || 'Notification',
          body: payload.data?.body || 'New update available',
          route: payload.data?.route || '/dashboard',
        };
        showForegroundToast(live);

        // Trigger bell pulse animation
        setHasNewPulse(true);
        setTimeout(() => setHasNewPulse(false), 2000);

        // ✅ Sync with server after a short delay to let the DB write complete.
        //    This corrects the optimistic count to the real value.
        setTimeout(() => {
          void fetchNotifications();
        }, 1200);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [fetchNotifications, showForegroundToast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const formattedCount = useMemo(() => {
    if (unreadCount > 50) return '50+';
    return unreadCount;
  }, [unreadCount]);

  return (
    <div className="bell-container" ref={containerRef}>
      <div
        className={`bell-icon ${hasNewPulse ? 'bell-pulse' : ''}`}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              void fetchNotifications();
            }
            return next;
          });
        }}
      >
        <FaRegBell style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand)' }} />
        {unreadCount > 0 && <span className="badge">{formattedCount}</span>}
      </div>

      {/* {open && (
        <NotificationDropdown
          notifications={notifications}
          refresh={fetchNotifications}
          onNavigate={goToNotification}
        />
      )} */}
      {open && (
  <NotificationDropdown
    notifications={notifications}
    refresh={fetchNotifications}
    onNavigate={goToNotification}
    loadingNotificationId={loadingNotificationId} // ✅ pass here
  />
)}
    </div>
  );
}

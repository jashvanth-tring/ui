import { useCallback, useMemo } from 'react';
import {
  FaUser,
  FaBriefcase,
  FaBuilding,
  FaUsers,
  FaCalendarCheck,
  FaComment,
  FaArchive,
  FaEdit,
  FaPlus,
  FaBell,
  FaExchangeAlt,
} from 'react-icons/fa';
import { markAllNotificationsAsRead, StoredNotification } from '../../store/services/notifications';
import './notificationDropdown.css';

interface Props {
  notifications: StoredNotification[];
  refresh: () => void;
  onNavigate: (notification: StoredNotification) => void | Promise<void>;
  loadingNotificationId: number | null;
}

/** Map notification type → icon + accent color */
function getNotifMeta(type: string): { icon: React.ReactNode; accent: string } {
  const map: Record<string, { icon: React.ReactNode; accent: string }> = {
    'candidate.created':         { icon: <FaPlus />,          accent: '#22c55e' },
    'candidate.updated':         { icon: <FaEdit />,          accent: '#3b82f6' },
    'candidate.status.changed':  { icon: <FaExchangeAlt />,   accent: '#8b5cf6' },
    'candidate.assigned.changed':{ icon: <FaUsers />,         accent: '#f59e0b' },
    'candidate.commented':       { icon: <FaComment />,       accent: '#06b6d4' },
    'candidate.archived':        { icon: <FaArchive />,       accent: '#ef4444' },
    'requirement.created':       { icon: <FaBriefcase />,     accent: '#22c55e' },
    'requirement.updated':       { icon: <FaBriefcase />,     accent: '#3b82f6' },
    'requirement.deleted':       { icon: <FaBriefcase />,     accent: '#ef4444' },
    'client.created':            { icon: <FaBuilding />,      accent: '#22c55e' },
    'client.updated':            { icon: <FaBuilding />,      accent: '#3b82f6' },
    'client.deleted':            { icon: <FaBuilding />,      accent: '#ef4444' },
    'user.created':              { icon: <FaUser />,          accent: '#22c55e' },
    'user.state.changed':        { icon: <FaUser />,          accent: '#f59e0b' },
    'interview.schedule.changed':{ icon: <FaCalendarCheck />, accent: '#8b5cf6' },
  };
  return map[type] || { icon: <FaBell />, accent: '#64748b' };
}

/** Relative time like "2m ago", "3h ago", "Yesterday" */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.round((now - then) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationDropdown({ notifications, refresh, onNavigate, loadingNotificationId }: Props) {
  const hasUnread = useMemo(() => notifications.some((n) => !n.isRead), [notifications]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      refresh();
    } catch (err) {
      console.error('markAllRead failed', err);
    }
  }, [refresh]);

  return (
    <div className="notif-dropdown">
      {/* Header */}
      <div className="notif-dropdown-header">
        <h4>Notifications</h4>
        {hasUnread && (
          <button className="notif-mark-all-btn" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="notif-dropdown-list">
        {notifications.length === 0 ? (
          <div className="notif-empty-state">
            <FaBell className="notif-empty-icon" />
            <p>You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = getNotifMeta(n.notification.type);
            const isLoading = loadingNotificationId === n.notification.id;
            return (
              <div
                    key={n.id}
                    className={`
                    notif-item
                    ${n.isRead ? 'notif-item--read' : 'notif-item--unread'}
                    ${isLoading ? 'notif-item--loading' : ''}
                  `}
                    onClick={() => {
                    if (!isLoading) {
                    void onNavigate(n);
                    }
                    }}
                    title="Open notification"
            >
                {/* Type icon */}
                <div
                  className="notif-item-icon"
                  style={{ backgroundColor: meta.accent + '18', color: meta.accent }}
                >
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="notif-item-content">
                  <p className="notif-item-title">{n.notification.title}</p>
                  <p className="notif-item-message">{n.notification.message}</p>
                  <div className="notif-item-footer">
                    <span className="notif-item-time">
                      {relativeTime(n.notification.createdAt)}
                    </span>
                    {!n.isRead && <span className="notif-item-new-badge">new</span>}
                  </div>
                </div>

                {/* Loader */}
{isLoading && (
  <div className="notif-loader">
    <span />
    <span />
    <span />
  </div>
)}

{/* Unread dot */}
{!n.isRead && !isLoading && (
  <div className="notif-item-dot" />
)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Plus, Crown, CheckCircle, Sparkles, AlertCircle, X, Menu } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  fullMessage: string;
  time: string;
  read: boolean;
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO' || user?.subscriptionPlan === 'ENTERPRISE';

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Caption generated successfully',
      message: 'Your Instagram post caption is ready',
      fullMessage: 'Your Instagram post caption has been generated successfully! The caption includes a hook, body text, call-to-action, and relevant hashtags optimized for maximum engagement. You can find it in your Library or copy it directly from the Generate page.',
      time: '2 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'New template available',
      message: 'Check out the new carousel templates',
      fullMessage: 'We\'ve added 5 new professional carousel templates to the Templates section! These templates are perfect for educational content, product showcases, and listicles. They\'re fully customizable and work great for Instagram and LinkedIn.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low credit balance',
      message: 'You have 5 generations remaining this month',
      fullMessage: 'You\'ve used most of your monthly generation credits. You have 5 generations remaining this month. Consider upgrading your plan to get unlimited generations, or wait until your credits reset on the 1st of next month.',
      time: '3 hours ago',
      read: true,
    },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const openNotification = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setSelectedNotification(notification);
    setShowNotifications(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string, size = 20) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={size} style={{ color: 'var(--success-500)' }} />;
      case 'info':
        return <Sparkles size={size} style={{ color: 'var(--primary-500)' }} />;
      case 'warning':
        return <AlertCircle size={size} style={{ color: 'var(--warning-500)' }} />;
      default:
        return <Bell size={size} />;
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Hamburger — mobile only */}
        {onMobileMenuToggle && (
          <button
            className="hamburger-btn"
            onClick={onMobileMenuToggle}
            title="Menu"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Search — clicking opens the command palette */}
        <div
          className="search-container"
          style={{ cursor: 'pointer' }}
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
        >
          <Search size={18} className="search-icon" />
          <input
            readOnly
            type="text"
            placeholder="Caută pagini sau acțiuni..."
            className="search-input"
            style={{ cursor: 'pointer' }}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Upgrade CTA for FREE users */}
          {!isPro && (
            <Link href="/dashboard/billing" className="upgrade-btn">
              <Crown size={16} />
              <span>Upgrade to PRO</span>
            </Link>
          )}

          {/* New Post Button */}
          <Link href="/dashboard/generate" className="btn btn-primary">
            <Plus size={18} />
            <span>New Post</span>
          </Link>

          {/* Notifications */}
          <div className="notifications-wrapper" ref={dropdownRef}>
            <button
              className="icon-button"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={markAllRead}>Mark all as read</button>
                  )}
                </div>

                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="empty-notifications">
                      <Bell size={48} style={{ opacity: 0.2 }} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => openNotification(notification)}
                      >
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">
                            {notification.title}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-time">
                            {notification.time}
                          </div>
                        </div>
                        {!notification.read && <div className="unread-dot" />}
                      </div>
                    ))
                  )}
                </div>

                <div className="dropdown-footer">
                  <button className="view-all-btn">View all notifications</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="notif-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="notif-modal" onClick={e => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div className="notif-modal-icon">
                {getNotificationIcon(selectedNotification.type, 28)}
              </div>
              <div className="notif-modal-titles">
                <h3>{selectedNotification.title}</h3>
                <span>{selectedNotification.time}</span>
              </div>
              <button
                className="notif-modal-close"
                onClick={() => setSelectedNotification(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="notif-modal-body">
              <p>{selectedNotification.fullMessage}</p>
            </div>
            <div className="notif-modal-footer">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .topbar {
          height: 64px;
          background: var(--background);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 var(--space-6);
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
        }

        .topbar-content {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-6);
        }

        /* Search */
        .search-container {
          flex: 1;
          max-width: 480px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--foreground-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          background: var(--background-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--foreground);
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-input::placeholder {
          color: var(--foreground-muted);
        }

        .search-kbd {
          position: absolute;
          right: 12px;
          padding: 2px 8px;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--foreground-muted);
          pointer-events: none;
        }

        /* Actions */
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .upgrade-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 8px 16px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          text-decoration: none;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
        }

        .upgrade-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .icon-button {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .icon-button:hover {
          background: var(--background);
          border-color: var(--primary-500);
          color: var(--foreground);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: var(--error-500);
          color: white;
          border-radius: var(--radius-full);
          font-size: 10px;
          font-weight: var(--font-bold);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--background);
        }

        /* Notifications Dropdown */
        .notifications-wrapper {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-height: 500px;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }

        .dropdown-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-header h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--foreground);
        }

        .mark-all-read {
          background: none;
          border: none;
          color: var(--primary-600);
          font-size: var(--text-sm);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }

        .mark-all-read:hover {
          background: var(--primary-50);
        }

        [data-theme="dark"] .mark-all-read:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .notifications-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .notification-item {
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          gap: var(--space-3);
          cursor: pointer;
          transition: background var(--transition-fast);
          position: relative;
        }

        .notification-item:hover {
          background: var(--background-alt);
        }

        .notification-item.unread {
          background: var(--primary-50);
        }

        [data-theme="dark"] .notification-item.unread {
          background: rgba(99, 102, 241, 0.05);
        }

        .notification-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background-alt);
          border-radius: var(--radius-md);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--foreground);
          margin-bottom: 4px;
        }

        .notification-message {
          font-size: var(--text-sm);
          color: var(--foreground-muted);
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-time {
          font-size: var(--text-xs);
          color: var(--foreground-muted);
          opacity: 0.7;
        }

        .unread-dot {
          position: absolute;
          top: 50%;
          right: var(--space-4);
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: var(--primary-600);
          border-radius: var(--radius-full);
        }

        .empty-notifications {
          padding: var(--space-12) var(--space-6);
          text-align: center;
        }

        .empty-notifications p {
          margin-top: var(--space-4);
          color: var(--foreground-muted);
          font-size: var(--text-sm);
        }

        .dropdown-footer {
          padding: var(--space-3);
          border-top: 1px solid var(--border);
        }

        .view-all-btn {
          width: 100%;
          padding: var(--space-2);
          background: none;
          border: none;
          color: var(--primary-600);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .view-all-btn:hover {
          background: var(--primary-50);
        }

        [data-theme="dark"] .view-all-btn:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        /* Hamburger — hidden on desktop, shown on mobile */
        .hamburger-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--background-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .hamburger-btn:hover {
          background: var(--background);
          color: var(--foreground);
          border-color: var(--primary-500);
        }

        @media (max-width: 768px) {
          .hamburger-btn {
            display: flex;
          }

          .search-container {
            display: none;
          }

          .upgrade-btn span {
            display: none;
          }

          .notifications-dropdown {
            width: 320px;
          }
        }

        /* Notification Modal */
        .notif-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: var(--space-4);
          backdrop-filter: blur(4px);
        }

        .notif-modal {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 480px;
          box-shadow: var(--shadow-2xl);
        }

        .notif-modal-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          padding: var(--space-6);
          border-bottom: 1px solid var(--border);
        }

        .notif-modal-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-lg);
          background: var(--background-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-modal-titles {
          flex: 1;
        }

        .notif-modal-titles h3 {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--foreground);
        }

        .notif-modal-titles span {
          font-size: var(--text-sm);
          color: var(--foreground-muted);
        }

        .notif-modal-close {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .notif-modal-close:hover {
          background: var(--error-light);
          border-color: var(--error-500);
          color: var(--error-600);
        }

        .notif-modal-body {
          padding: var(--space-6);
        }

        .notif-modal-body p {
          margin: 0;
          font-size: var(--text-base);
          color: var(--foreground);
          line-height: var(--leading-relaxed);
        }

        .notif-modal-footer {
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </header>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, Notification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/dateUtils';
import { Bell, Package, RotateCcw, Gift, Megaphone, Inbox } from 'lucide-react';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated: authContextAuthenticated, user: authContextUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check authentication from both AuthContext and localStorage (for employee sessions)
  // Employee login bypasses AuthContext, so we need to check localStorage directly
  const token = localStorage.getItem('token');
  const storedUserStr = localStorage.getItem('currentUser');
  let storedUser = null;
  try {
    storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  } catch {
    storedUser = null;
  }

  // Use AuthContext user if available, otherwise fall back to localStorage
  const user = authContextUser || storedUser;
  const isAuthenticated = authContextAuthenticated || (!!token && !!storedUser);

  // Determine if user is an employee (manager, admin, auditor)
  const isEmployee = user?.role && ['manager', 'admin', 'auditor', 'MANAGER', 'ADMIN', 'AUDITOR'].includes(user.role);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsApi.getUnreadCount();
        if (isMounted) {
          setUnreadCount(response.unread_count);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await notificationsApi.getNotifications({ page_size: 10 });
      setNotifications(response.items);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type and user role
    setIsOpen(false);

    if (isEmployee) {
      // Employee navigation (manager, admin, auditor)
      const basePath = user?.role?.toLowerCase() === 'manager' ? '/manager' :
                       user?.role?.toLowerCase() === 'admin' ? '/admin' :
                       user?.role?.toLowerCase() === 'auditor' ? '/auditor' : '/manager';

      if (notification.related_order_id) {
        navigate(`${basePath}/orders`);
      } else if (notification.related_return_id) {
        navigate(`${basePath}/returns`);
      }
    } else {
      // Customer navigation
      if (notification.related_order_id) {
        navigate('/customer?section=orders');
      } else if (notification.related_return_id) {
        navigate('/customer?section=returns');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order_update': return <Package size={16} />;
      case 'return_update': return <RotateCcw size={16} />;
      case 'promotion': return <Gift size={16} />;
      case 'system': return <Bell size={16} />;
      default: return <Megaphone size={16} />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={handleBellClick}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell size={24} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">
                <div className="spinner-small"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Inbox size={32} className="empty-icon" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <span className="unread-dot"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to appropriate dashboard based on user role
                  if (isEmployee) {
                    const basePath = user?.role?.toLowerCase() === 'manager' ? '/manager' :
                                     user?.role?.toLowerCase() === 'admin' ? '/admin' :
                                     user?.role?.toLowerCase() === 'auditor' ? '/auditor' : '/manager';
                    navigate(`${basePath}/orders`);
                  } else {
                    navigate('/customer');
                  }
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => {
  const [serverNotifications, setServerNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('cached_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  const getStorageKey = (key: string) => userId ? `${key}_${userId}` : key;

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(getStorageKey('deleted_notifications'));
    return saved ? JSON.parse(saved) : [];
  });

  const [readIds, setReadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(getStorageKey('read_notifications'));
    return saved ? JSON.parse(saved) : [];
  });

  // Update state when userId changes
  useEffect(() => {
    const savedDeleted = localStorage.getItem(getStorageKey('deleted_notifications'));
    setDeletedIds(savedDeleted ? JSON.parse(savedDeleted) : []);
    
    const savedRead = localStorage.getItem(getStorageKey('read_notifications'));
    setReadIds(savedRead ? JSON.parse(savedRead) : []);
  }, [userId]);

  const refreshNotifications = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const url = userId 
        ? `${API_BASE_URL}/api/notifications?userId=${userId}`
        : `${API_BASE_URL}/api/notifications`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Notifications API returned status: ${res.status}`);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setServerNotifications(data);
        localStorage.setItem('cached_notifications', JSON.stringify(data));
      } else {
        console.warn('Received non-array notification data:', data);
      }
    } catch (error) {
      console.warn('Could not connect to notifications API. Using cached data.');
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = async (notification: Omit<Notification, 'id' | 'read'>) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      if (res.ok) {
        await refreshNotifications();
      } else {
        console.warn('Failed to add notification, status:', res.status);
      }
    } catch (error) {
      console.warn('Could not add notification. Network error.');
    }
  };

  const markAsRead = async (id: string) => {
    const newRead = [...readIds, id];
    setReadIds(newRead);
    localStorage.setItem(getStorageKey('read_notifications'), JSON.stringify(newRead));
  };

  const deleteNotification = async (id: string) => {
    const newDeleted = [...deletedIds, id];
    setDeletedIds(newDeleted);
    localStorage.setItem(getStorageKey('deleted_notifications'), JSON.stringify(newDeleted));
  };

  const notifications = serverNotifications
    .filter(n => !deletedIds.includes(n.id))
    .map(n => ({
      ...n,
      read: n.read || readIds.includes(n.id)
    }));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      deleteNotification,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

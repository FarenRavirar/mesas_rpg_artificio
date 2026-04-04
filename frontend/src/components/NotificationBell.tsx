import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/notifications.css';

interface Notification {
  id: string;
  type: 'suggestion_approved' | 'suggestion_rejected' | 'suggestion_edited' | 'system';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Buscar contador de não lidas
  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/v1/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contador de notificações:', error);
    }
  };

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Polling a cada 30 segundos
  useEffect(() => {
    if (!token) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Abrir dropdown
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Clicar em notificação
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }

    setIsOpen(false);
  };

  // Formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!token) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label="Notificações"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notificações</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                Nenhuma notificação
              </div>
            ) : (
              <ul className="notification-list">
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-header">
                      <span className="notification-title">{notification.title}</span>
                      <span className="notification-time">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    {!notification.read && <span className="notification-unread-dot"></span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

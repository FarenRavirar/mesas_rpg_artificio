import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// CORREÇÃO DT-011: Fallback para dev local quando VITE_API_URL não está definida
const API_BASE = import.meta.env.VITE_API_URL || '';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const NotificationBell = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.data || []);
          setUnreadCount(data.data?.filter((n: Notification) => !n.read).length || 0);
        }
      } catch (error) {
        console.error('[NotificationBell] Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll a cada 1 minuto
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[NotificationBell] Erro ao marcar como lida:', error);
    }
  };

  if (!token) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/75 hover:text-white transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-[#1B2A4A] border border-white/10 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-white/10 font-bold text-white">
              Notificações
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/50 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                    notif.read ? 'bg-transparent' : 'bg-blue-500/10 hover:bg-blue-500/20'
                  }`}
                >
                  <div className="font-semibold text-white text-sm mb-1">{notif.title}</div>
                  <div className="text-white/70 text-xs mb-2">{notif.message}</div>
                  <div className="text-white/40 text-xs">
                    {new Date(notif.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

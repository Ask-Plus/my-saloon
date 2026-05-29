import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextValue {
  showNotification: (type: NotificationType, title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const COLORS: Record<NotificationType, { bg: string; icon: string; iconName: string }> = {
  success: { bg: '#22c55e', icon: '#fff', iconName: 'checkmark-circle' },
  error: { bg: '#ef4444', icon: '#fff', iconName: 'close-circle' },
  info: { bg: '#3b82f6', icon: '#fff', iconName: 'information-circle' },
  warning: { bg: '#f59e0b', icon: '#fff', iconName: 'warning' },
};

function NotificationBanner({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const { bg, icon, iconName } = COLORS[notification.type];
  const translateY = React.useRef(new Animated.Value(-120)).current;

  React.useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }).start(() => onDismiss());
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg, transform: [{ translateY }] }]}>
      <Ionicons name={iconName as any} size={22} color={icon} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{notification.title}</Text>
        {notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={icon} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 54,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  message: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});

let _notifId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, title: string, message?: string) => {
    const id = String(++_notifId);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.slice(-1).map((n) => (
        <NotificationBanner key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NotificationKind =
  | "booking_new"
  | "booking_paid"
  | "booking_refunded"
  | "booking_cancelled"
  | "join_request"
  | "employee_new";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  createdAt: string; // ISO
  read: boolean;
}

interface Ctx {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<Ctx | null>(null);

const MAX = 50;

function storageKey(userId: string | null) {
  return userId ? `bs.notifications.${userId}` : null;
}

function load(userId: string | null): AppNotification[] {
  const key = storageKey(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function save(userId: string | null, list: AppNotification[]) {
  const key = storageKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
}

export function NotificationsProvider({
  businessUserId,
  authUserId,
  children,
}: {
  businessUserId: string | null;
  authUserId: string | null;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load(authUserId));
  const seenIds = useRef<Set<string>>(new Set());

  // Reload when the account changes
  useEffect(() => {
    const list = load(authUserId);
    setNotifications(list);
    seenIds.current = new Set(list.map((n) => n.id));
  }, [authUserId]);

  // Persist on change
  useEffect(() => {
    save(authUserId, notifications);
  }, [authUserId, notifications]);

  const push = useCallback((n: AppNotification) => {
    setNotifications((prev) => {
      if (seenIds.current.has(n.id)) return prev;
      seenIds.current.add(n.id);
      return [n, ...prev].slice(0, MAX);
    });
    // Best-effort browser notification
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(n.title, { body: n.body });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!businessUserId) return;

    // Ask for browser notification permission once (non-blocking)
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch {
      /* ignore */
    }

    const channel = supabase
      .channel(`notif-${businessUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `user_id=eq.${businessUserId}` },
        (payload) => {
          const b: any = payload.new;
          push({
            id: `booking-new-${b.id}`,
            kind: "booking_new",
            title: "New booking",
            body: `${b.client_name ?? "A client"} — ${b.service ?? "service"} on ${b.booking_date} ${b.booking_time ?? ""}`.trim(),
            href: "/dashboard/bookings",
            createdAt: b.created_at || new Date().toISOString(),
            read: false,
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${businessUserId}` },
        (payload) => {
          const b: any = payload.new;
          const prev: any = payload.old || {};
          if (b.payment_status === "paid" && prev.payment_status !== "paid") {
            push({
              id: `booking-paid-${b.id}`,
              kind: "booking_paid",
              title: "Deposit received",
              body: `${b.client_name ?? "Client"} paid for ${b.service ?? "booking"}.`,
              href: "/payments",
              createdAt: new Date().toISOString(),
              read: false,
            });
          } else if (b.payment_status === "refunded" && prev.payment_status !== "refunded") {
            push({
              id: `booking-refunded-${b.id}`,
              kind: "booking_refunded",
              title: "Booking refunded",
              body: `${b.client_name ?? "Client"} — ${b.service ?? "service"} refunded.`,
              href: "/payments",
              createdAt: new Date().toISOString(),
              read: false,
            });
          } else if (b.status === "cancelled" && prev.status !== "cancelled") {
            push({
              id: `booking-cancelled-${b.id}`,
              kind: "booking_cancelled",
              title: "Booking cancelled",
              body: `${b.client_name ?? "Client"} — ${b.service ?? "service"} on ${b.booking_date}.`,
              href: "/dashboard/bookings",
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "employee_join_requests", filter: `user_id=eq.${businessUserId}` },
        (payload) => {
          const r: any = payload.new;
          push({
            id: `join-${r.id}`,
            kind: "join_request",
            title: "New join request",
            body: `${r.requester_name ?? r.requester_email ?? "Someone"} wants to join your team.`,
            href: "/staff",
            createdAt: r.created_at || new Date().toISOString(),
            read: false,
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "employees", filter: `user_id=eq.${businessUserId}` },
        (payload) => {
          const e: any = payload.new;
          push({
            id: `emp-${e.id}`,
            kind: "employee_new",
            title: "New team member",
            body: `${e.name ?? e.email ?? "An employee"} joined the team.`,
            href: "/staff",
            createdAt: e.created_at || new Date().toISOString(),
            read: false,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessUserId, push]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const clearAll = useCallback(() => {
    setNotifications([]);
    seenIds.current.clear();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markAllRead,
      markRead,
      clearAll,
    }),
    [notifications, markAllRead, markRead, clearAll],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      notifications: [] as AppNotification[],
      unreadCount: 0,
      markAllRead: () => {},
      markRead: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
}

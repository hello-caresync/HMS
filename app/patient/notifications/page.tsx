'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, BellOff, CheckCheck, Trash2, Hospital, Stethoscope, Clock } from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  source_app?: 'hospital_app' | 'doctor_app' | string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Existing Notifications & Listen to Realtime Events from Hospital/Doctor Apps
  useEffect(() => {
    fetchNotifications();

    // Subscribe to live Postgres inserts on patient_notifications
    const channel = supabase
      .channel('live_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_notifications',
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Add new notification from Hospital/Doctor App right at the top
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(false);
    // Fetch initial notifications from Supabase
    const { data } = await supabase
      .from('patient_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setNotifications(data);
    }
  };

  // 2. Clear All Notifications
  const handleClearAll = async () => {
    setNotifications([]);
    await supabase.from('patient_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  };

  // 3. Mark Single Notification as Read
  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from('patient_notifications').update({ is_read: true }).eq('id', id);
  };

  // 4. Mark All as Read
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('patient_notifications').update({ is_read: true }).neq('id', '');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F7FAF9] p-6 font-sans text-[#1A332F] md:p-10">
      <div className="mx-auto max-w-4xl">
        
        {/* HEADER & ACTION BUTTONS */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1A332F]">
              Notifications
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#7BA89E]">
              {notifications.length === 0
                ? 'No notifications · Listening for updates from hospital & doctor apps'
                : `${unreadCount} unread · updates from your care team`}
            </p>
          </div>

          {/* Action Toolbar */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 rounded-full border border-[#BDE2F5] bg-white px-4 py-2 text-xs font-bold text-[#1A332F] shadow-sm transition hover:bg-[#DAF0EB] active:scale-95"
              >
                <CheckCheck className="h-4 w-4 text-[#BDE2F5]" />
                Mark all read
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS LIST CONTAINER */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#CEB2C0] bg-white/60 p-12 text-center backdrop-blur-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3B8C7E]/10 text-[#3B8C7E]">
              <BellOff className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#1A332F]">
              All cleared!
            </h3>
            <p className="mt-1 max-w-sm text-xs font-medium text-[#7BA89E]">
              When the hospital staff or your consulting doctor sends updates, prescription alerts, or queue notices, they will appear here live.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`relative flex items-start justify-between rounded-2xl border p-5 shadow-sm transition-all ${
                  item.is_read
                    ? 'border-slate-200 bg-white/70 opacity-75'
                    : 'border-[#BDE2F5] bg-white shadow-md'
                }`}
              >
                <div className="flex gap-4">
                  {/* Badge indicating source app */}
                  <div className="mt-1">
                    {item.source_app === 'doctor_app' ? (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <Stethoscope className="h-5 w-5" />
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DAF0EB] text-[#3B8C7E]">
                        <Hospital className="h-5 w-5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#1A332F]">
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#7BA89E]">
                      {item.message}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {item.source_app ? item.source_app.replace('_', ' ') : 'Care Team'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mark as read button */}
                {!item.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="shrink-0 text-xs font-bold text-[#7BA89E] hover:text-[#3B8C7E] hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
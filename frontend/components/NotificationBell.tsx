'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import api from '@/lib/auth';

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/api/notifications');
            const count = data.filter((n: any) => n.status === 'unread').length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 block">
            <Bell size={24} />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                </span>
            )}
        </Link>
    );
}

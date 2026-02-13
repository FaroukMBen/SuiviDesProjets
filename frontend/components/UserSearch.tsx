'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';

interface User {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    profilePicture?: string;
}

interface UserSearchProps {
    onSelect: (user: User) => void;
    excludeIds?: string[];
    placeholder?: string;
    buttonText?: string;
    role?: string;
    excludeRoles?: string[];
}

export function UserSearch({ onSelect, excludeIds = [], placeholder = 'Rechercher un étudiant...', buttonText = 'Ajouter', role, excludeRoles }: UserSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setSearching(true);
            try {
                const roleParam = role ? `&role=${role}` : '';
                const excludeRolesParam = excludeRoles ? `&excludeRoles=${excludeRoles.join(',')}` : '';
                const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}${roleParam}${excludeRolesParam}`);
                const filtered = response.data.users.filter((u: User) => !excludeIds.includes(u._id));
                setResults(filtered);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query, excludeIds]);

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                {searching && (
                    <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((user) => (
                        <div
                            key={user._id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                                onSelect(user);
                                setQuery('');
                                setResults([]);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                    {user.firstName ? user.firstName[0] : (user.name ? user.name[0] : '?')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || 'Utilisateur sans nom')}
                                    </p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="text-xs text-primary-600 font-medium hover:text-primary-700"
                            >
                                {buttonText}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
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
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setSearching(true);
            try {
                const roleParam = role ? `&role=${role}` : '';
                const excludeRolesParam = excludeRoles ? `&excludeRoles=${excludeRoles.join(',')}` : '';
                const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}${roleParam}${excludeRolesParam}`);
                setResults(response.data.users || []);
                setIsOpen(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query, role, excludeRoles]);

    // Fermer le dropdown en cliquant en dehors
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredResults = results.filter((u: User) => !excludeIds.includes(u._id));

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.trim().length >= 2) {
                            setIsOpen(true);
                        } else {
                            setIsOpen(false);
                        }
                    }}
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm"
                />
                {searching && (
                    <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    </div>
                )}
            </div>

            {isOpen && query.trim().length >= 2 && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 max-h-60 overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredResults.length > 0 ? (
                        filteredResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors group"
                                onClick={() => {
                                    onSelect(user);
                                    setQuery('');
                                    setResults([]);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm border border-primary-100/50">
                                        {user.firstName ? user.firstName[0] : (user.name ? user.name[0] : '?')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                            {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.name || 'Utilisateur sans nom')}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="text-xs text-primary-600 font-bold uppercase tracking-wider hover:text-primary-700 bg-primary-50 group-hover:bg-primary-500 group-hover:text-white px-3 py-1.5 rounded-lg transition-all"
                                >
                                    {buttonText}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-5 text-center text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50/30">
                            {searching ? 'Recherche...' : 'Aucun résultat trouvé'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

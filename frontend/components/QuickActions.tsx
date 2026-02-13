'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  CheckCircle,
  Search,
  LayoutTemplate,
  ListTodo,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';

export function QuickActions() {
  const { user } = useAuthStore();

  // On vérifie si c'est un prof ou un admin
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm transition-hover">
      <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
        <Zap size={16} className="text-amber-500 fill-amber-500" />
        Actions rapides
      </h3>

      <div className="space-y-3">

        {/* --- ACTION PRINCIPALE --- */}
        {isInstructor ? (
          // CAS PROFESSEUR : Lien vers les campagnes
          <Link
            href="/campaigns"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition shadow-lg shadow-purple-200"
          >
            <LayoutTemplate size={16} />
            Gérer les Campagnes
          </Link>
        ) : (
          // CAS ÉTUDIANT : Créer un projet
          <Link
            href="/projects/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={16} />
            Nouveau Projet
          </Link>
        )}

        {/* --- ACTION SECONDAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
            <CheckCircle size={16} />
            Valider Livrables
          </button>
        ) : (
          <Link href="/tasks" className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
            <ListTodo size={16} />
            Mes Tâches
          </Link>
        )}

        {/* --- ACTION TERTIAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-lg shadow-slate-200">
            <Search size={16} />
            Rechercher Étudiant
          </button>
        ) : (
          <Link href="/messagerie" className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-lg shadow-slate-200">
            <MessageSquare size={16} />
            Messagerie
          </Link>
        )}

      </div>
    </div>
  );
}
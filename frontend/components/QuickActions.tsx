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
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 transition-hover">
      <h3 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
        <Zap size={20} className="text-amber-500 fill-amber-500" />
        Actions rapides
      </h3>

      <div className="space-y-4">

        {/* --- ACTION PRINCIPALE --- */}
        {isInstructor ? (
          // CAS PROFESSEUR : Lien vers les campagnes
          <Link
            href="/campaigns"
            className="flex items-center justify-center gap-3 w-full py-4 bg-purple-600 text-white rounded-2xl text-sm font-black hover:bg-purple-700 transition shadow-xl shadow-purple-200"
          >
            <LayoutTemplate size={20} />
            Gérer les Campagnes
          </Link>
        ) : (
          // CAS ÉTUDIANT : Créer un projet
          <Link
            href="/projects/new"
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition shadow-xl shadow-blue-200"
          >
            <Plus size={20} />
            Nouveau Projet
          </Link>
        )}

        {/* --- ACTION SECONDAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl text-sm font-black hover:bg-emerald-600 transition shadow-xl shadow-emerald-200">
            <CheckCircle size={20} />
            Valider Livrables
          </button>
        ) : (
          <Link href="/tasks" className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl text-sm font-black hover:bg-emerald-600 transition shadow-xl shadow-emerald-200">
            <ListTodo size={20} />
            Mes Tâches
          </Link>
        )}

        {/* --- ACTION TERTIAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-3 w-full py-4 bg-slate-700 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition shadow-xl shadow-slate-200">
            <Search size={20} />
            Rechercher Étudiant
          </button>
        ) : (
          <Link href="/messagerie" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-700 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition shadow-xl shadow-slate-200">
            <MessageSquare size={20} />
            Messagerie
          </Link>
        )}

      </div>
    </div>
  );
}
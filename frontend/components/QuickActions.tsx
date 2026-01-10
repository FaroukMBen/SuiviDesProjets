'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { 
  Plus, 
  CheckCircle, 
  Search, 
  LayoutTemplate, 
  ListTodo, 
  Users 
} from 'lucide-react';

export function QuickActions() {
  const { user } = useAuthStore();
  
  // On vérifie si c'est un prof ou un admin
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        ⚡ Actions rapides
      </h3>
      
      <div className="space-y-3">
        
        {/* --- ACTION PRINCIPALE --- */}
        {isInstructor ? (
          // CAS PROFESSEUR : Lien vers les campagnes
          <Link 
            href="/dashboard/campaigns" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-200"
          >
            <LayoutTemplate size={18} />
            Gérer les Campagnes
          </Link>
        ) : (
          // CAS ÉTUDIANT : Créer un projet
          <Link 
            href="/projects/new" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Nouveau Projet
          </Link>
        )}

        {/* --- ACTION SECONDAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
            <CheckCircle size={18} />
            Valider Livrables
          </button>
        ) : (
          <Link href="/tasks" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
            <ListTodo size={18} />
            Mes Tâches
          </Link>
        )}

        {/* --- ACTION TERTIAIRE --- */}
        {isInstructor ? (
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
            <Search size={18} />
            Rechercher Étudiant
          </button>
        ) : (
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
            <Users size={18} />
            Trouver un groupe
          </button>
        )}

      </div>
    </div>
  );
}
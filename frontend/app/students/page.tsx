'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  GraduationCap, 
  MoreVertical,
  LayoutGrid,
  List
} from 'lucide-react';
import Link from 'next/link';

export default function StudentSearchPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Fonction de recherche
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedYear) params.append('year', selectedYear);

      const res = await api.get(`/api/users/students?${params.toString()}`);
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour éviter trop d'appels API pendant la frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 400); // Délai de 400ms
    return () => clearTimeout(timer);
  }, [searchTerm, selectedYear]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        
        {/* 1. SIDEBAR */}
        <Navbar />

        {/* 2. CONTENU PRINCIPAL */}
        <div className="flex-1 ml-64 p-8">
            
            {/* --- EN-TÊTE --- */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Annuaire Étudiants</h1>
                    <p className="text-gray-500">Gérez et recherchez les étudiants inscrits dans vos promotions.</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    {students.length} étudiant(s) trouvé(s)
                </div>
            </div>

            {/* --- BARRE DE RECHERCHE & FILTRES --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                
                {/* Champ Recherche */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Rechercher par nom, email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Sélecteur Promo */}
                <div className="w-full md:w-56 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                        className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-gray-700"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">Tous les niveaux</option>
                        <option value="BUT1">BUT 1</option>
                        <option value="BUT2">BUT 2</option>
                        <option value="BUT3">BUT 3</option>
                        <option value="LP">Licence Pro</option>
                        <option value="Master">Master</option>
                    </select>
                    {/* Petite flèche custom pour le select */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* --- LISTE DES RÉSULTATS --- */}
            {loading ? (
                // SKELETON LOADING (Plus joli que du texte)
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-48 animate-pulse flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full"></div>
                            <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                            <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {students.map((student) => (
                        <div key={student._id} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden relative flex flex-col">
                            
                            {/* Header Carte (Fond coloré optionnel ou simple) */}
                            <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50"></div>
                            
                            {/* Avatar & Infos */}
                            <div className="px-6 pb-6 -mt-10 flex flex-col items-center flex-1">
                                <div className="w-20 h-20 bg-white p-1 rounded-full shadow-sm mb-3">
                                    <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
                                        {student.name.charAt(0)}
                                    </div>
                                </div>
                                
                                <h3 className="font-bold text-gray-900 text-lg text-center truncate w-full" title={student.name}>
                                    {student.name}
                                </h3>
                                
                                <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                                    <Mail size={14} />
                                    <span className="truncate max-w-[150px]" title={student.email}>{student.email}</span>
                                </div>

                                {/* Badges */}
                                <div className="flex gap-2 mt-auto">
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium border border-purple-100">
                                        <GraduationCap size={12} />
                                        {student.academicYear || 'N/A'}
                                    </span>
                                    {student.group && (
                                        <span className="inline-flex items-center bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200">
                                            Gr. {student.group}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="border-t border-gray-50 p-3 bg-gray-50/50 flex justify-center gap-2">
                                <a 
                                    href={`mailto:${student.email}`} 
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                    title="Envoyer un email"
                                >
                                    <Mail size={18} />
                                </a>
                                <Link 
                                    href={`/dashboard/users/${student._id}`} // Lien hypothétique vers profil complet
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                    title="Voir profil complet"
                                >
                                    <User size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // EMPTY STATE
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Aucun étudiant trouvé</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-1">
                        Essayez de modifier vos termes de recherche ou de changer les filtres de promotion.
                    </p>
                    <button 
                        onClick={() => {setSearchTerm(''); setSelectedYear('');}}
                        className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
// app/dashboard/students/page.tsx (ou app/students/page.tsx selon ta structure)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { Search, Filter, User } from 'lucide-react';

export default function StudentSearchPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Fonction de recherche
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Construction de l'URL avec paramètres query
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

  // Déclenche la recherche quand on tape ou change le filtre (avec petit délai pour éviter spam)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedYear]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Annuaire Étudiants</h1>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Rechercher par nom..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
            <select 
                className="w-full p-2 border border-gray-200 rounded-lg"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
            >
                <option value="">Tous les niveaux</option>
                <option value="BUT1">BUT 1</option>
                <option value="BUT2">BUT 2</option>
                <option value="BUT3">BUT 3</option>
            </select>
        </div>
      </div>

      {/* Liste des résultats */}
      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {students.map((student: any) => (
            <div key={student._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{student.name}</h3>
                <p className="text-xs text-gray-500">{student.email}</p>
                <div className="mt-2 flex gap-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                        {student.academicYear || 'N/A'}
                    </span>
                    {student.group && (
                        <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs font-medium">
                            Gr. {student.group}
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
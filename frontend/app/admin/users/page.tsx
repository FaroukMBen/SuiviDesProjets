'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Plus, Edit2, Trash2, Search, Shield, GraduationCap, Briefcase, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserModal } from '@/components/admin/UserModal';
import { CsvImportModal } from '@/components/admin/CsvImportModal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/lib/store';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const isModern = user?.theme === 'modern';
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Filtres & Pagination
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterYears, setFilterYears] = useState<string[]>([]);
  const [filterGroups, setFilterGroups] = useState<string[]>([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(7);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (filterRoles.length > 0) url += `&role=${filterRoles.join(',')}`;
      if (filterYears.length > 0) url += `&academicYear=${filterYears.join(',')}`;
      if (filterGroups.length > 0) url += `&group=${filterGroups.join(',')}`;

      const res = await api.get(url);
      setUsers(res.data.users);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchTerm, filterRoles, filterYears, filterGroups]);


  const handleDelete = async (id: string) => {
    if (!await confirm({ title: "Suppression", message: "Voulez-vous vraiment supprimer cet utilisateur ?", type: "danger" })) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
      showToast("Utilisateur supprimé", "success");
    } catch (err) {
      showToast("Erreur suppression", "error");
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Filtrage simple côté client - This is no longer needed as filtering is done on the server
  // const filteredUsers = users.filter(u => {
  //   const fullName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur';
  //   const email = u.email || '';

  //   return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     email.toLowerCase().includes(searchTerm.toLowerCase());
  // });

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        <div className="flex-1 ml-64 p-8">

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
              >
                <Upload size={18} /> Import CSV
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Nouvel Utilisateur
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className={`${isModern ? 'bg-white/80 backdrop-blur-md rounded-3xl' : 'bg-white rounded-xl'} shadow-sm border border-gray-100 mb-8`}>
            <div className={`p-4 ${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center relative z-20`}>
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur (Nom, Email...)"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-700"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto pb-2 md:pb-0">
                <MultiSelectDropdown
                  label="Rôles"
                  options={[
                    { value: 'student', label: 'Étudiants' },
                    { value: 'instructor', label: 'Enseignants' },
                    { value: 'admin', label: 'Administrateurs' }
                  ]}
                  selectedValues={filterRoles}
                  onChange={(vals) => { setFilterRoles(vals); setPage(1); }}
                  placeholder="Tous les rôles"
                  isModern={isModern}
                />

                <MultiSelectDropdown
                  label="Promos"
                  options={[
                    { value: 'BUT1', label: 'BUT1' },
                    { value: 'BUT2', label: 'BUT2' },
                    { value: 'BUT3', label: 'BUT3' }
                  ]}
                  selectedValues={filterYears}
                  onChange={(vals) => { setFilterYears(vals); setPage(1); }}
                  placeholder="Toutes promos"
                  isModern={isModern}
                />

                <MultiSelectDropdown
                  label="Groupes"
                  options={[
                    { value: 'G1', label: 'G1' }, { value: 'G2', label: 'G2' },
                    { value: 'G3', label: 'G3' }, { value: 'G4', label: 'G4' },
                    { value: 'RA1', label: 'RA1' }, { value: 'RA2', label: 'RA2' },
                    { value: 'DACS', label: 'DACS' }
                  ]}
                  selectedValues={filterGroups}
                  onChange={(vals) => { setFilterGroups(vals); setPage(1); }}
                  placeholder="Tous groupes"
                  isModern={isModern}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} text-gray-400 text-xs uppercase font-black tracking-widest`}>
                  <tr>
                    <th className="px-8 py-5">Utilisateur</th>
                    <th className="px-8 py-5">Rôle</th>
                    <th className="px-8 py-5">Promo / Groupe</th>
                    <th className="px-8 py-5">Dernière Connexion</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chargement...</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm
                            ${u.role === 'student' ? 'bg-blue-100 text-blue-600' :
                              u.role === 'instructor' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                            {(u.firstName?.[0] || u.name?.[0] || '?').toUpperCase()}{(u.lastName?.[0] || '').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-gray-900 leading-none mb-1">{u.firstName || ''} {u.lastName || u.name || ''}</div>
                            <div className="text-sm text-gray-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm">
                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm
                          ${u.role === 'student' ? 'bg-blue-50 text-blue-600' :
                            u.role === 'admin' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                          {u.role === 'student' ? 'Étudiant' : u.role === 'admin' ? 'Admin' : 'Enseignant'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-gray-700">{u.academicYear || '-'}</div>
                        <div className="text-xs text-blue-500 font-medium">{u.group || '-'}</div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-gray-400 italic">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Jamais'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}
                            className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Modifier"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="p-3 text-red-600 hover:bg-red-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-bold">
                        Aucun utilisateur ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <div className={`mt-8 flex flex-col md:flex-row justify-center items-center gap-6 border-t border-gray-100 pt-8`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Afficher</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className={`${isModern ? 'bg-gray-50 rounded-xl px-4 py-1.5 focus:ring-4 focus:ring-blue-500/10' : 'bg-white rounded-lg px-3 py-1.5 min-w-[70px]'} border border-gray-200 outline-none focus:border-blue-500 font-bold text-gray-700 transition-all cursor-pointer`}
              >
                <option value={7}>7</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
              <span>par page</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${isModern ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <span className="text-sm font-bold text-gray-600">
                Page <span className="text-blue-600">{page}</span> sur {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${isModern ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Modal User */}
          <UserModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchUsers}
            userToEdit={selectedUser}
          />

          {/* Modal Import CSV */}
          <CsvImportModal
            isOpen={isCsvModalOpen}
            onClose={() => setIsCsvModalOpen(false)}
            onSuccess={fetchUsers}
          />

        </div>
      </div>
    </ProtectedRoute>
  );
}
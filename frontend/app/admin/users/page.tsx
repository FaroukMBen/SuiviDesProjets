'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Plus, Edit2, Trash2, Search, Shield, GraduationCap, Briefcase, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserModal } from '@/components/admin/UserModal';
import { CsvImportModal } from '@/components/admin/CsvImportModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      const res = await api.get(`/api/users?page=${page}&limit=${limit}`);
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
  }, [page, limit]);

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert("Erreur suppression");
      }
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

  // Filtrage simple côté client
  const filteredUsers = users.filter(u => {
    const fullName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Utilisateur';
    const email = u.email || '';

    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

          {/* Barre de recherche */}
          <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex gap-4 items-center">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="flex-1 outline-none text-gray-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Info Promo</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chargement...</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sans nom'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Badge Rôle */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                          user.role === 'instructor' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {user.role === 'instructor' && <Briefcase size={12} />}
                        {user.role === 'student' && <GraduationCap size={12} />}

                        {user.role === 'admin' ? 'Administrateur' :
                          user.role === 'instructor' ? 'Enseignant' : 'Étudiant'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'student' ? (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{user.academicYear}</span>
                          {user.group && <span className="text-gray-500 ml-2">(Gr. {user.group})</span>}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-6 pb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Afficher</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={7}>7</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
              <span>par page</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                Page {page} sur {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                <ChevronRight size={20} />
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
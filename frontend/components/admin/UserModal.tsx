'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { X, Save, User, Mail, Lock, GraduationCap } from 'lucide-react';
import { SCHOOL_STRUCTURE } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: any;
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: Props) {
  const isEditing = !!userToEdit;
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // State initial
  const initialState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    academicYear: 'BUT1',
    group: ''
  };

  const [formData, setFormData] = useState(initialState);

  // Reset ou Remplissage à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({
          ...userToEdit,
          firstName: userToEdit.firstName || '',
          lastName: userToEdit.lastName || userToEdit.name || '',
          password: '',
          group: userToEdit.group || ''
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {

        const dataToSend = { ...formData };
        if (!dataToSend.password) delete dataToSend.password;

        await api.put(`/api/users/${userToEdit._id}`, dataToSend);
      } else {
        await api.post('/api/users', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Une erreur est survenue", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Prénom et Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  required type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                required type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                required type="email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="student">Étudiant</option>
              <option value="instructor">Enseignant</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {/* Champs Spécifiques Étudiants */}
          {formData.role === 'student' && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Promo</label>
                <select
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  value={formData.academicYear}
                  onChange={e => setFormData({
                    ...formData,
                    academicYear: e.target.value,
                    group: ''
                  })}
                >
                  {Object.keys(SCHOOL_STRUCTURE).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Groupe</label>
                <div className="flex flex-wrap gap-2">
                  {(SCHOOL_STRUCTURE[formData.academicYear] || []).map((group) => (
                    <button
                      type="button"
                      key={group}
                      onClick={() => setFormData({ ...formData, group })}
                      className={`
                                        px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                                        ${formData.group === group
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}
                                    `}
                    >
                      {formData.group === group && <span className="text-xs">✓</span>}
                      {group}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.group
                    ? `Groupe sélectionné : ${formData.group}`
                    : "Aucun groupe sélectionné."}
                </p>
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEditing ? 'Nouveau mot de passe (Laisser vide pour garder l\'actuel)' : 'Mot de passe'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                required={!isEditing}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              {loading ? '...' : <><Save size={18} /> {isEditing ? 'Mettre à jour' : 'Créer'}</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
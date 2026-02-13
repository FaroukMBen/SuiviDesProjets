'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Mail,
  Lock,
  Shield,
  Calendar,
  Users,
  Save,
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    academicYear: 'BUT1',
    group: 'G1'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || user.name || '',
        email: user.email || '',
        academicYear: user.academicYear || 'BUT1',
        group: user.group || 'G1'
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        academicYear: formData.academicYear,
        group: formData.group
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/api/auth/profile', payload);
      setUser(res.data.user); // Met à jour le store global

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        {/* Navbar Laterale */}
        <Navbar />

        {/* Contenu Principal */}
        <div className="flex-1 ml-64 flex flex-col min-h-screen">

          {/* Header */}
          <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-blue-600" />
              Paramètres du compte
            </h2>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {user ? `${user.firstName} ${user.lastName || user.name}` : 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">{user?.role === 'instructor' ? 'Enseignant' : 'Étudiant'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
                {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">

            {/* Bannière de Profil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 gap-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-white rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-4xl font-bold text-slate-400">
                      {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
                    </div>
                  </div>
                  <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition cursor-not-allowed" title="Changer la photo (bientôt disponible)">
                    <Camera size={16} />
                  </button>
                </div>

                <div className="flex-1 mb-2 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user ? `${user.firstName} ${user.lastName || user.name}` : ''}
                  </h1>
                  <p className="text-gray-500">{user?.email}</p>
                </div>

                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide border border-blue-100">
                    {user?.role === 'instructor' ? 'Enseignant' : 'Étudiant'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Colonne Gauche: Infos en lecture seule */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Informations Académiques</h3>
                  <div className="space-y-4">

                    <div className="flex items-center gap-3 text-slate-600">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Rôle</p>
                        <p className="text-sm font-semibold capitalize">{user?.role || 'Non défini'}</p>
                      </div>
                    </div>

                    {user?.role === 'student' && (
                      <>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Année</p>
                            <p className="text-sm font-semibold">{user?.academicYear || 'Non renseigné'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-600">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Groupe</p>
                            <p className="text-sm font-semibold">{user?.group || 'Non assigné'}</p>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 text-sm">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Sécurité
                  </h4>
                  <p className="mb-2 opacity-80">
                    Votre compte est sécurisé. Si vous remarquez une activité suspecte, changez votre mot de passe immédiatement.
                  </p>
                </div>
              </div>

              {/* Colonne Droite: Formulaire d'édition */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Modifier le profil</h3>
                    {loading && <span className="text-xs text-blue-600 font-medium animate-pulse">Sauvegarde en cours...</span>}
                  </div>

                  {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Prénom */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="John"
                          />
                        </div>
                      </div>

                      {/* Nom */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Adresse Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      {/* NOUVEAU : Champs Année et Groupe (Uniquement si étudiant) */}
                      {user?.role === 'student' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Année</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <select
                                name="academicYear"
                                value={formData.academicYear}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              >
                                <option value="BUT1">BUT1</option>
                                <option value="BUT2">BUT2</option>
                                <option value="BUT3">BUT3</option>
                                <option value="LP">Licence Pro</option>
                                <option value="Master">Master</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Groupe</label>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <select
                                name="group"
                                value={formData.group}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              >
                                {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'TP-A', 'TP-B', 'TP-C', 'TP-D'].map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-gray-400" />
                        Sécurité & Mot de passe
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="Laisser vide pour ne pas changer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition
                              ${formData.password && formData.password !== formData.confirmPassword ? 'ring-2 ring-red-500 bg-red-50' : 'focus:ring-blue-500'}
                            `}
                            placeholder="Répétez le mot de passe"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Enregistrer les modifications
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

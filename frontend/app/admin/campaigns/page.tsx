'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Plus, Edit2, Trash2, Search, User, Calendar } from 'lucide-react';
import { CampaignModal } from '@/components/campaigns/CampaignModal';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(res.data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Attention : Supprimer une campagne supprimera aussi tous les projets associés. Continuer ?')) {
      try {
        await api.delete(`/api/campaigns/${id}`);
        fetchCampaigns();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filtered = campaigns.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        <div className="flex-1 ml-64 p-8">
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Administration Campagnes</h1>
                <button 
                    onClick={() => { setSelectedCampaign(null); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={18} /> Créer une campagne
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 flex gap-2">
                    <Search className="text-gray-400" />
                    <input 
                        type="text" placeholder="Rechercher une campagne..." 
                        className="flex-1 outline-none"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Campagne</th>
                            <th className="px-6 py-4">Responsable</th>
                            <th className="px-6 py-4">Période</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((campaign) => (
                            <tr key={campaign._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{campaign.title}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User size={14} />
                                        {campaign.manager?.name || 'Inconnu'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        {new Date(campaign.endDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => { setSelectedCampaign(campaign); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(campaign._id)} className="p-2 text-red-600 hover:bg-red-50 rounded ml-2">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CampaignModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchCampaigns} 
                campaignToEdit={selectedCampaign} 
            />
        </div>
      </div>
    </ProtectedRoute>
  );
}
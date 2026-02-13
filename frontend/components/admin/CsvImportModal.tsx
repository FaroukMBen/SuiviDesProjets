'use client';

import { useState } from 'react';
import api from '@/lib/auth';
import { X, Upload, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null); // Reset result on new file
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/api/users/import-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(data.results);
            if (data.results.created > 0 || data.results.updated > 0) {
                onSuccess(); // Refresh parent list but keep modal open to show results
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Erreur lors de l'import", "error");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,firstname,lastname,email,academicYear,group\nJean,Dupont,jean.dupont@univ.fr,BUT1,G1\nMarie,Curie,marie.curie@univ.fr,BUT2,RA1";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modele_etudiants.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Upload size={24} className="text-blue-600" />
                        Importer des étudiants (CSV)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Template Download */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Format attendu : CSV</p>
                        <p>Colonnes : <span className="font-mono bg-white px-1 rounded border border-blue-200">firstname, lastname, email, academicYear, group</span></p>
                        <button
                            onClick={downloadTemplate}
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1"
                        >
                            <FileText size={16} /> Télécharger un modèle
                        </button>
                    </div>

                    {/* File Input */}
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            id="csvInput"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="csvInput" className="cursor-pointer flex flex-col items-center">
                            {file ? (
                                <>
                                    <FileText size={48} className="text-blue-500 mb-2" />
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={48} className="text-gray-400 mb-2" />
                                    <p className="font-medium text-gray-700">Cliquez pour sélectionner un fichier</p>
                                    <p className="text-xs text-gray-400 mt-1">Fichiers CSV uniquement</p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Results Display */}
                    {result && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex gap-4">
                                <div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                                    <p className="text-xs text-green-600 font-bold uppercase">Créés</p>
                                    <p className="text-xl font-bold text-green-700">{result.created}</p>
                                </div>
                                <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                    <p className="text-xs text-blue-600 font-bold uppercase">Mis à jour</p>
                                    <p className="text-xl font-bold text-blue-700">{result.updated}</p>
                                </div>
                                <div className={`flex-1 p-3 rounded-lg border text-center ${result.errors > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-xs font-bold uppercase ${result.errors > 0 ? 'text-red-600' : 'text-gray-500'}`}>Erreurs</p>
                                    <p className={`text-xl font-bold ${result.errors > 0 ? 'text-red-700' : 'text-gray-700'}`}>{result.errors}</p>
                                </div>
                            </div>

                            {result.errors > 0 && result.errorDetails.length > 0 && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 max-h-32 overflow-y-auto text-xs text-red-700 space-y-1">
                                    {result.errorDetails.slice(0, 10).map((err: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                            <span>{err}</span>
                                        </div>
                                    ))}
                                    {result.errorDetails.length > 10 && (
                                        <p className="italic text-center pt-1">... et {result.errorDetails.length - 10} autres erreurs.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">
                        Fermer
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Traitement...' : 'Importer'}
                    </button>
                </div>

            </div>
        </div>
    );
}

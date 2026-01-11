import { useState } from 'react';
import api from '@/lib/auth';

export function useProjectFiles(projectId: string, onUpdate?: () => void) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const uploadFile = async (file: File) => {
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/api/projects/${projectId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (onUpdate) onUpdate();
            return true;
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Erreur lors de l'upload");
            return false;
        } finally {
            setUploading(false);
        }
    };

    const deleteFile = async (fileId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return false;

        try {
            await api.delete(`/api/projects/${projectId}/files/${fileId}`);
            if (onUpdate) onUpdate();
            return true;
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Erreur lors de la suppression");
            return false;
        }
    };

    const downloadFile = async (path: string, originalName: string) => {
        try {
            const actualFilename = path.split('/').pop();
            if (!actualFilename) return;

            const response = await api.get(`/api/projects/files/${actualFilename}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error", err);
            alert("Erreur lors du téléchargement");
        }
    };

    return {
        uploading,
        error,
        uploadFile,
        deleteFile,
        downloadFile
    };
}

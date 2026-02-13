import { useState } from 'react';
import api from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export function useProjectFiles(projectId: string, onUpdate?: () => void) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const uploadFile = async (file: File, milestoneId?: string) => {
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        if (milestoneId) {
            formData.append('milestoneId', milestoneId);
        }

        try {
            await api.post(`/api/projects/${projectId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (onUpdate) onUpdate();
            showToast("Fichier uploadé avec succès", "success");
            return true;
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Erreur lors de l'upload";
            setError(msg);
            showToast(msg, "error");
            return false;
        } finally {
            setUploading(false);
        }
    };

    const deleteFile = async (fileId: string) => {
        if (!await confirm({ title: "Suppression", message: 'Êtes-vous sûr de vouloir supprimer ce fichier ?', type: 'danger' })) return false;

        try {
            await api.delete(`/api/projects/${projectId}/files/${fileId}`);
            if (onUpdate) onUpdate();
            showToast("Fichier supprimé", "success");
            return true;
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Erreur lors de la suppression";
            showToast(msg, "error");
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
            showToast("Erreur lors du téléchargement", "error");
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

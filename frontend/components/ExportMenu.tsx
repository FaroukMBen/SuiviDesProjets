'use client';

import api from '@/lib/auth';

export function ExportMenu({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/api/archive/${projectId}/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error('Export failed:', err.response?.data?.message || 'Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/api/archive/${projectId}/export/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error('Export failed:', err.response?.data?.message || 'Failed to export CSV');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPDF}
        className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium text-sm"
      >
        Export PDF
      </button>
      <button
        onClick={handleExportCSV}
        className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition font-medium text-sm"
      >
        Export CSV
      </button>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Paperclip, Download, Trash2, Upload, FileText, Image, File } from 'lucide-react';

interface AttachmentPanelProps {
  assetId?: string;
  maintenanceRequestId?: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

function fileIcon(type: string) {
  if (type?.includes('image')) return <Image size={16} />;
  if (type?.includes('pdf')) return <FileText size={16} />;
  return <File size={16} />;
}

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentPanel({
  assetId,
  maintenanceRequestId,
  canUpload = true,
  canDelete = true,
}: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    const params: any = {};
    if (assetId) params.asset_id = assetId;
    if (maintenanceRequestId) params.maintenance_request_id = maintenanceRequestId;
    api.get('/attachments', { params })
      .then(r => setAttachments(Array.isArray(r.data) ? r.data : (r.data?.data || [])))
      .catch(() => setAttachments([]));
  };

  useEffect(() => { load(); }, [assetId, maintenanceRequestId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (assetId) form.append('asset_id', assetId);
      if (maintenanceRequestId) form.append('maintenance_request_id', maintenanceRequestId);
      await api.post('/attachments', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      load();
    } catch (x: any) {
      setErr(x.response?.data?.message || 'Upload failed. Max 5 MB. Allowed: PDF, JPG, PNG, DOCX, TXT.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const r = await api.get(`/attachments/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErr('Download failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/attachments/${id}`);
      load();
    } catch (x: any) {
      setErr(x.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Paperclip size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Attachments
        </h2>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
              onChange={handleUpload}
            />
            <button
              className="btn btn-secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </>
        )}
      </div>

      {err && <div className="error" style={{ marginBottom: 8 }}>{err}</div>}

      {attachments.length === 0 ? (
        <div className="empty">No attachments yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {attachments.map((a: any) => (
            <div
              key={a.attachment_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>{fileIcon(a.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.file_name}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {formatBytes(a.file_size)} · {new Date(a.uploaded_at).toLocaleDateString()}
                  {a.uploader && ` · ${a.uploader.full_name}`}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => handleDownload(a.attachment_id, a.file_name)}
                title="Download"
              >
                <Download size={14} />
              </button>
              {canDelete && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', color: 'var(--danger, #e53e3e)' }}
                  onClick={() => handleDelete(a.attachment_id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useMedia } from '@/lib/hooks/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { Image as ImageIcon, Grid3x3, Search, Download, Trash2, Upload, FolderOpen, RefreshCw } from 'lucide-react';

type FilterType = 'all' | 'image' | 'carousel';

export default function LibraryPage() {
  const { listFiles, uploadFile, deleteFile } = useMedia();
  const { success, error: toastError, info } = useToast();

  const [assets, setAssets] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await listFiles();
      setAssets(data.files || []);
    } catch (err: any) {
      // If API fails, show empty state (not an error toast)
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadFile(file);
      success(`"${file.name}" uploaded successfully!`);
      await loadAssets();
    } catch (err: any) {
      toastError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (asset: any) => {
    setConfirmDeleteAsset(asset);
  };

  const confirmDelete = async () => {
    const asset = confirmDeleteAsset;
    if (!asset) return;
    setConfirmDeleteAsset(null);
    setDeletingId(asset.id || asset.filename);
    try {
      await deleteFile(asset.filename || asset.url);
      setAssets((prev) => prev.filter((a) => (a.id || a.filename) !== (asset.id || asset.filename)));
      info('Asset deleted');
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (asset: any) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.filename || asset.title || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterType !== 'all' && asset.type !== filterType) return false;
    const name = (asset.filename || asset.title || '').toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="library-page">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderOpen size={28} style={{ color: 'var(--primary-600)' }} />
            Media Library
          </h1>
          <p className="page-description">Manage all your generated images and carousels</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={loadAssets} disabled={isLoading} title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? <><RefreshCw size={16} className="spin" /> Uploading...</> : <><Upload size={18} /> Upload Media</>}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="library-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          {[
            { key: 'all',      label: 'All' },
            { key: 'image',    label: 'Images',    icon: <ImageIcon size={14} /> },
            { key: 'carousel', label: 'Carousels', icon: <Grid3x3 size={14} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`filter-btn ${filterType === key ? 'active' : ''}`}
              onClick={() => setFilterType(key as FilterType)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!isLoading && assets.length > 0 && (
        <div className="stats-bar">
          <span>{assets.length} total</span>
          <span>·</span>
          <span>{assets.filter(a => a.type === 'image').length} images</span>
          <span>·</span>
          <span>{assets.filter(a => a.type === 'carousel').length} carousels</span>
        </div>
      )}

      {/* Asset Grid */}
      {isLoading ? (
        <div className="assets-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="asset-card skeleton-card" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h3>{searchQuery || filterType !== 'all' ? 'No matching assets' : 'Your library is empty'}</h3>
          <p>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Upload images or generate content to see it here'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleUploadClick}>
              <Upload size={16} /> Upload your first asset
            </button>
          )}
        </div>
      ) : (
        <div className="assets-grid">
          {filteredAssets.map((asset) => {
            const assetKey = asset.id || asset.filename;
            const isDeleting = deletingId === assetKey;
            return (
              <div key={assetKey} className={`asset-card ${isDeleting ? 'deleting' : ''}`}>
                <div className="asset-preview">
                  <img
                    src={asset.url || asset.previewUrl}
                    alt={asset.filename || asset.title || 'Asset'}
                    loading="lazy"
                  />
                  <div className="asset-overlay">
                    <button
                      className="overlay-btn"
                      title="Download"
                      onClick={() => handleDownload(asset)}
                    >
                      <Download size={18} />
                    </button>
                    <button
                      className="overlay-btn danger"
                      title="Delete"
                      onClick={() => handleDelete(asset)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-title">
                    {asset.filename || asset.title || 'Untitled'}
                  </div>
                  <div className="asset-meta">
                    <span className={`asset-type ${asset.type || 'image'}`}>
                      {asset.type === 'carousel' ? <Grid3x3 size={12} /> : <ImageIcon size={12} />}
                      {asset.type ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1) : 'Image'}
                    </span>
                    <span className="asset-date">
                      {asset.createdAt
                        ? new Date(asset.createdAt).toLocaleDateString()
                        : asset.lastModified
                          ? new Date(asset.lastModified).toLocaleDateString()
                          : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteAsset && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'var(--background)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '380px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
              Delete asset?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: '0 0 20px 0' }}>
              "{confirmDeleteAsset.filename || confirmDeleteAsset.title || 'This asset'}" will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteAsset(null)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'var(--background-alt, #f3f4f6)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '10px',
                  background: '#ef4444', color: 'white',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .library-page { max-width: 1400px; margin: 0 auto; }

        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: var(--space-8);
        }
        .page-title {
          font-size: var(--text-4xl); font-weight: var(--font-bold);
          color: var(--foreground); margin-bottom: var(--space-2);
          display: flex; align-items: center; gap: var(--space-3);
        }
        .page-description { font-size: var(--text-lg); color: var(--foreground-muted); margin: 0; }

        .library-filters {
          display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap;
        }
        .search-box {
          flex: 1; min-width: 280px;
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--background); border: 1px solid var(--border);
          border-radius: var(--radius-lg); color: var(--foreground-muted);
        }
        .search-box input {
          flex: 1; border: none; background: transparent;
          font-size: var(--text-base); color: var(--foreground); outline: none;
        }
        .filter-buttons { display: flex; gap: var(--space-2); }
        .filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: var(--space-3) var(--space-4);
          background: var(--background); border: 1px solid var(--border);
          border-radius: var(--radius-lg); color: var(--foreground-muted);
          font-size: var(--text-sm); font-weight: var(--font-medium);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .filter-btn:hover { border-color: var(--primary-500); color: var(--foreground); }
        .filter-btn.active { background: var(--primary-600); border-color: var(--primary-600); color: white; }

        .stats-bar {
          display: flex; gap: 8px; align-items: center;
          font-size: 13px; color: var(--foreground-muted);
          margin-bottom: var(--space-6);
        }

        .assets-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--space-6);
        }

        .asset-card {
          background: var(--background); border: 1px solid var(--border);
          border-radius: var(--radius-xl); overflow: hidden;
          transition: all var(--transition-base);
        }
        .asset-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
        .asset-card.deleting { opacity: 0.4; pointer-events: none; }

        .skeleton-card {
          height: 280px;
          background: linear-gradient(90deg, var(--background-alt) 25%, var(--border) 50%, var(--background-alt) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .asset-preview {
          position: relative; width: 100%; padding-top: 100%;
          background: var(--background-alt); overflow: hidden;
        }
        .asset-preview img {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;
        }

        .asset-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center; gap: var(--space-3);
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .asset-card:hover .asset-overlay { opacity: 1; }

        .overlay-btn {
          padding: var(--space-3); background: white; border: none;
          border-radius: var(--radius-md); color: #111; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .overlay-btn:hover { background: var(--primary-600); color: white; }
        .overlay-btn.danger:hover { background: #ef4444; color: white; }

        .asset-info { padding: var(--space-4); }
        .asset-title {
          font-size: var(--text-base); font-weight: var(--font-semibold);
          color: var(--foreground); margin-bottom: var(--space-2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .asset-meta { display: flex; justify-content: space-between; align-items: center; }
        .asset-type {
          display: flex; align-items: center; gap: 4px;
          padding: 3px 8px; background: var(--primary-100);
          color: var(--primary-700); border-radius: var(--radius-sm);
          font-size: 11px; font-weight: var(--font-medium);
        }
        [data-theme="dark"] .asset-type { background: rgba(99,102,241,0.2); color: var(--primary-300); }
        .asset-date { font-size: 11px; color: var(--foreground-muted); }

        .empty-state {
          grid-column: 1 / -1; text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center;
        }
        .empty-state h3 { font-size: var(--text-2xl); color: var(--foreground); margin: 0 0 8px 0; }
        .empty-state p { font-size: var(--text-base); color: var(--foreground-muted); margin: 0; }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Mail,
  Tag,
  Search,
  AlertCircle,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react';
import { api } from '../../services/api';

export interface WhitelistEntry {
  id: number;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  notes?: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
}

// Apple iOS Smooth Switch Component
const AppleToggle: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '38px',
        height: '20px',
        borderRadius: '10px',
        backgroundColor: checked ? 'var(--color-bullish, #10b981)' : 'rgba(255, 255, 255, 0.15)',
        border: 'none',
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        transition: 'background-color 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        flexShrink: 0,
        outline: 'none',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
          transform: checked ? 'translateX(18px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </button>
  );
};

export const UserWhitelistManager: React.FC = () => {
  const [users, setUsers] = useState<WhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add User Form State
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Status Notification
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Deletion Modal / Inline Confirm
  const [deleteTarget, setDeleteTarget] = useState<WhitelistEntry | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const loadWhitelist = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<WhitelistEntry[]>('/auth/admin/whitelist');
      setUsers(data || []);
    } catch (err: any) {
      showFeedback(err?.message || 'Gagal memuat daftar whitelist user.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWhitelist();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showFeedback('Masukkan alamat email yang valid.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<WhitelistEntry>('/auth/admin/whitelist', {
        email: newEmail.trim(),
        role: newRole,
        notes: newNotes.trim(),
      });
      showFeedback(`User ${res.email} berhasil ditambahkan ke whitelist!`, 'success');
      setNewEmail('');
      setNewNotes('');
      setNewRole('USER');
      await loadWhitelist();
    } catch (err: any) {
      showFeedback(err?.message || 'Gagal menambahkan user ke whitelist.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: WhitelistEntry) => {
    if (user.role === 'OWNER' || user.email.toLowerCase() === 'ilhamgb11@gmail.com') {
      showFeedback('Akun Owner utama tidak dapat dinonaktifkan.', 'error');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await api.put(`/auth/admin/whitelist/${user.id}`, {
        status: nextStatus,
      });
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: nextStatus, updatedAt: Date.now() } : u))
      );
      showFeedback(
        nextStatus === 'ACTIVE'
          ? `Akses ${user.email} diaktifkan.`
          : `Akses ${user.email} dinonaktifkan (dilarang login).`,
        'success'
      );
    } catch (err: any) {
      showFeedback(err?.message || 'Gagal memperbarui status user.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/auth/admin/whitelist/${deleteTarget.id}`);
      showFeedback(`User ${deleteTarget.email} dihapus dari whitelist.`, 'success');
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      showFeedback(err?.message || 'Gagal menghapus user.', 'error');
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.notes && u.notes.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const totalActive = users.filter(u => u.status === 'ACTIVE').length;
  const totalRevoked = users.filter(u => u.status === 'REVOKED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 4px' }}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          className="terminal-toast toast-enter"
          style={{
            borderColor: feedback.type === 'error' ? 'var(--color-bearish)' : 'var(--color-accent-primary)',
            zIndex: 9999,
          }}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={15} color="var(--color-bearish)" />
          ) : (
            <Sparkles size={15} color="var(--color-accent-primary)" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-lg, 12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '22px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={16} color="var(--color-bearish, #f43f5e)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Hapus Akses Whitelist?
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Apakah Anda yakin ingin menghapus <strong style={{ color: '#fff' }}>{deleteTarget.email}</strong> dari
              whitelist CryptoOS? User ini tidak akan dapat login lagi ke terminal.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                style={{ height: '32px', fontSize: '12px' }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  height: '32px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-bearish, #f43f5e)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0 14px',
                  cursor: 'pointer',
                }}
              >
                Hapus Akses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Overview Cards (KPIs) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#070709',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              WHITELIST REGISTRATIONS
            </span>
            <Users size={14} color="var(--color-accent-primary)" />
          </div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>
            {users.length} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Akun</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Total alamat email yang terotorisasi di server
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#070709',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              ACTIVE PERMITTED USERS
            </span>
            <ShieldCheck size={14} color="var(--color-bullish, #10b981)" />
          </div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-bullish, #10b981)' }}>
            {totalActive} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Aktif</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            {totalRevoked > 0 ? `${totalRevoked} akun dinonaktifkan sementara` : 'Seluruh whitelist berstatus aktif'}
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#070709',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              AUTH SECURITY MODE
            </span>
            <Lock size={14} color="var(--color-accent-amber, #f59e0b)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="amber-badge" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 800 }}>
              STRICT WHITELIST ONLY
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Akun Google yang belum terdaftar otomatis ditolak sistem
          </span>
        </div>
      </div>

      {/* Add New Whitelisted User Form Card */}
      <div
        style={{
          backgroundColor: '#070709',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={16} color="var(--color-accent-primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
            Tambah User Baru ke Whitelist
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Daftarkan alamat email Google rekan / analis trader Anda. Setelah didaftarkan, user dapat langsung login
          menggunakan tombol Google OAuth di halaman login CryptoOS dengan data terisolasi secara mandiri.
        </p>

        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Input Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Alamat Email Google:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0 10px',
                }}
              >
                <Mail size={13} color="var(--color-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="email"
                  required
                  placeholder="contoh: trader.partner@gmail.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Select Role */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Peran / Hak Akses:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0 10px',
                }}
              >
                <Shield size={13} color="var(--color-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'USER' | 'ADMIN')}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="USER" style={{ background: '#121214', color: '#fff' }}>
                    USER (Standard Trader - Portofolio Mandiri)
                  </option>
                  <option value="ADMIN" style={{ background: '#121214', color: '#fff' }}>
                    ADMIN (Co-Admin - Hak Akses Kelola Whitelist)
                  </option>
                </select>
              </div>
            </div>

            {/* Notes / Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Catatan / Keterangan (Opsional):
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '0 10px',
                }}
              >
                <Tag size={13} color="var(--color-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="misal: Trader Partner / Analis Quant"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                height: '34px',
                fontSize: '12px',
                padding: '0 18px',
                fontWeight: 700,
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <UserPlus size={13} />
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan ke Whitelist'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directory of Whitelisted Users */}
      <div
        style={{
          backgroundColor: '#070709',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Table Filter & Search Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
              Daftar Email Terotorisasi ({filteredUsers.length})
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '0 10px',
              width: '240px',
            }}
          >
            <Search size={12} color="var(--color-text-muted)" style={{ marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Cari email atau catatan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '30px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* User List Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px' }}>
                  USER & EMAIL GOOGLE
                </th>
                <th style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px' }}>
                  ROLE
                </th>
                <th style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px' }}>
                  CATATAN / LABEL
                </th>
                <th style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px' }}>
                  STATUS AKSES
                </th>
                <th style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px' }}>
                  TERAKHIR MASUK
                </th>
                <th style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontWeight: 800, fontSize: '10px', textAlign: 'right' }}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Memuat daftar otorisasi whitelist...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Tidak ada user yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isOwner = u.role === 'OWNER' || u.email.toLowerCase() === 'ilhamgb11@gmail.com';
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Email & Initial */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: isOwner ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              border: `1px solid ${isOwner ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              color: isOwner ? 'var(--color-accent-amber, #f59e0b)' : '#fff',
                            }}
                          >
                            {isOwner ? <Crown size={14} /> : u.email.slice(0, 1).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                              {u.email}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              Terdaftar: {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '14px 14px' }}>
                        {isOwner ? (
                          <span className="amber-badge" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 800 }}>
                            OWNER
                          </span>
                        ) : u.role === 'ADMIN' ? (
                          <span className="cyan-badge" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 800 }}>
                            ADMIN
                          </span>
                        ) : (
                          <span className="neutral-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            USER
                          </span>
                        )}
                      </td>

                      {/* Notes / Description */}
                      <td style={{ padding: '14px 14px' }}>
                        <span style={{ color: u.notes ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', fontStyle: u.notes ? 'normal' : 'italic' }}>
                          {u.notes || '-'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AppleToggle
                            checked={isActive}
                            onChange={() => handleToggleStatus(u)}
                            disabled={isOwner}
                          />
                          <span
                            className={isActive ? 'bullish-badge' : 'bearish-badge'}
                            style={{ fontSize: '9px', padding: '1px 6px', fontWeight: 700 }}
                          >
                            {isActive ? 'ACTIVE' : 'REVOKED'}
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td style={{ padding: '14px 14px' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Belum pernah'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isOwner ? (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 8px',
                              height: '28px',
                              color: 'var(--color-bearish, #f43f5e)',
                              backgroundColor: 'rgba(244, 63, 94, 0.08)',
                              borderColor: 'rgba(244, 63, 94, 0.25)',
                              cursor: 'pointer',
                            }}
                            title="Hapus user dari whitelist"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

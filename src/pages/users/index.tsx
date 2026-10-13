import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { fetchAllUsers } from '../../store/action/users.action';
import { User, Role } from '../../store/model';
import { Search, UserPlus, Mail, Phone, Shield, Pencil, X, Loader2, Upload } from 'lucide-react';
import Modal from '@mui/material/Modal';
import SendInvite from '../../components/send-invite';
import * as XLSX from 'xlsx';
import { OptionAvatar } from '../../components/Common/OptionAvatar';
import { updateUser } from '../../store/services/users';
import { fetchRoles } from '../../store/action/roles.action';
import { HttpStatusCode } from '../../constants';
import PhoneField from '../../components/form/PhoneField';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../../components/customized-snackbar';

type FilterType = 'all' | 'active' | 'inactive';

const Users: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useAppSelector((state: RootState) => state.usersSelector);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', officialEmail: '', primaryPhone: '', trlId: '', roleId: 0, isActive: true });
  const [editSaving, setEditSaving] = useState(false);
  const { roles } = useAppSelector((state: RootState) => state?.rolesSelector || []);
  const {
    snackbarState,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackbar();

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      officialEmail: user.officialEmail ?? '',
      primaryPhone: user.primaryPhone ?? '',
      trlId: user.trlId ?? '',
      roleId: user.role?.id ?? 0,
      isActive: user.isActive ?? true,
    });
  };

  const closeEdit = () => {
    setEditUser(null);
  };

  const handleEditSave = async () => {
    if (!editUser?.id) return;
    setEditSaving(true);
    try {
      const res = await updateUser(editUser.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        officialEmail: editForm.officialEmail.trim(),
        primaryPhone: editForm.primaryPhone.trim() || undefined,
        trlId: editForm.trlId.trim() || undefined,
        role: editForm.roleId ? { id: editForm.roleId } : undefined,
        isActive: editForm.isActive,
        updatedBy: editUser.id,
      });
      const body = res.data;
      if (body.success && body.statusCode === HttpStatusCode.OK) {
        showSuccessSnackbar('User updated successfully');
        dispatch(fetchAllUsers());
        closeEdit();
      } else {
        showErrorSnackbar(body.message || 'Update failed');
      }
    } catch {
      showErrorSnackbar('Could not update user. Try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const activeCount = useMemo(() => users.filter((u: User) => u.isActive).length, [users]);
  const inactiveCount = users.length - activeCount;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u: User) => {
      const matchSearch =
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.officialEmail?.toLowerCase().includes(q) ||
        u.role?.roleName?.toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ||
        (filter === 'active' && u.isActive) ||
        (filter === 'inactive' && !u.isActive);
      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

  const handleExport = () => {
    const data = filtered.map((u: User) => ({
      'User ID': u.id,
      Name: `${u.firstName} ${u.lastName}`,
      Email: u.officialEmail,
      Role: u.role?.roleName,
      'TRL ID': u.trlId,
      Phone: u.primaryPhone,
      Status: u.isActive ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'team-members.xlsx');
  };

  const getCardStyle = (id: number): React.CSSProperties => {
    const isSelected = selectedId === id;
    return {
      background: '#fff',
      border: isSelected ? '1.5px solid [var(--brand)]' : '0.5px solid #e0e0e0',
      borderRadius: 14,
      padding: '16px 18px',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.18s ease',
      boxShadow: isSelected
        ? '0 8px 28px [var(--brand)], 0 0 0 1px [var(--brand)]'
        : '0 2px 6px rgba(0,0,0,0.07)',
    };
  };

  return (
    <div className="pt-14" style={{ fontFamily: "'DM Sans', sans-serif", background: '#F7F6F5'}}>

      {/* ── Top bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '0.5px solid #e8e6e1',
        padding: '16px 26px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#09090B', letterSpacing: -0.3 }}>
            Team Overview
          </h1>
          <p style={{ fontSize: 13.5, color: '#9a9690', marginTop: 3 }}>
            Manage organization access and member roles
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={primaryBtn}>
            <Upload className="w-4 h-4 mr-1"/> Export
          </button>
          <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>
            <UserPlus className="w-4 h-4 mr-1" /> Invite member
          </button>
        </div>
      </div>

      <div style={{ padding: '22px 26px' }}>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Segmented filter tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              border: '0.5px solid #e0ded9',
              borderRadius: 10,
              padding: 4,
              gap: 2,
            }}>
              {([
                { key: 'all', label: 'All', count: users.length },
                { key: 'active', label: 'Active', count: activeCount },
                { key: 'inactive', label: 'Inactive', count: inactiveCount },
              ] as { key: FilterType; label: string; count: number }[]).map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)} style={filterTabStyle(filter === key)}>
                  {label}
                  <span style={badgeStyle(filter === key)}>{count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{
                position: 'absolute', left: 11, top: '50%',
                transform: 'translateY(-50%)', color: '#b5b2ac', pointerEvents: 'none',
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, role…"
                style={searchInputStyle}
              />
            </div>
          </div>

          <span style={{
            fontSize: 12.5, color: '#9a9690', background: '#eeede9',
            padding: '4px 11px', borderRadius: 20, fontWeight: 500,
          }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Card grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))',
          gap: 12,
        }}>
          {filtered.map((user: User) => (
            <div
              key={user.id}
              style={getCardStyle(user.id ?? 0)}
              onClick={() => setSelectedId(prev => prev === user.id ? null : user.id ?? null)}
              onMouseEnter={e => {
                if (selectedId !== user.id) {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 8px 24px rgba(20,56,95,0.10)';
                  el.style.transform = 'translateY(-2px)';
                  el.style.borderColor = '#b8cfe8';
                }
              }}
              onMouseLeave={e => {
                if (selectedId !== user.id) {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.07)';
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = '#e0e0e0';
                }
              }}
            >
              {/* Accent stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: 3,
                borderRadius: '14px 14px 0 0',
                background: selectedId === user.id ? '[var(--brand)]' : '#e8e6e1',
                transition: 'background 0.18s',
              }} />

              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 12, marginTop: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <OptionAvatar
  userId={user.id ?? 0}
  imageURL={user.imageURL}
  label={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.officialEmail || 'U'}
  size="md"
/>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#b5b2ac', fontFamily: 'monospace', marginTop: 1 }}>
                      #{user.id}
                    </div>
                  </div>
                </div>
                <span style={user.isActive ? activeChip : inactiveChip}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Role */}
              <span style={roleChipStyle(user.role?.roleName)}>
                <Shield size={12} /> {user.role?.roleName || '—'}
              </span>

              {/* Divider */}
              <div style={{ height: 1, background: '#f0ede8', margin: '12px 0' }} />

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <InfoRow icon={<Mail size={13} />} text={user.officialEmail} />
                <InfoRow icon={<Phone size={13} />} text={user.primaryPhone || '—'} />
              </div>

              {/* TRL ID */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 10,
              }}>
                <span style={{
                  fontSize: 11, color: '#b5b2ac', fontWeight: 500,
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  TRL ID
                </span>
                <span style={{
                  fontFamily: 'monospace', fontSize: 12,
                  background: '#f4f3ef', color: '#5a5855',
                  padding: '3px 8px', borderRadius: 5,
                }}>
                  {user.trlId || '—'}
                </span>
              </div>

              {/* Edit button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600, padding: '5px 12px',
                    borderRadius: 7, border: '1px solid #e0ded9',
                    background: '#fff', color: '#5a5855', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.color = '#5a5855';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0ded9';
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a9690', fontSize: 15 , minHeight: '100vh' }}>
            No members match your search
          </div>
        )}
      </div>

      {/* ── Invite modal ── */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '100%', maxWidth: 480,
          transform: 'translate(-50%,-50%)',
          background: '#fff', padding: 24, borderRadius: 16,
        }}>
          <SendInvite onSuccess={() => { setIsModalOpen(false); dispatch(fetchAllUsers()); }} />
        </div>
      </Modal>

      {/* ── Edit User modal ── */}
      <Modal open={!!editUser} onClose={closeEdit}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '100%', maxWidth: 480,
          transform: 'translate(-50%,-50%)',
          background: '#fff', padding: 0, borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px', borderBottom: '1px solid #f0ede8',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                padding: 10, borderRadius: '50%', border: '1px solid #bfdbfe',
              }}>
                <Pencil size={18} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Edit User</h3>
                <p style={{ fontSize: 12, color: '#9a9690', margin: 0, marginTop: 2 }}>Update user details</p>
              </div>
            </div>
            <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
              <X size={18} color="#9a9690" />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={editLabelStyle}>First Name</label>
                <input
                  value={editForm.firstName}
                  onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                  style={editInputStyle}
                />
              </div>
              <div>
                <label style={editLabelStyle}>Last Name</label>
                <input
                  value={editForm.lastName}
                  onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                  style={editInputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={editLabelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b5b2ac' }} />
                <input
                  value={editForm.officialEmail}
                  onChange={e => setEditForm(f => ({ ...f, officialEmail: e.target.value }))}
                  style={{ ...editInputStyle, paddingLeft: 34 }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={editLabelStyle}>Phone</label>
              <PhoneField
                value={editForm.primaryPhone}
                onChange={(val) => setEditForm(f => ({ ...f, primaryPhone: val }))}
              />
            </div>

            {/* TRL ID */}
            <div>
              <label style={editLabelStyle}>TRL ID</label>
              <input
                value={editForm.trlId}
                onChange={e => setEditForm(f => ({ ...f, trlId: e.target.value }))}
                placeholder="e.g. TRL-0042"
                style={{ ...editInputStyle, fontFamily: 'monospace' }}
              />
            </div>

            {/* Role */}
            <div>
              <label style={editLabelStyle}>Role</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={editForm.roleId}
                  onChange={e => setEditForm(f => ({ ...f, roleId: Number(e.target.value) }))}
                  style={{ ...editInputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 32 }}
                >
                  <option value={0}>Select role…</option>
                  {roles?.map((role: Role) => (
                    <option key={role.id} value={role.id}>{role.roleName}</option>
                  ))}
                </select>
                <Shield size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#b5b2ac', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Active Status toggle */}
            <div>
              <label style={editLabelStyle}>Account Status</label>
              <div
                onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${editForm.isActive ? '#bbf7d0' : '#fecaca'}`,
                  background: editForm.isActive ? '#f0fdf4' : '#fef2f2',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: editForm.isActive ? '#22c55e' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', position: 'absolute', top: 2,
                    left: editForm.isActive ? 18 : 2,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: editForm.isActive ? '#16a34a' : '#dc2626',
                }}>
                  {editForm.isActive ? 'Active — User can log in' : 'Inactive — User is blocked from login'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '16px 24px', borderTop: '1px solid #f0ede8',
          }}>
            <button
              onClick={closeEdit}
              disabled={editSaving}
              style={{
                fontSize: 13.5, fontWeight: 500, padding: '8px 16px',
                borderRadius: 8, border: '1px solid #e0ded9', background: '#fff',
                color: '#5a5855', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={editSaving}
              style={{
                ...primaryBtn,
                opacity: editSaving ? 0.6 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {editSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <CustomizedSnackbars
        open={snackbarState.open}
        severity={snackbarState.severity}
        message={snackbarState.message}
        onClose={handleSnackbarClose}
      />
    </div>
  );
};

// ── Sub-components ──

const InfoRow = ({ icon, text }: { icon: React.ReactNode; text?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5a5855' }}>
    <span style={{ color: '#c0bdb8', flexShrink: 0 }}>{icon}</span>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
  </div>
);

// ── Style helpers ──

const roleChipStyle = (roleName?: string): React.CSSProperties => {
  const r = roleName?.toLowerCase() ?? '';
  const variants: Record<string, { bg: string; color: string }> = {
    super_user: { bg: '#fff0e6', color: '#c05a00' },
    admin:      { bg: '#eef3fb', color: '#1b4da3' },
    user:       { bg: '#f3edf9', color: '#6b33b0' },
  };
  const match = Object.keys(variants).find(k => r.includes(k)) ?? '';
  const { bg, color } = variants[match] ?? { bg: '#f4f3ef', color: '#5a5855' };
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600,
    padding: '3px 10px', borderRadius: 6,
    background: bg, color,
  };
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
  background: 'var(--brand)', border: 'none', color: '#fff',
};

const searchInputStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13.5,
  padding: '8px 13px 8px 34px',
  border: '0.5px solid #e0ded9',
  borderRadius: 10,
  background: '#fff',
  outline: 'none',
  color: '#1a1a1a',
  width: 270,
  height: 38,
};

const filterTabStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13.5,
  fontWeight: 500,
  padding: '6px 13px',
  border: 'none',
  borderRadius: 7,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  background: active ? 'var(--brand)' : 'transparent',
  color: active ? '#fff' : '#7a7875',
  transition: 'background 0.12s, color 0.12s',
});

const badgeStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 11.5,
  fontWeight: 600,
  minWidth: 19,
  height: 19,
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
  background: active ? 'rgba(255,255,255,0.18)' : '#f0ede8',
  color: active ? 'rgba(255,255,255,0.85)' : '#9a9690',
});

const activeChip: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  padding: '3px 9px',
  borderRadius: 20,
  textTransform: 'uppercase',
  background: '#edf8f1',
  color: '#1d6f42',
};

const inactiveChip: React.CSSProperties = {
  ...activeChip,
  background: '#fdf0f0',
  color: '#c0392b',
};

const editLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#9a9690',
  marginBottom: 6,
};

const editInputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 13.5,
  padding: '9px 12px',
  border: '1px solid #e0ded9',
  borderRadius: 8,
  background: '#fff',
  color: '#1a1a1a',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
};

export default Users;
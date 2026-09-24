import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../../components/MobileLayout';
import { adminService } from '../../services/admin.service';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newShopId, setNewShopId] = useState('');
  const [newRole, setNewRole] = useState('SHOP_USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, shopsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getShops(),
      ]);
      setUsers(usersData);
      setShops(shopsData);
      if (shopsData.length > 0 && !newShopId) {
        setNewShopId(shopsData[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        shopId: newRole === 'SHOP_USER' ? newShopId : undefined,
      });

      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setActionMessage('User account created successfully.');
      setTimeout(() => setActionMessage(null), 3000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `Activate account for ${user.name}?`
      : `Deactivate account for ${user.name}? They will be unable to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.toggleUserStatus(user._id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async (user) => {
    const newPass = window.prompt(`Enter new password for ${user.name}:`);
    if (!newPass || !newPass.trim()) return;

    try {
      await adminService.resetUserPassword(user._id, newPass.trim());
      alert(`Password for ${user.name} has been reset successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  return (
    <MobileLayout title="Staff Accounts Management" showBack>
      <div style={styles.topBar}>
        <span style={styles.topInfo}>
          {users.length} Registered {users.length === 1 ? 'User' : 'Users'}
        </span>
        <button
          type="button"
          style={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          ＋ Add Staff User
        </button>
      </div>

      {actionMessage && (
        <div style={styles.successBanner}>
          <span>✓ {actionMessage}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading personnel records...</span>
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <div style={styles.usersList}>
          {users.map((item) => (
            <div key={item._id} style={styles.userCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={styles.userName}>{item.name}</h4>
                  <span style={styles.userEmail}>{item.email}</span>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: item.isActive ? '#ecfdf5' : '#fef2f2',
                    color: item.isActive ? '#16a34a' : '#b91c1c',
                  }}
                >
                  {item.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div style={styles.metaRow}>
                <span style={styles.roleTag}>{item.role}</span>
                <span style={styles.shopTag}>
                  {item.shopId?.name || (item.role === 'ADMIN' ? 'Headquarters' : 'No Shop')}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionsRow}>
                <button
                  type="button"
                  style={styles.actionBtn}
                  onClick={() => handleResetPassword(item)}
                >
                  🔑 Reset Password
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.actionBtn,
                    color: item.isActive ? '#b91c1c' : '#16a34a',
                  }}
                  onClick={() => handleToggleStatus(item)}
                >
                  {item.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create User Modal ───────────────────────── */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Staff Member</h3>
              <button
                type="button"
                style={styles.closeModalBtn}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Staff Full Name</label>
                <input
                  type="text"
                  style={styles.modalInput}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  style={styles.modalInput}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sarah@pixx.co.uk"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <input
                  type="password"
                  style={styles.modalInput}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Role</label>
                <select
                  style={styles.modalSelect}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="SHOP_USER">Shop Staff (Shop User)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>

              {newRole === 'SHOP_USER' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Assign to Shop Location</label>
                  <select
                    style={styles.modalSelect}
                    value={newShopId}
                    onChange={(e) => setNewShopId(e.target.value)}
                  >
                    {shops.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.confirmBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    padding: '0 2px',
  },
  topInfo: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
  },
  createBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#065f46',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '14px',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b',
    border: '1px solid #e2e8f0',
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTopColor: '#1a56db',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '14px',
    color: '#b91c1c',
    fontSize: '13px',
    fontWeight: '600',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  userName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: '12px',
    color: '#64748b',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    padding: '2px 8px',
  },
  metaRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  roleTag: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    padding: '2px 8px',
  },
  shopTag: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    padding: '2px 8px',
  },
  actionsRow: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px',
  },
  actionBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '24px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '800',
    color: '#0f172a',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  modalInput: {
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalSelect: {
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#fff',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
  },
  cancelBtn: {
    flex: 1,
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

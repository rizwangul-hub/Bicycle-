import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';
import AdminLayout from '../components/AdminLayout';

function formatDate(iso) {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Never';
  }
}

export default function Users() {
  const { token, user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedShop, setSelectedShop] = useState('');

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SHOP_USER',
    shopId: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Password Reset Modal State
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Status toggle state
  const [togglingId, setTogglingId] = useState(null);

  // Load users and shops
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [userList, shopList] = await Promise.all([
        declarationService.getUsers(token),
        declarationService.getShops(token),
      ]);
      setUsers(userList || []);
      setShops(shopList || []);
    } catch (err) {
      setError(err.message || 'Failed to load users data.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showBanner = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Toggle user activation status
  const handleToggleStatus = async (user) => {
    if (user._id === currentAdmin?._id) {
      alert('You cannot deactivate your own administrator account.');
      return;
    }

    setTogglingId(user._id);
    try {
      const updatedStatus = !user.isActive;
      await declarationService.toggleUserStatus(token, user._id, updatedStatus);
      showBanner(`User ${user.name} has been ${updatedStatus ? 'activated' : 'deactivated'}.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Create User Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !createFormData.email.trim() || !createFormData.password) {
      setCreateError('Name, email, and password are required.');
      return;
    }

    if (createFormData.role === 'SHOP_USER' && !createFormData.shopId) {
      setCreateError('Please select a shop location for SHOP_USER.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await declarationService.createUser(token, createFormData);
      showBanner(`New user ${createFormData.name} created successfully.`);
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'SHOP_USER',
        shopId: '',
      });
      await loadData();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  // Reset Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setIsResetting(true);
    setPasswordError(null);
    try {
      await declarationService.resetUserPassword(token, passwordModalUser._id, newPassword);
      showBanner(`Password updated successfully for ${passwordModalUser.name}.`);
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);

    const matchRole = !selectedRole || u.role === selectedRole;

    const uShopId = typeof u.shopId === 'object' && u.shopId !== null ? u.shopId._id : u.shopId;
    const matchShop = !selectedShop || uShopId === selectedShop;

    return matchSearch && matchRole && matchShop;
  });

  return (
    <AdminLayout>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>User & Personnel Management</h2>
          <p style={styles.pageSubtitle}>
            Manage administrator accounts and authorized shop personnel across all 6 locations.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          style={styles.createUserBtn}
        >
          ➕ Add Shop User
        </button>
      </div>

      {successMessage && <div style={styles.successBanner}>✓ {successMessage}</div>}

      {/* ── Filter & Search Controls ──────────────────────── */}
      <div style={styles.controlsCard}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SHOP_USER">SHOP_USER</option>
          </select>

          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="">All Shop Locations</option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {(search || selectedRole || selectedShop) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedRole('');
                setSelectedShop('');
              }}
              style={styles.resetBtn}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Users Table ───────────────────────────────────── */}
      <div style={styles.tableCard}>
        {error ? (
          <div style={styles.errorBox}>
            <p>⚠️ {error}</p>
            <button onClick={loadData} style={styles.retryBtn}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p>Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3>No Users Found</h3>
            <p>No user accounts matched your search or filters.</p>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Name</th>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Assigned Shop</th>
                  <th style={styles.th}>Account Status</th>
                  <th style={styles.th}>Last Login</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const shopName =
                    typeof u.shopId === 'object' && u.shopId !== null
                      ? u.shopId.name
                      : u.role === 'ADMIN'
                      ? 'Global (All Shops)'
                      : 'Not assigned';

                  const isSelf = u._id === currentAdmin?._id;
                  const isToggling = togglingId === u._id;

                  return (
                    <tr key={u._id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{u.name}</strong>
                        {isSelf && <span style={styles.selfBadge}>You</span>}
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span
                          style={
                            u.role === 'ADMIN' ? styles.adminBadge : styles.shopUserBadge
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.shopLocation}>{shopName}</span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            u.isActive ? styles.activeStatus : styles.inactiveStatus
                          }
                        >
                          {u.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(u.lastLoginAt)}</td>
                      <td style={styles.td}>
                        <div style={styles.actionsGroup}>
                          {/* Toggle Active / Deactive button */}
                          <button
                            disabled={isSelf || isToggling}
                            onClick={() => handleToggleStatus(u)}
                            style={{
                              ...styles.actionToggleBtn,
                              backgroundColor: u.isActive ? '#fee2e2' : '#dcfce7',
                              color: u.isActive ? '#dc2626' : '#166534',
                              opacity: isSelf ? 0.4 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                            title={isSelf ? 'Cannot deactivate self' : u.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {isToggling ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Reset Password button */}
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword('');
                              setPasswordError(null);
                            }}
                            style={styles.actionResetBtn}
                            title="Reset password"
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create User Modal ─────────────────────────────── */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Shop User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {createError && <div style={styles.modalError}>⚠️ {createError}</div>}

            <form onSubmit={handleCreateSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Camden Staff User"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. staff.camden@pixx.co.uk"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, email: e.target.value })
                  }
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password *</label>
                <input
                  type="password"
                  placeholder="Enter initial password (min 6 chars)"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>User Role</label>
                <select
                  value={createFormData.role}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, role: e.target.value })
                  }
                  style={styles.formSelect}
                >
                  <option value="SHOP_USER">SHOP_USER (Shop Personnel)</option>
                  <option value="ADMIN">ADMIN (Central Administrator)</option>
                </select>
              </div>

              {createFormData.role === 'SHOP_USER' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Assigned Bicycle Shop *</label>
                  <select
                    value={createFormData.shopId}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, shopId: e.target.value })
                    }
                    required
                    style={styles.formSelect}
                  >
                    <option value="">Select a shop...</option>
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
                  onClick={() => setShowCreateModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={styles.modalSaveBtn}
                >
                  {isCreating ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Password Reset Modal ──────────────────────────── */}
      {passwordModalUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBoxSmall}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Reset User Password</h3>
              <button
                onClick={() => setPasswordModalUser(null)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <p style={styles.resetContext}>
              Resetting password for <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email}).
            </p>

            {passwordError && <div style={styles.modalError}>⚠️ {passwordError}</div>}

            <form onSubmit={handlePasswordSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>New Password *</label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  style={styles.modalSaveBtn}
                >
                  {isResetting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  createUserBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.2)',
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '600',
    fontSize: '14px',
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0 14px',
    height: '44px',
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '10px',
    color: '#94a3b8',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    width: '100%',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '14px',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  selectFilter: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  resetBtn: {
    height: '38px',
    padding: '0 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  tableResponsive: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: '600',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    color: '#1e293b',
    whiteSpace: 'nowrap',
  },
  selfBadge: {
    marginLeft: '6px',
    fontSize: '11px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '700',
  },
  adminBadge: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  shopUserBadge: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  shopLocation: {
    color: '#475569',
    fontWeight: '500',
  },
  activeStatus: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#166534',
  },
  inactiveStatus: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#991b1b',
  },
  actionsGroup: {
    display: 'flex',
    gap: '8px',
  },
  actionToggleBtn: {
    border: '1px solid transparent',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  actionResetBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '520px',
    width: '100%',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalBoxSmall: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '440px',
    width: '100%',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
  },
  resetContext: {
    fontSize: '13px',
    color: '#475569',
    marginBottom: '16px',
  },
  modalError: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  formInput: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  formSelect: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '14px',
    borderTop: '1px solid #e2e8f0',
  },
  modalCancelBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  modalSaveBtn: {
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
  },
  loadingBox: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#dc2626',
  },
  retryBtn: {
    marginTop: '12px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyBox: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
  },
};

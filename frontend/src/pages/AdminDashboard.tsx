import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig, DashboardUser } from '../components/shared';
import {
  DashboardOverview,
  DashboardUsers,
  DashboardLowStock,
  DashboardAnalytics,
  DashboardProfile,
  DashboardChangePassword
} from '../components/admin';
import ProfileModal from '../components/ProfileModal';
import { usersApi, productsApi, Customer as ApiCustomer, Employee as ApiEmployee, Product as ApiProduct } from '../services/api';
import {
  Plus, CheckCircle, Clock, AlertTriangle, Trash2,
  LayoutDashboard, Users, BarChart2, User, Shield, Pencil, Lock
} from 'lucide-react';
import './AdminDashboard.css';

// Navigation item IDs for Admin Dashboard
type AdminNavId = 'overview' | 'users' | 'low-stock' | 'analytics' | 'profile' | 'change-password';

interface LowStockProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  yearFrom?: number;
  yearTo?: number;
  price: number;
  quantityAvailable: number;
  category: string;
  imageUrl?: string;
  description?: string;
}

interface SalesData {
  month: string;
  sales: number;
  orders: number;
  topSellingParts: { name: string; units: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  dailyTrend: number[];
}

interface BrandSales {
  brand: string;
  sales: number;
  units: number;
}

interface UserProfile {
  email: string;
  name: string;
  fullName?: string;
  role: string;
  password?: string;
}

interface UserDisplay {
  id: string;
  fullName: string;
  email: string;
  role: 'manager' | 'auditor' | 'customer' | 'admin';
  userType: 'customer' | 'employee';
  dateCreated: string;
  status: 'active' | 'inactive';
}

interface NewUserForm {
  fullName: string;
  email: string;
  role: 'manager' | 'auditor';
  password: string;
  confirmPassword: string;
}

interface EditUserForm {
  id: string;
  fullName: string;
  email: string;
  role: 'manager' | 'auditor';
  password: string;
  confirmPassword: string;
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeNav, setActiveNav] = useState<AdminNavId>('overview');
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDisplay | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserDisplay | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [dateRange, setDateRange] = useState<'3months' | '6months' | 'year'>('3months');
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    fullName: '',
    email: '',
    role: 'manager',
    password: '',
    confirmPassword: ''
  });
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    id: '',
    fullName: '',
    email: '',
    role: 'manager',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Navigation items for Admin Dashboard
  const navItems: NavItem<AdminNavId>[] = useMemo(() => [
    { id: 'overview', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Manage Users', icon: <Users size={20} /> },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: <AlertTriangle size={20} /> },
    { id: 'analytics', label: 'Financial Analytics', icon: <BarChart2 size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'change-password', label: 'Change Password', icon: <Lock size={20} /> },
  ], []);

  // Role configuration for Admin
  const roleConfig: RoleConfig = useMemo(() => ({
    role: 'admin',
    ...roleConfigs.admin,
    portalIcon: <Shield size={14} />,
  }), []);

  // Dashboard user for layout
  const dashboardUser: DashboardUser | undefined = useMemo(() => {
    if (authUser) {
      return {
        email: authUser.email,
        full_name: authUser.full_name,
        role: authUser.role,
      };
    }
    if (user) {
      return {
        email: user.email,
        full_name: user.fullName || user.name,
        role: user.role,
      };
    }
    return undefined;
  }, [authUser, user]);

  // Sales data (placeholder - TODO: Replace with API call)
  const [allSalesData] = useState<SalesData[]>([
    {
      month: 'November 2024',
      sales: 1050000,
      orders: 128,
      topSellingParts: [
        { name: 'Brake Pads Set', units: 38 },
        { name: 'Engine Oil Filter', units: 35 },
        { name: 'Air Filter', units: 30 }
      ],
      revenueByCategory: [
        { category: 'Brake System', revenue: 380000 },
        { category: 'Engine Parts', revenue: 350000 },
        { category: 'Lighting', revenue: 220000 },
        { category: 'Other', revenue: 100000 }
      ],
      dailyTrend: [32000, 38000, 35000, 40000, 37000, 35000, 39000]
    },
    {
      month: 'December 2024',
      sales: 1380000,
      orders: 172,
      topSellingParts: [
        { name: 'LED Headlight Bulbs', units: 48 },
        { name: 'Brake Pads Set', units: 42 },
        { name: 'Spark Plugs Set', units: 38 }
      ],
      revenueByCategory: [
        { category: 'Lighting', revenue: 480000 },
        { category: 'Brake System', revenue: 420000 },
        { category: 'Engine Parts', revenue: 350000 },
        { category: 'Other', revenue: 130000 }
      ],
      dailyTrend: [42000, 48000, 45000, 52000, 48000, 46000, 50000]
    },
    {
      month: 'January 2025',
      sales: 1120000,
      orders: 142,
      topSellingParts: [
        { name: 'Engine Oil Filter', units: 40 },
        { name: 'Air Filter', units: 36 },
        { name: 'Brake Pads Set', units: 33 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 450000 },
        { category: 'Brake System', revenue: 380000 },
        { category: 'Lighting', revenue: 210000 },
        { category: 'Other', revenue: 80000 }
      ],
      dailyTrend: [35000, 40000, 38000, 43000, 39000, 37000, 41000]
    }
  ]);

  // Brand sales data
  const [brandSales] = useState<BrandSales[]>([
    { brand: 'Toyota', sales: 1450000, units: 234 },
    { brand: 'Honda', sales: 980000, units: 187 },
    { brand: 'BMW', sales: 750000, units: 98 },
    { brand: 'Ford', sales: 620000, units: 145 },
    { brand: 'Nissan', sales: 480000, units: 112 }
  ]);

  // Users data
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Products data
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError(null);

      const [customersResponse, employeesResponse] = await Promise.all([
        usersApi.getCustomers({ page_size: 100 }),
        usersApi.getEmployees({ page_size: 100 })
      ]);

      const customers: UserDisplay[] = customersResponse.items.map((c: ApiCustomer) => ({
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        role: 'customer' as const,
        userType: 'customer' as const,
        dateCreated: c.created_at,
        status: c.is_active ? 'active' as const : 'inactive' as const
      }));

      const employees: UserDisplay[] = employeesResponse.items.map((e: ApiEmployee) => ({
        id: e.id,
        fullName: e.full_name,
        email: e.email,
        role: e.role.toLowerCase() as 'manager' | 'auditor' | 'admin',
        userType: 'employee' as const,
        dateCreated: e.created_at,
        status: e.is_active ? 'active' as const : 'inactive' as const
      }));

      setUsers([...customers, ...employees]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError('Failed to load users.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch low stock products
  const fetchLowStockProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      const allProducts: ApiProduct[] = [];
      let currentPage = 1;
      let totalPages = 1;

      const firstResponse = await productsApi.getProducts({ page: 1, page_size: 100 });
      allProducts.push(...firstResponse.items);
      totalPages = firstResponse.total_pages;
      setTotalProducts(firstResponse.total);

      while (currentPage < totalPages) {
        currentPage++;
        const response = await productsApi.getProducts({ page: currentPage, page_size: 100 });
        allProducts.push(...response.items);
      }

      const lowStock: LowStockProduct[] = allProducts
        .filter((p: ApiProduct) => p.quantity_available < 3 && p.is_active)
        .map((p: ApiProduct) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          model: p.model,
          yearFrom: p.year_from,
          yearTo: p.year_to,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
          quantityAvailable: p.quantity_available,
          category: p.category,
          imageUrl: p.image_url,
          description: p.description
        }));

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError('Failed to load products.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchAllUsers();
    fetchLowStockProducts();
  }, [fetchAllUsers, fetchLowStockProducts]);

  // Filter sales data based on date range
  const salesData = useMemo(() => {
    const rangeMap = { '3months': 3, '6months': 6, 'year': 12 };
    const count = rangeMap[dateRange];
    return allSalesData.slice(-count);
  }, [dateRange, allSalesData]);

  // Calculate revenue
  const monthlyRevenue = salesData[salesData.length - 1]?.sales || 0;
  const yearlyRevenue = salesData.length > 0
    ? (() => {
        const totalSales = salesData.reduce((total: number, month) => total + month.sales, 0);
        if (salesData.length === 0 || !isFinite(totalSales)) return 0;
        const projectedYearly = totalSales * (12 / salesData.length);
        return isFinite(projectedYearly) ? projectedYearly : 0;
      })()
    : 0;

  // User statistics
  const userStats = useMemo(() => {
    const managers = users.filter(u => u.role === 'manager').length;
    const auditors = users.filter(u => u.role === 'auditor').length;
    const customers = users.filter(u => u.role === 'customer').length;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total: users.length, managers, auditors, customers, admins };
  }, [users]);

  // Total orders from sales data
  const totalOrders = useMemo(() => {
    return salesData.reduce((sum, data) => sum + data.orders, 0);
  }, [salesData]);

  // Toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // User management handlers
  const handleDeleteUser = (userToDeleteItem: UserDisplay) => {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentLoggedInUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    if (currentLoggedInUser && currentLoggedInUser.id === userToDeleteItem.id) {
      showToast('Cannot delete your own account', 'error');
      return;
    }

    setUserToDelete(userToDeleteItem);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeletingUser(true);

      if (userToDelete.userType === 'customer') {
        await usersApi.deleteCustomer(userToDelete.id);
      } else {
        await usersApi.deleteEmployee(userToDelete.id);
      }

      showToast(`User "${userToDelete.fullName}" has been deleted successfully`, 'success');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await fetchAllUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to delete user';
      showToast(errorMessage, 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const toggleUserStatus = async (targetUser: UserDisplay) => {
    try {
      const newStatus = targetUser.status === 'active' ? false : true;

      if (targetUser.userType === 'customer') {
        await usersApi.updateUserStatus(targetUser.id, newStatus);
      } else {
        await usersApi.updateEmployeeStatus(targetUser.id, newStatus);
      }

      setUsers(users.map(u =>
        u.id === targetUser.id ? { ...u, status: newStatus ? 'active' : 'inactive' } : u
      ));
      showToast('User status updated successfully', 'success');
    } catch (error: unknown) {
      console.error('Error updating user status:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to update user status';
      showToast(errorMessage, 'error');
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUserForm.fullName.trim()) {
      showToast('Please enter full name', 'error');
      return;
    }
    if (!newUserForm.email.trim() || !newUserForm.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!newUserForm.password || newUserForm.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!/[a-z]/.test(newUserForm.password)) {
      showToast('Password must contain at least one lowercase letter', 'error');
      return;
    }
    if (!/[A-Z]/.test(newUserForm.password)) {
      showToast('Password must contain at least one uppercase letter', 'error');
      return;
    }
    if (!/\d/.test(newUserForm.password)) {
      showToast('Password must contain at least one number', 'error');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newUserForm.password)) {
      showToast('Password must contain at least one special character', 'error');
      return;
    }
    if (newUserForm.password !== newUserForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      setIsAddingStaff(true);

      const response = await usersApi.createStaff({
        email: newUserForm.email.trim().toLowerCase(),
        full_name: newUserForm.fullName.trim(),
        password: newUserForm.password,
        role: newUserForm.role.toUpperCase() as 'MANAGER' | 'AUDITOR'
      });

      showToast(`${newUserForm.role === 'manager' ? 'Manager' : 'Auditor'} "${response.full_name}" has been created successfully`, 'success');

      setNewUserForm({
        fullName: '',
        email: '',
        role: 'manager',
        password: '',
        confirmPassword: ''
      });
      setShowAddUserModal(false);
      await fetchAllUsers();
    } catch (error: unknown) {
      console.error('Error creating staff:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to create staff member';
      showToast(errorMessage, 'error');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleEditUser = (userToEditItem: UserDisplay) => {
    // Only allow editing staff members (manager/auditor), not customers or admins
    if (userToEditItem.userType !== 'employee' || userToEditItem.role === 'admin') {
      showToast('Can only edit staff members (Manager/Auditor)', 'error');
      return;
    }

    setUserToEdit(userToEditItem);
    setEditUserForm({
      id: userToEditItem.id,
      fullName: userToEditItem.fullName,
      email: userToEditItem.email,
      role: userToEditItem.role as 'manager' | 'auditor',
      password: '',
      confirmPassword: ''
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    // Validation
    if (!editUserForm.fullName.trim()) {
      showToast('Please enter full name', 'error');
      return;
    }
    if (!editUserForm.email.trim() || !editUserForm.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Password validation only if password is being changed
    if (editUserForm.password) {
      if (editUserForm.password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }
      if (!/[a-z]/.test(editUserForm.password)) {
        showToast('Password must contain at least one lowercase letter', 'error');
        return;
      }
      if (!/[A-Z]/.test(editUserForm.password)) {
        showToast('Password must contain at least one uppercase letter', 'error');
        return;
      }
      if (!/\d/.test(editUserForm.password)) {
        showToast('Password must contain at least one number', 'error');
        return;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(editUserForm.password)) {
        showToast('Password must contain at least one special character', 'error');
        return;
      }
      if (editUserForm.password !== editUserForm.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
    }

    try {
      setIsEditingStaff(true);

      // Build update payload - only include changed fields
      const updatePayload: {
        full_name?: string;
        email?: string;
        password?: string;
        role?: 'MANAGER' | 'AUDITOR';
      } = {};

      if (editUserForm.fullName.trim() !== userToEdit?.fullName) {
        updatePayload.full_name = editUserForm.fullName.trim();
      }
      if (editUserForm.email.trim().toLowerCase() !== userToEdit?.email.toLowerCase()) {
        updatePayload.email = editUserForm.email.trim().toLowerCase();
      }
      if (editUserForm.role !== userToEdit?.role) {
        updatePayload.role = editUserForm.role.toUpperCase() as 'MANAGER' | 'AUDITOR';
      }
      if (editUserForm.password) {
        updatePayload.password = editUserForm.password;
      }

      const response = await usersApi.updateEmployee(editUserForm.id, updatePayload);

      showToast(response.message || `Staff member "${response.full_name}" updated successfully`, 'success');

      setEditUserForm({
        id: '',
        fullName: '',
        email: '',
        role: 'manager',
        password: '',
        confirmPassword: ''
      });
      setShowEditUserModal(false);
      setUserToEdit(null);
      await fetchAllUsers();
    } catch (error: unknown) {
      console.error('Error updating staff:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to update staff member';
      showToast(errorMessage, 'error');
    } finally {
      setIsEditingStaff(false);
    }
  };

  // Inventory handlers
  const notifyManager = (productName: string) => {
    showToast(`Notification sent to inventory manager about "${productName}"`, 'info');
  };

  const refreshStockData = async () => {
    await fetchLowStockProducts();
    showToast('Stock data refreshed successfully', 'success');
  };

  const restockAllItems = () => {
    showToast(`Restock order initiated for ${lowStockProducts.length} items`, 'info');
  };

  const handleOrderMore = (productId: string) => {
    alert(`Order request sent for Product ID: ${productId}\nThis would normally integrate with supplier systems.`);
  };

  // Authentication check
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);

        if (!userData || typeof userData !== 'object' || !userData.role || !userData.email) {
          throw new Error('Invalid user data structure');
        }

        if (userData.role !== 'admin') {
          console.warn('Unauthorized access attempt to admin dashboard');
          navigate('/');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('currentUser');
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Navigation handler
  const handleNavigation = (navId: AdminNavId) => {
    setActiveNav(navId);
  };

  // Render content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'overview':
        return (
          <DashboardOverview
            userStats={userStats}
            monthlyRevenue={monthlyRevenue}
            lowStockCount={lowStockProducts.length}
            totalOrders={totalOrders}
            totalProducts={totalProducts}
            onNavigateToUsers={() => setActiveNav('users')}
            onNavigateToLowStock={() => setActiveNav('low-stock')}
            onNavigateToAnalytics={() => setActiveNav('analytics')}
          />
        );

      case 'users':
        return (
          <DashboardUsers
            users={users}
            isLoading={isLoadingUsers}
            error={usersError}
            onToggleStatus={toggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onEditUser={handleEditUser}
            onAddUser={() => setShowAddUserModal(true)}
            onRetry={fetchAllUsers}
          />
        );

      case 'low-stock':
        return (
          <DashboardLowStock
            products={lowStockProducts}
            totalProducts={totalProducts}
            isLoading={isLoadingProducts}
            error={productsError}
            onRefresh={refreshStockData}
            onRestockAll={restockAllItems}
            onOrderMore={handleOrderMore}
            onNotifyManager={notifyManager}
            onRetry={fetchLowStockProducts}
          />
        );

      case 'analytics':
        return (
          <DashboardAnalytics
            salesData={salesData}
            brandSales={brandSales}
            monthlyRevenue={monthlyRevenue}
            yearlyRevenue={yearlyRevenue}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        );

      case 'profile':
        return (
          <DashboardProfile
            user={user || { email: '', name: '', role: 'admin' }}
            onEditProfile={() => setShowProfile(true)}
            onChangePassword={() => setActiveNav('change-password')}
          />
        );

      case 'change-password':
        return (
          <DashboardChangePassword
            onNavigate={handleNavigation}
          />
        );

      default:
        return null;
    }
  };

  if (!user) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <DashboardLayout<AdminNavId>
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={handleNavigation}
      roleConfig={roleConfig}
      user={dashboardUser}
    >
      {renderContent()}

      {/* Edit Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          roleLabel="Administrator"
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content admin-add-user-modal">
            <div className="admin-modal-header">
              <h2><Plus size={20} /> Add New User</h2>
              <button onClick={() => setShowAddUserModal(false)} className="admin-close-modal">×</button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-modal-description">Create a new Manager or Auditor account</p>

              <div className="admin-form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address (e.g., user@example.com)"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="admin-form-input"
                />
                <p className="admin-field-hint">Must include @ and a valid domain (e.g., .com, .org)</p>
              </div>

              <div className="admin-form-group">
                <label htmlFor="role">User Role *</label>
                <select
                  id="role"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'manager' | 'auditor' })}
                  className="admin-form-select"
                >
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
                <p className="admin-field-hint">Customers cannot be added through admin panel</p>
              </div>

              <div className="admin-form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter strong password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="admin-form-input"
                />
                <p className="admin-field-hint">Min 8 characters: uppercase, lowercase, number, special character (!@#$%^&*)</p>
              </div>

              <div className="admin-form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={newUserForm.confirmPassword}
                  onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })}
                  className="admin-form-input"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowAddUserModal(false)} className="admin-cancel-btn" disabled={isAddingStaff}>
                Cancel
              </button>
              <button onClick={handleAddUser} className="admin-confirm-btn" disabled={isAddingStaff}>
                {isAddingStaff ? (
                  <><Clock size={16} /> Creating...</>
                ) : (
                  <><CheckCircle size={16} /> Create User</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && userToEdit && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content admin-edit-user-modal">
            <div className="admin-modal-header">
              <h2><Pencil size={20} /> Edit Staff Member</h2>
              <button onClick={() => {
                setShowEditUserModal(false);
                setUserToEdit(null);
                setEditUserForm({
                  id: '',
                  fullName: '',
                  email: '',
                  role: 'manager',
                  password: '',
                  confirmPassword: ''
                });
              }} className="admin-close-modal">×</button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-modal-description">Update profile details for {userToEdit.fullName}</p>

              <div className="admin-form-group">
                <label htmlFor="editFullName">Full Name *</label>
                <input
                  id="editFullName"
                  type="text"
                  placeholder="Enter full name"
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="editEmail">Email Address *</label>
                <input
                  id="editEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="admin-form-input"
                />
                <p className="admin-field-hint">Must include @ and a valid domain (e.g., .com, .org)</p>
              </div>

              <div className="admin-form-group">
                <label htmlFor="editRole">User Role *</label>
                <select
                  id="editRole"
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as 'manager' | 'auditor' })}
                  className="admin-form-select"
                >
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              <div className="admin-form-divider">
                <span>Password Change (Optional)</span>
              </div>

              <div className="admin-form-group">
                <label htmlFor="editPassword">New Password</label>
                <input
                  id="editPassword"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  className="admin-form-input"
                />
                <p className="admin-field-hint">Min 8 characters: uppercase, lowercase, number, special character (!@#$%^&*)</p>
              </div>

              <div className="admin-form-group">
                <label htmlFor="editConfirmPassword">Confirm New Password</label>
                <input
                  id="editConfirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={editUserForm.confirmPassword}
                  onChange={(e) => setEditUserForm({ ...editUserForm, confirmPassword: e.target.value })}
                  className="admin-form-input"
                  disabled={!editUserForm.password}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => {
                setShowEditUserModal(false);
                setUserToEdit(null);
                setEditUserForm({
                  id: '',
                  fullName: '',
                  email: '',
                  role: 'manager',
                  password: '',
                  confirmPassword: ''
                });
              }} className="admin-cancel-btn" disabled={isEditingStaff}>
                Cancel
              </button>
              <button onClick={handleUpdateUser} className="admin-confirm-btn admin-edit-confirm-btn" disabled={isEditingStaff}>
                {isEditingStaff ? (
                  <><Clock size={16} /> Updating...</>
                ) : (
                  <><CheckCircle size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content admin-delete-modal">
            <div className="admin-modal-header">
              <div className="admin-delete-icon"><AlertTriangle size={24} /></div>
              <h2>Confirm Deletion</h2>
              <button onClick={() => setShowDeleteModal(false)} className="admin-close-modal">×</button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-delete-warning">Are you sure you want to delete <strong>{userToDelete.fullName}</strong>?</p>
              <p className="admin-delete-subtext">This action cannot be undone. All user data will be permanently removed.</p>
              <div className="admin-user-delete-info">
                <div className="admin-info-row">
                  <span>Email:</span>
                  <strong>{userToDelete.email}</strong>
                </div>
                <div className="admin-info-row">
                  <span>Role:</span>
                  <strong>{userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}</strong>
                </div>
                <div className="admin-info-row">
                  <span>Type:</span>
                  <strong>{userToDelete.userType === 'employee' ? 'Staff' : 'Customer'}</strong>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-cancel-btn" disabled={isDeletingUser}>
                Cancel
              </button>
              <button onClick={confirmDeleteUser} className="admin-delete-confirm-btn" disabled={isDeletingUser}>
                {isDeletingUser ? (
                  <><Clock size={16} /> Deleting...</>
                ) : (
                  <><Trash2 size={16} /> Delete User</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          <span className="admin-toast-icon">
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <AlertTriangle size={16} />}
            {toast.type === 'info' && <AlertTriangle size={16} />}
          </span>
          <span className="admin-toast-message">{toast.message}</span>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import { usersApi, User as ApiUser } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import './AdminDashboard.css';

interface Product {
  id: string;
  name: string;
  model: string;
  modelYear: string;
  price: number;
  quantityAvailable: number;
  category: string;
  image: string;
  description: string;
  lastChecked?: string;
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

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'manager' | 'auditor' | 'customer';
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

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'users'>('analytics');
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'3months' | '6months' | 'year'>('3months');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'auditor' | 'customer'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role'>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    fullName: '',
    email: '',
    role: 'manager',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  // Debug effect to track showProfile changes
  useEffect(() => {
    console.log('Admin Dashboard - showProfile changed to:', showProfile);
  }, [showProfile]);

  // TODO: Replace with API call when analytics endpoint is available
  // This is placeholder data for the analytics dashboard
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
    },
    {
      month: 'February 2025',
      sales: 1280000,
      orders: 158,
      topSellingParts: [
        { name: 'Timing Belt', units: 45 },
        { name: 'Brake Pads Set', units: 40 },
        { name: 'Spark Plugs Set', units: 35 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 520000 },
        { category: 'Brake System', revenue: 410000 },
        { category: 'Lighting', revenue: 250000 },
        { category: 'Other', revenue: 100000 }
      ],
      dailyTrend: [40000, 45000, 43000, 48000, 44000, 42000, 46000]
    },
    {
      month: 'March 2025',
      sales: 1350000,
      orders: 168,
      topSellingParts: [
        { name: 'Air Filter', units: 50 },
        { name: 'Engine Oil Filter', units: 43 },
        { name: 'Brake Pads Set', units: 38 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 550000 },
        { category: 'Brake System', revenue: 420000 },
        { category: 'Lighting', revenue: 270000 },
        { category: 'Other', revenue: 110000 }
      ],
      dailyTrend: [41000, 47000, 44000, 50000, 46000, 44000, 48000]
    },
    {
      month: 'April 2025',
      sales: 1180000,
      orders: 150,
      topSellingParts: [
        { name: 'Brake Pads Set', units: 44 },
        { name: 'LED Headlight Bulbs', units: 38 },
        { name: 'Spark Plugs Set', units: 33 }
      ],
      revenueByCategory: [
        { category: 'Brake System', revenue: 460000 },
        { category: 'Lighting', revenue: 370000 },
        { category: 'Engine Parts', revenue: 270000 },
        { category: 'Other', revenue: 80000 }
      ],
      dailyTrend: [36000, 42000, 39000, 45000, 41000, 39000, 43000]
    },
    {
      month: 'May 2025',
      sales: 1180000,
      orders: 142,
      topSellingParts: [
        { name: 'Brake Pads Set', units: 45 },
        { name: 'Engine Oil Filter', units: 38 },
        { name: 'LED Headlight Bulbs', units: 32 }
      ],
      revenueByCategory: [
        { category: 'Brake System', revenue: 420000 },
        { category: 'Engine Parts', revenue: 380000 },
        { category: 'Lighting', revenue: 280000 },
        { category: 'Other', revenue: 100000 }
      ],
      dailyTrend: [35000, 42000, 38000, 45000, 40000, 38000, 42000]
    },
    {
      month: 'June 2025',
      sales: 1320000,
      orders: 165,
      topSellingParts: [
        { name: 'Air Filter', units: 52 },
        { name: 'Spark Plugs Set', units: 41 },
        { name: 'Brake Pads Set', units: 39 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 520000 },
        { category: 'Brake System', revenue: 390000 },
        { category: 'Lighting', revenue: 280000 },
        { category: 'Other', revenue: 130000 }
      ],
      dailyTrend: [40000, 45000, 42000, 48000, 44000, 43000, 47000]
    },
    {
      month: 'July 2025',
      sales: 1420000,
      orders: 178,
      topSellingParts: [
        { name: 'Timing Belt', units: 48 },
        { name: 'Engine Oil Filter', units: 45 },
        { name: 'Air Filter', units: 42 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 580000 },
        { category: 'Brake System', revenue: 420000 },
        { category: 'Lighting', revenue: 290000 },
        { category: 'Other', revenue: 130000 }
      ],
      dailyTrend: [42000, 48000, 45000, 51000, 47000, 46000, 50000]
    },
    {
      month: 'August 2025',
      sales: 1250000,
      orders: 156,
      topSellingParts: [
        { name: 'Brake Pads Set', units: 43 },
        { name: 'LED Headlight Bulbs', units: 38 },
        { name: 'Spark Plugs Set', units: 35 }
      ],
      revenueByCategory: [
        { category: 'Brake System', revenue: 480000 },
        { category: 'Lighting', revenue: 390000 },
        { category: 'Engine Parts', revenue: 280000 },
        { category: 'Other', revenue: 100000 }
      ],
      dailyTrend: [38000, 43000, 40000, 46000, 42000, 40000, 44000]
    },
    {
      month: 'September 2025',
      sales: 1450000,
      orders: 189,
      topSellingParts: [
        { name: 'Air Filter', units: 55 },
        { name: 'Brake Pads Set', units: 48 },
        { name: 'Timing Belt', units: 42 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 620000 },
        { category: 'Brake System', revenue: 450000 },
        { category: 'Lighting', revenue: 280000 },
        { category: 'Other', revenue: 100000 }
      ],
      dailyTrend: [45000, 50000, 48000, 54000, 50000, 48000, 52000]
    },
    {
      month: 'October 2025',
      sales: 980000,
      orders: 98,
      topSellingParts: [
        { name: 'Engine Oil Filter', units: 32 },
        { name: 'Brake Pads Set', units: 28 },
        { name: 'Spark Plugs Set', units: 25 }
      ],
      revenueByCategory: [
        { category: 'Engine Parts', revenue: 420000 },
        { category: 'Brake System', revenue: 320000 },
        { category: 'Lighting', revenue: 180000 },
        { category: 'Other', revenue: 60000 }
      ],
      dailyTrend: [38000, 42000, 40000, 44000, 41000, 39000, 43000]
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

  // Users data - fetched from API
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setUsersError(null);
        const response = await usersApi.getUsers({ page_size: 100 });
        const transformedUsers: User[] = response.items.map((u: ApiUser) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          role: u.role as 'manager' | 'auditor' | 'customer',
          dateCreated: u.created_at,
          status: u.is_active ? 'active' : 'inactive'
        }));
        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsersError('Failed to load users.');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter sales data based on date range
  const salesData = useMemo(() => {
    const rangeMap = { '3months': 3, '6months': 6, 'year': 12 };
    const count = rangeMap[dateRange];
    return allSalesData.slice(-count);
  }, [dateRange, allSalesData]);

  // Calculate monthly and yearly revenue - with safe division and validation
  const monthlyRevenue = salesData[salesData.length - 1]?.sales || 0; // Current month
  const yearlyRevenue = salesData.length > 0
    ? (() => {
        const totalSales = salesData.reduce((total: number, month) => total + month.sales, 0);
        // Protect against division edge cases
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
    return { total: users.length, managers, auditors, customers };
  }, [users]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'date':
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        case 'role':
          return a.role.localeCompare(b.role);
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, roleFilter, searchQuery, sortBy]);

  // Sample inventory data (synchronized with manager's database)
  const [inventoryData] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      model: 'Toyota Camry',
      modelYear: '2018-2023',
      price: 4500.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads for Toyota Camry 2018-2023'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Honda Civic',
      modelYear: '2016-2021',
      price: 1200.00,
      quantityAvailable: 2, // Low stock
      category: 'Engine Parts',
      image: '⚙️',
      description: 'Premium oil filter for Honda Civic 2016-2021'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      model: 'BMW 3 Series',
      modelYear: '2019-2024',
      price: 2800.00,
      quantityAvailable: 1, // Low stock
      category: 'Lighting',
      image: '💡',
      description: 'LED headlight bulb set for BMW 3 Series 2019-2024'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Ford Focus',
      modelYear: '2015-2020',
      price: 1850.00,
      quantityAvailable: 30,
      category: 'Engine Parts',
      image: '🌪️',
      description: 'High-flow air filter for Ford Focus 2015-2020'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      model: 'Nissan Altima',
      modelYear: '2017-2022',
      price: 3200.00,
      quantityAvailable: 15,
      category: 'Engine Parts',
      image: '⚡',
      description: 'Iridium spark plugs for Nissan Altima 2017-2022'
    },
    {
      id: 'P006',
      name: 'Timing Belt',
      model: 'Honda Accord',
      modelYear: '2013-2017',
      price: 5500.00,
      quantityAvailable: 8,
      category: 'Engine Parts',
      image: '⏰',
      description: 'Timing belt kit for Honda Accord 2013-2017'
    }
  ]);

  // Filter low stock items (quantity < 3)
  const lowStockItems = inventoryData.filter(item => 
    item && typeof item.quantityAvailable === 'number' && item.quantityAvailable < 3
  );

  // Toast notification with cleanup
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  };

  // Delete user handler
  const handleDeleteUser = (userToDelete: User) => {
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      showToast(`User "${userToDelete.fullName}" has been deleted successfully`, 'success');
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Toggle user status
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
    showToast('User status updated successfully', 'success');
  };

  // Add new user handler
  const handleAddUser = () => {
    // Validation
    if (!newUserForm.fullName.trim()) {
      showToast('Please enter full name', 'error');
      return;
    }
    if (!newUserForm.email.trim() || !newUserForm.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    // Case-insensitive email comparison
    const emailLower = newUserForm.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      showToast('Email already exists', 'error');
      return;
    }
    if (!newUserForm.password || newUserForm.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newUserForm.password !== newUserForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Generate new user ID - handle empty array and invalid IDs safely
    const userIds = users
      .map(u => {
        const idNum = parseInt(u.id.substring(1));
        return isNaN(idNum) ? 0 : idNum;
      })
      .filter(id => id > 0);
    
    const maxId = userIds.length > 0 ? Math.max(...userIds) : 0;
    const newId = `U${String(maxId + 1).padStart(3, '0')}`;

    // Create new user
    const newUser: User = {
      id: newId,
      fullName: newUserForm.fullName.trim(),
      email: newUserForm.email.trim().toLowerCase(),
      role: newUserForm.role,
      dateCreated: new Date().toISOString(),
      status: 'active'
    };

    // Add to users list
    setUsers([...users, newUser]);

    // Reset form and close modal
    setNewUserForm({
      fullName: '',
      email: '',
      role: 'manager',
      password: '',
      confirmPassword: ''
    });
    setShowAddUserModal(false);
    showToast(`${newUserForm.role === 'manager' ? 'Manager' : 'Auditor'} "${newUser.fullName}" has been created successfully`, 'success');
  };

  // Notify manager
  const notifyManager = (productName: string) => {
    showToast(`Notification sent to inventory manager about "${productName}"`, 'info');
  };

  // Refresh stock data
  const refreshStockData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Stock data refreshed successfully', 'success');
    }, 1000);
  };

  // Restock all items
  const restockAllItems = () => {
    showToast(`Restock order initiated for ${lowStockItems.length} items`, 'info');
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        
        // Validate user data structure
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
        try {
          localStorage.removeItem('currentUser');
        } catch (storageError) {
          console.error('Error removing corrupted user data:', storageError);
        }
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleOrderMore = (productId: string) => {
    alert(`Order request sent for Product ID: ${productId}\nThis would normally integrate with supplier systems.`);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Admin Portal</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user?.name || user?.email || 'Admin'}!</span>
            <button 
              className="profile-header-btn"
              onClick={() => {
                console.log('Admin Profile button clicked, current showProfile:', showProfile);
                setShowProfile(!showProfile);
                console.log('Admin showProfile should now be:', !showProfile);
              }}
            >
              <span className="profile-btn-icon">👤</span>
              <span className="profile-btn-text">Profile</span>
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Profile Section - Conditionally Rendered */}
        

        {/* Dashboard Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="stat-card stat-card-users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{userStats.total}</h3>
              <p>Total Users</p>
              <div className="stat-breakdown">
                <span>{userStats.managers} Managers</span>
                <span>{userStats.auditors} Auditors</span>
                <span>{userStats.customers} Customers</span>
              </div>
              <button className="stat-link" onClick={() => setActiveTab('users')}>View All →</button>
            </div>
          </div>

          <div className="stat-card stat-card-revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Rs. {monthlyRevenue.toLocaleString()}</h3>
              <p>Monthly Revenue</p>
              <div className="stat-trend-up">↗ Current Month</div>
            </div>
          </div>

          <div className="stat-card stat-card-alert">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{lowStockItems.length}</h3>
              <p>Low Stock Alerts</p>
              <button className="stat-link" onClick={() => setActiveTab('inventory')}>View Items →</button>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Financial Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Low Stock Alert ({lowStockItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Manage Users ({userStats.total})
          </button>
        </div>

        {activeTab === 'analytics' && (
          <div className="analytics-section animate-fade-in">
            <div className="section-header-with-controls">
              <h2><span className="section-icon">📊</span> Financial Analytics</h2>
              <div className="date-range-selector">
                <label>Time Period:</label>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value as '3months' | '6months' | 'year')}>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <div className="sales-cards">
              {salesData.map((data, index) => {
                const isExpanded = expandedMonth === data.month;
                return (
                  <div 
                    key={data.month} 
                    className={`sales-card ${index === salesData.length - 1 ? 'current-month' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedMonth(isExpanded ? null : data.month)}
                  >
                    <div className="sales-header">
                      <h3>{data.month}</h3>
                      {index === salesData.length - 1 && <span className="current-badge">Current</span>}
                      <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpandedMonth(isExpanded ? null : data.month); }}>
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                    <div className="sales-amount">
                      <span className="currency">Rs.</span>
                      <span className="amount">{data.sales.toLocaleString()}</span>
                    </div>
                    <div className="sales-details">
                      <div className="detail-item">
                        <span className="detail-label">Total Orders:</span>
                        <span className="detail-value">{data.orders}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Avg Order:</span>
                        <span className="detail-value">Rs. {data.orders > 0 ? Math.round(data.sales / data.orders).toLocaleString() : '0'}</span>
                      </div>
                    </div>

                    {/* Trend Line Chart */}
                    <div className="mini-trend-chart">
                      {data.dailyTrend && data.dailyTrend.length > 0 && data.dailyTrend.map((value, i) => {
                        const validValues = data.dailyTrend.filter(v => typeof v === 'number' && isFinite(v) && v > 0);
                        const maxTrend = validValues.length > 0 ? Math.max(...validValues) : 0;
                        return (
                          <div
                            key={i}
                            className="trend-bar"
                            style={{ height: `${maxTrend > 0 && isFinite(value) && value > 0 ? (value / maxTrend) * 100 : 0}%` }}
                          />
                        );
                      })}
                    </div>

                    <div className="sales-trend">
                      {index > 0 && salesData[index - 1] && salesData[index - 1].sales > 0 && (
                        <span className={`trend ${data.sales > salesData[index - 1].sales ? 'up' : 'down'}`}>
                          {data.sales > salesData[index - 1].sales ? '📈' : '📉'}
                          {Math.abs(((data.sales - salesData[index - 1].sales) / salesData[index - 1].sales) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="expanded-details" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-section">
                          <h4>🏆 Top Selling Parts</h4>
                          <ul>
                            {data.topSellingParts && data.topSellingParts.length > 0 ? (
                              data.topSellingParts.map((part, idx) => (
                                <li key={idx}>
                                  <span>{part.name}</span>
                                  <strong>{part.units} units</strong>
                                </li>
                              ))
                            ) : (
                              <li>No data available</li>
                            )}
                          </ul>
                        </div>
                        <div className="detail-section">
                          <h4>📂 Revenue by Category</h4>
                          <ul>
                            {data.revenueByCategory && data.revenueByCategory.length > 0 ? (
                              data.revenueByCategory.map((cat, idx) => (
                                <li key={idx}>
                                  <span>{cat.category}</span>
                                  <strong>Rs. {cat.revenue.toLocaleString()}</strong>
                                </li>
                              ))
                            ) : (
                              <li>No data available</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="summary-section">
              <h3>Summary</h3>
              <div className="summary-cards">
                <div className="summary-card summary-card-primary">
                  <div className="summary-icon">💰</div>
                  <h4>Monthly Revenue</h4>
                  <p className="summary-amount">Rs. {monthlyRevenue.toLocaleString()}</p>
                  <span className="summary-label">Current Month</span>
                </div>
                <div className="summary-card summary-card-success">
                  <div className="summary-icon">📈</div>
                  <h4>Yearly Revenue (Est.)</h4>
                  <p className="summary-amount">Rs. {Math.round(yearlyRevenue).toLocaleString()}</p>
                  <span className="summary-label">Annual Projection</span>
                </div>
                <div className="summary-card summary-card-info">
                  <div className="summary-icon">🛒</div>
                  <h4>Total Sales ({salesData.length} Months)</h4>
                  <p className="summary-amount">Rs. {salesData.reduce((sum: number, data) => sum + data.sales, 0).toLocaleString()}</p>
                </div>
                <div className="summary-card summary-card-warning">
                  <div className="summary-icon">📦</div>
                  <h4>Total Orders</h4>
                  <p className="summary-amount">{salesData.reduce((sum: number, data) => sum + data.orders, 0)}</p>
                </div>
                <div className="summary-card summary-card-accent">
                  <div className="summary-icon">📊</div>
                  <h4>Average Monthly Sales</h4>
                  <p className="summary-amount">Rs. {Math.round(salesData.length > 0 ? salesData.reduce((sum: number, data) => sum + data.sales, 0) / salesData.length : 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="brand-sales-section">
              <h3>Top Selling Brands</h3>
              <div className="brand-chart">
                {brandSales && brandSales.length > 0 && brandSales.map((brand, index) => {
                  // Safe calculation of percentage with proper validation
                  const salesValues = brandSales.map(b => b.sales).filter(s => s > 0);
                  const maxSales = salesValues.length > 0 ? Math.max(...salesValues) : 0;
                  const percentage = maxSales > 0 && isFinite(maxSales) && brand.sales > 0
                    ? Math.min((brand.sales / maxSales) * 100, 100)
                    : 0;
                  return (
                    <div key={brand.brand} className="brand-bar-container">
                      <div className="brand-info">
                        <span className="brand-rank">#{index + 1}</span>
                        <span className="brand-name">{brand.brand}</span>
                      </div>
                      <div className="brand-bar-wrapper">
                        <div 
                          className="brand-bar" 
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="bar-label">
                            Rs. {brand.sales.toLocaleString()} ({brand.units} units)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="users-section animate-fade-in">
            <div className="section-header">
              <h2><span className="section-icon">👥</span> User Management</h2>
              <button className="add-user-btn" onClick={() => setShowAddUserModal(true)}>
                ➕ Add User
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="users-controls">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="role-filter">
                <option value="all">All Roles</option>
                <option value="manager">Managers</option>
                <option value="auditor">Auditors</option>
                <option value="customer">Customers</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="role">Sort by Role</option>
              </select>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="no-users-found">
                <div className="no-users-icon">🔍</div>
                <h3>No users found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Date Created</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={user.status === 'inactive' ? 'inactive-user' : ''}>
                        <td><span className="user-id-badge">{user.id}</span></td>
                        <td>
                          <div className="user-name-cell">
                            <div className="user-avatar-small">
                              {user.fullName.charAt(0)}
                            </div>
                            <span>{user.fullName}</span>
                          </div>
                        </td>
                        <td className="email-cell">{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role === 'manager' && '👔'}
                            {user.role === 'auditor' && '📋'}
                            {user.role === 'customer' && '👤'}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(user.dateCreated)}</td>
                        <td>
                          <button 
                            className={`status-toggle ${user.status}`}
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.status === 'active' ? '✓ Active' : '✕ Inactive'}
                          </button>
                        </td>
                        <td>
                          <button 
                            className="delete-user-btn"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users Summary */}
            <div className="users-summary">
              <div className="summary-stat">
                <span className="stat-label">Showing:</span>
                <span className="stat-value">{filteredUsers.length} of {users.length} users</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-section animate-fade-in">
            <div className="section-header">
              <div>
                <h2><span className="section-icon">⚠️</span> Low Stock Alert (Quantity &lt; 3)</h2>
                <p className="last-checked">Last checked: 2 hours ago</p>
              </div>
              <div className="header-actions">
                <button className="refresh-btn" onClick={refreshStockData} disabled={isLoading}>
                  {isLoading ? '⏳' : '🔄'} Refresh Data
                </button>
                {lowStockItems.length > 0 && (
                  <button className="restock-all-btn" onClick={restockAllItems}>
                    📦 Restock All ({lowStockItems.length})
                  </button>
                )}
              </div>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="no-alerts">
                <div className="no-alerts-icon">✅</div>
                <h3>All inventory levels are healthy!</h3>
                <p>No items require immediate restocking.</p>
              </div>
            ) : (
              <div className="low-stock-grid">
                {lowStockItems.map(item => (
                  <div key={item.id} className="low-stock-item">
                    <div className="stock-alert">
                      <span className="alert-icon">🚨</span>
                      <span className="stock-level">Only {item.quantityAvailable} left!</span>
                    </div>
                    <div className="item-icon">{item.image}</div>
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-model">{item.model} ({item.modelYear})</p>
                      <p className="item-price">Rs. {item.price.toFixed(2)}</p>
                      <p className="item-category">{item.category}</p>
                      {item.lastChecked && <p className="item-timestamp">Updated: {item.lastChecked}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        onClick={() => handleOrderMore(item.id)}
                        className="order-btn"
                      >
                        📦 Order More
                      </button>
                      <button 
                        onClick={() => notifyManager(item.name)}
                        className="notify-btn"
                      >
                        🔔 Notify Manager
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="inventory-summary">
              <h3>Inventory Overview</h3>
              <div className="inventory-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Products:</span>
                  <span className="stat-value">{inventoryData.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Low Stock Items:</span>
                  <span className="stat-value critical">{lowStockItems.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Healthy Stock:</span>
                  <span className="stat-value healthy">{inventoryData.length - lowStockItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
        <div className="modal-overlay">
          <div className="modal-content add-user-modal">
            <div className="modal-header">
              <h2>➕ Add New User</h2>
              <button onClick={() => setShowAddUserModal(false)} className="close-modal">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Create a new Manager or Auditor account</p>
              
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">User Role *</label>
                <select
                  id="role"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'manager' | 'auditor' })}
                  className="form-select"
                >
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
                <p className="field-hint">Customers cannot be added through admin panel</p>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={newUserForm.confirmPassword}
                  onChange={(e) => setNewUserForm({ ...newUserForm, confirmPassword: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddUserModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleAddUser} className="confirm-btn">
                ✓ Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <div className="delete-modal-icon">⚠️</div>
              <h2>Confirm Deletion</h2>
              <button onClick={() => setShowDeleteModal(false)} className="close-modal">×</button>
            </div>
            <div className="modal-body">
              <p className="delete-warning">Are you sure you want to delete <strong>{userToDelete.fullName}</strong>?</p>
              <p className="delete-subtext">This action cannot be undone. All user data will be permanently removed.</p>
              <div className="user-delete-info">
                <div className="info-row">
                  <span>Email:</span>
                  <strong>{userToDelete.email}</strong>
                </div>
                <div className="info-row">
                  <span>Role:</span>
                  <strong>{userToDelete.role}</strong>
                </div>
                <div className="info-row">
                  <span>User ID:</span>
                  <strong>{userToDelete.id}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-delete-btn">
                Cancel
              </button>
              <button onClick={confirmDeleteUser} className="confirm-delete-btn">
                🗑️ Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal: React.FC<{
  user: UserProfile | null;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('User data not available. Please refresh and try again.');
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave({
        ...user,
        ...formData
      });
    } catch (error) {
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-profile-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="profile-icon">👤</div>
            <h2>Edit Admin Profile</h2>
          </div>
          <button onClick={onClose} className="close-modal" disabled={isLoading}>×</button>
        </div>

        <div className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {formData.name.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
            <p className="profile-email">{formData.email}</p>
            <p className="profile-role">Administrator</p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-fields">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="label-icon">👤</span>
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className={errors.name ? 'error' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">📧</span>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={errors.email ? 'error' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className={`save-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="save-icon">💾</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
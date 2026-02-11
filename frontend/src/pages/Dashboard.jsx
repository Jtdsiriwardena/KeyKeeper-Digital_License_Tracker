import React, { useEffect, useState } from 'react';
import CalendarView from '../components/CalendarView';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, licenses, products

  // Product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductTags, setNewProductTags] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductData, setEditProductData] = useState({
    name: '',
    tags: ''
  });

  // License form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [usageLimits, setUsageLimits] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [clientProject, setClientProject] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [searchText, setSearchText] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddLicense, setShowAddLicense] = useState(false);

  const totalLicenses = licenses.length;
  const activeCount = licenses.filter(l => l.status === 'Active').length;
  const expiredCount = licenses.filter(l => l.status === 'Expired').length;
  const expiringSoon = licenses.filter(l => {
    const daysLeft = (new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30 && l.status === 'Active';
  }).length;

  // Message state
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const [editingLicenseId, setEditingLicenseId] = useState(null);
  const [editLicenseData, setEditLicenseData] = useState({
    licenseKey: '',
    expiryDate: '',
    autoRenew: false,
    usageLimits: '',
    status: 'Active',
    notes: '',
    clientProject: '',
    monthlyCost: '',
    annualCost: '',
  });

  const [monthlyCost, setMonthlyCost] = useState('');
  const [annualCost, setAnnualCost] = useState('');

  const monthlyCostSum = licenses.reduce((sum, lic) => sum + (lic.monthlyCost || 0), 0);
  const annualCostSum = licenses.reduce((sum, lic) => sum + (lic.annualCost || 0), 0);

  // For upcoming renewal costs (licenses expiring in next 30 days)
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewalCost = licenses
    .filter(lic => new Date(lic.expiryDate) <= in30Days && lic.status === 'Active')
    .reduce((sum, lic) => sum + (lic.annualCost || 0), 0);

  useEffect(() => {
    fetchProducts();
    fetchLicenses();
  }, [filterStatus, filterTag, filterClient, searchText]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchNotifications();
  }, []);

  async function markAsRead(id) {
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  function handleBellClick() {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      notifications
        .filter(n => !n.read)
        .forEach(n => markAsRead(n._id));
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function fetchLicenses() {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterTag) params.append('tag', filterTag);
      if (filterClient) params.append('clientProject', filterClient);
      if (searchText) params.append('search', searchText);

      const res = await fetch(`http://localhost:5000/api/licenses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLicenses(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function getExpiryRiskLabel(expiryDate) {
    const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 60) return { label: 'Safe', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '●', border: 'border-emerald-200' };
    if (daysLeft > 30) return { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50', icon: '●', border: 'border-amber-200' };
    if (daysLeft > 0) return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', icon: '●', border: 'border-red-200' };
    return { label: 'Expired', color: 'text-gray-600', bg: 'bg-gray-50', icon: '●', border: 'border-gray-200' };
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProductName,
          tags: newProductTags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to add product');
      }

      setNewProductName('');
      setNewProductTags('');
      setShowAddProduct(false);
      setMessage('Product added successfully!');
      fetchProducts();
      fetchLicenses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function startEditingProduct(product) {
    setEditingProductId(product._id);
    setEditProductData({
      name: product.name,
      tags: product.tags?.join(', ') || ''
    });
  }

  function handleEditProductChange(e) {
    const { name, value } = e.target;
    setEditProductData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    setSelectedFile(e.target.files[0]);
  }


  async function updateProduct(id) {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editProductData.name,
          tags: editProductData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update product');
      }
      setEditingProductId(null);
      setMessage('Product updated successfully!');
      fetchProducts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteProductById(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete product');
      }
      setMessage('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleAddLicense(e) {
    e.preventDefault();
    if (!selectedProduct || !licenseKey || !expiryDate) {
      setMessage('Please fill required fields for license.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('product', selectedProduct);
      formData.append('licenseKey', licenseKey);
      formData.append('expiryDate', expiryDate);
      formData.append('autoRenew', autoRenew);
      formData.append('usageLimits', usageLimits);
      formData.append('status', status);
      formData.append('notes', notes);
      formData.append('clientProject', clientProject);
      formData.append('monthlyCost', monthlyCost ? parseFloat(monthlyCost) : 0);
      formData.append('annualCost', annualCost ? parseFloat(annualCost) : 0);

      if (selectedFile) {
        formData.append('document', selectedFile);
      }

      const res = await fetch('http://localhost:5000/api/licenses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to add license');
      }

      // Reset form
      setSelectedProduct('');
      setLicenseKey('');
      setExpiryDate('');
      setAutoRenew(false);
      setUsageLimits('');
      setStatus('Active');
      setNotes('');
      setClientProject('');
      setMonthlyCost('');
      setAnnualCost('');
      setSelectedFile(null);
      setShowAddLicense(false);
      setMessage('License added successfully!');
      fetchLicenses();
    } catch (error) {
      setMessage(error.message);
    }
  }


  function startEditing(license) {
    setEditingLicenseId(license._id);
    setEditLicenseData({
      licenseKey: license.licenseKey,
      expiryDate: license.expiryDate ? license.expiryDate.slice(0, 10) : '',
      autoRenew: license.autoRenew || false,
      usageLimits: license.usageLimits || '',
      status: license.status || 'Active',
      notes: license.notes || '',
      clientProject: license.clientProject || '',
      monthlyCost: license.monthlyCost || '',
      annualCost: license.annualCost || '',
      createdAt: license.createdAt || new Date().toISOString(),
    });
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    setEditLicenseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function updateLicense(id) {
    try {
      const formData = new FormData();
      Object.entries(editLicenseData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (selectedFile) {
        formData.append('document', selectedFile);
      }

      const res = await fetch(`http://localhost:5000/api/licenses/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update license');
      }

      setEditingLicenseId(null);
      setSelectedFile(null);
      setMessage('License updated successfully!');
      fetchLicenses();
    } catch (error) {
      setMessage(error.message);
    }
  }


  async function deleteLicense(id) {
    if (!window.confirm('Are you sure you want to delete this license?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/licenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete license');
      }
      setMessage('License deleted successfully!');
      fetchLicenses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const licensesByProduct = licenses.reduce((acc, license) => {
    const prodId = license.product?._id || 'unknown';
    if (!acc[prodId]) acc[prodId] = [];
    acc[prodId].push(license);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">KeyKeeper</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Software License Management</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-auto">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {notifications.map(n => (
                          <li
                            key={n._id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              if (!n.read) markAsRead(n._id);
                            }}
                          >
                            <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                              {n.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Toast */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
            <button onClick={() => setMessage('')} className="text-green-600 hover:text-green-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'licenses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Licenses ({totalLicenses})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Products ({products.length})
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Licenses</p>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalLicenses}</p>
                <p className="text-xs text-gray-500 mt-1">Active subscriptions</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-gray-500 mt-1">Currently valid</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600">{expiringSoon}</p>
                <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600">{expiredCount}</p>
                <p className="text-xs text-gray-500 mt-1">Needs renewal</p>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-900">Monthly Cost</p>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-blue-900">${monthlyCostSum.toFixed(2)}</p>
                <p className="text-xs text-blue-700 mt-1">Recurring expense</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-green-900">Annual Spend</p>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-green-900">${annualCostSum.toFixed(2)}</p>
                <p className="text-xs text-green-700 mt-1">Total yearly cost</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-amber-900">Upcoming Renewals</p>
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-amber-900">${upcomingRenewalCost.toFixed(2)}</p>
                <p className="text-xs text-amber-700 mt-1">Next 30 days</p>
              </div>
            </div>

            {/* Calendar View */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Calendar</h3>
              <CalendarView licenses={licenses} />
            </div>
          </div>
        )}

        {/* Licenses Tab */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
              <button
                onClick={() => setShowAddLicense(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add License</span>
              </button>
            </div>

            {/* Add License Form */}
            {showAddLicense && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New License</h3>
                  <button
                    onClick={() => setShowAddLicense(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddLicense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        required
                      >
                        <option value="">Select product</option>
                        {products.map((prod) => (
                          <option key={prod._id} value={prod._id}>{prod.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">License Key *</label>
                      <input
                        type="text"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={licenseKey}
                        onChange={e => setLicenseKey(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document (optional)</label>
                      <input
                        type="file"
                        onChange={e => setSelectedFile(e.target.files[0])}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Renewed">Renewed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={monthlyCost}
                        onChange={e => setMonthlyCost(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={annualCost}
                        onChange={e => setAnnualCost(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Usage Limits</label>
                      <input
                        type="text"
                        placeholder="e.g., 5 users"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={usageLimits}
                        onChange={e => setUsageLimits(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client/Project</label>
                      <input
                        type="text"
                        placeholder="Client or project name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={clientProject}
                        onChange={e => setClientProject(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      placeholder="Additional notes or comments"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoRenew"
                      checked={autoRenew}
                      onChange={e => setAutoRenew(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
                      Enable auto-renewal
                    </label>
                  </div>
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add License
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddLicense(false)}
                      className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Renewed">Renewed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Tag</label>
                  <select
                    value={filterTag}
                    onChange={e => setFilterTag(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Tags</option>
                    {[...new Set(products.flatMap(p => p.tags || []))].map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Client/Project</label>
                  <input
                    placeholder="Filter by client"
                    value={filterClient}
                    onChange={e => setFilterClient(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Search</label>
                  <input
                    placeholder="Search licenses"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Licenses List */}
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No licenses found</h3>
                  <p className="text-gray-600 mb-4">Add your first product to start tracking licenses</p>
                  <button
                    onClick={() => {
                      setActiveTab('products');
                      setShowAddProduct(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Product</span>
                  </button>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {product.tags?.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {licensesByProduct[product._id]?.length || 0} {licensesByProduct[product._id]?.length === 1 ? 'license' : 'licenses'}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {licensesByProduct[product._id]?.length ? (
                        <div className="space-y-3">
                          {licensesByProduct[product._id].map((license) => (
                            <div
                              key={license._id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              {editingLicenseId === license._id ? (
                                <form
                                  onSubmit={e => {
                                    e.preventDefault();
                                    updateLicense(license._id);
                                  }}
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">License Key</label>
                                      <input
                                        name="licenseKey"
                                        value={editLicenseData.licenseKey}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
                                      <input
                                        type="file"
                                        name="documentFile"
                                        onChange={handleFileChange}
                                        className="w-full"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                      <input
                                        name="expiryDate"
                                        type="date"
                                        value={editLicenseData.expiryDate}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Cost</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="monthlyCost"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editLicenseData.monthlyCost}
                                        onChange={handleEditChange}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Cost</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="annualCost"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editLicenseData.annualCost}
                                        onChange={handleEditChange}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                      <select
                                        name="status"
                                        value={editLicenseData.status}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      >
                                        <option value="Active">Active</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Renewed">Renewed</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Usage Limits</label>
                                      <input
                                        name="usageLimits"
                                        value={editLicenseData.usageLimits}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Usage Limits"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Client/Project</label>
                                      <input
                                        name="clientProject"
                                        value={editLicenseData.clientProject}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Client or project name"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                      name="notes"
                                      value={editLicenseData.notes}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Additional notes"
                                      rows="3"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      name="autoRenew"
                                      type="checkbox"
                                      checked={editLicenseData.autoRenew}
                                      onChange={handleEditChange}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">Enable auto-renewal</label>
                                  </div>
                                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                      type="submit"
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                      Save Changes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLicenseId(null)}
                                      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <code className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-900">
                                          {license.licenseKey}
                                        </code>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${license.status === 'Active' ? 'bg-green-100 text-green-800' :
                                          license.status === 'Expired' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                          }`}>
                                          {license.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => startEditing(license)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => deleteLicense(license._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {license.expiryDate && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Expires</p>
                                        <div className="flex items-center space-x-2">
                                          <p className="font-medium text-gray-900">
                                            {new Date(license.expiryDate).toLocaleDateString()}
                                          </p>
                                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium ${getExpiryRiskLabel(license.expiryDate).bg} ${getExpiryRiskLabel(license.expiryDate).color} border ${getExpiryRiskLabel(license.expiryDate).border}`}>
                                            <span>{getExpiryRiskLabel(license.expiryDate).icon}</span>
                                            <span>{getExpiryRiskLabel(license.expiryDate).label}</span>
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {license.documents?.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Documents:</p>
                                        <ul className="list-disc list-inside">
                                          {license.documents.map(doc => (
                                            <li key={doc.s3Key}>
                                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {doc.fileName}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {license.clientProject && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Client/Project</p>
                                        <p className="font-medium text-gray-900">{license.clientProject}</p>
                                      </div>
                                    )}
                                    {(license.monthlyCost > 0 || license.annualCost > 0) && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Cost</p>
                                        <p className="font-medium text-gray-900">
                                          {license.monthlyCost > 0 && `$${license.monthlyCost}/mo`}
                                          {license.monthlyCost > 0 && license.annualCost > 0 && ' • '}
                                          {license.annualCost > 0 && `$${license.annualCost}/yr`}
                                        </p>
                                      </div>
                                    )}
                                    {license.autoRenew && (
                                      <div>
                                        <p className="text-gray-600 mb-1">Auto Renew</p>
                                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                          Enabled
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {license.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <p className="text-xs text-gray-600 mb-1">Notes</p>
                                      <p className="text-sm text-gray-900">{license.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm">No licenses for this product</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Product</span>
              </button>
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Adobe Creative Cloud"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newProductName}
                      onChange={e => setNewProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., Design, Development, Marketing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newProductTags}
                      onChange={e => setNewProductTags(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products List */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Add your first product to start managing licenses</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {editingProductId === product._id ? (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          updateProduct(product._id);
                        }}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          name="name"
                          value={editProductData.name}
                          onChange={handleEditProductChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="tags"
                          value={editProductData.tags}
                          onChange={handleEditProductChange}
                          placeholder="Tags (comma separated)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="flex-1 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {product.tags?.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {licensesByProduct[product._id]?.length || 0} {licensesByProduct[product._id]?.length === 1 ? 'license' : 'licenses'}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEditingProduct(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteProductById(product._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Ban, CheckCircle, Trash2, Shield, Mail, Phone, Calendar, Activity } from 'lucide-react';
import UserForm from '@/components/admin/UserForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended';
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  created_at: string;
  last_login?: string;
  suspension_reason?: string;
  activity_history?: {
    trips_count: number;
    shipments_as_sender_count: number;
    shipments_as_traveler_count: number;
    ratings_received_count: number;
    ratings_given_count: number;
  };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignAdminDialog, setShowAssignAdminDialog] = useState(false);

  useEffect(() => {
    params.then(p => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (formData: { name: string; email: string; phone: string }) => {
    if (!userId) return;
    
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      fetchUserDetails();
      setShowEditForm(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleSuspendUser = async () => {
    if (!userId) return;
    
    try {
      await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspended by admin' })
      });
      fetchUserDetails();
      setShowSuspendDialog(false);
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleActivateUser = async () => {
    if (!userId) return;
    
    try {
      await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST'
      });
      fetchUserDetails();
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      router.push('/admin/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleAssignAdmin = async () => {
    if (!userId) return;
    
    try {
      await fetch(`/api/admin/users/${userId}/assign-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });
      fetchUserDetails();
      setShowAssignAdminDialog(false);
    } catch (error) {
      console.error('Failed to assign admin role:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!showEditForm && (
            <button
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}

          {user.status === 'active' ? (
            <button
              onClick={() => setShowSuspendDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend
            </button>
          ) : (
            <button
              onClick={handleActivateUser}
              className="inline-flex items-center px-4 py-2 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Activate
            </button>
          )}

          {user.role === 'user' && (
            <button
              onClick={() => setShowAssignAdminDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              Assign Admin
            </button>
          )}

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
          <UserForm
            initialData={{
              name: user.name,
              email: user.email,
              phone: user.phone
            }}
            onSubmit={handleUpdateUser}
            onCancel={() => setShowEditForm(false)}
            submitLabel="Save Changes"
          />
        </div>
      )}

      {/* User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {user.phone}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Joined</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              {user.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Activity className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(user.last_login).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>

            {user.status === 'suspended' && user.suspension_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Suspension Reason</p>
                <p className="text-sm text-red-700 mt-1">{user.suspension_reason}</p>
              </div>
            )}
          </div>

          {/* Activity Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h2>
            {user.activity_history ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Trips Created</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{user.activity_history.trips_count}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Shipments as Sender</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{user.activity_history.shipments_as_sender_count}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Shipments as Traveler</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{user.activity_history.shipments_as_traveler_count}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">Ratings Received</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{user.activity_history.ratings_received_count}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No activity recorded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Account Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'super_admin' ? 'bg-pink-100 text-pink-800' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">KYC Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                    user.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    user.kyc_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.kyc_status === 'not_submitted' ? 'Not Submitted' : user.kyc_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={handleSuspendUser}
        title="Suspend User"
        message={`Are you sure you want to suspend ${user.name}? They will not be able to create new trips or shipments.`}
        confirmLabel="Suspend"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone. Personal data will be anonymized but transaction records will be preserved.`}
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showAssignAdminDialog}
        onClose={() => setShowAssignAdminDialog(false)}
        onConfirm={handleAssignAdmin}
        title="Assign Admin Role"
        message={`Are you sure you want to assign admin role to ${user.name}? They will have access to the admin dashboard.`}
        confirmLabel="Assign Admin"
        variant="default"
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, AlertTriangle, Eye, Send, Users, User as UserIcon } from 'lucide-react';

type RecipientType = 'individual' | 'broadcast' | 'group';

interface NotificationFormData {
  recipient_type: RecipientType;
  recipient_id?: string;
  group_filter?: {
    role?: string;
    kyc_status?: string;
    status?: string;
  };
  title: string;
  message: string;
}

interface NotificationFormProps {
  onSubmit: (data: NotificationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

export default function NotificationForm({
  onSubmit,
  onCancel,
  loading = false
}: NotificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<NotificationFormData>({
    defaultValues: {
      recipient_type: 'broadcast',
      title: '',
      message: ''
    }
  });

  const watchedValues = watch();
  const titleLength = watchedValues.title?.length || 0;
  const messageLength = watchedValues.message?.length || 0;
  const recipientType = watchedValues.recipient_type;

  const onFormSubmit = async (data: NotificationFormData) => {
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);
    try {
      await onSubmit(watchedValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecipientCount = () => {
    if (recipientType === 'individual') return '1 user';
    if (recipientType === 'broadcast') return 'All users';
    
    // For group, estimate based on filters
    const filters = watchedValues.group_filter;
    if (!filters || Object.keys(filters).length === 0) return 'All users';
    
    const filterCount = Object.keys(filters).length;
    return `Users matching ${filterCount} filter${filterCount > 1 ? 's' : ''}`;
  };

  const isLoading = loading || isSubmitting;

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Recipient Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Recipient Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label
              className={`
                relative flex items-center p-4 border-2 rounded-lg cursor-pointer
                transition-all
                ${recipientType === 'individual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                value="individual"
                {...register('recipient_type')}
                disabled={isLoading}
                className="sr-only"
              />
              <UserIcon className="w-5 h-5 mr-3 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Individual</div>
                <div className="text-xs text-gray-500">Send to one user</div>
              </div>
            </label>

            <label
              className={`
                relative flex items-center p-4 border-2 rounded-lg cursor-pointer
                transition-all
                ${recipientType === 'broadcast' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                value="broadcast"
                {...register('recipient_type')}
                disabled={isLoading}
                className="sr-only"
              />
              <Users className="w-5 h-5 mr-3 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Broadcast</div>
                <div className="text-xs text-gray-500">Send to all users</div>
              </div>
            </label>

            <label
              className={`
                relative flex items-center p-4 border-2 rounded-lg cursor-pointer
                transition-all
                ${recipientType === 'group' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                value="group"
                {...register('recipient_type')}
                disabled={isLoading}
                className="sr-only"
              />
              <Users className="w-5 h-5 mr-3 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Group</div>
                <div className="text-xs text-gray-500">Filter by criteria</div>
              </div>
            </label>
          </div>
        </div>

        {/* Individual Recipient ID */}
        {recipientType === 'individual' && (
          <div>
            <label htmlFor="recipient_id" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              id="recipient_id"
              type="text"
              {...register('recipient_id', {
                required: recipientType === 'individual' ? 'User ID is required' : false
              })}
              className={`
                block w-full px-3 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.recipient_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
              `}
              placeholder="Enter user ID"
              disabled={isLoading}
            />
            {errors.recipient_id && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.recipient_id.message}
              </div>
            )}
          </div>
        )}

        {/* Group Filters */}
        {recipientType === 'group' && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Filter Criteria</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="role_filter" className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role_filter"
                  onChange={(e) => setValue('group_filter.role', e.target.value || undefined)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="kyc_filter" className="block text-xs font-medium text-gray-700 mb-1">
                  KYC Status
                </label>
                <select
                  id="kyc_filter"
                  onChange={(e) => setValue('group_filter.kyc_status', e.target.value || undefined)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="status_filter" className="block text-xs font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <select
                  id="status_filter"
                  onChange={(e) => setValue('group_filter.status', e.target.value || undefined)}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Notification Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title', {
              required: 'Title is required',
              maxLength: {
                value: MAX_TITLE_LENGTH,
                message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`
              }
            })}
            className={`
              block w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            `}
            placeholder="Enter notification title"
            disabled={isLoading}
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : 'title-count'}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.title ? (
              <div id="title-error" className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title.message}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Keep it short and clear</div>
            )}
            <div
              id="title-count"
              className={`text-xs ${
                titleLength > MAX_TITLE_LENGTH ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {titleLength}/{MAX_TITLE_LENGTH}
            </div>
          </div>
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={6}
            {...register('message', {
              required: 'Message is required',
              maxLength: {
                value: MAX_MESSAGE_LENGTH,
                message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`
              }
            })}
            className={`
              block w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed resize-none
              ${errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            `}
            placeholder="Enter your message here..."
            disabled={isLoading}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : 'message-count'}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.message ? (
              <div id="message-error" className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.message.message}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Be clear and concise</div>
            )}
            <div
              id="message-count"
              className={`text-xs ${
                messageLength > MAX_MESSAGE_LENGTH ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {messageLength}/{MAX_MESSAGE_LENGTH}
            </div>
          </div>
        </div>

        {/* Preview Button */}
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={isLoading || !watchedValues.title || !watchedValues.message}
          className="
            w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
            rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center
          "
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Notification
        </button>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="
              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
              rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="
              px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent
              rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preview</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">LP</span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {watchedValues.title || 'Notification Title'}
                  </div>
                  <div className="text-xs text-gray-500">Just now</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {watchedValues.message || 'Your message will appear here...'}
              </p>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Recipients: {getRecipientCount()}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              You are about to send this notification to:
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-4">
              {getRecipientCount()}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

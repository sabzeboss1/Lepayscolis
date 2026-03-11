import React from 'react';
import { User } from '@/lib/types/user';
import { RatingStars } from './RatingStars';
import { Card } from './Card';
import { Button } from './Button';

export interface UserCardProps {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'rating' | 'completed_deliveries' | 'is_recommended' | 'kyc_status'>;
  onClick?: () => void;
  showContactButton?: boolean;
  onContactClick?: () => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onClick,
  showContactButton = false,
  onContactClick,
  className = '',
}) => {
  const cardContent = (
    <div className="flex flex-col items-center text-center space-y-3">
      {/* Avatar with verified badge */}
      <div className="relative">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={`${user.name}'s avatar`}
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
        />
        {user.kyc_status === 'approved' && (
          <div
            className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1"
            aria-label="KYC Verified"
          >
            <svg
              className="w-4 h-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <title>KYC Verified</title>
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Name and Recommended badge */}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
        {user.is_recommended && (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
            aria-label="Recommended user"
          >
            <svg
              className="w-3 h-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
            Recommended
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="flex flex-col items-center gap-1">
        <RatingStars rating={Number(user.rating) || 0} size="sm" />
        <span className="text-sm text-gray-600">
          {(Number(user.rating) || 0).toFixed(1)} ({user.completed_deliveries} {user.completed_deliveries === 1 ? 'delivery' : 'deliveries'})
        </span>
      </div>

      {/* Contact button */}
      {showContactButton && (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onContactClick?.();
          }}
          fullWidth
        >
          Contact
        </Button>
      )}
    </div>
  );

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={className}
      padding="lg"
    >
      {cardContent}
    </Card>
  );
};

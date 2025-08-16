import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  user: {
    fullName: string;
    avatar?: string;
    provider?: 'google' | 'email';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl'
  };

  const imageSizes = {
    sm: 32,
    md: 40,
    lg: 48
  };

  // Check if user has a Google avatar
  const hasGoogleAvatar = user.avatar && user.provider === 'google';

  if (hasGoogleAvatar) {
    return (
      <div className={`rounded-full overflow-hidden ${className}`}>
        <Image
          src={user.avatar || ''}
          alt={user.fullName}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div className={`rounded-full bg-primary text-primary-content flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <span className="font-bold">
        {user.fullName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default UserAvatar;

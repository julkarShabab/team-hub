'use client';

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizeClass = sizes[size] || sizes.md;

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-900 ${className}`}
      />
    );
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const colors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500',
  ];
  const colorIndex = user?.name
    ? user.name.charCodeAt(0) % colors.length
    : 0;

  return (
    <div
      className={`${sizeClass} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

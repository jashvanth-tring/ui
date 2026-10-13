import { useProfileImage } from '../../hooks/useProfileImage';

interface OptionAvatarProps {
  userId?: number;
  imageURL?: string | null;
  label: string;
  size?: 'sm' | 'md';
}

const sizeMap = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-10 w-10 text-sm',
};

export function OptionAvatar({
  userId,
  imageURL,
  label,
  size = 'sm',
}: OptionAvatarProps) {
  const { imageUrl, handleImageError } = useProfileImage(userId, imageURL ?? null);
  const initial = label?.charAt(0)?.toUpperCase() ?? 'U';

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={initial}
      className={`${sizeMap[size]} rounded-full object-cover shrink-0`}
      onError={() => void handleImageError()}
    />
  ) : (
    <div
      className={`${sizeMap[size]} rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-semibold shrink-0`}
>
      {initial}
    </div>
  );
}
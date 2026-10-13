import { useAppSelector } from '../store';
import { RootState } from '../store/reducers';
import { useProfileImage } from '../hooks/useProfileImage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const user = useAppSelector((s: RootState) => s.authSelector.user);
  const { imageUrl, handleImageError } = useProfileImage(user?.id, user?.imageURL);

  const initial = user?.firstName?.charAt(0).toUpperCase()
    ?? user?.officialEmail?.charAt(0).toUpperCase()
    ?? 'U';

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={initial}
      className={`${sizeMap[size]} rounded-md object-cover shrink-0`}
      onError={() => void handleImageError()}
    />
  ) : (
    <div
      className={`${sizeMap[size]} rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-semibold`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function ProfileAvatar({
  userId,
  imageKey,
  name,
  size = 'sm',
}: {
  userId?: number | null;
  imageKey?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { imageUrl, handleImageError } = useProfileImage(userId, imageKey);

  const initial = name?.trim().charAt(0).toUpperCase() ?? 'U';

 const avatarEl = imageUrl ? (
    <img
      src={imageUrl}
      alt={initial}
      className={`${sizeMap[size]} rounded-md object-cover shrink-0`}
      onError={() => void handleImageError()}
    />
  ) : (
    <div
      className={`${sizeMap[size]} rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-semibold shrink-0`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
   return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{avatarEl}</TooltipTrigger>
        <TooltipContent side="top">
          <p>{name?.trim() || 'Unknown'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
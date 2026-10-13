import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProfileImageFile } from '../store/services/users';
import { RootState } from '@/store/reducers';
import { useAppSelector } from '@/store';

function isUsableProfileImageKey(value: string | null | undefined): boolean {
  if (!value) return false;
  const key = value.trim();
  if (!key) return false;
  if (key.startsWith('data:')) return false;
  if (/^https?:\/\//i.test(key)) return false;
  return true;
}

export function useProfileImage(
  userId?: number | null,
  imageKey?: string | null,
) {
   const profileImageVersion = useAppSelector(
    (s: RootState) => s.authSelector.profileImageVersion
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const loadImage = useCallback(async (force = false) => {
    if (!userId || (!force && !isUsableProfileImageKey(imageKey))) {
      retryCountRef.current = 0;
      revokeObjectUrl();
      setImageUrl(null);
      return null;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await fetchProfileImageFile(userId);
      if (requestId !== requestIdRef.current) return null;

      revokeObjectUrl();
      const nextObjectUrl = URL.createObjectURL(response.data);
      objectUrlRef.current = nextObjectUrl;
      setImageUrl(nextObjectUrl);
      return nextObjectUrl;
    } catch {
      if (requestId !== requestIdRef.current) return null;
      revokeObjectUrl();
      setImageUrl(null);
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [imageKey, revokeObjectUrl, userId]);

  useEffect(() => {
    retryCountRef.current = 0;
    void loadImage();
  }, [loadImage]);

   useEffect(() => {
    if (profileImageVersion === 0) return; // skip initial mount
    retryCountRef.current = 0;
    void loadImage(true); // force = true bypasses isUsableProfileImageKey guard
  }, [profileImageVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    retryCountRef.current = 0;
    return loadImage(true);
  }, [loadImage]);

  const handleImageError = useCallback(async () => {
    if (!userId || !isUsableProfileImageKey(imageKey)) {
      revokeObjectUrl();
      setImageUrl(null);
      return;
    }

    if (retryCountRef.current >= 1) {
      revokeObjectUrl();
      setImageUrl(null);
      return;
    }

    retryCountRef.current += 1;
    await loadImage(true);
  }, [imageKey, loadImage, revokeObjectUrl, userId]);

  return {
    imageUrl,
    loading,
    refresh,
    handleImageError,
  };
}

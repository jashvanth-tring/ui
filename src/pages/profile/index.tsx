'use client';

import type React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import {
  Edit,
  Mail,
  Phone,
  Save,
  Camera,
  Loader2,
  Shield,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { useDispatch, useAppSelector } from '../../store';
import { fetchAuthState } from '../../store/action/authentication.action';
import { setCredentials } from '../../store/reducers/authentication.reducer';
import { RootState } from '../../store/reducers';
import { updateUser, uploadProfileImage } from '../../store/services/users';
import { HttpStatusCode } from '../../constants/status-code';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../../components/customized-snackbar';
import type { User } from '../../store/model/user.types';
import PhoneField from '../../components/form/PhoneField';
import { cn } from '../../lib/utils';
import { useProfileImage } from '../../hooks/useProfileImage';
import { PROFILE_ILLUSTRATIONS } from '../../utils/profile-illustrations';
import { bumpProfileImageVersion } from '../../store/reducers/authentication.reducer';

interface ProfilePopupProps {
  onClose: () => void;
  user?: User | null;
}

type ProfileForm = {
  firstName: string;
  lastName: string;
  officialEmail: string;
  primaryPhone: string;
  trlId: string;
};

function formFromUser(u: User | null | undefined): ProfileForm {
  return {
    firstName: u?.firstName ?? '',
    lastName: u?.lastName ?? '',
    officialEmail: u?.officialEmail ?? '',
    primaryPhone: u?.primaryPhone ?? '',
    trlId: u?.trlId ?? '',
  };
}

function mergeUserFromUpdateResponse(base: User | null, data: Record<string, unknown>): User {
  const roleRaw = data.role as { id?: number; roleName?: string } | undefined;
  const role =
    roleRaw && typeof roleRaw.id === 'number'
      ? {
          id: roleRaw.id,
          roleName:
            typeof roleRaw.roleName === 'string' ? roleRaw.roleName : (base?.role?.roleName ?? ''),
        }
      : (base?.role ?? { id: 0, roleName: '' });
  const str = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    return typeof v === 'string' ? v : String(v);
  };
  const strField = (v: unknown, fallback: string | null | undefined): string | null =>
    v === undefined ? (fallback ?? null) : str(v);
  const toIso = (v: unknown, fallback: string | null | undefined): string | null => {
    if (v === undefined || v === null) return fallback ?? null;
    if (typeof v === 'string') return v;
    try {
      return new Date(v as number | Date).toISOString();
    } catch {
      return fallback ?? null;
    }
  };
  return {
    id: typeof data.id === 'number' ? data.id : (base?.id ?? 0),
    role,
    firstName: strField(data.firstName, base?.firstName),
    lastName: strField(data.lastName, base?.lastName),
    officialEmail:
      typeof data.officialEmail === 'string' ? data.officialEmail : (base?.officialEmail ?? ''),
    primaryPhone: strField(data.primaryPhone, base?.primaryPhone),
    trlId: strField(data.trlId, base?.trlId),
    imageURL: strField(data.imageURL, base?.imageURL),
    isActive: typeof data.isActive === 'boolean' ? data.isActive : (base?.isActive ?? true),
    createdAt: toIso(data.createdAt, base?.createdAt) ?? base?.createdAt ?? '',
    createdBy:
      data.createdBy === undefined || data.createdBy === null
        ? (base?.createdBy ?? null)
        : str(data.createdBy),
    updatedAt: toIso(data.updatedAt, base?.updatedAt),
    updatedBy:
      data.updatedBy === undefined || data.updatedBy === null
        ? (base?.updatedBy ?? null)
        : str(data.updatedBy),
    lastLoginTime: toIso(data.lastLoginTime, base?.lastLoginTime),
  };
}

// ── reusable pieces ────────────────────────────────────────────────────────

function FieldReadOnly({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="h-10 flex items-center gap-2.5 rounded-lg bg-slate-50 border border-slate-200 px-3 text-sm font-medium text-slate-700">
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
      <span className="truncate">{children}</span>
    </div>
  );
}
// ── main component ─────────────────────────────────────────────────────────

export default function ProfilePopup({ onClose: _onClose, user: propUser }: ProfilePopupProps) {
  const dispatch = useDispatch();
  const session = useAppSelector((s: RootState) => s.authSelector.session);
  const userFromStore = useAppSelector((s: RootState) => s.authSelector.user);
  const user = userFromStore ?? propUser ?? null;
  const {
    snackbarState,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => formFromUser(user));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    imageUrl: storedProfileImageUrl,
    refresh: refreshProfileImage,
    handleImageError: handleStoredProfileImageError,
  } = useProfileImage(user?.id, user?.imageURL);

  useEffect(() => {
    if (!isEditing) setForm(formFromUser(user ?? null));
  }, [user, isEditing]);

  const resetFromUser = useCallback(() => {
    setForm(formFromUser(user ?? null));
    setTempImage(null);
    setPendingFile(null);
  }, [user]);

  const getInitial = (): string => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user?.officialEmail) return user.officialEmail.charAt(0).toUpperCase();
    return 'U';
  };

  const displayName =
    user && (user.firstName || user.lastName)
      ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
      : (user?.officialEmail ?? 'Profile');

  // ── Image adjuster state ──
  const [adjusterOpen, setAdjusterOpen] = useState(false);
  const [adjusterSrc, setAdjusterSrc] = useState<string | null>(null);
  const [adjusterImgEl, setAdjusterImgEl] = useState<HTMLImageElement | null>(null);
  const [adjusterZoom, setAdjusterZoom] = useState(1);
  const [adjusterPos, setAdjusterPos] = useState({ x: 0, y: 0 });
  const [adjusterRotation, setAdjusterRotation] = useState(0);
  const [adjusterStep, setAdjusterStep] = useState<'pick' | 'crop'>('pick');
  const adjusterDragging = useRef(false);
  const adjusterLastPos = useRef({ x: 0, y: 0 });

  // ── hover state for avatar border ──
  const [avatarHovered, setAvatarHovered] = useState(false);

  const professionalIllustrations = useMemo(
    () => PROFILE_ILLUSTRATIONS.filter((item) => item.group === 'professional'),
    [],
  );
  const casualIllustrations = useMemo(
    () => PROFILE_ILLUSTRATIONS.filter((item) => item.group === 'casual'),
    [],
  );

  const openAdjusterWithFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setAdjusterImgEl(img);
        setAdjusterSrc(dataUrl);
        setAdjusterZoom(1);
        setAdjusterPos({ x: 0, y: 0 });
        setAdjusterRotation(0);
        setAdjusterStep('crop');
        setAdjusterOpen(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const openAdjusterWithUrl = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setAdjusterImgEl(img);
      setAdjusterSrc(url);
      setAdjusterZoom(1);
      setAdjusterPos({ x: 0, y: 0 });
      setAdjusterRotation(0);
      setAdjusterStep('crop');   // ← go straight to crop inline
      setAdjusterOpen(true);
    };
    img.onerror = () => {
      fetch(url)
        .then(r => r.blob())
        .then(blob => {
          const fr = new FileReader();
          fr.onload = () => {
            const dataUrl = fr.result as string;
            const img2 = new Image();
            img2.onload = () => {
              setAdjusterImgEl(img2);
              setAdjusterSrc(dataUrl);
              setAdjusterZoom(1);
              setAdjusterPos({ x: 0, y: 0 });
              setAdjusterRotation(0);
              setAdjusterStep('crop');
              setAdjusterOpen(true);
            };
            img2.src = dataUrl;
          };
          fr.readAsDataURL(blob);
        })
        .catch(() => {});
    };
    img.src = url;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      openAdjusterWithFile(file);
    }
  };

  const handleAdjustCurrentPhoto = useCallback(async () => {
    const currentSrc = tempImage || storedProfileImageUrl;
    if (currentSrc) {
      openAdjusterWithUrl(currentSrc);
      return;
    }
    const refreshed = await refreshProfileImage();
    if (!refreshed) {
      showErrorSnackbar('No current profile image is available to adjust.');
      return;
    }
    openAdjusterWithUrl(refreshed);
  }, [refreshProfileImage, showErrorSnackbar, storedProfileImageUrl, tempImage]);

  // ── Confirm crop — go back to 'pick' step inline (not close modal) ──
  const handleAdjusterConfirm = () => {
    if (!adjusterImgEl) return;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    const img = adjusterImgEl;
    const fitScale = Math.max(size / img.width, size / img.height);
    const drawW = img.width * fitScale * adjusterZoom;
    const drawH = img.height * fitScale * adjusterZoom;
    const dx = (size - drawW) / 2 + adjusterPos.x;
    const dy = (size - drawH) / 2 + adjusterPos.y;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((adjusterRotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'profile-image.png', { type: 'image/png' });
          setPendingFile(file);
          setTempImage(canvas.toDataURL('image/png'));
        }
        // ← Go back to pick step (inline), don't close modal
        setAdjusterStep('pick');
        setAdjusterSrc(null);
        setAdjusterImgEl(null);
      },
      'image/png',
    );
  };

  const handleAdjusterCancel = () => {
    setAdjusterOpen(false);
    setAdjusterSrc(null);
    setAdjusterImgEl(null);
    setAdjusterStep('pick');
  };

  const handleOpenPicker = () => {
    setAdjusterStep('pick');
    setAdjusterOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetFromUser();
  };

  const handleSave = async () => {
    if (!user?.id) {
      showErrorSnackbar('Cannot save: user is not loaded.');
      return;
    }
    const trimmedEmail = form.officialEmail.trim();
    if (!trimmedEmail) {
      showErrorSnackbar('Email is required.');
      return;
    }

    const normalize = (v: unknown) => String(v ?? '').trim();
    const hasImageChange = Boolean(pendingFile);
    const hasFieldChange =
      normalize(form.firstName) !== normalize(user?.firstName ?? '') ||
      normalize(form.lastName) !== normalize(user?.lastName ?? '') ||
      normalize(trimmedEmail) !== normalize(user?.officialEmail ?? '') ||
      normalize(form.primaryPhone) !== normalize(user?.primaryPhone ?? '');
    const changed = hasFieldChange || hasImageChange;

    if (!changed) {
      showSuccessSnackbar('No changes to update');
      setIsEditing(false);
      setTempImage(null);
      setPendingFile(null);
      return;
    }

    setSaving(true);
    try {
      let uploadedImageKey: string | null = null;

      if (pendingFile) {
        const imgRes = await uploadProfileImage(user.id, pendingFile);
        const imgData = imgRes.data as any;
        if (!imgData?.success) {
          throw new Error(imgData?.message || 'Profile image upload failed.');
        }
        uploadedImageKey =
          typeof imgData?.data?.imageURL === 'string' && imgData.data.imageURL.trim()
            ? imgData.data.imageURL.trim()
            : null;
        dispatch(bumpProfileImageVersion());
      }

      if (hasFieldChange) {
        const payload: Parameters<typeof updateUser>[1] = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          officialEmail: trimmedEmail,
          primaryPhone: form.primaryPhone.trim() || undefined,
          updatedBy: user.id,
          role: user.role?.id != null ? { id: user.role.id } : undefined,
        };

        const response = await updateUser(user.id, payload);
        const body = response.data;

        if (!body.success || body.statusCode !== HttpStatusCode.OK) {
          showErrorSnackbar(body.message || 'Update failed.');
          return;
        }

        const raw = body.data;
        if (raw && typeof raw === 'object' && user) {
          const nextUser = mergeUserFromUpdateResponse(user, raw as Record<string, unknown>);
          if (uploadedImageKey) {
            nextUser.imageURL = uploadedImageKey;
          }
          setForm(formFromUser(nextUser));
          if (session) dispatch(setCredentials({ user: nextUser, session }));
        }
      } else if (uploadedImageKey && user && session) {
        dispatch(setCredentials({ user: { ...user, imageURL: uploadedImageKey }, session }));
      }

      await dispatch(fetchAuthState({ silent: true }));

      showSuccessSnackbar(
        hasFieldChange ? 'Profile updated successfully.' : 'Profile image updated successfully.',
      );
      setIsEditing(false);
      setTempImage(null);
      setPendingFile(null);
    } catch (err: unknown) {
       } finally {
      setSaving(false);
    }
  };

  const avatarSrc = tempImage || storedProfileImageUrl || undefined;

  const inputCls =
    'h-10 text-sm rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-200';

  // ── helper to render avatar grid items ──
  const renderIllustrationButton = (item: (typeof PROFILE_ILLUSTRATIONS)[0]) => (
    <button
      key={item.id}
      type="button"
      title={item.label}
      onClick={() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/png');
          const file = new File(
            [Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0))],
            'avatar.png',
            { type: 'image/png' }
          );
          setPendingFile(file);
          setTempImage(dataUrl);
        };
        img.onerror = () => {
          setTempImage(item.src);
          fetch(item.src)
            .then(r => r.blob())
            .then(blob => {
              const file = new File([blob], 'avatar.png', { type: 'image/png' });
              setPendingFile(file);
            })
            .catch(() => {});
        };
        img.src = item.src;
      }}
      className={`
        relative rounded-xl border-2 overflow-hidden aspect-square
        transition-all duration-150 hover:scale-105
        ${tempImage === item.src
          ? 'border-[var(--brand)] ring-2 ring-[var(--brand)] ring-offset-1'
          : 'border-slate-200 hover:border-[var(--brand)]'
        }
      `}
    >
      <img
        src={item.src}
        alt={item.label}
        className="w-full h-full object-cover"
        style={{ objectPosition: 'center 35%' }}
      />
    </button>
  );

    let avatarBorderClass = 'bg-transparent';

  if (avatarHovered) {
    if (isEditing) {
      avatarBorderClass = 'bg-[var(--brand)]';
    } else {
      avatarBorderClass = 'bg-slate-300';
    }
  }

  return (
    <>
      {/* ── outermost: no overflow, just shape ── */}
      <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col">

        {/* ══ TOP BAR ══ */}
        <div className="flex items-center gap-4 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl shrink-0">

          {/* ── Avatar ── */}
          <div className="relative shrink-0">
            <div
                 className={cn(
                'rounded-full transition-all duration-200 p-[3px]',
                avatarBorderClass
          
            )}
            >
              <button
                type="button"
                className="relative rounded-full outline-none block"
                style={{ display: 'block' }}
                onClick={isEditing ? handleOpenPicker : undefined}
                disabled={!isEditing}
                onMouseEnter={() => setAvatarHovered(true)}
                onMouseLeave={() => setAvatarHovered(false)}
              >
                <Avatar className="h-16 w-16 rounded-full">
                  {avatarSrc ? (
                    <AvatarImage
                      src={avatarSrc}
                      alt=""
                      className="object-cover rounded-full"
                      onError={() => {
                        if (!tempImage) void handleStoredProfileImageError();
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-full bg-[var(--brand)] text-2xl font-bold text-white select-none">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Camera className="h-5 w-5 text-white" />
                  </span>
                )}
              </button>
            </div>

            {user?.isActive && !isEditing && (
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white z-10" />
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* ── Profile Image Picker Modal ── */}
          {adjusterOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[920px] h-[80vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">
                    {adjusterStep === 'crop' ? 'Adjust photo' : 'Change profile picture'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleAdjusterCancel}
                    className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                {/* Two-column body */}
                <div className="flex" style={{ maxHeight: 'calc(90vh - 130px)' }}>

                  {/* ── LEFT PANEL ── */}
                  <div className="w-[360px] shrink-0 border-r border-slate-100 p-6 flex flex-col gap-4 overflow-x-auto">

                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 self-start">
                        {adjusterStep === 'crop' ? 'Drag to position' : 'Current image'}
                      </p>

                      {/* ── INLINE CROP VIEW ── */}
                      {adjusterStep === 'crop' && adjusterSrc ? (
                        <div className="flex flex-col gap-3 w-full">
                          {/* Crop canvas */}
                          <div
  className="relative mx-auto w-[280px] h-[280px] rounded-xl overflow-hidden
    cursor-grab active:cursor-grabbing select-none bg-slate-800"
  style={{ touchAction: 'none' }}
  role="application"
  aria-label="Image crop area. Use arrow keys to move the image."
  tabIndex={0}
  onKeyDown={(e) => {
    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setAdjusterPos((p) => ({ ...p, x: p.x - step }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setAdjusterPos((p) => ({ ...p, x: p.x + step }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAdjusterPos((p) => ({ ...p, y: p.y - step }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setAdjusterPos((p) => ({ ...p, y: p.y + step }));
        break;
    }
  }}
  onMouseDown={(e) => {
    e.preventDefault();
    adjusterDragging.current = true;
    adjusterLastPos.current = { x: e.clientX, y: e.clientY };
  }}
  onMouseMove={(e) => {
    if (!adjusterDragging.current) return;
    const dx = e.clientX - adjusterLastPos.current.x;
    const dy = e.clientY - adjusterLastPos.current.y;
    adjusterLastPos.current = { x: e.clientX, y: e.clientY };
    setAdjusterPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }}
  onMouseUp={() => {
    adjusterDragging.current = false;
  }}
  onMouseLeave={() => {
    adjusterDragging.current = false;
  }}
>
              <img
                  src={adjusterSrc}
                  alt=""
                  className="absolute w-full h-full object-cover pointer-events-none"
                        draggable={false}
                   style={{
                    transform: `translate(${adjusterPos.x}px, ${adjusterPos.y}px) scale(${adjusterZoom}) rotate(${adjusterRotation}deg)`,
                     transformOrigin: 'center center',
                    }}
                            />
                            {/* Circle overlay */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              viewBox="0 0 180 180"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <defs>
                                <mask id="circleMaskInline">
                                  <rect width="180" height="180" fill="white" />
                                  <circle cx="90" cy="90" r="82" fill="black" />
                                </mask>
                              </defs>
                              <rect
                                width="180"
                                height="180"
                                fill="rgba(0,0,0,0.55)"
                                mask="url(#circleMaskInline)"
                              />
                              <circle
                                cx="90" cy="90" r="82"
                                fill="none"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </div>

                          {/* Zoom slider */}
                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => setAdjusterZoom((z) => Math.max(1, z - 0.1))}
                              className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                              <ZoomOut className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={0.02}
                              value={adjusterZoom}
                              onChange={(e) => setAdjusterZoom(Number(e.target.value))}
                              className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-[var(--brand)]"
                            />
                            <button
                              type="button"
                              onClick={() => setAdjusterZoom((z) => Math.min(3, z + 0.1))}
                              className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                              <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                          </div>

                          {/* Rotate + Reset row */}
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setAdjusterRotation((r) => r + 90)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                border border-slate-200 hover:bg-slate-50
                                text-xs font-medium text-slate-600 transition-colors"
                            >
                              <RotateCw className="h-3 w-3" />
                              Rotate
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjusterPos({ x: 0, y: 0 });
                                setAdjusterZoom(1);
                                setAdjusterRotation(0);
                              }}
                              className="text-xs text-[var(--brand)] hover:underline font-medium"
                            >
                              Reset
                            </button>
                          </div>

                          {/* Back / Apply buttons */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjusterStep('pick')}
                              className="flex-1 px-3 py-2 rounded-lg border border-slate-200
                                text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={handleAdjusterConfirm}
                              className="flex-1 px-3 py-2 rounded-lg bg-[var(--brand)]
                                text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                              Apply
                            </button>
                          </div>
                        </div>

                      ) : (
                        /* ── NORMAL PREVIEW ── */
                        <div className="w-75 h-75 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                          {(tempImage || storedProfileImageUrl) ? (
                            <img
                              src={tempImage || storedProfileImageUrl || ''}
                              alt="Current profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-[180px] h-[180px] flex items-center justify-center bg-[var(--brand)] text-white text-4xl font-bold select-none">
                              {getInitial()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Upload / Adjust buttons — hidden during crop */}
                    {adjusterStep !== 'crop' && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                            border border-slate-200 bg-slate-50 hover:border-[var(--brand)] hover:bg-blue-50
                            transition-all duration-150 text-sm font-medium text-slate-700"
                        >
                          <Upload className="h-4 w-4" />
                          Upload from device
                        </button>

                        {(storedProfileImageUrl || tempImage) && (
                          <button
                            type="button"
                            onClick={() => void handleAdjustCurrentPhoto()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                              border border-slate-200 bg-slate-50 hover:border-[var(--brand)] hover:bg-blue-50
                              transition-all duration-150 text-sm font-medium text-slate-700"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Adjust current photo
                          </button>
                        )}

                        <div className="flex-1" />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAdjusterCancel}
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200
                              text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!tempImage}
                            onClick={() => setAdjusterOpen(false)}
                            className="flex-1 px-4 py-2 rounded-lg bg-[var(--brand)] text-sm font-semibold
                              text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── RIGHT: Avatar grid — hidden during crop ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-600 mb-4">
                          Professional illustrations
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {professionalIllustrations.map(renderIllustrationButton)}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-600 mb-4">
                          Casual illustrations
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {casualIllustrations.map(renderIllustrationButton)}
                        </div>
                      </div>
                    </div>

                  {/* When in crop mode, fill remaining space with a subtle bg */}
                  {/* {adjusterStep === 'crop' && (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                      <p className="text-sm text-slate-400 text-center px-8">
                        Drag the image to reposition.<br />
                        Use the slider to zoom in or out.
                      </p>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          )}

          {/* Name / email / role / status pill */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{displayName}</h2>
              {user?.trlId && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600 tracking-wide">
                  {user.trlId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-400">{user?.officialEmail ?? '—'}</span>
              {user?.role?.roleName && (
                <>
                  <span className="text-slate-300 select-none">·</span>
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {user.role.roleName}
                  </span>
                </>
              )}
            </div>
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border',
                user?.isActive
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-500 border-red-200'
              )}
            >
              {user?.isActive ? 'Active account' : 'Inactive'}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══ */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4">
            {/* Personal Identity */}
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                  <Shield className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Personal Identity
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" 
                  className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    First name
                  </label>
                  {isEditing ? (
                    <Input
                    id ="firstName"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <FieldReadOnly>{user?.firstName || '—'}</FieldReadOnly>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName"
                  className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    Last name
                  </label>
                  {isEditing ? (
                    <Input
                    id = "lastName"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <FieldReadOnly>{user?.lastName || '—'}</FieldReadOnly>
                  )}
                </div>

                <div className="col-span-2">
                  <label 
                  htmlFor="officialEmail"
                  className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    Email address
                  </label>
                  {isEditing ? (
                    <Input
                      id = "officialEmail"
                      type="email"
                      value={form.officialEmail}
                      onChange={(e) => setForm((f) => ({ ...f, officialEmail: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <FieldReadOnly icon={Mail}>{user?.officialEmail ?? '—'}</FieldReadOnly>
                  )}
                </div>

                <div className="col-span-2"><label
  htmlFor="primaryPhone"
  className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2"
>
  Phone number
</label>

{isEditing ? (
  <PhoneField
  id="primarPhone"
    value={form.primaryPhone}
    onChange={(val) =>
      setForm((f) => ({ ...f, primaryPhone: val }))
    }
  />
) : (
  <FieldReadOnly icon={Phone}>
    {user?.primaryPhone || '—'}
  </FieldReadOnly>
)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { AppDispatch } from '../../store/index';
import Loader from '../../components/loader/index';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { resetPasswordRequest } from '../../store/action/authentication.action';
import { cn } from '../../lib/utils';

interface ResetPasswordInputs {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const RULES = [
  { id: 'len',  label: '8+ characters',      test: (v: string) => v.length >= 8 },
  { id: 'up',   label: 'Uppercase letter',    test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lo',   label: 'Lowercase letter',    test: (v: string) => /[a-z]/.test(v) },
  { id: 'num',  label: '2+ numbers',          test: (v: string) => (v.match(/\d/g) || []).length >= 2 },
  { id: 'sp',   label: 'Special character',   test: (v: string) => /[@$!%*?&]/.test(v) },
];

function getStrength(password: string): number {
  return RULES.filter((r) => r.test(password)).length;
}

function StrengthBar({ value }: { value: number }) {
  const pct = Math.round((value / 5) * 100);
  let config;

    if(pct <= 40){
      config =  { color: '#E24B4A', label: 'Weak',   labelColor: '#A32D2D' } ;
    }
    else if(pct <= 60)
      config = { color: '#EF9F27', label: 'Fair',   labelColor: '#854F0B' } ;

   else if(pct <= 80)
    config = { color: '#97C459', label: 'Good',   labelColor: '#3B6D11' } ;
      else
              config =  { color: '#639922', label: 'Strong',  labelColor: '#27500A' };

  if (!pct) return null;
  return (
    <div className="mt-1.5">
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: config.color }}
        />
      </div>
      <p className="text-[11px] mt-1" style={{ color: config.labelColor }}>
        {config.label}
      </p>
    </div>
  );
}

function PasswordInput({
  id,
  placeholder,
  registration,
  hasError,
}: {
  id: string;
  placeholder: string;
  registration: object;
  hasError?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        {...registration}
        className={cn(
          'w-full pl-9 pr-9 py-2 text-sm border rounded-lg bg-white text-slate-800 outline-none transition-all placeholder:text-slate-400',
          'focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]',
          hasError ? 'border-red-400' : 'border-slate-200'
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show
          ? <EyeOff className="h-3.5 w-3.5" />
          : <Eye className="h-3.5 w-3.5" />
        }
      </button>
    </div>
  );
}

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordInputs>({ mode: 'onChange' });

  useEffect(() => {
    const sub = watch((value, { name }) => {
      if (name === 'newPassword') setStrength(getStrength(value.newPassword || ''));
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const newPassword = watch('newPassword') || '';
  const oldPassword = watch('oldPassword') || '';

  const onSubmit = async (data: ResetPasswordInputs) => {
    setIsLoading(true);
    try {
      const userId = 1;
      await dispatch(
        resetPasswordRequest({ oldPassword: data.oldPassword, newPassword: data.newPassword, userId })
      ).unwrap();
      showSuccessSnackbar('Password successfully reset');
      navigate('/login');
    } catch (error) {
      showErrorSnackbar((error as string) || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border shadow-md border-slate-200 rounded-xl overflow-hidden w-full mx-auto overflow-y-auto">
      {isLoading && <Loader />}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
          <KeyRound className="h-4 w-4 text-[#534AB7]" />
        </div>
        <div>
          <p className="text-m font-semibold text-slate-700">Reset password</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Update your account password securely</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 space-y-3">

        {/* Current password */}
        <div className="space-y-1.5">
          <label 
          htmlFor="oldPassword"
          className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Current password
          </label>
          <PasswordInput
            id="oldPassword"
            placeholder="Enter current password"
            registration={register('oldPassword', { required: 'Please enter your current password' })}
            hasError={!!errors.oldPassword}
          />
          <p className="text-[11px] text-red-500 min-h-[15px]">{errors.oldPassword?.message}</p>
        </div>

        <hr className="border-slate-100" />

        {/* New password */}
        <div className="space-y-1.5">
          <label
          htmlFor="confirmPassword"
           className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            New password
          </label>
          <PasswordInput
            id="newPassword"
            placeholder="Enter new password"
            registration={register('newPassword', {
              required: 'Please enter a new password',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: {
                hasUpperCase: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                hasLowerCase: (v) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
                hasTwoNumbers: (v) => (v.match(/\d/g) || []).length >= 2 || 'Must contain 2+ numbers',
                hasSpecialChar: (v) => /[@$!%*?&]/.test(v) || 'Must contain a special character',
                notSameAsOld: (v) => v !== getValues('oldPassword') || 'Must differ from current password',
              },
            })}
            hasError={!!errors.newPassword}
          />
          {newPassword && <StrengthBar value={strength} />}
          <p className="text-[11px] text-red-500 min-h-[15px]">{errors.newPassword?.message}</p>
        </div>

        {/* Password rules */}
        {newPassword && (
          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3">
            {RULES.map((r) => {
              const ok = r.test(newPassword);
              return (
                <div key={r.id} className={cn('flex items-center gap-1.5 text-[11px] transition-colors', ok ? 'text-[#3B6D11]' : 'text-slate-400')}>
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors', ok ? 'bg-[#3B6D11]' : 'bg-slate-300')} />
                  {r.label}
                </div>
              );
            })}
            <div className={cn('flex items-center gap-1.5 text-[11px] transition-colors', (newPassword !== oldPassword && newPassword.length > 0) ? 'text-[#3B6D11]' : 'text-slate-400')}>
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors', (newPassword !== oldPassword && newPassword.length > 0) ? 'bg-[#3B6D11]' : 'bg-slate-300')} />
              Differs from current
            </div>
          </div>
        )}

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label  htmlFor="confirmPassword"
           className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter new password"
            registration={register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (v) => v === getValues('newPassword') || 'Passwords do not match',
            })}
            hasError={!!errors.confirmPassword}
          />
          <p className="text-[11px] text-red-500 min-h-[15px]">{errors.confirmPassword?.message}</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
            'bg-[var(--brand)] hover:[var(--brand)]  text-white disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Reset password
        </button>

      </form>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </div>
  );
};

export default ResetPassword;
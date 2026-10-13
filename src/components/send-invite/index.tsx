import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { EMAIL_VALIDATION_REGEX } from '../../constants/regex-patterns';
import { fetchRoles } from '../../store/action/roles.action';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { ApiResponse, InviteUserResponse, Role } from '../../store/model';
import { HttpStatusCode } from '../../constants';
import { registerUser } from '../../store/action/users.action';
import CustomizedSnackbars from '../customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { closeDialog } from '../../store/reducers/dialog-state.reducer';
import { ChevronDown, Mail, UserPlus, Loader2, Send } from 'lucide-react';
import PhoneField from '../../components/form/PhoneField';

const inviteSchema = yup.object().shape({
  firstName: yup.string().required('First name is required').min(2).max(50),
  lastName: yup.string().optional(),
  email: yup
    .string()
    .required('Email is required')
    .test('contains-at', 'Email must contain @ symbol', (value) =>
      EMAIL_VALIDATION_REGEX.CONTAINS_AT.test(value || '')
    )
    .test('contains-dot', 'Email must contain a dot (.)', (value) =>
      EMAIL_VALIDATION_REGEX.CONTAINS_DOT.test(value || '')
    )
    .matches(EMAIL_VALIDATION_REGEX.VALID_CHARS, 'Invalid email format')
    .max(100),
  phone: yup
    .string()
    .required('Phone number is required')
     .test('ten-digits', 'Must be exactly 10 digits', (value) => {
      if (!value) return false;
      const digits = value.replace(/^\+91\s?/, '').replace(/\D/g, ''); // strip country code
      return /^[0-9]{10}$/.test(digits);
    }),
  role: yup.number().typeError('Role is required').required('Role is required'),
  trlId: yup.string().optional(),
});
type InviteFormData = yup.InferType<typeof inviteSchema>;

const SendInvite = ({ onSuccess }: { onSuccess?: () => void }) => {
  const dispatch = useDispatch();
  const { roles } = useAppSelector((state: RootState) => state?.rolesSelector || []);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const [isSubmitting, setIsSubmitting] = useState(false); // ← loader state

  const {
    snackbarState,
    showSuccessSnackbar,
    showErrorSnackbar,
    showWarningSnackbar,
    handleSnackbarClose,
  } = useSnackbar();

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<InviteFormData>({
    resolver: yupResolver(inviteSchema),
    mode: 'all',
    defaultValues: { phone: '+91' },
  });
  const formatRoleName = (name: string) => {
    return name
      .toLowerCase()                 
      .replace(/_/g, ' ')           
      .replace(/\b\w/g, c => c.toUpperCase()); 
  };

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true); // ← start loader
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        officialEmail: data.email,
        primaryPhone: data.phone,
        roleId: { id: data.role },
        createdBy: { id: user?.id },
        trlId: data.trlId || undefined,
      };
      const response: ApiResponse<InviteUserResponse> = await dispatch(
        registerUser(payload)
      ).unwrap();

      if (response?.success && response?.statusCode === HttpStatusCode.CREATED) {
        showSuccessSnackbar(response?.message ?? 'Invite sent successfully!');
        setTimeout(() => {
          dispatch(closeDialog());
          reset();
          onSuccess?.();
        }, 1500);
      } else if (response?.statusCode === HttpStatusCode.CONFLICT) {
        showWarningSnackbar(response?.message ?? 'Email already exists!');
      } else {
        showErrorSnackbar(response?.message || 'Failed to send invite');
      }
    } catch (error) {
      showErrorSnackbar('Unexpected error occurred');
    } finally {
      setIsSubmitting(false); // ← stop loader
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 w-full mx-auto max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-7">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-full border border-blue-200">
          <UserPlus className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Invite team member</h2>
          <p className="text-xs text-slate-500 mt-1">Add a new user to your workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* First + Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              First Name
              {/* <span className="text-red-500">  *</span> */}
              <span className="text-red-500 text-lg font-semibold relative top-[1px]"> *</span>
            </label>
            <input
              {...register('firstName')}
              placeholder="Jane"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-colors"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Last Name
                <span className="text-red-500 text-lg font-semibold relative top-[1px]"> </span>
              </label>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded px-2 py-0.5 uppercase">
                optional
              </span>
            </div>
            <input
              {...register('lastName')}
              placeholder="Smith"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Email Address
            <span className="text-red-500 text-lg font-semibold relative top-[1px]"> *</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register('email')}
              placeholder="jane@company.com"
              className="w-full px-3.5 py-2.5 pl-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-colors"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone — max 10 digits */}
        <div className='space-y-1'>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Phone Number
            <span className="text-red-500 text-lg font-semibold relative top-[1px]"> *</span>
          </label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneField
              value={field.value ?? '+91'}
              error={errors.phone?.message}
              onChange={field.onChange}
            />
          )}
        />
        </div>

        <hr className="border-slate-200 my-1" />

        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Assign Role
            <span className="text-red-500 text-lg font-semibold relative top-[1px]"> *</span>
          </label>
          <div className="relative">
            <select
              {...register('role', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select a role…</option>
              {roles?.map((role: Role) => (
                <option key={role.id} value={role.id}>
                  {formatRoleName(role.roleName)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {errors.role && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.role.message}</p>
          )}
        </div>

        {/* TRL ID (optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              TRL ID
            </label>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded px-2 py-0.5 uppercase">
              optional
            </span>
          </div>
          <input
            {...register('trlId')}
            placeholder="e.g. TRL-0042"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-colors font-mono"
          />
        </div>

        <hr className="border-slate-200 my-1" />

        {/* Submit with loader */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-semibold text-white 
             bg-[var(--brand)] hover:bg-[var(--brand)]
             shadow-md hover:shadow-lg 
             disabled:opacity-50 disabled:cursor-not-allowed 
             transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send invitation
            </>
          )}
        </button>
      </form>

      <CustomizedSnackbars {...snackbarState} handleClose={handleSnackbarClose} />
    </div>
  );
};

export default SendInvite;

import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/index';
import { Mail, Lock } from 'lucide-react';
import backgroundImage from '../../assets/Option 2.jpeg';
import tringappsLogo from '../../assets/tringapps-logo.png';
import Loader from '../../components/loader/index';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { forgetPasswordRequest } from '../../store/action/authentication.action';
import { validateEmail } from '../login';

interface ForgetPasswordInputs {
  officialEmail: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgetPasswordInputs>({
    mode: 'onChange',
    defaultValues: {
      officialEmail: '',
    },
  });

  const onSubmit = async (data: ForgetPasswordInputs) => {
    setIsLoading(true);
    try {
      await dispatch(
        forgetPasswordRequest({
          validateEmail: data.officialEmail,
        })
      ).unwrap();

      showSuccessSnackbar('Password reset instructions sent to your email');
      navigate('/login');
    } catch (error) {
      showErrorSnackbar((error as string) || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-5 flex flex-col items-center">
          <img src={tringappsLogo} alt="Tringapps" className="h-5 object-contain" style={{ filter: 'brightness(0) opacity(0.6)' }} />
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1a3a6b]">TA TRACKER</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your email to receive reset instructions
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="overflow-hidden rounded-2xl bg-white/90 shadow-xl ring-1 ring-white/50 backdrop-blur-sm">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="officialEmail" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="officialEmail"
                    type="email"
                    placeholder="you@company.com"
                    className={`w-full pl-10 h-11 rounded-xl border border-gray-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ${
                      errors.officialEmail ? 'border-red-500' : ''
                    }`}
                    {...register('officialEmail', {
                      required: 'Please fill in the Email ID',
                      validate: {
                        validEmail: (value) =>
                          validateEmail(value) || 'Please enter a valid email ID',
                      },
                    })}
                  />
                </div>
                {errors.officialEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.officialEmail.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium transition-all hover:from-blue-700 hover:to-blue-600 disabled:opacity-70 shadow-md shadow-blue-200"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>

        {/* Company Branding */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="h-3 w-3" />
          <span>Secure connection</span>
          <span className="mx-1">·</span>
          <span>Developed by</span>
          <img src={tringappsLogo} alt="Tringapps" className="h-3 object-contain" style={{ filter: 'brightness(0) opacity(0.4)' }} />
        </div>
      </div>

      {/* Loader and Snackbar */}
      {isLoading && <Loader />}
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </div>
  );
};

export default ForgotPassword;

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/index';
import { ChevronRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Loader from '../../components/loader/index';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { encrypt, decrypt } from '../../utils/encryption';
import { useSnackbar } from '../../utils/snackbar-function';
import { login } from '../../store/action/authentication.action';
import backgroundImage from '../../assets/Option 2.jpeg';
import tringappsLogo from '../../assets/tringapps-logo.png';
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(String(email).toLowerCase());
};

const Login: React.FC = () => {
  const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  useEffect(() => {
    const rememberedEmail = sessionStorage.getItem('tempEmail');
    if (rememberedEmail) {
      setFormState((prev) => ({ ...prev, email: rememberedEmail }));
      sessionStorage.removeItem('tempEmail'); // Clean up after use
    }
    const storedEmail = localStorage.getItem('rememberedEmail');
    const storedPassword = localStorage.getItem('rememberedPassword');
    if (storedEmail && storedPassword) {
      setFormState({
        email: decrypt(storedEmail, ENCRYPTION_KEY),
        password: decrypt(storedPassword, ENCRYPTION_KEY),
        rememberMe: true,
      });
    }
  }, [ENCRYPTION_KEY]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;

    setFormState((prev) => ({ ...prev, [name]: newValue }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {
      email: '',
      password: '',
    };

    if (!formState.email) {
      errors.email = 'Please fill in the Email ID';
    } else if (!validateEmail(formState.email)) {
      errors.email = 'Please enter a valid email ID';
    }

    if (!formState.password) {
      errors.password = 'Please fill in the Password';
    }

    setFormErrors(errors);
    return !errors.email && !errors.password;
  }, [formState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await dispatch(
        login({
          email: formState.email,
          password: formState.password,
        })
      ).unwrap();

      showSuccessSnackbar('Login Successful');

      if (formState.rememberMe) {
        localStorage.setItem('rememberedEmail', encrypt(formState.email, ENCRYPTION_KEY));
        localStorage.setItem('rememberedPassword', encrypt(formState.password, ENCRYPTION_KEY));
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      navigate('/dashboard');
    } catch (error) {
      showErrorSnackbar((error as string) || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
const [show, setShow] = useState(false);
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
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="overflow-hidden rounded-2xl bg-white/90 shadow-xl ring-1 ring-white/50 backdrop-blur-sm">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formState.email}
                    onChange={handleChange}
                    className={`w-full pl-10 h-11 rounded-xl border border-gray-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={formState.password}
                    onChange={handleChange}
                    className={`w-full pl-10 h-11 rounded-xl border border-gray-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ${
                      formErrors.password ? 'border-red-500' : ''
                    }`}
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
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium transition-all hover:from-blue-700 hover:to-blue-600 disabled:opacity-70 shadow-md shadow-blue-200"
              >
                <span className="relative flex items-center justify-center">
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign in
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>Don't have an account? <b>ta@tringapps.net</b></span>
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

export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import type { AppDispatch } from '../../store/index';
import { recoverPasswordRequest } from '../../store/action/authentication.action';
import CustomizedSnackbars from '../../components/customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import Loader from '../../components/loader';
import styles from './recover-password.module.css';

type FormInputs = {
  newPassword: string;
  confirmPassword: string;
};

const RecoverPassword: React.FC = () => {
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormInputs>();

  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('resetToken');
    if (token) {
      setResetToken(token);
    } else {
      setGeneralError('Invalid reset link. Please request a new password reset link.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [location, navigate]);

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return 'Please enter a new password';
    }

    if (value.length < 8) {
      return 'Password should contain at least 8 characters.';
    }

    const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
    const numberPattern = /[0-9]/g;
    const uppercasePattern = /[A-Z]/;
    const lowercasePattern = /[a-z]/;

    if (!specialCharPattern.test(value)) {
      return 'Password should contain at least one special character.';
    }

    if ((value.match(numberPattern) || []).length < 2) {
      return 'Password should contain at least two numerical digits.';
    }

    if (!uppercasePattern.test(value) || !lowercasePattern.test(value)) {
      return 'Password must include at least one uppercase letter, one lowercase letter, two numbers, and one special character';
    }

    return true;
  };

  const onSubmit = async (data: FormInputs) => {
    setGeneralError('');
    setIsLoading(true);

    try {
      await dispatch(
        recoverPasswordRequest({
          newPassword: data.newPassword,
        })
      ).unwrap();

      showSuccessSnackbar('Password successfully recovered');
      reset();

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = (error as string) || 'Failed to recover password. Please try again.';
      showErrorSnackbar(errorMessage);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className={styles.outerContainer}>
        <div className={styles.innerContainer}>
          <div className={styles.errorMessage}>{generalError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.outerContainer}>
      <div className={styles.innerContainer}>
        {isLoading && <Loader />}
        <div className={styles.formWrapper}>
          <h2 className={styles.recover}>Recover Password</h2>
          <p className={styles.recoverSubtext}>Enter your new password</p>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {generalError && <div className={styles.errorMessage}>{generalError}</div>}

            <div className={styles.inputGroup}>
              {errors.newPassword && (
                <div className={styles.errorMessage}>{errors.newPassword.message}</div>
              )}
              <input
                type="password"
                placeholder="New Password"
                {...register('newPassword', {
                  validate: validatePassword,
                })}
                className={errors.newPassword ? styles.errorInput : ''}
              />
            </div>

            <div className={styles.inputGroup}>
              {errors.confirmPassword && (
                <div className={styles.errorMessage}>{errors.confirmPassword.message}</div>
              )}
              <input
                type="password"
                placeholder="Confirm New Password"
                {...register('confirmPassword', {
                  validate: (value) => value === watch('newPassword') || 'Passwords do not match',
                })}
                className={errors.confirmPassword ? styles.errorInput : ''}
              />
            </div>

            <button type="submit" className={styles.recoverButton} disabled={isLoading}>
              {isLoading ? 'Setting New Password...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </div>
  );
};

export default RecoverPassword;

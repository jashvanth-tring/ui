import { useState } from 'react';
import { Stepper, Step, StepLabel, Button, TextField, Box, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

const StepperForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const steps = ['Login', 'Register'];

   
  const onSubmitLogin = () => {
    // console.log('Login Data:', data);
    setActiveStep(activeStep + 1);
  };

   
  const onSubmitRegister = () => {
    // console.log('Registration Data:', data);
    // Handle registration logic
    setActiveStep(activeStep + 1);
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box>
          <Typography variant="h6">Login</Typography>
          <form onSubmit={handleSubmit(onSubmitLogin)}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email}
              helperText={typeof errors.email?.message === 'string' ? errors.email.message : ''}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={
                typeof errors.password?.message === 'string' ? errors.password?.message : ''
              }
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Login
            </Button>
          </form>
        </Box>
      );
    }

    if (activeStep === 1) {
      return (
        <Box>
          <Typography variant="h6">Register</Typography>
          <form onSubmit={handleSubmit(onSubmitRegister)}>
            <TextField
              label="Full Name"
              fullWidth
              {...register('fullName', { required: 'Full name is required' })}
              error={!!errors.fullName}
              helperText={
                typeof errors.fullName?.message === 'string' ? errors.fullName?.message : ''
              }
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email}
              helperText={typeof errors.email?.message === 'string' ? errors.email?.message : ''}
            />
            <TextField
              label="Phone Number"
              type="text"
              fullWidth
              {...register('phoneNumber', { required: 'Phone number is required' })}
              error={!!errors.phoneNumber}
              helperText={
                typeof errors.phoneNumber?.message === 'string' ? errors.phoneNumber?.message : ''
              }
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={
                typeof errors.password?.message === 'string' ? errors.password?.message : ''
              }
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Register
            </Button>
          </form>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ width: '100%', padding: '20px' }}>
      <Stepper activeStep={activeStep} alternativeLabel orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 3 }}>{renderStepContent()}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(activeStep - 1)}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setActiveStep(activeStep + 1)}
          disabled={activeStep === steps.length - 1}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default StepperForm;

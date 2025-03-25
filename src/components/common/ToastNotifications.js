import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, severity = 'info', duration = 6000 }) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, severity, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => {
    addToast({ message, severity: 'success' });
  }, [addToast]);

  const showError = useCallback((message) => {
    addToast({ message, severity: 'error' });
  }, [addToast]);

  const showWarning = useCallback((message) => {
    addToast({ message, severity: 'warning' });
  }, [addToast]);

  const showInfo = useCallback((message) => {
    addToast({ message, severity: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.severity}
            sx={{ width: '100%' }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => removeToast(toast.id)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

// Example usage:
/*
import { useToast } from './ToastNotifications';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!');
  };

  const handleWarning = () => {
    showWarning('Please review your input!');
  };

  const handleInfo = () => {
    showInfo('New updates available!');
  };

  return (
    // Your component JSX
  );
};
*/ 
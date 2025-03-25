import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, Box, Typography } from '@mui/material';
import { CloudOff as CloudOffIcon, CloudDone as CloudDoneIcon } from '@mui/icons-material';

const OfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false);
  };

  const handleCloseOnlineAlert = () => {
    setShowOnlineAlert(false);
  };

  return (
    <>
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={handleCloseOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseOfflineAlert}
          severity="warning"
          icon={<CloudOffIcon />}
          sx={{ width: '100%' }}
        >
          You are currently offline. Some features may be limited.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={6000}
        onClose={handleCloseOnlineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseOnlineAlert}
          severity="success"
          icon={<CloudDoneIcon />}
          sx={{ width: '100%' }}
        >
          You are back online!
        </Alert>
      </Snackbar>

      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CloudOffIcon sx={{ mr: 1 }} />
          <Typography variant="body2">
            You are offline. Some features may be limited.
          </Typography>
        </Box>
      )}
    </>
  );
};

export default OfflineSupport; 
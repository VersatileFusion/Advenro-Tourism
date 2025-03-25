import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

const LoadingSpinner = ({ 
  open = false, 
  message = 'Loading...',
  fullScreen = false,
  size = 40,
  thickness = 3.6
}) => {
  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={open}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <CircularProgress
            size={size}
            thickness={thickness}
            color="inherit"
          />
          {message && (
            <Typography variant="h6" color="inherit">
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={3}
      gap={2}
    >
      <CircularProgress
        size={size}
        thickness={thickness}
        color="primary"
      />
      {message && (
        <Typography variant="body1" color="textSecondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;

// Example usage:
/*
import LoadingSpinner from './LoadingSpinner';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleSomeAsyncOperation = async () => {
    setLoading(true);
    try {
      // Your async operation here
      await someAsyncOperation();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingSpinner
        open={loading}
        message="Processing your request..."
        fullScreen={true}
      />
      {/* Rest of your component */}
    </>
  );
};
*/ 
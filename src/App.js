import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ToastProvider } from './components/common/ToastNotifications';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';

// Layout components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

// Page components
import Home from './pages/Home';
import AdminDashboard from './components/admin/AdminDashboard';
import Documentation from './components/docs/Documentation';
import BookingComIntegration from './components/hotels/BookingComIntegration';
import OfflineSupport from './components/common/OfflineSupport';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Layout>
                <OfflineSupport />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/docs" element={<Documentation />} />
                  <Route
                    path="/admin"
                    element={
                      <PrivateRoute>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/hotels/booking"
                    element={<BookingComIntegration />}
                  />
                </Routes>
              </Layout>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 
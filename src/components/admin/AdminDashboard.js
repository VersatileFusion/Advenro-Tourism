import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import { 
  People as PeopleIcon, 
  Hotel as HotelIcon, 
  Flight as FlightIcon,
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  LocalActivity as LocalActivityIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    hotels: 0,
    flights: 0,
    restaurants: 0,
    events: 0,
    localServices: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Icon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Users" value={stats.users} icon={PeopleIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Hotels" value={stats.hotels} icon={HotelIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Flights" value={stats.flights} icon={FlightIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Restaurants" value={stats.restaurants} icon={RestaurantIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Events" value={stats.events} icon={EventIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Local Services" value={stats.localServices} icon={LocalActivityIcon} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, Grid, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
   //npm start
   //  localStorage.removeItem("userData"); 
    navigate("/login"); 
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ✅ Top Navbar */}
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

    
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
          Welcome to Your Dashboard
        </Typography>

        {/* ✅ Grid Layout for Cards */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h4" color="primary">1,250</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6">Active Sessions</Typography>
              <Typography variant="h4" color="secondary">320</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6">New Signups</Typography>
              <Typography variant="h4" color="success.main">85</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;

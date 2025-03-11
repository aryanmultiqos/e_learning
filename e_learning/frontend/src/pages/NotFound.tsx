import React from "react";
import  {Link} from "react-router-dom"
import { Box, Typography, Button } from "@mui/material";

const NotFound: React.FC = () => {

    return (
        <Box
          sx={{
            textAlign: "center",
            mt: 10,
          }}
        >
          <Typography variant="h2" color="error">
            404
          </Typography>
          <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
            Oops! Page not found.
          </Typography>
          <Button variant="contained" color="primary" component={Link} to="/login">
            Go Home
          </Button>
        </Box>
      );
    };
    
    export default NotFound;
    

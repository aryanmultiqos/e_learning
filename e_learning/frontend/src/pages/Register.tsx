import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

import { LockOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

interface IRegForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const schema = yup.object().shape({
  fullName: yup
    .string()
    .min(3, "Full Name must be at least 3 characters")
    .required("Full Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  password: yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const Register: React.FC = () => {
  const navigate = useNavigate(); 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IRegForm>({
    resolver: yupResolver(schema),
  });

  const [storedData, setStoredData] = useState<IRegForm | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      setStoredData(JSON.parse(savedData));
    }
  }, []);

  const onSubmit: SubmitHandler<IRegForm> = (data) => {
    console.log("Form Data:", data);

    localStorage.setItem("userData", JSON.stringify(data));

    setStoredData(data);

    alert("Registration Successful! Data saved in Local Storage.");

    navigate("/");
};

 

  return (
    <Container maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          mt: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.light" }}>
          <LockOutlined />
        </Avatar>
        <Typography variant="h5">Register</Typography>
        <Box sx={{ mt: 3 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Full Name" {...register("fullName")} />
                <span style={{ color: "red", fontSize: "12px" }}>{errors.fullName?.message}</span>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Email Address" {...register("email")} />
                <span style={{ color: "red", fontSize: "12px" }}>{errors.email?.message}</span>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" {...register("phone")} />
                <span style={{ color: "red", fontSize: "12px" }}>{errors.phone?.message}</span>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Password" type="password" {...register("password")} />
                <span style={{ color: "red", fontSize: "12px" }}>{errors.password?.message}</span>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Confirm Password" type="password" {...register("confirmPassword")} />
                <span style={{ color: "red", fontSize: "12px" }}>{errors.confirmPassword?.message}</span>
              </Grid>
            </Grid>

            <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} type="submit">
              Register
            </Button>
          </form>

      

          <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
            <Grid item>
              <Link to="/login">Already have an account? Login</Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;

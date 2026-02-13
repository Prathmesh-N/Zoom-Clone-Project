import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import Snackbar from "@mui/material/Snackbar";
import { useNavigate, useSearchParams } from "react-router-dom";

const defaultTheme = createTheme({
  palette: {
    primary: { main: "#ff6b3d" },
    text: { primary: "#1e1e1e", secondary: "#6b6b6b" },
    background: { default: "#f7f4ef", paper: "#ffffff" },
  },
  typography: {
    fontFamily: '"Work Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    h5: {
      fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
      fontWeight: 700,
    },
  },
  shape: { borderRadius: 16 },
});

const getModeFromQuery = (searchParams) => {
  return searchParams.get("mode") === "login" ? "login" : "register";
};

export default function Authentication() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [mode, setMode] = React.useState(getModeFromQuery(searchParams));
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  React.useEffect(() => {
    setMode(getModeFromQuery(searchParams));
    setError("");
  }, [searchParams]);

  const switchMode = (nextMode) => {
    setSearchParams({ mode: nextMode });
  };

  const handleAuth = async () => {
    try {
      if (mode === "register") {
        const result = await handleRegister(email, username, password);
        setPassword("");
        setEmail("");
        setMessage(`${result}. Please log in to continue.`);
        setOpen(true);
        setError("");
        switchMode("login");
        return;
      }

      const result = await handleLogin(username, password);
      if (result) {
        setUsername("");
        setPassword("");
        setError("");
        setMessage("Login Successful");
        setOpen(true);
        navigate("/home");
      }
    } catch (err) {
      const errMessage = err.response?.data?.message || "Something went wrong";
      setError(errMessage);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid
        container
        component="main"
        sx={{
          height: "100vh",
          background: "#f7f4ef",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CssBaseline />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "#ff6b3d" }}>
              <LockOutlinedIcon />
            </Avatar>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                bgcolor: "#f7f4ef",
                border: "1px solid #e6e0d8",
                borderRadius: 999,
                p: 0.4,
                mb: 1,
              }}
            >
              <Button
                variant={mode === "register" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: 999, px: 2.5 }}
                onClick={() => {
                  switchMode("register");
                }}
              >
                Sign Up
              </Button>
              <Button
                variant={mode === "login" ? "contained" : "outlined"}
                sx={{ textTransform: "none", borderRadius: 999, px: 2.5 }}
                onClick={() => {
                  switchMode("login");
                }}
              >
                Sign In
              </Button>
            </Box>

            <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
              {mode === "register" ? (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  autoFocus
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                />
              ) : null}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                autoFocus
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                sx={{ backgroundColor: "#fff", borderRadius: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                sx={{ backgroundColor: "#fff", borderRadius: 2 }}
              />

              <p style={{ color: "#c2410c", margin: "0.25rem 0 0" }}>{error}</p>

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  textTransform: "none",
                  borderRadius: 999,
                  py: 1.1,
                  boxShadow: "0 12px 24px rgba(232, 168, 149, 0.3)",
                }}
                onClick={handleAuth}
              >
                {mode === "register" ? "Register" : "Login"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={4000} message={message} />
    </ThemeProvider>
  );
}

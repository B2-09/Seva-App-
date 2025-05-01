import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Box,
    Link,
    Alert,
} from '@mui/material';
import { Lock, Person, Login } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Define a styled component for the card with a gradient background
const GradientCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(to bottom, #6a1b9a, #3f51b5)',
    color: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
    },
}));

// Define a styled component for the card content
const GradientCardContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
}));

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        // Simulate API call and JWT token
        try {
            const response = await fetch('http://localhost:5000/api/login', { // Corrected URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.token);
                navigate('/home');
            } else {
                setError(data.message || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #e0f2f1, #b2ebf2)' }}>
            <Grid item xs={12} sm={8} md={6} lg={4}>
                <GradientCard>
                    <GradientCardContent>
                        <Login sx={{ fontSize: 40, color: 'white', marginBottom: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom style={{ color: 'white' }}>
                            Login
                        </Typography>
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                required
                                fullWidth
                                InputProps={{
                                    startAdornment: <Person sx={{ color: 'white' }} />,
                                    style: { color: 'white' },
                                }}
                                InputLabelProps={{
                                    style: { color: 'white' },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'white',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                        },
                                        '& input': {
                                            color: 'white',
                                        },
                                        '& svg': {
                                            color: 'white',
                                        },
                                    },
                                }}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                                fullWidth
                                InputProps={{
                                    startAdornment: <Lock sx={{ color: 'white' }} />,
                                    style: { color: 'white' },
                                }}
                                InputLabelProps={{
                                    style: { color: 'white' },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'white',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                        },
                                        '& input': {
                                            color: 'white',
                                        },
                                        '& svg': {
                                            color: 'white',
                                        },
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                style={{ marginTop: '16px', width: '100%', backgroundColor: 'white', color: '#3f51b5', fontWeight: 'bold' }}
                            >
                                {loading ? 'Loading...' : 'Login'}
                            </Button>
                            <Box mt={2}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => navigate('/signup')} // Use navigate
                                    style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                                >
                                    Not registered yet? Register
                                </Link>
                            </Box>
                        </form>
                        {error && (
                            <Alert severity="error" style={{ marginTop: '16px', color: 'white', backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
                                {error}
                            </Alert>
                        )}
                    </GradientCardContent>
                </GradientCard>
            </Grid>
        </Grid>
    );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const handleLogin = (userToken) => {
        setToken(userToken);
        localStorage.setItem('token', userToken);
        navigate('/home');
    };

    const handleSignup = (userToken) => {
        setToken(userToken);
        localStorage.setItem('token', userToken);
        navigate('/home');
    };

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        if (token) {
            navigate('/home');
        }
    }, [navigate, token]);

    return (
        <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupPage onSignup={handleSignup} />} />
            <Route path="/home" element={<HomePage onLogout={handleLogout} />} />
            <Route path="/" element={<HomePage onLogout={handleLogout} />} />
        </Routes>
    );
};

export default App;
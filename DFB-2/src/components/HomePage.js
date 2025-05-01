import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Grid, Tabs, Tab, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CreateDynamicForm from './CreateDynamicForm';
import ManageDynamicForm from './ManageDynamicForm';
import PreviewDynamicForm from './PreviewDynamicForm';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = ({ onLogout }) => {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [forms, setForms] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const fetchUserData = async () => {
                try {
                    const response = await fetch('http://localhost:5000/api/user', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    } else {
                        localStorage.removeItem('token');
                        navigate('/login');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            };

            fetchUserData();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const updateForms = (newForm) => {
        setForms(prev => [...prev, newForm]);
    };

    const handleSectionClick = (section) => {
        setSelectedSection(section);
    };

    const renderContent = () => {
        if (selectedSection === 'UI') {
            return (
                <Box sx={{ width: '100%', marginTop: '20px' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} centered>
                        <Tab label="Create Dynamic Form" value={0} />
                        <Tab label="Manage Dynamic Form" value={1} />
                        <Tab label="Preview Dynamic Form" value={2} />
                    </Tabs>
                    <Box sx={{ p: 2 }}>
                        {activeTab === 0 && <CreateDynamicForm addForm={updateForms} />}
                        {activeTab === 1 && <ManageDynamicForm forms={forms} />}
                        {activeTab === 2 && <PreviewDynamicForm forms={forms} />}
                    </Box>
                </Box>
            );
        } else if (selectedSection === 'DB') {
            return (
                <Box sx={{ marginTop: '20px' }}>
                    <Typography variant="h6">Not implemented yet.</Typography>
                </Box>
            );
        }
        return null;
    };

    if (!userData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h6">Loading...</Typography>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: '20px' }}>
                <AnimatePresence>
                    {selectedSection && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, x: -200, y: 0 }}
                            animate={{ opacity: 1, scale: 0.7, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: -200, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                        >
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => setSelectedSection('')}

                                style={{ backgroundColor: selectedSection === 'UI' ? '#e3f2fd' : '#f0f4c3', color: selectedSection === 'UI' ? '#3f51b5' : '#795548' }}

                            >
                                {selectedSection}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Button variant="outlined" onClick={onLogout} style={{ color: '#3f51b5', borderColor: '#3f51b5' }}>
                    Logout
                </Button>
            </div>
            {!selectedSection && (
                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={6} style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSectionClick('UI')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Card style={{ height: '200px', width: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e3f2fd' }}>
                                <Typography variant="h5" style={{ color: '#3f51b5' }}>UI</Typography>
                            </Card>
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} md={6} style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSectionClick('DB')}
                            style={{ cursor: 'pointer' }}
                        >
                            <Card style={{ height: '200px', width: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4c3' }}>
                                <Typography variant="h5" style={{ color: '#795548' }}>DB</Typography>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            )}
            {renderContent()}
        </div>
    );
};

export default HomePage;
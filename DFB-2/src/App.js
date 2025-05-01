import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import CreateDynamicForm from './components/CreateDynamicForm';
import ManageDynamicForm from './components/ManageDynamicForm';
import PreviewDynamicForm from './components/PreviewDynamicForm';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [forms, setForms] = useState([]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const updateForms = (newForm) => {
    setForms(prev => [...prev, newForm]);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="Create Dynamic Form" />
        <Tab label="Manage Dynamic Form" />
        <Tab label="Preview Dynamic Form" />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {activeTab === 0 && <CreateDynamicForm addForm={updateForms} />}
        {activeTab === 1 && <ManageDynamicForm forms={forms} />}
        {activeTab === 2 && <PreviewDynamicForm forms={forms} />}
      </Box>
    </Box>
  );
}

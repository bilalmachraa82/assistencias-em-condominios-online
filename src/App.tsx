
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import SupplierInteraction from './pages/SupplierInteraction';
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/supplier-interaction/:token" element={<SupplierInteraction />} />

        {/* Admin routes with dashboard layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Index />} />
          {/* Add more admin routes here */}
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

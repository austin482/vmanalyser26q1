import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UnifiedDashboard from './components/UnifiedDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<UnifiedDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

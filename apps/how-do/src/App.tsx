import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-canvas text-text-primary font-ui flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar - Glass Effect */}
      {/* Header now handles its own visibility logic based on route */}
      <Header />

      <div className="flex-1 overflow-auto relative bg-bg-canvas">
        <Outlet />
      </div>
    </div>
  );
}

export default App;

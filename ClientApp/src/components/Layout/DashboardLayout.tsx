import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '../../lib/utils';
import { QuickViewContainer } from '../QuickView/QuickViewContainer';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d12] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        "lg:pl-56",
        isCollapsed && "lg:pl-16"
      )} id="main-content">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} isCollapsed={isCollapsed} />
        <main className="flex-1 pt-16 p-4 lg:p-6 lg:pt-16 custom-scrollbar overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <QuickViewContainer />
    </div>
  );
}

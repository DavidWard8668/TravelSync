import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Shield, Home, Settings, Play, User } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import SetupWizard from './SetupWizard';
import Dashboard from './Dashboard';
import AppManagement from './AppManagement';
import RequestSimulator from './RequestSimulator';
import AdminPanel from './AdminPanel';

const AppLayout: React.FC = () => {
  const { isSetup, sidebarOpen, toggleSidebar } = useAppContext();
  const [currentView, setCurrentView] = React.useState('dashboard');

  if (!isSetup) {
    return <SetupWizard />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apps', label: 'App Management', icon: Settings },
    { id: 'simulator', label: 'Test Requests', icon: Play },
    { id: 'admin', label: 'Admin Panel', icon: User },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'apps':
        return <AppManagement />;
      case 'simulator':
        return <RequestSimulator />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Second Key</h2>
            <p className="text-sm text-gray-600">Digital Wellness</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentView(item.id);
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>Protected Mode Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-bold">Second Key</span>
          </div>
          <Sheet open={sidebarOpen} onOpenChange={toggleSidebar}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <NavigationContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex">
        <div className="hidden md:block w-80 bg-white border-r min-h-screen">
          <NavigationContent />
        </div>
        <div className="flex-1">
          <main className="p-6 max-w-6xl mx-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, Play, Clock } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

const RequestSimulator: React.FC = () => {
  const { blacklistedApps, addPendingRequest } = useAppContext();
  const [selectedApp, setSelectedApp] = useState('');
  const [requestType, setRequestType] = useState<'install' | 'launch'>('launch');

  const handleSimulateRequest = () => {
    const app = blacklistedApps.find(a => a.id === selectedApp);
    if (!app) return;

    const request = {
      type: requestType,
      appName: app.name,
      timestamp: new Date(),
      status: 'pending' as const,
    };

    addPendingRequest(request);
    
    toast({
      title: "Request Sent",
      description: `${requestType === 'install' ? 'Install' : 'Launch'} request for ${app.name} sent to admin`,
    });

    // Simulate admin notification
    setTimeout(() => {
      toast({
        title: "Admin Notified",
        description: `Notification sent to admin for approval`,
      });
    }, 1000);
  };

  const simulateInstallAttempt = () => {
    const newAppRequest = {
      type: 'install' as const,
      appName: 'New Social App',
      timestamp: new Date(),
      status: 'pending' as const,
    };

    addPendingRequest(newAppRequest);
    
    toast({
      title: "Install Blocked",
      description: "App installation blocked. Admin approval required.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Request Simulator</h2>
        <p className="text-gray-600">Test how Second Key handles app requests</p>
      </div>

      {/* Install Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            App Install Simulation
          </CardTitle>
          <CardDescription>
            Simulate what happens when someone tries to install a new app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Install Protection Active</span>
              </div>
              <p className="text-sm text-yellow-700">
                When someone tries to install any app, Second Key will intercept and require admin approval.
              </p>
            </div>
            <Button onClick={simulateInstallAttempt} className="w-full">
              Simulate App Install Attempt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Launch Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-red-600" />
            App Launch Simulation
          </CardTitle>
          <CardDescription>
            Simulate launching a blocked app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select App to Launch</label>
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a blocked app" />
                </SelectTrigger>
                <SelectContent>
                  {blacklistedApps.filter(app => app.blocked).map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Request Type</label>
              <Select value={requestType} onValueChange={(value: 'install' | 'launch') => setRequestType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="launch">Launch Request</SelectItem>
                  <SelectItem value="install">Install Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSimulateRequest} 
              disabled={!selectedApp}
              className="w-full"
            >
              Simulate {requestType === 'install' ? 'Install' : 'Launch'} Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Second Key Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">App Launch Blocked</h4>
                <p className="text-sm text-gray-600">When you try to open a blocked app, Second Key intercepts the launch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Admin Notified</h4>
                <p className="text-sm text-gray-600">Your trusted admin receives a notification to approve or deny the request</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Play className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Decision Made</h4>
                <p className="text-sm text-gray-600">Admin approves or denies - you get access or stay protected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestSimulator;
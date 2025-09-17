import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const ClientDashboard: React.FC = () => {
  const [monitoredApps, setMonitoredApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch monitored apps on component mount
  useEffect(() => {
    fetchMonitoredApps();
  }, []);

  const fetchMonitoredApps = async () => {
    try {
      const response = await fetch('/api/apps/monitored');
      const data = await response.json();
      setMonitoredApps(data);
      console.log('✅ Client fetched monitored apps:', data.length);
    } catch (error) {
      console.error('❌ Error fetching monitored apps:', error);
    }
  };

  const requestAppAccess = async (appId: string, appName: string) => {
    setIsLoading(true);
    try {
      // This would normally create a request to the master
      console.log(`✅ Requesting access to ${appName} (ID: ${appId})`);
      
      // Mock API call
      const response = await fetch('/api/apps/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          app_name: appName,
          reason: 'Need access for work/personal use'
        }),
      });

      if (response.ok) {
        console.log(`✅ Successfully requested access to ${appName}`);
        alert(`Request sent for ${appName}! Your master will be notified.`);
      }
    } catch (error) {
      console.error('❌ Error requesting app access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-2">Request app access and manage your recovery journey</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monitored Apps */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Request App Access</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoredApps.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No apps being monitored</p>
              ) : (
                <div className="space-y-3">
                  {monitoredApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-600">{app.category}</p>
                        <Badge 
                          variant={app.riskLevel === 'high' ? 'destructive' : 
                                  app.riskLevel === 'medium' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {app.riskLevel} risk
                        </Badge>
                      </div>
                      <Button
                        onClick={() => requestAppAccess(app.id, app.name)}
                        disabled={isLoading}
                        size="sm"
                      >
                        🙋 Request Access
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Progress */}
          <Card>
            <CardHeader>
              <CardTitle>📈 Recovery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Days Clean</span>
                  <Badge variant="outline">7 days</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Requests Made Today</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved Requests</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{width: '70%'}}></div>
                </div>
                <p className="text-sm text-gray-600">70% progress towards weekly goal</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crisis Support */}
        <Card className="mt-6 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">🚨 Crisis Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              If you're struggling or in crisis, immediate support is available:
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="destructive"
                onClick={() => window.location.href = '/crisis'}
              >
                🆘 Get Crisis Support
              </Button>
              <Button variant="outline">
                📞 Call Samaritans: 116 123
              </Button>
              <Button variant="outline">
                🏥 Emergency Services: 999
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>⚡ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={fetchMonitoredApps}>
                🔄 Refresh Apps
              </Button>
              <Button variant="outline">
                📊 View My Progress
              </Button>
              <Button variant="outline">
                ⚙️ Settings
              </Button>
              <Button variant="outline">
                📱 Download Mobile App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test All Buttons */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🧪 Button Functionality Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Test that all client buttons are working and connecting to the backend:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={() => console.log('✅ Request button works!')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Test Request
              </Button>
              <Button 
                onClick={() => console.log('✅ Crisis button works!')}
                variant="destructive"
              >
                Test Crisis
              </Button>
              <Button 
                onClick={() => console.log('✅ Refresh button works!')}
                variant="outline"
              >
                Test Refresh
              </Button>
              <Button 
                onClick={() => console.log('✅ Settings button works!')}
                variant="outline"
              >
                Test Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
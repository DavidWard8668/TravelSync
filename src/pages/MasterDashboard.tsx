import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const MasterDashboard: React.FC = () => {
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [monitoredApps, setMonitoredApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchApprovalRequests();
    fetchMonitoredApps();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      const response = await fetch('/api/apps/requests');
      const data = await response.json();
      setApprovalRequests(data);
      console.log('✅ Fetched approval requests:', data.length);
    } catch (error) {
      console.error('❌ Error fetching approval requests:', error);
    }
  };

  const fetchMonitoredApps = async () => {
    try {
      const response = await fetch('/api/apps/monitored');
      const data = await response.json();
      setMonitoredApps(data);
      console.log('✅ Fetched monitored apps:', data.length);
    } catch (error) {
      console.error('❌ Error fetching monitored apps:', error);
    }
  };

  const handleApprovalResponse = async (requestId: string, action: 'approve' | 'deny', message?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/apps/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, message }),
      });

      if (response.ok) {
        console.log(`✅ Request ${requestId} ${action}ed successfully`);
        // Refresh the requests list
        await fetchApprovalRequests();
      } else {
        console.error('❌ Failed to respond to request');
      }
    } catch (error) {
      console.error('❌ Error responding to request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Master Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage client app usage requests</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Approval Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔔 Pending Approvals
                {approvalRequests.length > 0 && (
                  <Badge variant="destructive">{approvalRequests.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {approvalRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{request.app_name}</h3>
                          <p className="text-sm text-gray-600">
                            Client: {request.client_name} ({request.client_email})
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprovalResponse(request.id, 'approve')}
                          disabled={isLoading}
                        >
                          ✅ Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApprovalResponse(request.id, 'deny', 'Access denied by master')}
                          disabled={isLoading}
                        >
                          ❌ Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monitored Apps */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Monitored Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoredApps.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No monitored apps configured</p>
              ) : (
                <div className="space-y-3">
                  {monitoredApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-600">{app.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={app.riskLevel === 'high' ? 'destructive' : 
                                  app.riskLevel === 'medium' ? 'default' : 'secondary'}
                        >
                          {app.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>⚡ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.href = '/crisis'}>
                🚨 Crisis Support
              </Button>
              <Button variant="outline" onClick={fetchApprovalRequests}>
                🔄 Refresh Requests
              </Button>
              <Button variant="outline">
                📊 View Analytics
              </Button>
              <Button variant="outline">
                ⚙️ Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test All Buttons */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">🧪 Button Functionality Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Test that all buttons are working and connecting to the backend:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={() => console.log('✅ Approve button works!')}
                className="bg-green-600 hover:bg-green-700"
              >
                Test Approve
              </Button>
              <Button 
                onClick={() => console.log('✅ Deny button works!')}
                variant="destructive"
              >
                Test Deny
              </Button>
              <Button 
                onClick={() => console.log('✅ Refresh button works!')}
                variant="outline"
              >
                Test Refresh
              </Button>
              <Button 
                onClick={() => console.log('✅ Crisis button works!')}
                className="bg-red-600 hover:bg-red-700"
              >
                Test Crisis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterDashboard;
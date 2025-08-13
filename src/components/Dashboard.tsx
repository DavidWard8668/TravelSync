import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const Dashboard: React.FC = () => {
  const { blacklistedApps, pendingRequests, adminEmail, updateRequestStatus } = useAppContext();

  const blockedAppsCount = blacklistedApps.filter(app => app.blocked).length;
  const pendingCount = pendingRequests.filter(req => req.status === 'pending').length;

  const handleApproval = (requestId: string, approved: boolean) => {
    updateRequestStatus(requestId, approved ? 'approved' : 'denied');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Second Key</h1>
        <p className="text-gray-600 mt-2">Your digital wellness is protected</p>
        <p className="text-sm text-gray-500">Admin: {adminEmail}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Apps</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedAppsCount}</div>
            <p className="text-xs text-muted-foreground">Apps currently blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Protection enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Recent Requests
            </CardTitle>
            <CardDescription>
              Approval requests sent to your admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={request.status === 'pending' ? 'secondary' : 
                        request.status === 'approved' ? 'default' : 'destructive'}>
                        {request.status}
                      </Badge>
                      <span className="font-medium">{request.appName}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.type === 'install' ? 'Install request' : 'Launch request'} • 
                      {request.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApproval(request.id, true)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApproval(request.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocked Apps */}
      <Card>
        <CardHeader>
          <CardTitle>Protected Apps</CardTitle>
          <CardDescription>
            Apps that require admin approval to launch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blacklistedApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-gray-600">{app.packageName}</div>
                </div>
                <Badge variant={app.blocked ? 'destructive' : 'secondary'}>
                  {app.blocked ? 'Blocked' : 'Allowed'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
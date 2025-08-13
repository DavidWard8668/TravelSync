import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, X, Clock, Mail, Shield, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

const AdminPanel: React.FC = () => {
  const { pendingRequests, updateRequestStatus, adminEmail, setAdminEmail } = useAppContext();
  const [newAdminEmail, setNewAdminEmail] = useState(adminEmail);

  const handleApproval = (requestId: string, approved: boolean) => {
    updateRequestStatus(requestId, approved ? 'approved' : 'denied');
    toast({
      title: approved ? "Request Approved" : "Request Denied",
      description: `The request has been ${approved ? 'approved' : 'denied'}.`,
    });
  };

  const handleUpdateAdmin = () => {
    if (newAdminEmail && newAdminEmail.includes('@')) {
      setAdminEmail(newAdminEmail);
      toast({
        title: "Admin Updated",
        description: "Admin email has been updated successfully.",
      });
    }
  };

  const pendingCount = pendingRequests.filter(req => req.status === 'pending').length;
  const approvedCount = pendingRequests.filter(req => req.status === 'approved').length;
  const deniedCount = pendingRequests.filter(req => req.status === 'denied').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Settings</h2>
        <p className="text-gray-600">Manage admin configuration and pending requests</p>
      </div>

      {/* Admin Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Admin Configuration
          </CardTitle>
          <CardDescription>
            Set up the trusted admin who will approve requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUpdateAdmin}
              disabled={!newAdminEmail || !newAdminEmail.includes('@') || newAdminEmail === adminEmail}
            >
              Update Admin
            </Button>
            {adminEmail && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Current admin: {adminEmail}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Access granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedCount}</div>
            <p className="text-xs text-muted-foreground">Access denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Pending Approval Requests
          </CardTitle>
          <CardDescription>
            Review and approve or deny user requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.filter(req => req.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending requests</p>
              <p className="text-sm">All requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests
                .filter(req => req.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {request.type === 'install' ? 'Install' : 'Launch'}
                        </Badge>
                        <span className="font-medium">{request.appName}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested at {request.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleApproval(request.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleApproval(request.id, false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              All approval requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.slice(-10).reverse().map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={request.status === 'pending' ? 'secondary' : 
                      request.status === 'approved' ? 'default' : 'destructive'}>
                      {request.status}
                    </Badge>
                    <div>
                      <span className="font-medium">{request.appName}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({request.type})
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {request.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPanel;
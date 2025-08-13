import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, VisuallyHidden } from '@/components/ui/dialog';
import { Plus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const AppManagement: React.FC = () => {
  const { blacklistedApps, addBlacklistedApp, removeBlacklistedApp, toggleAppBlock } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', packageName: '', blocked: true });

  const handleAddApp = () => {
    if (newApp.name && newApp.packageName) {
      addBlacklistedApp(newApp);
      setNewApp({ name: '', packageName: '', blocked: true });
      setIsAddDialogOpen(false);
    }
  };

  const commonApps = [
    { name: 'Instagram', packageName: 'com.instagram.android' },
    { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
    { name: 'Facebook', packageName: 'com.facebook.katana' },
    { name: 'Twitter', packageName: 'com.twitter.android' },
    { name: 'YouTube', packageName: 'com.google.android.youtube' },
    { name: 'WhatsApp', packageName: 'com.whatsapp' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">App Management</h2>
          <p className="text-gray-600">Manage which apps require admin approval</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add App
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add App to Protection List</DialogTitle>
              <DialogDescription>
                Add an app that will require admin approval to launch
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="appName">App Name</Label>
                <Input
                  id="appName"
                  placeholder="e.g., Instagram"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  placeholder="e.g., com.instagram.android"
                  value={newApp.packageName}
                  onChange={(e) => setNewApp({ ...newApp, packageName: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="blocked"
                  checked={newApp.blocked}
                  onCheckedChange={(checked) => setNewApp({ ...newApp, blocked: checked })}
                />
                <Label htmlFor="blocked">Block by default</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddApp} disabled={!newApp.name || !newApp.packageName}>
                Add App
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Add Common Apps */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Popular Apps</CardTitle>
          <CardDescription>
            Common apps that users often want to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {commonApps.map((app) => {
              const isAlreadyAdded = blacklistedApps.some(existing => existing.packageName === app.packageName);
              return (
                <Button
                  key={app.packageName}
                  variant="outline"
                  size="sm"
                  disabled={isAlreadyAdded}
                  onClick={() => addBlacklistedApp({ ...app, blocked: true })}
                  className="justify-start"
                >
                  {isAlreadyAdded ? '✓ ' : '+ '}{app.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Managed Apps List */}
      <Card>
        <CardHeader>
          <CardTitle>Protected Apps ({blacklistedApps.length})</CardTitle>
          <CardDescription>
            Apps currently under Second Key protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blacklistedApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No apps are currently being managed</p>
              <p className="text-sm">Add apps above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blacklistedApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {app.blocked ? (
                        <Shield className="h-5 w-5 text-red-600" />
                      ) : (
                        <ShieldOff className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium">{app.name}</div>
                        <div className="text-sm text-gray-600">{app.packageName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={app.blocked ? 'destructive' : 'secondary'}>
                      {app.blocked ? 'Blocked' : 'Allowed'}
                    </Badge>
                    <Switch
                      checked={app.blocked}
                      onCheckedChange={() => toggleAppBlock(app.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBlacklistedApp(app.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppManagement;
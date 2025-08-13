import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from '@/components/ui/dialog';
import { Shield, UserCheck, Lock, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const SetupWizard: React.FC = () => {
  const { setAdminEmail, completeSetup } = useAppContext();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissions, setPermissions] = useState({
    accessibility: false,
    deviceAdmin: false,
    notifications: false,
  });

  const handleEmailSubmit = () => {
    if (email === confirmEmail && email.includes('@')) {
      setAdminEmail(email);
      setStep(2);
    }
  };

  const handlePermissionsSetup = () => {
    setShowPermissionDialog(true);
    // Simulate permission requests
    setTimeout(() => {
      setPermissions({ accessibility: true, deviceAdmin: true, notifications: true });
      setShowPermissionDialog(false);
      setStep(3);
    }, 2000);
  };

  const handleComplete = () => {
    completeSetup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Second Key</CardTitle>
          <CardDescription>Your digital wellness companion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Setup Your Admin</h3>
                <p className="text-sm text-gray-600">Choose a trusted person to help manage your digital wellness</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmEmail">Confirm Email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleEmailSubmit} 
                  className="w-full"
                  disabled={!email || email !== confirmEmail || !email.includes('@')}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Lock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Enable Permissions</h3>
                <p className="text-sm text-gray-600">Grant necessary permissions for Second Key to protect you</p>
              </div>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Accessibility Service</h4>
                  <p className="text-sm text-gray-600">Monitor app launches</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Device Administrator</h4>
                  <p className="text-sm text-gray-600">Prevent unauthorized uninstalls</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Notifications</h4>
                  <p className="text-sm text-gray-600">Send approval requests to admin</p>
                </div>
                <Button onClick={handlePermissionsSetup} className="w-full">
                  Grant Permissions
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold">Setup Complete!</h3>
              <p className="text-sm text-gray-600">
                Second Key is now protecting your digital wellness. Your admin ({email}) will receive approval requests.
              </p>
              <Button onClick={handleComplete} className="w-full">
                Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Setting up permissions</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="text-center py-6">
            <Lock className="h-12 w-12 text-blue-600 mx-auto mb-3 animate-pulse" />
            <p className="text-lg font-medium">Setting up permissions...</p>
            <p className="text-sm text-gray-600 mt-2">Please grant the requested permissions when prompted</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SetupWizard;
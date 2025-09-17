import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>👤 User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Profile management coming soon...</p>
            <Button className="mt-4">Update Profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const SelfHelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Self-Help Resources</h1>
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Recovery Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Self-help resources coming soon...</p>
            <Button className="mt-4">Learn More</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelfHelpPage;
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Second Chance Recovery
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take control of your digital habits with our comprehensive recovery support system. 
            Master/Client monitoring, crisis intervention, and UK-based support resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">🛡️ Master Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Monitor and manage client app usage with real-time notifications and approval controls.
            </p>
            <Link to="/login?role=master">
              <Button className="w-full">Access Master Dashboard</Button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📱 Client Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Request app access, track your progress, and access crisis support when needed.
            </p>
            <Link to="/login?role=client">
              <Button variant="outline" className="w-full">Access Client Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mb-16">
          <h3 className="text-lg font-semibold text-red-800 mb-2">🚨 Crisis Support Always Available</h3>
          <p className="text-red-700 mb-4">
            If you're experiencing a crisis, immediate help is available 24/7:
          </p>
          <div className="space-y-2">
            <p className="font-medium">🇬🇧 UK Emergency: <a href="tel:999" className="text-red-600 underline">999</a></p>
            <p className="font-medium">💙 Samaritans: <a href="tel:116123" className="text-red-600 underline">116 123</a> (Free, 24/7)</p>
          </div>
          <Link to="/crisis" className="inline-block mt-4">
            <Button variant="destructive">Access Crisis Support</Button>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">New to Second Chance?</p>
          <Link to="/register">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
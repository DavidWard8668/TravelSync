import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ExternalLink, Heart, Shield, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCrisisMode } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface CrisisResource {
  id: string;
  name: string;
  phone?: string;
  text?: string;
  email?: string;
  description: string;
  website: string;
  category: string;
  availability: string;
  cost: string;
  methods: string[];
  specialties: string[];
}

const CrisisPage: React.FC = () => {
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [crisisModeActive, setCrisisModeActive] = useState(false);
  const { activateCrisisMode } = useCrisisMode();
  const { user } = useAuth();

  // Fetch crisis resources on page load
  useEffect(() => {
    fetchCrisisResources();
  }, []);

  const fetchCrisisResources = async () => {
    try {
      const response = await fetch('/api/crisis/resources');
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch crisis resources:', error);
      toast.error('Failed to load crisis resources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrisisModeActivation = async () => {
    if (!user || user.role !== 'client') {
      toast.error('Crisis mode is only available for recovery clients');
      return;
    }

    const confirmed = window.confirm(
      '🆘 Activate Crisis Mode?\n\nThis will:\n• Temporarily remove all app restrictions\n• Notify your recovery support person immediately\n• Provide access to crisis resources\n\nAre you in crisis and need immediate access?'
    );

    if (confirmed) {
      try {
        activateCrisisMode('Crisis mode activated from crisis page');
        setCrisisModeActive(true);
        toast.success('🆘 Crisis Mode Activated', {
          description: 'All app restrictions temporarily lifted. Your support person has been notified.',
          duration: 10000
        });
      } catch (error) {
        console.error('Failed to activate crisis mode:', error);
        toast.error('Failed to activate crisis mode');
      }
    }
  };

  const handleResourceAccess = async (resource: CrisisResource, method: string) => {
    // Log resource access (even for anonymous users)
    try {
      await fetch('/api/crisis/access-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resource.id,
          user_id: user?.id,
          access_method: method
        })
      });
    } catch (error) {
      console.error('Failed to log resource access:', error);
    }

    // Handle different access methods
    switch (method) {
      case 'phone':
        if (resource.phone) {
          window.open(`tel:${resource.phone}`);
          toast.success(`Calling ${resource.name}...`);
        }
        break;
      case 'text':
        if (resource.text) {
          window.open(`sms:${resource.text.split(' to ')[1]}?body=${resource.text.split(' to ')[0]}`);
          toast.success(`Opening text to ${resource.name}...`);
        }
        break;
      case 'email':
        if (resource.email) {
          window.open(`mailto:${resource.email}`);
          toast.success(`Opening email to ${resource.name}...`);
        }
        break;
      case 'website':
        window.open(resource.website, '_blank');
        toast.success(`Opening ${resource.name} website...`);
        break;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'emotional_support': 'bg-blue-100 text-blue-800',
      'crisis_text': 'bg-green-100 text-green-800', 
      'healthcare': 'bg-red-100 text-red-800',
      'mental_health_info': 'bg-purple-100 text-purple-800',
      'suicide_prevention': 'bg-orange-100 text-orange-800',
      'youth_support': 'bg-yellow-100 text-yellow-800',
      'addiction_support': 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityIcon = (availability: string) => {
    return availability === '24/7' ? <Clock className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-orange-600" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crisis resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Emergency Header */}
      <div className="bg-red-600 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <h1 className="text-2xl font-bold">🆘 Crisis Support</h1>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-red-100">
            If you are in immediate danger, call <strong>999</strong> immediately
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Crisis Mode Section (for authenticated clients) */}
        {user?.role === 'client' && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <Shield className="w-5 h-5" />
                <span>Emergency Access</span>
              </CardTitle>
              <CardDescription className="text-orange-700">
                If you need immediate access to communication apps for support, activate crisis mode below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crisisModeActive ? (
                <div className="p-4 bg-green-100 border border-green-200 rounded-lg text-center">
                  <div className="text-green-800 font-semibold mb-2">✅ Crisis Mode Active</div>
                  <p className="text-green-700 text-sm">
                    All app restrictions temporarily lifted. Your support person has been notified.
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleCrisisModeActivation}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  🆘 Activate Crisis Mode
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Primary Crisis Resources */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {resources
            .filter(r => ['emotional_support', 'crisis_text', 'healthcare'].includes(r.category))
            .map((resource) => (
            <Card key={resource.id} className="border-2 border-red-200 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-red-800">{resource.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getCategoryColor(resource.category)}>
                        {resource.category.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getAvailabilityIcon(resource.availability)}
                        <span className="text-xs text-gray-600">{resource.availability}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {resource.cost}
                  </Badge>
                </div>
                <CardDescription className="text-gray-700">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Contact Methods */}
                <div className="space-y-2">
                  {resource.phone && (
                    <Button 
                      onClick={() => handleResourceAccess(resource, 'phone')}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call {resource.phone}
                    </Button>
                  )}
                  {resource.text && (
                    <Button 
                      onClick={() => handleResourceAccess(resource, 'text')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Text {resource.text}
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleResourceAccess(resource, 'website')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                </div>

                {/* Specialties */}
                {resource.specialties.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Specializes in:</div>
                    <div className="flex flex-wrap gap-1">
                      {resource.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Additional Support Resources */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-pink-600" />
            Additional Support
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {resources
              .filter(r => !['emotional_support', 'crisis_text', 'healthcare'].includes(r.category))
              .map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{resource.name}</CardTitle>
                    <Badge className={getCategoryColor(resource.category)}>
                      {resource.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium">{resource.availability}</span>
                    </div>
                    <div className="space-y-1">
                      {resource.phone && (
                        <Button 
                          onClick={() => handleResourceAccess(resource, 'phone')}
                          variant="outline" 
                          size="sm"
                          className="w-full text-xs"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {resource.phone}
                        </Button>
                      )}
                      {resource.text && (
                        <Button 
                          onClick={() => handleResourceAccess(resource, 'text')}
                          variant="outline" 
                          size="sm"
                          className="w-full text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {resource.text}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Self-Care Reminders */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Remember
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-blue-700">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>💙 You are not alone in this</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>🌟 Recovery is possible</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>🤝 Asking for help is strength</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>🌈 This feeling will pass</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            If you're experiencing a mental health crisis, please reach out immediately. 
            There are people who want to help you through this.
          </p>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/self-help'}
              className="mr-4"
            >
              Self-Help Resources
            </Button>
            {user && (
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisPage;
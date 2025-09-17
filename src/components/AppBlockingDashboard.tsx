import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Clock, 
  Shield, 
  Smartphone, 
  TrendingDown, 
  TrendingUp,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Timer,
  Ban
} from 'lucide-react';
import { appAccessControl } from '../services/AppAccessControl';

interface AppUsage {
  appId: string;
  appName: string;
  category: string;
  todayMinutes: number;
  weekMinutes: number;
  status: 'normal' | 'warning' | 'blocked' | 'limited';
  restriction?: any;
}

export const AppBlockingDashboard: React.FC = () => {
  const [apps, setApps] = useState<AppUsage[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [problematicApps, setProblematicApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    setIsLoading(true);
    try {
      // Get problematic apps
      const problematic = appAccessControl.getProblematicApps();
      setProblematicApps(problematic);

      // Mock app data for demo
      const mockApps: AppUsage[] = [
        {
          appId: 'instagram',
          appName: 'Instagram',
          category: 'social',
          todayMinutes: 85,
          weekMinutes: 420,
          status: 'warning'
        },
        {
          appId: 'tiktok',
          appName: 'TikTok',
          category: 'social',
          todayMinutes: 120,
          weekMinutes: 600,
          status: 'blocked'
        },
        {
          appId: 'candy-crush',
          appName: 'Candy Crush',
          category: 'gaming',
          todayMinutes: 45,
          weekMinutes: 210,
          status: 'limited'
        },
        {
          appId: 'amazon',
          appName: 'Amazon Shopping',
          category: 'shopping',
          todayMinutes: 30,
          weekMinutes: 180,
          status: 'normal'
        }
      ];
      
      setApps(mockApps);
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyRestriction = (appId: string, type: string, settings: any) => {
    const app = apps.find(a => a.appId === appId);
    if (!app) return;

    appAccessControl.setRestriction({
      appId,
      appName: app.appName,
      category: app.category as any,
      restrictionType: type as any,
      settings
    });

    loadAppData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'destructive';
      case 'warning': return 'default';
      case 'limited': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked': return <Ban className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'limited': return <Timer className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getRecommendedAction = (app: AppUsage) => {
    if (app.todayMinutes > 120) {
      return {
        action: 'Block temporarily',
        reason: 'Excessive usage detected',
        severity: 'high'
      };
    } else if (app.todayMinutes > 60) {
      return {
        action: 'Set daily limit',
        reason: 'Above healthy usage',
        severity: 'medium'
      };
    } else {
      return {
        action: 'Monitor only',
        reason: 'Usage within limits',
        severity: 'low'
      };
    }
  };

  const QuickActionButtons = ({ app }: { app: AppUsage }) => {
    const recommendation = getRecommendedAction(app);
    
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => applyRestriction(app.appId, 'blocked', {})}
        >
          <Ban className="w-4 h-4 mr-1" />
          Block
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyRestriction(app.appId, 'timed', {
            dailyLimit: 30,
            sessionLimit: 15
          })}
        >
          <Timer className="w-4 h-4 mr-1" />
          30min/day
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyRestriction(app.appId, 'scheduled', {
            allowedHours: [{ start: '09:00', end: '17:00' }]
          })}
        >
          <Clock className="w-4 h-4 mr-1" />
          Work hours
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={() => applyRestriction(app.appId, 'limited', {
            launchLimit: 5
          })}
        >
          5 opens/day
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">App Control Center</h1>
          <p className="text-muted-foreground">
            Manage app access to support your recovery journey
          </p>
        </div>
        <Button onClick={() => appAccessControl.enableEmergencyOverride()}>
          <Shield className="w-4 h-4 mr-2" />
          Emergency Override
        </Button>
      </div>

      {problematicApps.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {problematicApps.length} apps showing concerning usage patterns. 
            Review recommendations below.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Protected</p>
                <p className="text-2xl font-bold">
                  {apps.filter(a => a.status !== 'normal').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Time Saved Today</p>
                <p className="text-2xl font-bold">2h 15m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Weekly Reduction</p>
                <p className="text-2xl font-bold">-35%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked Opens</p>
                <p className="text-2xl font-bold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">My Apps</TabsTrigger>
          <TabsTrigger value="insights">Usage Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recovery Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <div className="grid gap-4">
            {apps.map((app) => (
              <Card key={app.appId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {app.appName.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.appName}</CardTitle>
                        <CardDescription>
                          {app.category} • Today: {app.todayMinutes}m • Week: {app.weekMinutes}m
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(app.status)}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Usage</span>
                        <span>{app.todayMinutes}/120 minutes</span>
                      </div>
                      <Progress 
                        value={(app.todayMinutes / 120) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Recommendation: {getRecommendedAction(app).action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getRecommendedAction(app).reason}
                      </p>
                    </div>

                    <QuickActionButtons app={app} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Peak Hours</span>
                      <span>2:00-4:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Session</span>
                      <span>23 minutes</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Most Used Day</span>
                      <span>Sunday</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Triggers Identified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Stress after work
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Weekend boredom
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    Late night routine
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appAccessControl.getRecoveryApps().map((app, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{app.name}</CardTitle>
                      <CardDescription>{app.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {app.description}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(app.url, '_blank')}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recovery Mode Settings</CardTitle>
          <CardDescription>
            Special features to support your recovery journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Gradual Reduction</p>
                <p className="text-sm text-muted-foreground">
                  Automatically reduce daily limits over time
                </p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Crisis Support Access</p>
                <p className="text-sm text-muted-foreground">
                  Emergency override for mental health resources
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Support Network Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify trusted contacts during high-risk usage
                </p>
              </div>
              <Button variant="outline">Set Up</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
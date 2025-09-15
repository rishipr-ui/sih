import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Building2, 
  BarChart3, 
  Heart, 
  FileText, 
  Users, 
  Trophy, 
  LogOut,
  Plus,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import ShedForm from '@/components/ShedForm';
import DailyLogForm from '@/components/DailyLogForm';
import MortalityRateChart from '@/components/MortalityRateChart';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; farm_area: string | null; farm_location: string | null; budget: string | null; animal_type: string | null } | null>(null);
  const [sheds, setSheds] = useState<Array<{ id: string; name: string; location: string | null; capacity: number | null; current_birds: number | null; status: string | null; age_days: number | null; vaccinated: boolean | null; last_vaccination_date: string | null }>>([]);
  const [dailyLogs, setDailyLogs] = useState<Array<{ alive_count: number | null; dead_count: number | null; eggs_count: number | null; offspring_count: number | null }>>([]);
  const [showShedForm, setShowShedForm] = useState(false);
  const [editingShedId, setEditingShedId] = useState<string | null>(null);
  const [loggingShedId, setLoggingShedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      // initial fetch on mount
      await fetchProfileAndSheds(session.user.id);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate('/login');
        } else {
          setUser(session.user);
          // refetch data on auth change
          void fetchProfileAndSheds(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfileAndSheds = async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name,farm_area,farm_location,budget,animal_type')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(profileData ?? null);

    // Fetch sheds
    const { data: shedsData } = await supabase
      .from('sheds')
      .select('id,name,location,capacity,current_birds,status,age_days,vaccinated,last_vaccination_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setSheds(shedsData ?? []);

    // Fetch recent daily logs (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: logsData } = await supabase
      .from('daily_logs')
      .select('alive_count,dead_count,eggs_count,offspring_count')
      .eq('user_id', userId)
      .gte('log_date', since.toISOString().slice(0,10));
    setDailyLogs(logsData ?? []);
  };

  const totalAnimals = sheds.reduce((sum, s) => sum + (s.current_birds || 0), 0);
  const totals = dailyLogs.reduce((acc, l) => ({
    alive: acc.alive + (l.alive_count || 0),
    dead: acc.dead + (l.dead_count || 0),
    eggs: acc.eggs + (l.eggs_count || 0),
    offspring: acc.offspring + (l.offspring_count || 0),
  }), { alive: 0, dead: 0, eggs: 0, offspring: 0 });
  const mortalityRate = (totals.alive + totals.dead) > 0 ? Math.round((totals.dead / (totals.alive + totals.dead)) * 1000) / 10 : 0;
  const productionRate = profile?.animal_type === 'poultry'
    ? (totalAnimals > 0 ? Math.round((totals.eggs / (totalAnimals * 30)) * 1000) / 10 : 0) // eggs per bird per day over 30d
    : (totalAnimals > 0 ? Math.round((totals.offspring / (totalAnimals)) * 1000) / 10 : 0);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'shed', label: 'Shed', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'health', label: 'Health Management', icon: Heart },
    { id: 'guidelines', label: 'Guidelines', icon: FileText },
    { id: 'visitors', label: 'Visitor Management', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sheds</p>
                      <p className="text-2xl font-bold text-foreground">{sheds.length}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Animals</p>
                      <p className="text-2xl font-bold text-foreground">{totalAnimals}</p>
                    </div>
                    <Activity className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mortality Rate</p>
                      <p className="text-2xl font-bold text-foreground">{mortalityRate}%</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-farm-danger" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Production Rate</p>
                      <p className="text-2xl font-bold text-foreground">{productionRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-farm-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('shed')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Shed
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('health')}
                    className="border-border hover:bg-muted"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Vaccination
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('analytics')}
                    className="border-border hover:bg-muted"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'shed':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Shed Management</h2>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => { setEditingShedId(null); setShowShedForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Shed
              </Button>
            </div>
            
            {showShedForm && user ? (
              <ShedForm
                userId={user.id}
                shed={editingShedId ? sheds.find(s => s.id === editingShedId) as any : undefined}
                animalType={profile?.animal_type || null}
                onSuccess={async () => { setShowShedForm(false); setEditingShedId(null); await fetchProfileAndSheds(user.id); }}
                onCancel={() => { setShowShedForm(false); setEditingShedId(null); }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sheds.length === 0 && (
                  <Card className="bg-card border-border col-span-1 md:col-span-2 lg:col-span-3">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No sheds yet. Create your first shed to get started.</p>
                    </CardContent>
                  </Card>
                )}
                {sheds.map((shed) => (
                  <Card key={shed.id} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">{shed.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {profile?.animal_type || 'Animals'} • {shed.current_birds ?? 0}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Location:</span>
                          <span className="text-sm text-foreground">{shed.location || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Age (days):</span>
                          <span className="text-sm text-foreground">{shed.age_days ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Vaccinated:</span>
                          <Badge variant={shed.vaccinated ? 'secondary' : 'destructive'}>{shed.vaccinated ? 'Yes' : 'No'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Vaccination:</span>
                          <span className="text-sm text-foreground">{shed.last_vaccination_date ? new Date(shed.last_vaccination_date).toLocaleDateString() : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Capacity:</span>
                          <span className="text-sm text-foreground">{shed.capacity ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant="secondary">{shed.status || 'unknown'}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border hover:bg-muted"
                            onClick={() => { setEditingShedId(shed.id); setShowShedForm(true); }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border hover:bg-muted"
                            onClick={() => { setLoggingShedId(shed.id); }}
                          >
                            Daily Log
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Mortality Rate Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <MortalityRateChart />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Production Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Chart.js Production Graph
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Average Mortality Rate</h4>
                    <p className="text-2xl font-bold text-farm-danger">{mortalityRate}%</p>
                    <p className="text-sm text-muted-foreground">Across all sheds</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Average Production</h4>
                    <p className="text-2xl font-bold text-farm-success">{productionRate}%</p>
                    <p className="text-sm text-muted-foreground">Monthly average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Health Management</h2>
            
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Vaccination Scheduler</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Upcoming vaccination reminders based on shed age and last vaccination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sheds.length === 0 && (
                    <div className="p-4 border border-border rounded-lg text-center text-muted-foreground">
                      No sheds yet. Add sheds to see vaccination reminders.
                    </div>
                  )}
                  {sheds.map((s, idx) => {
                    const last = s.last_vaccination_date ? new Date(s.last_vaccination_date) : null;
                    const baseIntervalDays = profile?.animal_type === 'poultry' ? 30 : 90;
                    const nextDate = last ? new Date(last.getTime()) : new Date();
                    if (!last) {
                      nextDate.setDate(nextDate.getDate() + baseIntervalDays);
                    } else {
                      nextDate.setDate(nextDate.getDate() + baseIntervalDays);
                    }
                    const daysUntil = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000*60*60*24));
                    const status = daysUntil <= 7 ? 'Due Soon' : 'Scheduled';
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-semibold text-foreground">{s.name}</h4>
                          <p className="text-sm text-muted-foreground">{profile?.animal_type || 'Animals'} • Next: {nextDate.toLocaleDateString()}</p>
                        </div>
                        <Badge variant={status === 'Due Soon' ? 'destructive' : 'secondary'}>
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {navigationItems.find(item => item.id === activeTab)?.label}
            </h2>
            <p className="text-muted-foreground">
              This section is under development and will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Welcome, {profile?.full_name || user?.email || 'User'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(profile?.farm_location || '-') + ' • ' + (profile?.farm_area || '-')}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="border-border hover:bg-muted"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border px-4 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                activeTab === item.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        {loggingShedId && user ? (
          <DailyLogForm
            userId={user.id}
            shedId={loggingShedId}
            onSuccess={async () => { setLoggingShedId(null); await fetchProfileAndSheds(user.id); }}
            onCancel={() => setLoggingShedId(null)}
          />
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

export default Dashboard;
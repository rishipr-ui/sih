import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DailyLogFormProps {
  userId: string;
  shedId: string;
  shedName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DailyLogForm: React.FC<DailyLogFormProps> = ({ userId, shedId, shedName, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().slice(0,10),
    alive_count: '',
    dead_count: '',
    death_reason: '',
    eggs_count: '',
    offspring_count: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const deadCountNum = formData.dead_count ? parseInt(formData.dead_count) : 0;
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: userId,
          shed_id: shedId,
          log_date: formData.log_date,
          alive_count: formData.alive_count ? parseInt(formData.alive_count) : null,
          dead_count: formData.dead_count ? parseInt(formData.dead_count) : null,
          death_reason: formData.death_reason || null,
          eggs_count: formData.eggs_count ? parseInt(formData.eggs_count) : null,
          offspring_count: formData.offspring_count ? parseInt(formData.offspring_count) : null
        }, { onConflict: 'user_id,shed_id,log_date' });
      if (error) throw error;
      toast({ title: 'Daily Log Saved', description: 'Your daily shed log has been recorded.' });
      if (deadCountNum > 15) {
        toast({
          title: 'High Mortality Risk',
          description: `${shedName ? shedName + ' ' : ''}reported ${deadCountNum} deaths today.`,
          variant: 'destructive'
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save log', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Daily Log</CardTitle>
        <CardDescription className="text-muted-foreground">Record today’s counts</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log_date" className="text-sm font-medium text-foreground">Date</Label>
              <Input id="log_date" type="date" value={formData.log_date} onChange={(e) => handleInputChange('log_date', e.target.value)} className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alive_count" className="text-sm font-medium text-foreground">Alive</Label>
              <Input id="alive_count" type="number" value={formData.alive_count} onChange={(e) => handleInputChange('alive_count', e.target.value)} className="bg-input border-border" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dead_count" className="text-sm font-medium text-foreground">Dead</Label>
              <Input id="dead_count" type="number" value={formData.dead_count} onChange={(e) => handleInputChange('dead_count', e.target.value)} className="bg-input border-border" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eggs_count" className="text-sm font-medium text-foreground">Eggs</Label>
              <Input id="eggs_count" type="number" value={formData.eggs_count} onChange={(e) => handleInputChange('eggs_count', e.target.value)} className="bg-input border-border" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offspring_count" className="text-sm font-medium text-foreground">Offspring</Label>
              <Input id="offspring_count" type="number" value={formData.offspring_count} onChange={(e) => handleInputChange('offspring_count', e.target.value)} className="bg-input border-border" min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="death_reason" className="text-sm font-medium text-foreground">Death Reason</Label>
            <Input id="death_reason" type="text" value={formData.death_reason} onChange={(e) => handleInputChange('death_reason', e.target.value)} className="bg-input border-border" placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Log'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="border-border hover:bg-muted">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyLogForm;



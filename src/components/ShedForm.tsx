import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Shed = Tables<'sheds'>;

interface ShedFormProps {
  shed?: Shed;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  animalType?: string | null;
}

const ShedForm: React.FC<ShedFormProps> = ({ shed, userId, onSuccess, onCancel, animalType }) => {
  const [formData, setFormData] = useState({
    name: shed?.name || '',
    location: shed?.location || '',
    capacity: shed?.capacity?.toString() || '',
    current_birds: shed?.current_birds?.toString() || '0',
    age_days: shed?.age_days?.toString() || '',
    vaccinated: (shed?.vaccinated ?? false) ? 'yes' : 'no',
    last_vaccination_date: shed?.last_vaccination_date || '',
    start_date: (shed as any)?.start_date || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If start_date is provided and age_days empty, derive age_days
      const derivedAgeDays = (!formData.age_days && formData.start_date)
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)))
        : undefined;

      const shedData = {
        name: formData.name,
        location: formData.location || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        current_birds: parseInt(formData.current_birds) || 0,
        age_days: formData.age_days ? parseInt(formData.age_days) : (derivedAgeDays ?? null),
        vaccinated: formData.vaccinated === 'yes',
        last_vaccination_date: formData.last_vaccination_date || null,
        start_date: formData.start_date || null,
        user_id: userId
      };

      if (shed) {
        // Update existing shed
        const { error } = await supabase
          .from('sheds')
          .update(shedData)
          .eq('id', shed.id);

        if (error) throw error;

        toast({
          title: "Shed Updated",
          description: "The shed has been successfully updated.",
        });
      } else {
        // Create new shed
        const { error } = await supabase
          .from('sheds')
          .insert(shedData);

        if (error) throw error;

        toast({
          title: "Shed Created",
          description: "The shed has been successfully created.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">
          {shed ? 'Edit Shed' : 'Add New Shed'}
        </h2>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">
            {shed ? 'Edit Shed Details' : 'Shed Information'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {shed ? 'Update the shed information below.' : 'Enter the details for your new shed.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Shed Name *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Shed A, North Shed, etc."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-foreground">
                Location
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., North side, Near gate, etc."
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium text-foreground">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Maximum animals"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className="bg-input border-border"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_birds" className="text-sm font-medium text-foreground">
                  Current Animals
                </Label>
                <Input
                  id="current_birds"
                  type="number"
                  placeholder="Current count"
                  value={formData.current_birds}
                  onChange={(e) => handleInputChange('current_birds', e.target.value)}
                  className="bg-input border-border"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_days" className="text-sm font-medium text-foreground">
                  {animalType === 'poultry' ? 'Age of chicks (days)' : animalType === 'pig' ? 'Age of pigs (days)' : 'Age (days)'}
                </Label>
                <Input
                  id="age_days"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.age_days}
                  onChange={(e) => handleInputChange('age_days', e.target.value)}
                  className="bg-input border-border"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaccinated" className="text-sm font-medium text-foreground">
                  Vaccinated
                </Label>
                <Select value={formData.vaccinated} onValueChange={(value) => handleInputChange('vaccinated', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_vaccination_date" className="text-sm font-medium text-foreground">
                Last Vaccination Date
              </Label>
              <Input
                id="last_vaccination_date"
                type="date"
                value={formData.last_vaccination_date}
                onChange={(e) => handleInputChange('last_vaccination_date', e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : (shed ? 'Update Shed' : 'Create Shed')}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShedForm;

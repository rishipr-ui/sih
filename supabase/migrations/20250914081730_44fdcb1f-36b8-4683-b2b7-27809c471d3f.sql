-- Create sheds table only since profiles already exists
CREATE TABLE public.sheds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER,
  current_birds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sheds
ALTER TABLE public.sheds ENABLE ROW LEVEL SECURITY;

-- Create policies for sheds
CREATE POLICY "Users can view their own sheds" 
ON public.sheds 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sheds" 
ON public.sheds 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheds" 
ON public.sheds 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheds" 
ON public.sheds 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sheds_updated_at
  BEFORE UPDATE ON public.sheds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
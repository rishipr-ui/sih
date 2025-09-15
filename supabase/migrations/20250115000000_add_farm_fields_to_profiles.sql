-- Add farm-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN farm_area TEXT,
ADD COLUMN farm_location TEXT,
ADD COLUMN budget TEXT,
ADD COLUMN animal_type TEXT;

-- Update the handle_new_user function to include farm information
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, farm_area, farm_location, budget, animal_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'farm_area',
    NEW.raw_user_meta_data ->> 'farm_location',
    NEW.raw_user_meta_data ->> 'budget',
    NEW.raw_user_meta_data ->> 'animal_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

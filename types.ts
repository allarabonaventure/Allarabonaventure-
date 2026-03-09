
export type Category = 
  | 'formation' 
  | 'cultures' 
  | 'arboriculture' 
  | 'phytopathologie' 
  | 'pedologie' 
  | 'fertilisant' 
  | 'economie' 
  | 'ecologie' 
  | 'business';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: Category;
  duration: string;
  level: 'Débutant' | 'Intermédiaire' | 'Expert';
  image: string;
}

export interface CropItinerary {
  id: string;
  name: string;
  scientificName: string;
  cycle: string;
  density: string;
  fertilization: string;
  pests: string[];
  steps: string[];
}

export interface User {
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isSubscribed: boolean;
  plan?: 'Free' | 'Pro' | 'Enterprise';
  settings?: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark';
  };
}

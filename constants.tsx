
import React from 'react';
import { BookOpen, Sprout, TreeDeciduous, Bug, Microscope, FlaskRound as Flask, TrendingUp, Leaf, Briefcase } from 'lucide-react';
import { Course, Category } from './types';

export const CATEGORIES = [
  { id: 'formation', name: 'Formation', icon: <BookOpen />, color: 'bg-blue-500' },
  { id: 'cultures', name: 'Cultures', icon: <Sprout />, color: 'bg-emerald-500' },
  { id: 'arboriculture', name: 'Arboriculture', icon: <TreeDeciduous />, color: 'bg-green-600' },
  { id: 'phytopathologie', name: 'Phytopathologie', icon: <Bug />, color: 'bg-red-500' },
  { id: 'pedologie', name: 'Pédologie', icon: <Microscope />, color: 'bg-amber-600' },
  { id: 'fertilisant', name: 'Fertilité & Fertilisation', icon: <Flask />, color: 'bg-purple-500' },
  { id: 'economie', name: 'Agro-Économie', icon: <TrendingUp />, color: 'bg-indigo-500' },
  { id: 'ecologie', name: 'Agro-Écologie', icon: <Leaf />, color: 'bg-lime-500' },
  { id: 'business', name: 'Agro-Business', icon: <Briefcase />, color: 'bg-sky-600' },
];

export const COURSES: Course[] = [
  {
    id: '1',
    title: 'Sols Africains : Votre Premier Capital',
    description: "Arrêtez de cultiver à l'aveugle ! Découvrez comment un jeune entrepreneur au Tchad a triplé sa production d'oignons en comprenant simplement son sol. Apprenez à transformer une terre aride en mine d'or verte par l'analyse et la régénération biologique. Le sol n'est pas de la poussière, c'est un organisme vivant qui peut vous rendre riche.",
    category: 'pedologie',
    duration: '4h',
    level: 'Débutant',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Maïs : De 2t/ha à 8t/ha par la Technique',
    description: "L'agriculture est un business de précision, pas une fatalité. Suivez l'itinéraire qui a permis à des coopératives du Sahel de passer de la simple subsistance à l'exportation massive. Chaque grain semé avec la bonne densité et la bonne fertilisation est un investissement qui rapporte 4 fois plus que les méthodes traditionnelles.",
    category: 'cultures',
    duration: '6h',
    level: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1551730459-92db2a308d6a?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Protection Bio : Sauvez 90% de vos récoltes',
    description: "La chenille légionnaire et les criquets ne sont plus une condamnation. Découvrez des solutions de lutte intégrée (GIPD) vérifiées au Kenya et au Tchad, utilisant des extraits naturels de Neem et de Piment accessibles partout. Protégez votre champ, votre santé et votre portefeuille en disant adieu aux pesticides chimiques coûteux.",
    category: 'phytopathologie',
    duration: '3h',
    level: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1589408546115-28b340081d69?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'Agro-Business : L\'Art de Transformer',
    description: "Pourquoi vendre la matière brute quand on peut multiplier sa valeur par 5 ? Inspirez-vous du succès phénoménal de la transformation du manioc en Gari haut de gamme ou de l'arachide en beurre exportable. Structurez votre ferme comme une véritable entreprise agro-industrielle moderne et devenez un leader de l'économie rurale.",
    category: 'business',
    duration: '10h',
    level: 'Expert',
    image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=800&auto=format&fit=crop',
  }
];

export const PLANS = [
  {
    name: 'Gratuit',
    price: '0 FCFA',
    features: ['Accès aux fiches de base', 'Météo locale', 'Conseils hebdomadaires'],
    id: 'free'
  },
  {
    name: 'Pro',
    price: '5 000 FCFA / mois',
    features: ['Diagnostic IA illimité (Photos)', 'Vidéos de formation IA personnalisées', 'Business Plans types validés', 'Calculateur de rentabilité par culture', 'Accompagnement expert direct'],
    id: 'pro',
    popular: true
  },
  {
    name: 'Entreprise',
    price: 'Sur Devis',
    features: ['Cartographie de précision', 'Suivi satellite des cultures', 'Expertise sur site (Zone CEMAC)', 'Formation certifiante des équipes'],
    id: 'enterprise'
  }
];


export enum AppPillar {
  CONTENT = 'CONTENT',
  BUSINESS = 'BUSINESS',
  ACADEMY = 'ACADEMY',
  HEALTH = 'HEALTH'
}

export interface NavItem {
  id: AppPillar;
  label: string;
  icon: string;
  path: string;
}

export interface ContentGenerationResult {
  text: string;
  imageUrl?: string;
  platformVersions?: {
    linkedin: string;
    twitter: string;
    reel: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export interface Course {
  id: string;
  title: string;
  duration: string;
  level: string;
  topics: string[];
}

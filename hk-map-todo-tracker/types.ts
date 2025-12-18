
export enum UrgencyLevel {
  TOMORROW = 'TOMORROW',
  TWO_DAYS = 'TWO_DAYS',
  THIS_WEEK = 'THIS_WEEK',
  NEXT_WEEK = 'NEXT_WEEK'
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface Task {
  id: string;
  name: string;
  urgency: UrgencyLevel;
  location: GeoLocation;
  createdAt: number;
  completedAt?: number;
  isCompleted: boolean;
}

export const URGENCY_CONFIG = {
  [UrgencyLevel.TOMORROW]: {
    label: '立刻',
    color: 'bg-teal-900',
    borderColor: 'border-teal-900',
    dotColor: '#134e4a'
  },
  [UrgencyLevel.TWO_DAYS]: {
    label: '两天内',
    color: 'bg-teal-600',
    borderColor: 'border-teal-600',
    dotColor: '#0d9488'
  },
  [UrgencyLevel.THIS_WEEK]: {
    label: '本周内',
    color: 'bg-teal-300',
    borderColor: 'border-teal-300',
    dotColor: '#5eead4'
  },
  [UrgencyLevel.NEXT_WEEK]: {
    label: '下周',
    color: 'bg-transparent',
    borderColor: 'border-black',
    dotColor: 'transparent'
  }
};

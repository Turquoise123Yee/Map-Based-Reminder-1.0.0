
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
    color: 'bg-[#0EC0A6]',
    borderColor: 'border-[#0EC0A6]',
    dotColor: '#0EC0A6',
    textColor: 'text-white'
  },
  [UrgencyLevel.TWO_DAYS]: {
    label: '两天内',
    color: 'bg-[#0EC0A6]/80',
    borderColor: 'border-[#0EC0A6]/80',
    dotColor: 'rgba(14, 192, 166, 0.8)',
    textColor: 'text-white'
  },
  [UrgencyLevel.THIS_WEEK]: {
    label: '本周内',
    color: 'bg-[#0EC0A6]/40',
    borderColor: 'border-[#0EC0A6]/40',
    dotColor: 'rgba(14, 192, 166, 0.4)',
    textColor: 'text-[#0B9985]'
  },
  [UrgencyLevel.NEXT_WEEK]: {
    label: '下周',
    color: 'bg-white',
    borderColor: 'border-[#0EC0A6]',
    dotColor: '#FFFFFF',
    textColor: 'text-[#0EC0A6]'
  }
};

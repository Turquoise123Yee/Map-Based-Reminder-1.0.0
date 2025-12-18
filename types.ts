
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
    color: 'bg-[#4FD2C1]',
    borderColor: 'border-[#4FD2C1]',
    dotColor: '#4FD2C1',
    textColor: 'text-white'
  },
  [UrgencyLevel.THIS_WEEK]: {
    label: '本周内',
    color: 'bg-[#9EE6DE]',
    borderColor: 'border-[#9EE6DE]',
    dotColor: '#9EE6DE',
    textColor: 'text-[#0B9985]'
  },
  [UrgencyLevel.NEXT_WEEK]: {
    label: '下周',
    color: 'bg-white',
    borderColor: 'border-black',
    dotColor: '#FFFFFF',
    textColor: 'text-black'
  }
};

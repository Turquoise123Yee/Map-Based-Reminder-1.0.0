
import React, { useState } from 'react';
import { UrgencyLevel, URGENCY_CONFIG } from '../types';
import { X, Send } from 'lucide-react';

interface TaskModalProps {
  onClose: () => void;
  onSave: (name: string, urgency: UrgencyLevel) => void;
  lat: number;
  lng: number;
}

const TaskModal: React.FC<TaskModalProps> = ({ onClose, onSave, lat, lng }) => {
  const [name, setName] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.TOMORROW);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-
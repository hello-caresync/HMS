'use client';

import { MapPin, Navigation } from 'lucide-react';

import { opdUi } from '@/lib/opd/design-tokens';
import { getRoomDirections } from '@/lib/opd/room-directions';

type Props = {
  roomNumber?: string;
};

export function RoomDirections({ roomNumber }: Props) {
  const directions = getRoomDirections(roomNumber);
  if (!directions) return null;

  return (
    <div className={`${opdUi.card} border-[#8E7692]/30 bg-[#CEB2C0]/15 p-4`}>
      <h4 className="flex items-center gap-2 text-sm font-black text-[#482A41]">
        <Navigation className="h-4 w-4 text-[#572E54]" /> Indoor Directions · {directions.roomNumber}
      </h4>
      <p className="mt-1 text-xs text-[#8E7692]">
        {directions.floor} · {directions.wing} · {directions.landmark}
      </p>
      <ol className="mt-3 space-y-1.5 text-xs text-[#482A41]">
        {directions.steps.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#572E54] text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[#5E8B7E]">
        <MapPin className="h-3 w-3" /> Proceed to {directions.roomNumber} when called
      </p>
    </div>
  );
}

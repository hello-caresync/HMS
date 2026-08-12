'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';

interface VitalPoint {
  time: string;
  systolic: number;
  spo2: number;
  diastolic: number;
}

const mockVitalsData: VitalPoint[] = [
  { time: '09:00', systolic: 118, spo2: 98, diastolic: 72 },
  { time: '09:30', systolic: 121, spo2: 97, diastolic: 74 },
  { time: '10:00', systolic: 122, spo2: 97, diastolic: 75 },
  { time: '10:30', systolic: 120, spo2: 97, diastolic: 74 },
  { time: '11:00', systolic: 119, spo2: 98, diastolic: 73 },
  { time: '11:30', systolic: 118, spo2: 98, diastolic: 72 },
  { time: '12:00', systolic: 119, spo2: 99, diastolic: 71 },
];

export default function VitalsTrackerCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-800">Vitals Tracker</h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={mockVitalsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={12}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              domain={[0, 140]}
              ticks={[0, 35, 70, 105, 140]}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="systolic"
              name="Systolic BP"
              stroke="#1e5894"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="spo2"
              name="SpO₂ (%)"
              stroke="#15803d"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic BP"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

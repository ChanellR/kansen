import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpeedGraphProps {
  data: Array<{ time: number; currentSpeed: number; maxSpeed: number }>;
}

export function SpeedGraph({ data }: SpeedGraphProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#FFD4E0" opacity={0.3} />
        <XAxis 
          dataKey="time" 
          stroke="#D97BA6"
          tick={{ fill: '#D97BA6', fontSize: 12 }}
          label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#C97A98' }}
        />
        <YAxis 
          stroke="#D97BA6"
          tick={{ fill: '#D97BA6', fontSize: 12 }}
          label={{ value: 'Speed', angle: -90, position: 'insideLeft', fill: '#C97A98' }}
        />
        <Tooltip 
          contentStyle={{
            background: 'linear-gradient(145deg, #FFF5F7, #FFE8EE)',
            border: '1px solid #FFB3C6',
            borderRadius: '8px',
            color: '#C97A98',
            boxShadow: '4px 4px 8px rgba(255, 182, 198, 0.4)'
          }}
          labelStyle={{ color: '#D97BA6' }}
        />
        <Legend 
          wrapperStyle={{ color: '#C97A98' }}
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="maxSpeed" 
          stroke="#FFB3C6" 
          strokeWidth={2}
          dot={false}
          name="Max Speed"
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="currentSpeed" 
          stroke="#FF8FAB" 
          strokeWidth={3}
          dot={false}
          name="Current Speed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

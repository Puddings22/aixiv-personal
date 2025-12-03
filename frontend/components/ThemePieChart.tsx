
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClusterTheme } from '../types';
import { PIE_CHART_COLORS } from '../constants';

interface ThemePieChartProps {
  data: ClusterTheme[];
}

const ThemePieChart: React.FC<ThemePieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-600">No theme data available to display chart.</p>;
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="count"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} papers`, name as string]} />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ThemePieChart;

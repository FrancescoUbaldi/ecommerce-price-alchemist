
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslation } from '@/utils/translations';

interface RevenueComparisonChartProps {
  preReverNetBilling: number;
  finalNetBilling: number;
  language: string;
}

const RevenueComparisonChart = ({ 
  preReverNetBilling, 
  finalNetBilling, 
  language 
}: RevenueComparisonChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const data = [
    {
      name: getTranslation(language, 'preReverNetBilling'),
      value: preReverNetBilling,
      color: '#E5E7EB'
    },
    {
      name: getTranslation(language, 'finalNetBilling'),
      value: finalNetBilling,
      color: '#1790FF'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ x, y, width, value }: any) => {
    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="12"
        fontWeight="500"
      >
        {formatCurrency(value)}
      </text>
    );
  };

  // Only show if both values are present
  if (!preReverNetBilling || !finalNetBilling) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {getTranslation(language, 'revenueImpactTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueComparisonChart;

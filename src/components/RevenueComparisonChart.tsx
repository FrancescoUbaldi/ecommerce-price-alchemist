
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { getTranslation, formatCurrency as formatCurrencyUtil } from '@/utils/translations';

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
    return formatCurrencyUtil(value, language);
  };

  const difference = finalNetBilling - preReverNetBilling;

  // Ensure visual growth of at least 15-20% even when values are similar
  const visualPreRever = preReverNetBilling;
  const visualMinGrowth = preReverNetBilling * 0.15; // 15% minimum visual growth
  const actualGrowth = finalNetBilling - preReverNetBilling;
  const visualFinalNetBilling = finalNetBilling < preReverNetBilling + visualMinGrowth 
    ? preReverNetBilling + visualMinGrowth 
    : finalNetBilling;

  const data = [
    {
      name: getTranslation(language, 'netRevenuePreRever'),
      value: preReverNetBilling,
      visualValue: visualPreRever,
      color: '#E5E7EB',
      isBaseline: true
    },
    {
      name: getTranslation(language, 'netRevenueWithRever'),
      value: finalNetBilling,
      visualValue: visualFinalNetBilling,
      color: '#1790FF',
      isBaseline: false
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].payload.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ x, y, width, payload }: any) => {
    // Add safety checks for payload
    if (!payload || typeof payload.value === 'undefined') {
      return null;
    }

    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="14"
        fontWeight="bold"
        className="animate-fade-in"
      >
        {formatCurrency(payload.value)}
      </text>
    );
  };

  // Only show if both values are present
  if (!preReverNetBilling || !finalNetBilling) {
    return null;
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#1790FF]" />
          {getTranslation(language, 'netRevenueGrowthTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 40, right: 40, left: 20, bottom: 40 }}
              barCategoryGap="20%"
            >
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={40}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 50000']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="visualValue" 
                radius={[6, 6, 0, 0]}
                label={<CustomLabel />}
                maxBarSize={60}
                className="animate-scale-in"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className={`transition-all duration-1000 ease-out ${
                      entry.isBaseline 
                        ? 'opacity-80' 
                        : 'opacity-100 animate-pulse'
                    }`}
                    style={{
                      animation: entry.isBaseline 
                        ? `scale-in 1s ease-out ${index * 0.2}s both`
                        : `scale-in 1s ease-out ${index * 0.2}s both, pulse 2s infinite 1s`,
                      filter: entry.isBaseline ? 'none' : 'drop-shadow(0 0 8px rgba(23, 144, 255, 0.3))'
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Growth indicator */}
        {difference > 0 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <span className="text-2xl">🚀</span>
              <span className="text-green-700 font-semibold">
                +{formatCurrency(difference)}
              </span>
              <span className="text-green-600 text-sm">
                {getTranslation(language, 'growthIndicator')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueComparisonChart;

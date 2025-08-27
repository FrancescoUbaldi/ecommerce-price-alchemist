
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { getTranslation } from '@/utils/translations';

interface FeeDistributionProps {
  saasFee: number;
  transactionFee: number;
  rdvFee: number;
  upsellingFee: number;
  totalMensile: number;
}

const FeeDistributionChart = ({ 
  saasFee, 
  transactionFee, 
  rdvFee, 
  upsellingFee, 
  totalMensile 
}: FeeDistributionProps) => {
  if (totalMensile === 0) return null;

  const saasPercentage = (saasFee / totalMensile) * 100;
  const transactionPercentage = (transactionFee / totalMensile) * 100;
  const rdvPercentage = (rdvFee / totalMensile) * 100;
  const upsellingPercentage = (upsellingFee / totalMensile) * 100;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-600">{getTranslation('it', 'feeDistribution')}</h4>
      <div className="relative">
        <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${saasPercentage}%` }}
          />
          <div 
            className="bg-teal-500 h-full transition-all duration-300"
            style={{ width: `${transactionPercentage}%` }}
          />
          <div 
            className="bg-yellow-500 h-full transition-all duration-300"
            style={{ width: `${rdvPercentage}%` }}
          />
          <div 
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${upsellingPercentage}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{getTranslation('it', 'saasLabel')}: {saasPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
          <span>{getTranslation('it', 'transactionLabel')}: {transactionPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>{getTranslation('it', 'rdvLabel')}: {rdvPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span>{getTranslation('it', 'upsellingLabel')}: {upsellingPercentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default FeeDistributionChart;

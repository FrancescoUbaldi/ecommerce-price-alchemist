
import React from 'react';
import { Lightbulb } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface ClientData {
  totalOrdersAnnual: number;
  annualReturns: number;
  returnRate: number;
  averageCart: number;
}

interface RevenueSuggestionBoxProps {
  currentRevenueData: ClientData;
  updateClientData: (field: keyof any, value: number) => void;
  language: string;
}

const RevenueSuggestionBox = ({ currentRevenueData, updateClientData, language }: RevenueSuggestionBoxProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate potential extra revenue based on current data
  const calculateExtraRevenue = () => {
    if (!currentRevenueData.annualReturns || !currentRevenueData.averageCart) {
      return 0;
    }

    // Example calculation: RDV + Upselling potential
    const rdvResi = currentRevenueData.annualReturns * 0.35;
    const rdvValue = rdvResi * currentRevenueData.averageCart;
    
    const upsellingResi = currentRevenueData.annualReturns * 0.0378;
    const upsellingAOV = currentRevenueData.averageCart * 1.3;
    const upsellingValue = upsellingResi * upsellingAOV;
    
    return rdvValue + upsellingValue;
  };

  const extraRevenue = calculateExtraRevenue();

  // Only show if extraRevenue is positive and meaningful
  if (extraRevenue <= 0) {
    return null;
  }

  return (
    <div className="bg-[#F1F6FA] p-4 rounded-lg mt-6 border border-gray-100">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-[#1790FF] mt-0.5 flex-shrink-0" />
        <p className="text-gray-700 text-sm leading-relaxed">
          <span className="font-medium">
            {getTranslation(language, 'revenueSuggestion')}
          </span>{' '}
          <span className="font-bold text-[#1790FF]">
            {formatCurrency(extraRevenue)}
          </span>{' '}
          {getTranslation(language, 'revenueSuggestionEnd')}
        </p>
      </div>
    </div>
  );
};

export default RevenueSuggestionBox;

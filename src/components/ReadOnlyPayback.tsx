
import React from 'react';
import { getTranslation } from '@/utils/translations';

interface ReadOnlyPaybackProps {
  businessCaseData: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
  };
  scenarioData: {
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  monthlyTotal: number;
  language: string;
}

const ReadOnlyPayback = ({ businessCaseData, scenarioData, monthlyTotal, language }: ReadOnlyPaybackProps) => {
  // Calculate payback period using the correct business logic
  const annualReturns = businessCaseData.resiAnnuali > 0 ? businessCaseData.resiAnnuali : businessCaseData.resiMensili * 12;
  
  // Calculate RDV revenue (same logic as main UI)
  const rdvAnnuali = annualReturns * 0.35;
  const rdvMensili = rdvAnnuali / 12;
  const rdvRevenue = (rdvMensili * businessCaseData.carrelloMedio * scenarioData.rdvPercentage) / 100;
  
  // Calculate upselling revenue (same logic as main UI)
  const upsellingAnnuali = annualReturns * 0.0378;
  const upsellingMensili = upsellingAnnuali / 12;
  const incrementoCarrello = businessCaseData.carrelloMedio * 0.3;
  const upsellingRevenue = (upsellingMensili * incrementoCarrello * scenarioData.upsellingPercentage) / 100;
  
  // Calculate total extra revenue and payback (CORRECTED formula)
  const totalExtraRevenue = rdvRevenue + upsellingRevenue;
  // Payback should be: investment cost / monthly extra revenue
  const annualInvestment = monthlyTotal * 12;
  const paybackMonths = totalExtraRevenue > 0 ? annualInvestment / totalExtraRevenue : 0;

  console.log('ReadOnlyPayback Debug:', {
    totalExtraRevenue,
    monthlyTotal,
    annualInvestment,
    paybackMonths,
    showPayback: paybackMonths > 0 && paybackMonths < 6
  });

  // Only show if payback is less than 6 months and greater than 0
  if (paybackMonths <= 0 || paybackMonths >= 6) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-green-800 font-semibold">
          ⏱️ {getTranslation(language, 'estimatedPayback')}: {paybackMonths.toFixed(1)} {getTranslation(language, 'monthsToRecoverInvestment')}
        </span>
      </div>
    </div>
  );
};

export default ReadOnlyPayback;


import React from 'react';
import { getTranslation } from '@/utils/translations';

interface ReadOnlyPaybackProps {
  businessCaseData: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
    totalOrdersAnnual: number;
  };
  scenarioData: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  monthlyTotal: number;
  language: string;
}

const ReadOnlyPayback = ({ businessCaseData, scenarioData, monthlyTotal, language }: ReadOnlyPaybackProps) => {
  // Calculate payback period using the EXACT SAME business logic as BusinessCase.tsx
  const annualReturns = businessCaseData.resiAnnuali > 0 ? businessCaseData.resiAnnuali : businessCaseData.resiMensili * 12;
  
  // Use scenario RDV and upselling rates instead of hardcoded values
  const effectiveRdvRate = 0.35; // Default RDV rate (35%) 
  const effectiveUpsellingRate = 0.0378; // Default upselling rate (3.78%)
  
  // Calculate base revenue (matching BusinessCase exactly)
  const fatturazione = businessCaseData.totalOrdersAnnual * businessCaseData.carrelloMedio;
  const resiValue = annualReturns * businessCaseData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  // Calculate RDV revenue (matching BusinessCase exactly)
  const rdvResi = annualReturns * effectiveRdvRate;
  const rdvValue = rdvResi * businessCaseData.carrelloMedio;
  
  // Calculate upselling revenue (matching BusinessCase exactly)
  const upsellingResi = annualReturns * effectiveUpsellingRate;
  const upsellingAOV = businessCaseData.carrelloMedio * 1.3; // 30% increase
  const upsellingValue = upsellingResi * upsellingAOV;
  
  // Calculate final net billing (matching BusinessCase exactly)
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  const fatturazioneGenerataRever = rdvValue + upsellingValue;
  
  // Calculate total platform cost using SAME logic as BusinessCase
  const saasFeeAnnuale = scenarioData.saasFee * 12;
  const transactionFeeAnnuale = scenarioData.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * scenarioData.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenarioData.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  
  // Calculate net revenues and increase (matching BusinessCase exactly)
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;
  
  // Calculate payback using the EXACT SAME formula as BusinessCase
  const paybackMonths = (businessCaseData.carrelloMedio && annualReturns && businessCaseData.totalOrdersAnnual && 
                        aumentoNetRevenues > 0 && totalPlatformCost > 0)
    ? totalPlatformCost / (aumentoNetRevenues / 12) 
    : null;

  console.log('ReadOnlyPayback Debug:', {
    fatturazioneGenerataRever,
    aumentoNetRevenues,
    totalPlatformCost,
    paybackMonths,
    showPayback: paybackMonths && paybackMonths < 6,
    scenarioRates: {
      rdvPercentage: scenarioData.rdvPercentage,
      upsellingPercentage: scenarioData.upsellingPercentage
    }
  });

  // Show if payback exists and is meaningful (matching BusinessCase logic exactly)
  if (!paybackMonths || paybackMonths >= 6) {
    return null;
  }

  return (
    <div className="text-center">
      <div className="inline-block p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700 font-medium">
          ⏱️ {getTranslation(language, 'paybackEstimated')}: {paybackMonths.toFixed(1)} {getTranslation(language, 'monthsToRecoverInvestment')}
        </p>
      </div>
    </div>
  );
};

export default ReadOnlyPayback;

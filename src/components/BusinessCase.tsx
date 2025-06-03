import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, TrendingUp } from 'lucide-react';
import { getTranslation } from '@/utils/translations';
import ClientLogoBanner from './ClientLogoBanner';
import RevenueSuggestionBox from './RevenueSuggestionBox';
import RevenueComparisonChart from './RevenueComparisonChart';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface PricingData {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
  name: string;
}

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: ClientData;
  scenario: PricingData;
  language: string;
  updateClientData: (field: keyof ClientData, value: number) => void;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language,
  updateClientData 
}: BusinessCaseProps) => {
  // Calculate payback period
  const calculatePayback = useMemo(() => {
    if (!clientData.carrelloMedio || !clientData.resiAnnuali || !clientData.totalOrdersAnnual) {
      return null;
    }

    const annualReturns = clientData.resiAnnuali;
    
    // Pre-REVER calculations
    const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
    const resiValue = annualReturns * clientData.carrelloMedio;
    const fatturazioneNettaPreRever = fatturazione - resiValue;
    
    // With REVER calculations
    const rdvResi = annualReturns * 0.35;
    const rdvValue = rdvResi * clientData.carrelloMedio;
    
    const upsellingResi = annualReturns * 0.0378;
    const upsellingAOV = clientData.carrelloMedio * 1.3;
    const upsellingValue = upsellingResi * upsellingAOV;
    
    const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
    
    // REVER Platform Cost
    const saasFeeAnnuale = scenario.saasFee * 12;
    const transactionFeeAnnuale = scenario.transactionFeeFixed * annualReturns;
    const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
    const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
    const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
    
    const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
    const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;
    
    if (netRevenueIncrease <= 0 || totalPlatformCost <= 0) {
      return null;
    }
    
    const paybackMonths = totalPlatformCost / (netRevenueIncrease / 12);
    
    return paybackMonths < 6 ? paybackMonths : null;
  }, [clientData, scenario]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyNoDecimals = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Business case calculations
  const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
  
  if (!annualReturns || !clientData.carrelloMedio || !clientData.totalOrdersAnnual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getTranslation(language, 'businessCase')}: {clientName || getTranslation(language, 'ecommerceName')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>{getTranslation(language, 'fillAllFieldsMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resiValue = annualReturns * clientData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  const rdvResi = annualReturns * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;
  
  const upsellingResi = annualReturns * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;
  
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  
  const fatturazioneGenerataDaRever = rdvValue + upsellingValue;
  
  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;
  const roiPercentage = fatturazioneNettaPreRever > 0 ? (netRevenueIncrease / fatturazioneNettaPreRever) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {getTranslation(language, 'clientData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessCaseClientName">{getTranslation(language, 'clientName')}</Label>
            <Input
              id="businessCaseClientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={getTranslation(language, 'clientNamePlaceholder')}
            />
          </div>

          <ClientLogoBanner 
            language={language}
          />

          <RevenueSuggestionBox
            language={language}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getTranslation(language, 'businessCase')}: {clientName || getTranslation(language, 'ecommerceName')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-[#007BFF] text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium">Descrizione</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-medium">Ordini</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-medium">AOV</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">%</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-medium">Totale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">📦 Fatturazione (Pre REVER)</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{clientData.totalOrdersAnnual.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold">{formatCurrencyNoDecimals(fatturazione)}</td>
                </tr>
                
                <tr className="bg-red-50 hover:bg-red-100">
                  <td className="border border-gray-300 px-4 py-3 font-medium">↩️ Resi (Pre REVER)</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{annualReturns.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{formatPercentage(clientData.returnRatePercentage)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-red-600">-{formatCurrencyNoDecimals(resiValue)}</td>
                </tr>
                
                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="border border-gray-300 px-4 py-3 font-bold">💰 Fatturazione netta (Pre REVER)</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-blue-600">{formatCurrencyNoDecimals(fatturazioneNettaPreRever)}</td>
                </tr>
                
                <tr className="bg-green-50 hover:bg-green-100">
                  <td className="border border-gray-300 px-4 py-3 font-medium">🔄 Vendite ritenute (35%)</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{Math.round(rdvResi).toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">35%</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">+{formatCurrencyNoDecimals(rdvValue)}</td>
                </tr>
                
                <tr className="bg-green-50 hover:bg-green-100">
                  <td className="border border-gray-300 px-4 py-3 font-medium">📈 Upselling</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{Math.round(upsellingResi).toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{formatCurrency(upsellingAOV)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">3.78%</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-green-600">+{formatCurrencyNoDecimals(upsellingValue)}</td>
                </tr>
                
                <tr className="bg-emerald-100 hover:bg-emerald-200">
                  <td className="border border-gray-300 px-4 py-3 font-bold">🚀 Fatturazione netta finale</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-emerald-700">{formatCurrencyNoDecimals(fatturazioneNettaFinale)}</td>
                </tr>
                
                <tr className="bg-purple-50 hover:bg-purple-100">
                  <td className="border border-gray-300 px-4 py-3 font-bold">⭐ Fatturazione generata da REVER</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-purple-700">+{formatCurrencyNoDecimals(fatturazioneGenerataDaRever)}</td>
                </tr>
                
                <tr className="bg-orange-50 hover:bg-orange-100">
                  <td className="border border-gray-300 px-4 py-3 font-bold">💳 Costi</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-orange-600">-{formatCurrencyNoDecimals(totalPlatformCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-700">📊 ROI</div>
                <div className="text-3xl font-bold text-green-600">
                  +{formatPercentage(roiPercentage)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-700">💰 Aumento Net Revenues</div>
                <div className="text-3xl font-bold text-green-600">
                  +{formatCurrencyNoDecimals(netRevenueIncrease)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payback Display - only show if payback < 6 months */}
      {calculatePayback !== null && (
        <div 
          className="bg-[#E6F0FF] text-[#004085] px-3 py-2 rounded-lg font-semibold mb-3 animate-fade-in"
          style={{ 
            fontWeight: '600',
            marginBottom: '12px'
          }}
        >
          ⏱️ Payback stimato: {calculatePayback.toFixed(1)} mesi per recuperare l'investimento
        </div>
      )}

      <RevenueComparisonChart
        preReverNetBilling={fatturazioneNettaPreRever}
        finalNetBilling={netRevenuesEcommerce}
        language={language}
      />
    </div>
  );
};

export default BusinessCase;

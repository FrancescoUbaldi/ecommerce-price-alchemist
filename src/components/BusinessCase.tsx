import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import RevenueComparisonChart from './RevenueComparisonChart';
import ClientLogoBanner from './ClientLogoBanner';
import RevenueSuggestionBox from './RevenueSuggestionBox';
import { getTranslation } from '@/utils/translations';

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
    totalOrdersAnnual: number;
    returnRatePercentage: number;
  };
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  language: string;
  updateClientData?: (field: string, value: number) => void;
  isReadOnly?: boolean;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language,
  updateClientData,
  isReadOnly = false
}: BusinessCaseProps) => {
  // Calcola il GTV annuale
  const gtv = useMemo(() => {
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Calcola i valori pre-REVER
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resiValue = clientData.resiAnnuali * clientData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;

  // Calcola i valori con REVER
  const rdvResi = clientData.resiAnnuali * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;

  const upsellingResi = clientData.resiAnnuali * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;

  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;

  // Calcola i costi della piattaforma REVER
  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * clientData.resiAnnuali;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;

  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;

  // Calcola il payback period
  const calculatePayback = useMemo(() => {
    if (!clientData.carrelloMedio || !clientData.resiAnnuali || !clientData.totalOrdersAnnual) {
      return null;
    }

    if (netRevenueIncrease <= 0 || totalPlatformCost <= 0) {
      return null;
    }

    const paybackMonths = totalPlatformCost / (netRevenueIncrease / 12);
    return paybackMonths < 6 ? paybackMonths : null;
  }, [clientData, scenario, netRevenueIncrease, totalPlatformCost]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Client Name Input - hidden in read-only mode */}
      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {getTranslation(language, 'businessCase')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="clientName">{getTranslation(language, 'clientName')}</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Inserisci il nome del cliente"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Logo Banner */}
      <ClientLogoBanner clientName={clientName} language={language} />

      {/* Business Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getTranslation(language, 'businessAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pre-REVER vs With REVER Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{getTranslation(language, 'preReverAnalysis')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{getTranslation(language, 'totalRevenue')}:</span>
                  <span>{formatCurrency(fatturazione)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getTranslation(language, 'returnsValue')}:</span>
                  <span>{formatCurrency(resiValue)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{getTranslation(language, 'netRevenue')}:</span>
                  <span>{formatCurrency(fatturazioneNettaPreRever)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">{getTranslation(language, 'withReverAnalysis')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{getTranslation(language, 'rdvRevenue')}:</span>
                  <span>{formatCurrency(rdvValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getTranslation(language, 'upsellingRevenue')}:</span>
                  <span>{formatCurrency(upsellingValue)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{getTranslation(language, 'netRevenue')}:</span>
                  <span>{formatCurrency(fatturazioneNettaFinale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{getTranslation(language, 'platformCost')}:</span>
                  <span>{formatCurrency(totalPlatformCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-3">
                  <span>{getTranslation(language, 'netEcommerceRevenue')}:</span>
                  <span className="text-green-600">{formatCurrency(netRevenuesEcommerce)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Comparison Chart */}
          <RevenueComparisonChart
            preReverRevenue={fatturazioneNettaPreRever}
            withReverRevenue={netRevenuesEcommerce}
            platformCost={totalPlatformCost}
            language={language}
          />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600">{getTranslation(language, 'gtv')}</h4>
              <p className="text-2xl font-bold">{formatCurrency(gtv)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600">{getTranslation(language, 'revenueIncrease')}</h4>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(netRevenueIncrease)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600">{getTranslation(language, 'netEcommerceRevenue')}</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(netRevenuesEcommerce)}</p>
            </div>
          </div>

          {/* Payback Period */}
          {calculatePayback !== null && (
            <div className="bg-[#E5F0FF] border border-[#1790FF] rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#1790FF]" />
                <div className="text-[#000D1F]">
                  <span className="font-medium">⏳ Payback stimato: </span>
                  <span className="font-bold text-[#1790FF]">
                    {calculatePayback.toFixed(1)} mesi
                  </span>
                  <span> per recuperare l'investimento</span>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Suggestion Box - hidden in read-only mode */}
          {!isReadOnly && (
            <RevenueSuggestionBox
              currentRevenue={netRevenuesEcommerce}
              language={language}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCase;

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import RevenueComparisonChart from './RevenueComparisonChart';
import RevenueSuggestionBox from './RevenueSuggestionBox';
import ClientLogoBanner from './ClientLogoBanner';
import { getTranslation } from '@/utils/translations';

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: any;
  scenario: any;
  language: string;
  updateClientData: (field: string, value: number) => void;
  readOnly?: boolean;
}

const BusinessCase: React.FC<BusinessCaseProps> = ({
  clientName,
  setClientName,
  clientData,
  scenario,
  language,
  updateClientData,
  readOnly = false
}) => {
  const annualReturns = clientData.resiAnnuali;

  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resiValue = annualReturns * clientData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;

  const rdvResi = annualReturns * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;

  const upsellingResi = annualReturns * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;

  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;

  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;

  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;
  const revenueIncrease = (netRevenueIncrease / fatturazioneNettaPreRever) * 100;

  const revenueComparison = useMemo(() => {
    return {
      grossRevenue: fatturazione,
      returnsValue: resiValue,
      netRevenueWithoutRever: fatturazioneNettaPreRever,
      rdvValue: rdvValue,
      upsellingValue: upsellingValue,
      platformCost: totalPlatformCost,
      netRevenueWithRever: netRevenuesEcommerce,
      additionalRevenue: netRevenueIncrease,
      revenueIncrease: revenueIncrease
    };
  }, [clientData, scenario]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Business Case for ' + clientName, 10, 10);
    doc.save('business-case.pdf');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getTranslation(language, 'businessCase')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!readOnly && (
            <div className="space-y-2">
              <Label htmlFor="clientName">{getTranslation(language, 'clientName')}</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Inserisci il nome del cliente"
              />
            </div>
          )}

          {readOnly && clientName && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1790FF]">{clientName}</h2>
              <p className="text-gray-600 mt-2">Business Case Analysis</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessCaseCarrello">{getTranslation(language, 'averageCart')}</Label>
              <Input
                id="businessCaseCarrello"
                type="number"
                value={clientData.carrelloMedio || ''}
                onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                placeholder="35.50"
                readOnly={readOnly}
                className={readOnly ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessCaseResi">{getTranslation(language, 'annualReturns')}</Label>
              <Input
                id="businessCaseResi"
                type="number"
                value={clientData.resiAnnuali || ''}
                onChange={(e) => updateClientData('resiAnnuali', parseInt(e.target.value) || 0)}
                placeholder="23900"
                readOnly={readOnly}
                className={readOnly ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
          </div>

          {revenueComparison && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">{getTranslation(language, 'revenueComparison')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">💸 SENZA REVER</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'grossRevenue')}:</span>
                      <span className="font-medium">{formatCurrency(revenueComparison.grossRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'returnsValue')}:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(revenueComparison.returnsValue)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{getTranslation(language, 'netRevenue')}:</span>
                      <span className="text-red-600">{formatCurrency(revenueComparison.netRevenueWithoutRever)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#1790FF]">
                  <h4 className="font-medium text-[#1790FF] mb-3">🚀 CON REVER</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'rdvRecovered')}:</span>
                      <span className="font-medium text-green-600">+{formatCurrency(revenueComparison.rdvValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'upsellingRevenue')}:</span>
                      <span className="font-medium text-green-600">+{formatCurrency(revenueComparison.upsellingValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Cost:</span>
                      <span className="font-medium text-[#1790FF]">-{formatCurrency(revenueComparison.platformCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{getTranslation(language, 'netRevenue')}:</span>
                      <span className="text-green-600">{formatCurrency(revenueComparison.netRevenueWithRever)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-block bg-[#1790FF] text-white px-6 py-3 rounded-lg">
                  <div className="text-sm font-medium">💰 {getTranslation(language, 'additionalRevenue')}</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(revenueComparison.additionalRevenue)}
                  </div>
                  <div className="text-sm">
                    (+{formatPercentage(revenueComparison.revenueIncrease)} {getTranslation(language, 'increase')})
                  </div>
                </div>
              </div>

              <RevenueComparisonChart
                netRevenueWithoutRever={revenueComparison.netRevenueWithoutRever}
                netRevenueWithRever={revenueComparison.netRevenueWithRever}
                additionalRevenue={revenueComparison.additionalRevenue}
                language={language}
              />
            </div>
          )}

          <RevenueSuggestionBox
            clientData={clientData}
            scenario={scenario}
            language={language}
          />

          {clientName && !readOnly && (
            <div className="flex justify-center pt-6">
              <Button 
                onClick={generatePDF}
                className="bg-[#1790FF] hover:bg-[#1470CC] text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {getTranslation(language, 'downloadPDF')}
              </Button>
            </div>
          )}

          {clientName && (
            <ClientLogoBanner clientName={clientName} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCase;

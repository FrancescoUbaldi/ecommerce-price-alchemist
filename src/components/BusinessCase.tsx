import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calculator } from 'lucide-react';
import { jsPDF } from 'jspdf';
import RevenueComparisonChart from './RevenueComparisonChart';
import ClientLogoBanner from './ClientLogoBanner';
import RevenueSuggestionBox from './RevenueSuggestionBox';
import { getTranslation } from '@/utils/translations';

interface PricingData {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
  name: string;
}

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: ClientData;
  scenario: PricingData;
  language: string;
  updateClientData: (field: keyof ClientData, value: number) => void;
  paybackMonths?: number | null;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language, 
  updateClientData,
  paybackMonths 
}: BusinessCaseProps) => {
  
  const calculations = useMemo(() => {
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
    const roiPercentage = fatturazioneNettaPreRever > 0 ? (netRevenueIncrease / fatturazioneNettaPreRever) * 100 : 0;

    return {
      fatturazione,
      resiValue,
      fatturazioneNettaPreRever,
      rdvResi,
      rdvValue,
      upsellingResi,
      upsellingValue,
      fatturazioneNettaFinale,
      saasFeeAnnuale,
      transactionFeeAnnuale,
      rdvFeeAnnuale,
      upsellingFeeAnnuale,
      totalPlatformCost,
      netRevenuesEcommerce,
      netRevenueIncrease,
      roiPercentage
    };
  }, [clientData, scenario]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(Math.round(value));
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportToPDF = () => {
    if (!calculations) return;

    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text(`Business Case: ${clientName || 'Nome Ecommerce'}`, 20, 30);
    
    pdf.setFontSize(12);
    let yPosition = 50;
    
    // Client data
    pdf.text('Dati Cliente:', 20, yPosition);
    yPosition += 10;
    pdf.text(`Resi Annuali: ${formatNumber(clientData.resiAnnuali)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Carrello Medio: ${formatCurrency(clientData.carrelloMedio)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Ordini Totali Annuali: ${formatNumber(clientData.totalOrdersAnnual)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Tasso di Reso: ${formatPercentage(clientData.returnRatePercentage)}`, 20, yPosition);
    yPosition += 15;
    
    // Financial data
    pdf.text('Analisi Finanziaria:', 20, yPosition);
    yPosition += 10;
    pdf.text(`Fatturazione Pre-REVER: ${formatCurrency(calculations.fatturazioneNettaPreRever)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Fatturazione Con REVER: ${formatCurrency(calculations.netRevenuesEcommerce)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Incremento Ricavi Netti: ${formatCurrency(calculations.netRevenueIncrease)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`ROI: ${formatPercentage(calculations.roiPercentage)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Costo Piattaforma REVER: ${formatCurrency(calculations.totalPlatformCost)}`, 20, yPosition);
    
    pdf.save(`business-case-${clientName || 'ecommerce'}.pdf`);
  };

  if (!calculations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getTranslation(language, 'businessCase')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{getTranslation(language, 'fillDataMessage')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ClientLogoBanner clientName={clientName} setClientName={setClientName} language={language} />
      
      <RevenueSuggestionBox
        currentRevenueData={{
          totalOrdersAnnual: clientData.totalOrdersAnnual,
          annualReturns: clientData.resiAnnuali,
          returnRate: clientData.returnRatePercentage,
          averageCart: clientData.carrelloMedio
        }}
        updateClientData={updateClientData}
        language={language}
      />

      <Card className="bg-[#000D1F] text-white border-0 p-0 m-0">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-white text-center text-xl">
            Business Case: {clientName || 'Nome Ecommerce'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="bg-white rounded-2xl m-6 p-8 shadow-lg text-gray-900">
            <div className="space-y-8">
              {/* Dati Cliente Section */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {getTranslation(language, 'clientData')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessAnnualReturns">{getTranslation(language, 'annualReturns')}</Label>
                    <Input
                      id="businessAnnualReturns"
                      type="number"
                      value={clientData.resiAnnuali || ''}
                      onChange={(e) => updateClientData('resiAnnuali', parseInt(e.target.value) || 0)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAverageCart">{getTranslation(language, 'averageCart')}</Label>
                    <Input
                      id="businessAverageCart"
                      type="number"
                      value={clientData.carrelloMedio || ''}
                      onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessTotalOrders">{getTranslation(language, 'totalAnnualOrders')}</Label>
                    <Input
                      id="businessTotalOrders"
                      type="number"
                      value={clientData.totalOrdersAnnual || ''}
                      onChange={(e) => updateClientData('totalOrdersAnnual', parseInt(e.target.value) || 0)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessReturnRate">{getTranslation(language, 'returnRate')}</Label>
                    <Input
                      id="businessReturnRate"
                      type="number"
                      step="0.1"
                      value={clientData.returnRatePercentage || ''}
                      onChange={(e) => updateClientData('returnRatePercentage', parseFloat(e.target.value) || 0)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Fatturazione Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center mb-6">{getTranslation(language, 'financialAnalysis')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800">{getTranslation(language, 'preReverSection')}</h4>
                    <div className="bg-red-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span>{getTranslation(language, 'totalBilling')}:</span>
                        <span className="font-medium">{formatCurrency(calculations.fatturazione)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{getTranslation(language, 'returnsValue')}:</span>
                        <span className="font-medium">-{formatCurrency(calculations.resiValue)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>{getTranslation(language, 'netRevenuePreRever')}:</span>
                        <span>{formatCurrency(calculations.fatturazioneNettaPreRever)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-[#1790FF]">{getTranslation(language, 'withReverSection')}</h4>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span>{getTranslation(language, 'netRevenuePreRever')}:</span>
                        <span className="font-medium">{formatCurrency(calculations.fatturazioneNettaPreRever)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>+ RDV ({formatNumber(calculations.rdvResi)} resi):</span>
                        <span className="font-medium">+{formatCurrency(calculations.rdvValue)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>+ Upselling ({formatNumber(calculations.upsellingResi)} resi):</span>
                        <span className="font-medium">+{formatCurrency(calculations.upsellingValue)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{getTranslation(language, 'platformCost')}:</span>
                        <span className="font-medium">-{formatCurrency(calculations.totalPlatformCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2 text-[#1790FF]">
                        <span>{getTranslation(language, 'finalNetRevenue')}:</span>
                        <span>{formatCurrency(calculations.netRevenuesEcommerce)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Section */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <h4 className="font-semibold text-gray-700">{getTranslation(language, 'netRevenueIncrease')}</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(calculations.netRevenueIncrease)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">ROI</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatPercentage(calculations.roiPercentage)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">{getTranslation(language, 'platformCost')}</h4>
                    <p className="text-2xl font-bold text-gray-600">{formatCurrency(calculations.totalPlatformCost)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button onClick={exportToPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {getTranslation(language, 'exportPDF')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RevenueComparisonChart
        preReverNetBilling={calculations.fatturazioneNettaPreRever}
        finalNetBilling={calculations.netRevenuesEcommerce}
        language={language}
        paybackMonths={paybackMonths}
      />
    </div>
  );
};

export default BusinessCase;

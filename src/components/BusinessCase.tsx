
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calculator } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <ClientLogoBanner 
        clientName={clientName} 
        setClientName={setClientName} 
        language={language} 
      />
      
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

              {/* Business Case Table */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center mb-6">{getTranslation(language, 'financialAnalysis')}</h3>
                
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#007BFF] hover:bg-[#007BFF]">
                        <TableHead className="text-white font-bold text-left">Voce</TableHead>
                        <TableHead className="text-white font-bold text-center">Ordini</TableHead>
                        <TableHead className="text-white font-bold text-center">AOV</TableHead>
                        <TableHead className="text-white font-bold text-center">%</TableHead>
                        <TableHead className="text-white font-bold text-right">Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Fatturazione */}
                      <TableRow>
                        <TableCell className="font-medium">Fatturazione</TableCell>
                        <TableCell className="text-center">{formatNumber(clientData.totalOrdersAnnual)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(calculations.fatturazione)}</TableCell>
                      </TableRow>
                      
                      {/* Resi */}
                      <TableRow className="bg-red-50">
                        <TableCell className="font-medium text-red-600">Resi</TableCell>
                        <TableCell className="text-center text-red-600">{formatNumber(clientData.resiAnnuali)}</TableCell>
                        <TableCell className="text-center text-red-600">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                        <TableCell className="text-center text-red-600">{formatPercentage(clientData.returnRatePercentage)}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">-{formatCurrency(calculations.resiValue)}</TableCell>
                      </TableRow>
                      
                      {/* Fatturazione netta Pre-REVER */}
                      <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                        <TableCell className="font-bold">Fatturazione netta (Pre-REVER)</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-bold text-lg">{formatCurrency(calculations.fatturazioneNettaPreRever)}</TableCell>
                      </TableRow>
                      
                      {/* Vendite ritenute */}
                      <TableRow className="bg-green-50">
                        <TableCell className="font-medium text-green-600">Vendite ritenute (35%)</TableCell>
                        <TableCell className="text-center text-green-600">{formatNumber(calculations.rdvResi)}</TableCell>
                        <TableCell className="text-center text-green-600">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                        <TableCell className="text-center text-green-600">35%</TableCell>
                        <TableCell className="text-right font-medium text-green-600">+{formatCurrency(calculations.rdvValue)}</TableCell>
                      </TableRow>
                      
                      {/* Upselling */}
                      <TableRow className="bg-green-50">
                        <TableCell className="font-medium text-green-600">Upselling</TableCell>
                        <TableCell className="text-center text-green-600">{formatNumber(calculations.upsellingResi)}</TableCell>
                        <TableCell className="text-center text-green-600">{formatCurrency(calculations.upsellingAOV)}</TableCell>
                        <TableCell className="text-center text-green-600">3.78%</TableCell>
                        <TableCell className="text-right font-medium text-green-600">+{formatCurrency(calculations.upsellingValue)}</TableCell>
                      </TableRow>
                      
                      {/* Fatturazione netta finale */}
                      <TableRow className="bg-blue-50 border-t-2 border-blue-300">
                        <TableCell className="font-bold text-blue-600">Fatturazione netta finale</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-bold text-lg text-blue-600">{formatCurrency(calculations.fatturazioneNettaFinale)}</TableCell>
                      </TableRow>
                      
                      {/* Fatturazione generata da REVER */}
                      <TableRow className="bg-yellow-50">
                        <TableCell className="font-medium text-yellow-700">Fatturazione generata da REVER</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-medium text-yellow-700">{formatCurrency(calculations.rdvValue + calculations.upsellingValue)}</TableCell>
                      </TableRow>
                      
                      {/* Costi REVER */}
                      <TableRow className="bg-red-50">
                        <TableCell className="font-medium text-red-600">Costi REVER</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-medium text-red-600">-{formatCurrency(calculations.totalPlatformCost)}</TableCell>
                      </TableRow>
                      
                      {/* Net Revenues finale */}
                      <TableRow className="bg-[#1790FF] text-white border-t-2 border-[#1790FF]">
                        <TableCell className="font-bold text-white">Net Revenues (Con REVER)</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-bold text-lg text-white">{formatCurrency(calculations.netRevenuesEcommerce)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* ROI Section */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">{getTranslation(language, 'netRevenueIncrease')}</h4>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(calculations.netRevenueIncrease)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">ROI</h4>
                    <p className="text-3xl font-bold text-blue-600">{formatPercentage(calculations.roiPercentage)}</p>
                  </div>
                </div>
              </div>

              {/* Payback display - only if under 6 months */}
              {paybackMonths !== null && paybackMonths !== undefined && paybackMonths < 6 && (
                <div className="bg-[#E6F0FF] border border-[#004085] rounded-lg px-6 py-4 animate-fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">⏱</span>
                    <span className="text-[#004085] font-bold text-lg">
                      Payback stimato: {paybackMonths.toFixed(1)} mesi per recuperare l'investimento
                    </span>
                  </div>
                </div>
              )}
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

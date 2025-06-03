
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Clock } from 'lucide-react';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import BusinessCase from '@/components/BusinessCase';
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

const ClientView = () => {
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [customScenario, setCustomScenario] = useState<PricingData | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [language, setLanguage] = useState<string>('it');

  useEffect(() => {
    if (!shareId) {
      setError('Link di condivisione non valido');
      setLoading(false);
      return;
    }

    try {
      const shareData = localStorage.getItem(`share-${shareId}`);
      if (!shareData) {
        setError('Link di condivisione scaduto o non trovato');
        setLoading(false);
        return;
      }

      const data = JSON.parse(shareData);
      setClientData(data.clientData);
      setCustomScenario(data.customScenario);
      setClientName(data.clientName);
      setLanguage(data.language);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      setLoading(false);
    }
  }, [shareId]);

  // Calculate GTV
  const gtv = useMemo(() => {
    if (!clientData) return 0;
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData]);

  const calculateScenario = (scenario: PricingData) => {
    if (!clientData) return null;
    
    const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
    
    if (!annualReturns || !clientData.carrelloMedio) {
      return {
        saasFee: 0,
        transactionFee: 0,
        rdvFee: 0,
        upsellingFee: 0,
        totalMensile: 0,
        takeRate: 0,
        gtv: 0,
        annualContractValue: 0
      };
    }

    const resiMensili = annualReturns / 12;
    
    const transactionFee = resiMensili * scenario.transactionFeeFixed;
    
    const rdvAnnuali = annualReturns * 0.35;
    const rdvMensili = rdvAnnuali / 12;
    const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
    
    const upsellingAnnuali = annualReturns * 0.0378;
    const upsellingMensili = upsellingAnnuali / 12;
    const incrementoCarrello = clientData.carrelloMedio * 0.3;
    const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
    
    const totalMensile = scenario.saasFee + transactionFee + rdvFee + upsellingFee;
    const annualContractValue = totalMensile * 12;
    
    const takeRate = gtv > 0 ? (annualContractValue / gtv) * 100 : 0;

    return {
      saasFee: scenario.saasFee,
      transactionFee,
      rdvFee,
      upsellingFee,
      totalMensile,
      takeRate,
      gtv,
      annualContractValue
    };
  };

  // Calculate payback period
  const calculatePayback = useMemo(() => {
    if (!clientData || !customScenario || !clientData.carrelloMedio || !clientData.resiAnnuali || !clientData.totalOrdersAnnual) {
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
    const saasFeeAnnuale = customScenario.saasFee * 12;
    const transactionFeeAnnuale = customScenario.transactionFeeFixed * annualReturns;
    const rdvFeeAnnuale = (rdvValue * customScenario.rdvPercentage) / 100;
    const upsellingFeeAnnuale = (upsellingValue * customScenario.upsellingPercentage) / 100;
    const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
    
    const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
    const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;
    
    if (netRevenueIncrease <= 0 || totalPlatformCost <= 0) {
      return null;
    }
    
    const paybackMonths = totalPlatformCost / (netRevenueIncrease / 12);
    
    return paybackMonths < 6 ? paybackMonths : null;
  }, [clientData, customScenario]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1790FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Contatta il tuo riferimento REVER per un nuovo link.</p>
        </div>
      </div>
    );
  }

  if (!clientData || !customScenario) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Dati non disponibili</p>
        </div>
      </div>
    );
  }

  const calculation = calculateScenario(customScenario);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Read Only */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-40 w-auto overflow-hidden mb-1">
            <img 
              src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png" 
              alt="REVER Logo" 
              className="h-48 w-auto object-cover object-top transform -translate-y-2"
            />
          </div>
          <p className="text-gray-600 text-center -mt-6 leading-tight relative z-10">{getTranslation(language, 'subtitle')}</p>
          
          {/* Client-specific header */}
          <div className="mt-4 text-center">
            <div className="inline-block bg-[#E5F0FF] border border-[#1790FF] rounded-lg px-4 py-2">
              <p className="text-[#1790FF] font-medium">
                📊 Business Case per: <span className="font-bold">{clientName || 'Cliente'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Custom Scenario - Read Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {getTranslation(language, 'customScenario')} - Scenario Proposto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>{getTranslation(language, 'totalAnnualOrders')}</Label>
                <Input
                  type="number"
                  value={clientData.totalOrdersAnnual || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'annualReturns')}</Label>
                <Input
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'returnRate')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={clientData.returnRatePercentage || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>{getTranslation(language, 'saasFee')}</Label>
                <Input
                  type="number"
                  value={customScenario.saasFee || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'transactionFee')}</Label>
                <Input
                  type="number"
                  step="0.10"
                  value={customScenario.transactionFeeFixed || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'rdvFee')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customScenario.rdvPercentage || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'upsellingFee')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customScenario.upsellingPercentage || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            {calculation && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{getTranslation(language, 'calculationResults')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>SaaS Fee:</span>
                      <span className="font-medium">{formatCurrency(calculation.saasFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Fee:</span>
                      <span className="font-medium">{formatCurrency(calculation.transactionFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RDV Fee:</span>
                      <span className="font-medium">{formatCurrency(calculation.rdvFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upselling Fee:</span>
                      <span className="font-medium">{formatCurrency(calculation.upsellingFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-3">
                      <span>{getTranslation(language, 'monthlyTotal')}:</span>
                      <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'annualGTV')}:</span>
                      <span className="font-medium">{formatCurrency(gtv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{getTranslation(language, 'annualACV')}:</span>
                      <span className="font-medium">{formatCurrency(calculation.annualContractValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Payback calculation box */}
                {calculatePayback !== null && (
                  <div className="mt-6 bg-[#E5F0FF] border border-[#1790FF] rounded-lg p-4">
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

                {/* Fee Distribution Chart */}
                <div className="mt-6">
                  <FeeDistributionChart
                    saasFee={calculation.saasFee}
                    transactionFee={calculation.transactionFee}
                    rdvFee={calculation.rdvFee}
                    upsellingFee={calculation.upsellingFee}
                    totalMensile={calculation.totalMensile}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Case - Read Only */}
        <BusinessCase
          clientName={clientName}
          setClientName={() => {}} // No-op function for read-only
          clientData={clientData}
          scenario={customScenario}
          language={language}
          updateClientData={() => {}} // No-op function for read-only
          readOnly={true}
        />
      </div>
    </div>
  );
};

export default ClientView;

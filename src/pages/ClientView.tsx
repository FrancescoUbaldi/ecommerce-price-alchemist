
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import BusinessCase from '@/components/BusinessCase';
import { getTranslation } from '@/utils/translations';

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

interface SharedData {
  clientName: string;
  clientData: ClientData;
  customScenario: PricingData;
  showUpfrontDiscount?: boolean;
}

const ClientView = () => {
  const { id } = useParams();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      try {
        const decodedData = JSON.parse(atob(id));
        setSharedData(decodedData);
      } catch (err) {
        setError('Invalid share link');
      }
    }
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-4">The shared link is invalid or corrupted.</p>
          <Link to="/">
            <Button>Go Back to Calculator</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1790FF]"></div>
          <p className="mt-4 text-gray-600">Loading business case...</p>
        </div>
      </div>
    );
  }

  const { clientName, clientData, customScenario, showUpfrontDiscount } = sharedData;

  // Calculate scenario results
  const calculateScenario = (scenario: PricingData) => {
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
    
    const gtv = clientData.resiAnnuali > 0 
      ? clientData.resiAnnuali * clientData.carrelloMedio 
      : clientData.resiMensili * 12 * clientData.carrelloMedio;
    
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

  const calculation = calculateScenario(customScenario);
  const gtv = clientData.resiAnnuali > 0 
    ? clientData.resiAnnuali * clientData.carrelloMedio 
    : clientData.resiMensili * 12 * clientData.carrelloMedio;

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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Button>
          </Link>
          
          <div className="flex flex-col items-center justify-center">
            <div className="h-40 w-auto overflow-hidden mb-1">
              <img 
                src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png" 
                alt="REVER Logo" 
                className="h-48 w-auto object-cover object-top transform -translate-y-2"
              />
            </div>
            <p className="text-gray-600 text-center -mt-6 leading-tight relative z-10">
              Returns Management Platform
            </p>
          </div>
          
          <div className="w-32"></div>
        </div>

        {/* Client Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-6 w-6 text-[#1790FF]" />
            <h1 className="text-2xl font-bold text-gray-900">
              Business Case: {clientName || 'Cliente'}
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Resi Annuali: <strong>{clientData.resiAnnuali.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>Carrello Medio: <strong>{formatCurrency(clientData.carrelloMedio)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span>GTV Annuale: <strong>{formatCurrencyNoDecimals(gtv)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>Take Rate: <strong>{formatPercentage(calculation.takeRate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Scenario Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Scenario Personalizzato - Risultati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Risultati Calcolo</h3>
              
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
                  <div className="flex justify-between items-center font-bold text-xl border-t pt-3">
                    <span>Totale Mensile:</span>
                    <div className="flex items-center">
                      <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                      {showUpfrontDiscount && calculation.totalMensile > 0 && (
                        <div className="ml-3 bg-[#f5f5f5] rounded-lg p-2 text-sm">
                          <div className="font-medium text-gray-700 mb-1">💡 Sconto upfront:</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">6 mesi (-10%):</span>
                              <span className="line-through text-red-600 text-xs">{formatCurrency(calculation.totalMensile)}</span>
                              <span className="text-green-700 font-semibold text-xs">→ {formatCurrency(calculation.totalMensile * 0.9)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">12 mesi (-15%):</span>
                              <span className="line-through text-red-600 text-xs">{formatCurrency(calculation.totalMensile)}</span>
                              <span className="text-green-700 font-semibold text-xs">→ {formatCurrency(calculation.totalMensile * 0.85)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>ACV (Annual Contract Value):</span>
                    <span className="font-medium">{formatCurrency(calculation.annualContractValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Rate:</span>
                    <span className="font-medium text-[#1790FF]">{formatPercentage(calculation.takeRate)}</span>
                  </div>
                </div>
              </div>

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
          </CardContent>
        </Card>

        {/* Business Case */}
        <BusinessCase
          clientName={clientName}
          setClientName={() => {}} // Read-only in shared view
          clientData={clientData}
          scenario={customScenario}
          language="it"
          updateClientData={() => {}} // Read-only in shared view
          isReadOnly={true}
        />
      </div>
    </div>
  );
};

export default ClientView;


import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Euro, TrendingUp, Settings, FileText } from 'lucide-react';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import BusinessCase from '@/components/BusinessCase';
import LanguageSelector from '@/components/LanguageSelector';
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

const Index = () => {
  const [language, setLanguage] = useState<string>('it');
  
  const [clientData, setClientData] = useState<ClientData>({
    resiAnnuali: 0,
    resiMensili: 0,
    carrelloMedio: 0,
    totalOrdersAnnual: 0,
    returnRatePercentage: 23.9
  });

  const [clientName, setClientName] = useState<string>('');

  const [customScenario, setCustomScenario] = useState<PricingData>({
    saasFee: 0,
    transactionFeeFixed: 0,
    rdvPercentage: 0,
    upsellingPercentage: 0,
    name: "Scenario Personalizzato"
  });

  const [predefinedScenarios, setPredefinedScenarios] = useState<PricingData[]>([
    {
      saasFee: 199,
      transactionFeeFixed: 1.50,
      rdvPercentage: 0,
      upsellingPercentage: 5,
      name: "Scenario Base"
    },
    {
      saasFee: 299,
      transactionFeeFixed: 1.20,
      rdvPercentage: 2,
      upsellingPercentage: 4,
      name: "Scenario Premium"
    },
    {
      saasFee: 399,
      transactionFeeFixed: 1.00,
      rdvPercentage: 3,
      upsellingPercentage: 3,
      name: "Scenario Enterprise"
    }
  ]);

  // Calculate GTV
  const gtv = useMemo(() => {
    return clientData.resiAnnuali * clientData.carrelloMedio;
  }, [clientData.resiAnnuali, clientData.carrelloMedio]);

  // Auto-adjust base scenario pricing to maintain 2.3% take rate
  useEffect(() => {
    if (gtv > 0) {
      const targetTakeRate = 0.023; // 2.3%
      const targetACV = gtv * targetTakeRate;
      const targetMonthlyCost = targetACV / 12;
      
      // Calculate other fees first
      const resiMensili = clientData.resiAnnuali / 12;
      const transactionFee = resiMensili * predefinedScenarios[0]?.transactionFeeFixed || 0;
      
      const rdvAnnuali = clientData.resiAnnuali * 0.37;
      const rdvMensili = rdvAnnuali / 12;
      const rdvFee = (rdvMensili * clientData.carrelloMedio * (predefinedScenarios[0]?.rdvPercentage || 0)) / 100;
      
      const upsellingAnnuali = clientData.resiAnnuali * 0.0378;
      const upsellingMensili = upsellingAnnuali / 12;
      const incrementoCarrello = clientData.carrelloMedio * 0.3;
      const upsellingFee = (upsellingMensili * incrementoCarrello * (predefinedScenarios[0]?.upsellingPercentage || 0)) / 100;
      
      // Calculate required SaaS fee to reach target
      const requiredSaasFee = Math.max(0, targetMonthlyCost - transactionFee - rdvFee - upsellingFee);
      
      setPredefinedScenarios(prev => 
        prev.map((scenario, index) => 
          index === 0 ? { ...scenario, saasFee: Math.round(requiredSaasFee) } : scenario
        )
      );
    }
  }, [gtv, clientData.resiAnnuali, clientData.carrelloMedio]);

  const updatePredefinedScenario = (index: number, field: keyof PricingData, value: number) => {
    setPredefinedScenarios(prev => 
      prev.map((scenario, i) => 
        i === index ? { ...scenario, [field]: value } : scenario
      )
    );
  };

  const updateClientData = (field: keyof ClientData, value: number) => {
    setClientData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Sync annual and monthly returns
      if (field === 'resiAnnuali') {
        newData.resiMensili = Math.round(value / 12);
        // Update return rate if we have total orders
        if (newData.totalOrdersAnnual > 0) {
          newData.returnRatePercentage = (value / newData.totalOrdersAnnual) * 100;
        }
      } else if (field === 'resiMensili') {
        newData.resiAnnuali = value * 12;
        // Update return rate if we have total orders
        if (newData.totalOrdersAnnual > 0) {
          newData.returnRatePercentage = ((value * 12) / newData.totalOrdersAnnual) * 100;
        }
      } else if (field === 'totalOrdersAnnual') {
        // Update return rate based on existing returns
        if (value > 0) {
          newData.returnRatePercentage = (newData.resiAnnuali / value) * 100;
        }
      } else if (field === 'returnRatePercentage') {
        // Update returns based on total orders
        if (newData.totalOrdersAnnual > 0) {
          newData.resiAnnuali = Math.round((value / 100) * newData.totalOrdersAnnual);
          newData.resiMensili = Math.round(newData.resiAnnuali / 12);
        }
      }
      
      return newData;
    });
  };

  const calculateScenario = (scenario: PricingData) => {
    if (!clientData.resiAnnuali || !clientData.carrelloMedio) {
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

    const resiMensili = clientData.resiAnnuali / 12;
    
    // Calcolo Transaction Fee (fixed amount per return)
    const transactionFee = resiMensili * scenario.transactionFeeFixed;
    
    // Calcolo RDV (37% dei resi in un anno)
    const rdvAnnuali = clientData.resiAnnuali * 0.37;
    const rdvMensili = rdvAnnuali / 12;
    const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
    
    // Calcolo Upselling (3.78% dei resi in un anno con incremento del carrello medio del 30%)
    const upsellingAnnuali = clientData.resiAnnuali * 0.0378;
    const upsellingMensili = upsellingAnnuali / 12;
    const incrementoCarrello = clientData.carrelloMedio * 0.3;
    const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
    
    const totalMensile = scenario.saasFee + transactionFee + rdvFee + upsellingFee;
    const annualContractValue = totalMensile * 12;
    
    // Calcolo Take Rate usando GTV
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center gap-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{getTranslation(language, 'title')}</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageSelector language={language} setLanguage={setLanguage} />
            </div>
          </div>
          <p className="text-gray-600">{getTranslation(language, 'subtitle')}</p>
        </div>

        {/* Dati Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {getTranslation(language, 'clientData')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resiAnnuali">{getTranslation(language, 'annualReturns')}</Label>
                <Input
                  id="resiAnnuali"
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  onChange={(e) => updateClientData('resiAnnuali', parseInt(e.target.value) || 0)}
                  placeholder="Inserisci il numero di resi annuali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resiMensili">{getTranslation(language, 'monthlyReturns')}</Label>
                <Input
                  id="resiMensili"
                  type="number"
                  value={clientData.resiMensili || ''}
                  onChange={(e) => updateClientData('resiMensili', parseInt(e.target.value) || 0)}
                  placeholder="Inserisci il numero di resi mensili"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrelloMedio">{getTranslation(language, 'averageCart')}</Label>
                <Input
                  id="carrelloMedio"
                  type="number"
                  value={clientData.carrelloMedio || ''}
                  onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                  placeholder="Inserisci il carrello medio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalOrdersAnnual">{getTranslation(language, 'totalAnnualOrders')}</Label>
                <Input
                  id="totalOrdersAnnual"
                  type="number"
                  value={clientData.totalOrdersAnnual || ''}
                  onChange={(e) => updateClientData('totalOrdersAnnual', parseInt(e.target.value) || 0)}
                  placeholder="Inserisci il totale ordini annuali"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'annualGTV')}</Label>
                <div className="p-3 bg-blue-50 rounded-md border">
                  <span className="text-lg font-semibold text-blue-700">
                    {formatCurrency(gtv)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenari di Pricing */}
        <Tabs defaultValue="predefiniti" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predefiniti">{getTranslation(language, 'predefinedScenarios')}</TabsTrigger>
            <TabsTrigger value="personalizzato">{getTranslation(language, 'customScenario')}</TabsTrigger>
            <TabsTrigger value="business-case">{getTranslation(language, 'businessCase')}</TabsTrigger>
          </TabsList>

          <TabsContent value="predefiniti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predefinedScenarios.map((scenario, index) => {
                const calculation = calculateScenario(scenario);
                return (
                  <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {scenario.name}
                        <Euro className="h-5 w-5 text-green-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Parametri Modificabili */}
                      <div className="bg-gray-50 p-3 rounded-lg space-y-3 text-sm">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">SaaS Fee (€/mese)</label>
                          <Input
                            type="number"
                            value={scenario.saasFee}
                            onChange={(e) => updatePredefinedScenario(index, 'saasFee', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">Transaction Fee (€/reso)</label>
                          <Input
                            type="number"
                            step="0.10"
                            value={scenario.transactionFeeFixed}
                            onChange={(e) => updatePredefinedScenario(index, 'transactionFeeFixed', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">RDV Fee (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={scenario.rdvPercentage}
                            onChange={(e) => updatePredefinedScenario(index, 'rdvPercentage', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">Upselling Fee (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={scenario.upsellingPercentage}
                            onChange={(e) => updatePredefinedScenario(index, 'upsellingPercentage', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Fee Distribution Chart */}
                      <FeeDistributionChart
                        saasFee={calculation.saasFee}
                        transactionFee={calculation.transactionFee}
                        rdvFee={calculation.rdvFee}
                        upsellingFee={calculation.upsellingFee}
                        totalMensile={calculation.totalMensile}
                      />

                      {/* Calcoli */}
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span>SaaS Fee:</span>
                          <span>{formatCurrency(calculation.saasFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Transaction Fee:</span>
                          <span>{formatCurrency(calculation.transactionFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>RDV Fee:</span>
                          <span>{formatCurrency(calculation.rdvFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Upselling Fee:</span>
                          <span>{formatCurrency(calculation.upsellingFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Totale Mensile:</span>
                          <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                          <span>Take Rate:</span>
                          <span className="font-medium text-blue-600">{formatPercentage(calculation.takeRate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="personalizzato" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {getTranslation(language, 'customScenario')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="customSaasFee">{getTranslation(language, 'saasFee')}</Label>
                    <Input
                      id="customSaasFee"
                      type="number"
                      value={customScenario.saasFee || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        saasFee: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customTransactionFee">{getTranslation(language, 'transactionFee')}</Label>
                    <Input
                      id="customTransactionFee"
                      type="number"
                      step="0.10"
                      value={customScenario.transactionFeeFixed || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        transactionFeeFixed: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customRdvFee">{getTranslation(language, 'rdvFee')}</Label>
                    <Input
                      id="customRdvFee"
                      type="number"
                      step="0.1"
                      value={customScenario.rdvPercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        rdvPercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customUpsellingFee">{getTranslation(language, 'upsellingFee')}</Label>
                    <Input
                      id="customUpsellingFee"
                      type="number"
                      step="0.1"
                      value={customScenario.upsellingPercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        upsellingPercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnRate">{getTranslation(language, 'returnRate')}</Label>
                    <Input
                      id="returnRate"
                      type="number"
                      step="0.1"
                      value={clientData.returnRatePercentage || ''}
                      onChange={(e) => updateClientData('returnRatePercentage', parseFloat(e.target.value) || 0)}
                      placeholder="23.9"
                    />
                  </div>
                </div>

                {/* Risultati Scenario Personalizzato - senza take rate e fee distribution */}
                {(() => {
                  const calculation = calculateScenario(customScenario);
                  return (
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
                            <span>ACV Annuale:</span>
                            <span className="font-medium">{formatCurrency(calculation.annualContractValue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-case" className="space-y-6">
            <BusinessCase
              clientName={clientName}
              setClientName={setClientName}
              clientData={clientData}
              scenario={customScenario}
              language={language}
              updateClientData={updateClientData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

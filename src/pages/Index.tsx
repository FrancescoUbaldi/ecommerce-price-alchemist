
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, RotateCcw } from 'lucide-react';
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
  const [showScenarioNotification, setShowScenarioNotification] = useState(false);
  
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
      name: "ECO MODE"
    },
    {
      saasFee: 299,
      transactionFeeFixed: 1.20,
      rdvPercentage: 2,
      upsellingPercentage: 4,
      name: "GAS"
    },
    {
      saasFee: 399,
      transactionFeeFixed: 1.00,
      rdvPercentage: 3,
      upsellingPercentage: 3,
      name: "FULL GAS"
    }
  ]);

  // Calculate GTV - FIXED: should be Annual Returns × Average Cart OR Monthly Returns × 12 × Average Cart
  const gtv = useMemo(() => {
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Auto-adjust predefined scenarios based on Take Rate targets
  useEffect(() => {
    if (gtv > 0) {
      // Target Take Rate ranges: ECO MODE (flexible), GAS (2.8%-4.8%), FULL GAS (>5%)
      const targetTakeRates = [0.025, 0.035, 0.055]; // Base target rates
      
      const updatedScenarios = predefinedScenarios.map((scenario, index) => {
        const targetTakeRate = targetTakeRates[index];
        const targetACV = gtv * targetTakeRate;
        const targetMonthlyCost = targetACV / 12;
        
        // Calculate other fees first
        const resiMensili = clientData.resiAnnuali > 0 ? clientData.resiAnnuali / 12 : clientData.resiMensili;
        const transactionFee = resiMensili * scenario.transactionFeeFixed;
        
        const rdvAnnuali = (clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12) * 0.35;
        const rdvMensili = rdvAnnuali / 12;
        const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
        
        const upsellingAnnuali = (clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12) * 0.0378;
        const upsellingMensili = upsellingAnnuali / 12;
        const incrementoCarrello = clientData.carrelloMedio * 0.3;
        const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
        
        // Calculate required SaaS fee to reach target
        const requiredSaasFee = Math.max(0, targetMonthlyCost - transactionFee - rdvFee - upsellingFee);
        
        return { ...scenario, saasFee: Math.round(requiredSaasFee) };
      });
      
      setPredefinedScenarios(updatedScenarios);
    }
  }, [gtv, clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  const updatePredefinedScenario = (index: number, field: keyof PricingData, value: number) => {
    setPredefinedScenarios(prev => 
      prev.map((scenario, i) => 
        i === index ? { ...scenario, [field]: value } : scenario
      )
    );
  };

  const selectPredefinedScenario = (scenario: PricingData) => {
    setCustomScenario({
      ...scenario,
      name: "Scenario Personalizzato"
    });
    
    // Show notification
    setShowScenarioNotification(true);
    setTimeout(() => setShowScenarioNotification(false), 3000);
  };

  const resetData = () => {
    setClientData({
      resiAnnuali: 0,
      resiMensili: 0,
      carrelloMedio: 0,
      totalOrdersAnnual: 0,
      returnRatePercentage: 23.9
    });
    setClientName('');
    setCustomScenario({
      saasFee: 0,
      transactionFeeFixed: 0,
      rdvPercentage: 0,
      upsellingPercentage: 0,
      name: "Scenario Personalizzato"
    });
  };

  const updateClientData = (field: keyof ClientData, value: number) => {
    setClientData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Dynamic relationship between Returns, Return Rate, and Total Orders
      if (field === 'resiAnnuali') {
        newData.resiMensili = Math.round(value / 12);
        if (newData.totalOrdersAnnual > 0) {
          newData.returnRatePercentage = (value / newData.totalOrdersAnnual) * 100;
        }
      } else if (field === 'resiMensili') {
        newData.resiAnnuali = value * 12;
        if (newData.totalOrdersAnnual > 0) {
          newData.returnRatePercentage = ((value * 12) / newData.totalOrdersAnnual) * 100;
        }
      } else if (field === 'totalOrdersAnnual') {
        if (newData.returnRatePercentage > 0) {
          newData.resiAnnuali = Math.round((newData.returnRatePercentage / 100) * value);
          newData.resiMensili = Math.round(newData.resiAnnuali / 12);
        }
      } else if (field === 'returnRatePercentage') {
        if (newData.totalOrdersAnnual > 0) {
          newData.resiAnnuali = Math.round((value / 100) * newData.totalOrdersAnnual);
          newData.resiMensili = Math.round(newData.resiAnnuali / 12);
        }
      }
      
      return newData;
    });
  };

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
    
    // Transaction Fee calculation
    const transactionFee = resiMensili * scenario.transactionFeeFixed;
    
    // RDV calculation (35% of returns)
    const rdvAnnuali = annualReturns * 0.35;
    const rdvMensili = rdvAnnuali / 12;
    const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
    
    // Upselling calculation (3.78% of returns with 30% cart increase)
    const upsellingAnnuali = annualReturns * 0.0378;
    const upsellingMensili = upsellingAnnuali / 12;
    const incrementoCarrello = clientData.carrelloMedio * 0.3;
    const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
    
    const totalMensile = scenario.saasFee + transactionFee + rdvFee + upsellingFee;
    const annualContractValue = totalMensile * 12;
    
    // Take Rate calculation using GTV
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

  const getScenarioEmoji = (index: number) => {
    const emojis = ['🌱', '⚡', '🚀'];
    return emojis[index] || '📊';
  };

  // Check Take Rate ranges for predefined scenarios
  const getTakeRateStatus = (takeRate: number, scenarioName: string) => {
    if (scenarioName === "GAS") {
      return takeRate >= 2.8 && takeRate <= 4.8 ? "✅ In range (2.8%-4.8%)" : "⚠️ Out of range";
    } else if (scenarioName === "FULL GAS") {
      return takeRate > 5 ? "✅ In range (>5%)" : "⚠️ Out of range";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with logo repositioned */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png" 
                alt="REVER Logo" 
                className="h-24 w-auto"
              />
            </div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-3xl font-bold text-[#1790FF]">Price & Smile :)</h1>
            </div>
            <div className="flex justify-end">
              <LanguageSelector language={language} setLanguage={setLanguage} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Calcola il pricing perfetto per il tuo cliente</p>
          </div>
        </div>

        {/* Client Data - Removed Return Rate and Total Orders Annual fields */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {getTranslation(language, 'clientData')}
              </CardTitle>
              <Button 
                onClick={resetData}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {getTranslation(language, 'reset')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="resiAnnuali">{getTranslation(language, 'annualReturns')}</Label>
                <Input
                  id="resiAnnuali"
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  onChange={(e) => updateClientData('resiAnnuali', parseInt(e.target.value) || 0)}
                  placeholder="23900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resiMensili">{getTranslation(language, 'monthlyReturns')}</Label>
                <Input
                  id="resiMensili"
                  type="number"
                  value={clientData.resiMensili || ''}
                  onChange={(e) => updateClientData('resiMensili', parseInt(e.target.value) || 0)}
                  placeholder="1992"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrelloMedio">{getTranslation(language, 'averageCart')}</Label>
                <Input
                  id="carrelloMedio"
                  type="number"
                  value={clientData.carrelloMedio || ''}
                  onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                  placeholder="35.50"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, 'annualGTV')}</Label>
                <div className="p-3 bg-[#1790FF] text-white rounded-md border-2 border-[#1790FF] shadow-lg">
                  <span className="text-lg font-semibold">
                    {formatCurrencyNoDecimals(gtv)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Scenarios */}
        <Tabs defaultValue="predefiniti" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white relative">
            <TabsTrigger 
              value="predefiniti"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white transition-all duration-300"
            >
              {getTranslation(language, 'predefinedScenarios')}
            </TabsTrigger>
            <TabsTrigger 
              value="personalizzato"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white transition-all duration-300"
            >
              {getTranslation(language, 'customScenario')}
              {showScenarioNotification && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded animate-fade-in">
                  {getTranslation(language, 'scenarioApplied')}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="business-case"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white transition-all duration-300"
            >
              {getTranslation(language, 'businessCase')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predefiniti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predefinedScenarios.map((scenario, index) => {
                const calculation = calculateScenario(scenario);
                const takeRateStatus = getTakeRateStatus(calculation.takeRate, scenario.name);
                
                return (
                  <Card 
                    key={index} 
                    className="border-2 hover:border-[#1790FF] transition-colors"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{getScenarioEmoji(index)}</span>
                          {scenario.name}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Editable Parameters */}
                      <div className="bg-gray-50 p-3 rounded-lg space-y-3 text-sm">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">{getTranslation(language, 'saasFee')}</label>
                          <Input
                            type="number"
                            value={scenario.saasFee}
                            onChange={(e) => updatePredefinedScenario(index, 'saasFee', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">{getTranslation(language, 'transactionFee')}</label>
                          <Input
                            type="number"
                            step="0.10"
                            value={scenario.transactionFeeFixed}
                            onChange={(e) => updatePredefinedScenario(index, 'transactionFeeFixed', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">{getTranslation(language, 'rdvFee')}</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={scenario.rdvPercentage}
                            onChange={(e) => updatePredefinedScenario(index, 'rdvPercentage', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">{getTranslation(language, 'upsellingFee')}</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={scenario.upsellingPercentage}
                            onChange={(e) => updatePredefinedScenario(index, 'upsellingPercentage', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Calculations */}
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
                          <span>{getTranslation(language, 'monthlyTotal')}:</span>
                          <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                        </div>
                        
                        {/* Take Rate with status */}
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>{getTranslation(language, 'takeRate')}:</span>
                          <span className="text-[#1790FF]">{formatPercentage(calculation.takeRate)}</span>
                        </div>
                        {takeRateStatus && (
                          <div className="text-xs text-center mt-1">
                            {takeRateStatus}
                          </div>
                        )}

                        {/* Fee Distribution Chart */}
                        <div className="mt-4">
                          <FeeDistributionChart
                            saasFee={calculation.saasFee}
                            transactionFee={calculation.transactionFee}
                            rdvFee={calculation.rdvFee}
                            upsellingFee={calculation.upsellingFee}
                            totalMensile={calculation.totalMensile}
                          />
                        </div>
                        
                        {/* Use this scenario button */}
                        <Button 
                          onClick={() => selectPredefinedScenario(scenario)}
                          className="w-full mt-3 bg-[#1790FF] hover:bg-[#1470CC] text-white"
                        >
                          {getTranslation(language, 'useThisScenario')}
                        </Button>
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
                  <Settings className="h-5 w-5" />
                  {getTranslation(language, 'customScenario')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Client Data Sync Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="customTotalOrders">{getTranslation(language, 'totalAnnualOrders')}</Label>
                    <Input
                      id="customTotalOrders"
                      type="number"
                      value={clientData.totalOrdersAnnual || ''}
                      onChange={(e) => updateClientData('totalOrdersAnnual', parseInt(e.target.value) || 0)}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customReturnRatePersonal">{getTranslation(language, 'returnRate')}</Label>
                    <Input
                      id="customReturnRatePersonal"
                      type="number"
                      step="0.1"
                      value={clientData.returnRatePercentage || ''}
                      onChange={(e) => updateClientData('returnRatePercentage', parseFloat(e.target.value) || 0)}
                      placeholder="23.9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{getTranslation(language, 'annualGTV')}</Label>
                    <div className="p-3 bg-[#1790FF] text-white rounded-md border-2 border-[#1790FF] shadow-lg">
                      <span className="text-lg font-semibold">
                        {formatCurrency(gtv)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                </div>

                {/* Custom Scenario Results - NO Take Rate or Fee Distribution here */}
                {(() => {
                  const calculation = calculateScenario(customScenario);
                  return (
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

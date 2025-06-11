import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, RotateCcw, Check, Undo, Clock } from 'lucide-react';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import BusinessCase from '@/components/BusinessCase';
import LanguageSelector from '@/components/LanguageSelector';
import ComboActions from '@/components/ComboActions';
import ShareModal from '@/components/ShareModal';
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

interface AppState {
  clientData: ClientData;
  clientName: string;
  customScenario: PricingData;
  duplicatedScenarios: PricingData[];
}

const Index = () => {
  const [language, setLanguage] = useState<string>('it');
  const [showScenarioNotification, setShowScenarioNotification] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [previousState, setPreviousState] = useState<AppState | null>(null);
  const [showComboDeletedNotification, setShowComboDeletedNotification] = useState(false);
  const [showComboUsedNotification, setShowComboUsedNotification] = useState(false);
  
  // Track which field was last modified to determine calculation priority
  const [lastModifiedField, setLastModifiedField] = useState<'orders' | 'returns' | 'rate' | null>(null);
  
  // Track field modification order for intelligent calculation
  const [fieldModificationOrder, setFieldModificationOrder] = useState<Array<'totalOrdersAnnual' | 'resiAnnuali' | 'returnRatePercentage'>>([]);
  
  const [clientData, setClientData] = useState<ClientData>({
    resiAnnuali: 0,
    resiMensili: 0,
    carrelloMedio: 0,
    totalOrdersAnnual: 0,
    returnRatePercentage: 0
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

  const [duplicatedScenarios, setDuplicatedScenarios] = useState<PricingData[]>([]);

  // Calculate GTV - FIXED: should be Annual Returns × Average Cart OR Monthly Returns × 12 × Average Cart
  const gtv = useMemo(() => {
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Auto-adjust predefined scenarios based on Take Rate targets with minimum SaaS fee
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
        
        // Calculate required SaaS fee to reach target with minimum 69€
        const requiredSaasFee = Math.max(69, targetMonthlyCost - transactionFee - rdvFee - upsellingFee);
        
        return { ...scenario, saasFee: Math.round(requiredSaasFee) };
      });
      
      setPredefinedScenarios(updatedScenarios);
    }
  }, [gtv, clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Hide undo button after 5 seconds
  useEffect(() => {
    if (showUndoButton) {
      const timer = setTimeout(() => {
        setShowUndoButton(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showUndoButton]);

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
    
    setShowScenarioNotification(true);
    setTimeout(() => setShowScenarioNotification(false), 3000);
  };

  const resetData = () => {
    // Store current state for undo functionality
    setPreviousState({
      clientData: { ...clientData },
      clientName,
      customScenario: { ...customScenario },
      duplicatedScenarios: [...duplicatedScenarios]
    });

    // FORCE RESET ALL CLIENT DATA TO 0 EXPLICITLY
    setClientData({
      resiAnnuali: 0,
      resiMensili: 0,
      carrelloMedio: 0,
      totalOrdersAnnual: 0,
      returnRatePercentage: 0
    });
    
    // FORCE RESET CLIENT NAME TO EMPTY STRING
    setClientName('');
    
    // FORCE RESET CUSTOM SCENARIO TO ALL ZEROS
    setCustomScenario({
      saasFee: 0,
      transactionFeeFixed: 0,
      rdvPercentage: 0,
      upsellingPercentage: 0,
      name: "Scenario Personalizzato"
    });

    // FORCE RESET DUPLICATED SCENARIOS TO EMPTY ARRAY
    setDuplicatedScenarios([]);

    // FORCE RESET PREDEFINED SCENARIOS TO INITIAL VALUES
    setPredefinedScenarios([
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

    // Reset last modified field tracker and field modification order
    setLastModifiedField(null);
    setFieldModificationOrder([]);

    // Show confirmation message and undo button
    setShowResetConfirmation(true);
    setShowUndoButton(true);
    setTimeout(() => setShowResetConfirmation(false), 4000);
  };

  const undoReset = () => {
    if (previousState) {
      setClientData(previousState.clientData);
      setClientName(previousState.clientName);
      setCustomScenario(previousState.customScenario);
      setDuplicatedScenarios(previousState.duplicatedScenarios);
      setShowUndoButton(false);
      setPreviousState(null);
    }
  };

  // Intelligent calculation logic for Custom Scenario
  const updateCustomScenarioField = (field: 'totalOrdersAnnual' | 'resiAnnuali' | 'returnRatePercentage', value: number) => {
    // Update field modification order
    setFieldModificationOrder(prev => {
      const newOrder = prev.filter(f => f !== field);
      return [field, ...newOrder];
    });

    setClientData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Get the two most recently modified fields
      const currentOrder = fieldModificationOrder.filter(f => f !== field);
      const recentFields = [field, ...currentOrder];
      
      // If we have at least 2 fields with values, calculate the third
      const hasOrders = newData.totalOrdersAnnual > 0;
      const hasReturns = newData.resiAnnuali > 0;
      const hasRate = newData.returnRatePercentage > 0;
      
      const nonZeroFields = [];
      if (hasOrders) nonZeroFields.push('totalOrdersAnnual');
      if (hasReturns) nonZeroFields.push('resiAnnuali');
      if (hasRate) nonZeroFields.push('returnRatePercentage');
      
      // Only calculate if we have exactly 2 non-zero fields
      if (nonZeroFields.length === 2) {
        if (!hasOrders) {
          // Calculate orders from returns and rate
          newData.totalOrdersAnnual = Math.round(newData.resiAnnuali / (newData.returnRatePercentage / 100));
        } else if (!hasReturns) {
          // Calculate returns from orders and rate
          newData.resiAnnuali = Math.round((newData.returnRatePercentage / 100) * newData.totalOrdersAnnual);
        } else if (!hasRate) {
          // Calculate rate from orders and returns
          newData.returnRatePercentage = (newData.resiAnnuali / newData.totalOrdersAnnual) * 100;
        }
      }
      
      // Always update monthly returns based on annual
      newData.resiMensili = Math.round(newData.resiAnnuali / 12);
      
      return newData;
    });
  };

  // Smart calculation logic - only calculate the missing field based on priority
  const updateClientDataSmart = (field: keyof ClientData, value: number) => {
    setClientData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Track which field was modified
      if (field === 'totalOrdersAnnual') {
        setLastModifiedField('orders');
      } else if (field === 'resiAnnuali') {
        setLastModifiedField('returns');
      } else if (field === 'returnRatePercentage') {
        setLastModifiedField('rate');
      }
      
      // Smart calculation logic - only calculate missing field
      const hasOrders = newData.totalOrdersAnnual > 0;
      const hasReturns = newData.resiAnnuali > 0;
      const hasRate = newData.returnRatePercentage > 0;
      
      if (field === 'totalOrdersAnnual' && hasReturns && !hasRate) {
        // Calculate rate when orders changed and we have returns but no rate
        newData.returnRatePercentage = (newData.resiAnnuali / value) * 100;
      } else if (field === 'totalOrdersAnnual' && hasRate && !hasReturns) {
        // Calculate returns when orders changed and we have rate but no returns
        newData.resiAnnuali = Math.round((newData.returnRatePercentage / 100) * value);
      } else if (field === 'resiAnnuali' && hasOrders && !hasRate) {
        // Calculate rate when returns changed and we have orders but no rate
        newData.returnRatePercentage = (value / newData.totalOrdersAnnual) * 100;
      } else if (field === 'resiAnnuali' && hasRate && !hasOrders) {
        // Calculate orders when returns changed and we have rate but no orders
        newData.totalOrdersAnnual = Math.round(value / (newData.returnRatePercentage / 100));
      } else if (field === 'returnRatePercentage' && hasOrders && !hasReturns) {
        // Calculate returns when rate changed and we have orders but no returns
        newData.resiAnnuali = Math.round((value / 100) * newData.totalOrdersAnnual);
      } else if (field === 'returnRatePercentage' && hasReturns && !hasOrders) {
        // Calculate orders when rate changed and we have returns but no orders
        newData.totalOrdersAnnual = Math.round(newData.resiAnnuali / (value / 100));
      }
      
      // Always update monthly returns based on annual
      newData.resiMensili = Math.round(newData.resiAnnuali / 12);
      
      return newData;
    });
  };

  const updateClientData = (field: keyof ClientData, value: number) => {
    setClientData(prev => {
      const newData = { ...prev, [field]: value };
      
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

  // Calculate business case data for breakdown sections
  const calculateBusinessCaseData = () => {
    const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
    const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
    const resiValue = annualReturns * clientData.carrelloMedio;
    const fatturazioneNettaPreRever = fatturazione - resiValue;
    
    const rdvResi = annualReturns * 0.35;
    const rdvValue = rdvResi * clientData.carrelloMedio;
    const upsellingResi = annualReturns * 0.0378;
    const upsellingAOV = clientData.carrelloMedio * 1.3;
    const upsellingValue = upsellingResi * upsellingAOV;
    const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
    
    const saasFeeAnnuale = customScenario.saasFee * 12;
    const transactionFeeAnnuale = customScenario.transactionFeeFixed * annualReturns;
    const rdvFeeAnnuale = (rdvValue * customScenario.rdvPercentage) / 100;
    const upsellingFeeAnnuale = (upsellingValue * customScenario.upsellingPercentage) / 100;
    const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
    const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
    const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

    return {
      fatturazioneNettaPreRever,
      netRevenuesEcommerce,
      totalPlatformCost,
      aumentoNetRevenues,
      rdvFeeAnnuale,
      upsellingFeeAnnuale,
      annualReturns
    };
  };

  // Calculate payback period for the custom scenario
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getScenarioEmoji = (index: number) => {
    const emojis = ['🌱', '⚡', '🚀'];
    return emojis[index] || '📊';
  };

  const getTakeRateStatus = (takeRate: number, scenarioName: string) => {
    if (scenarioName === "GAS") {
      return takeRate >= 2.8 && takeRate <= 4.8 ? "✅ In range (2.8%-4.8%)" : "⚠️ Out of range";
    } else if (scenarioName === "FULL GAS") {
      return takeRate > 5 ? "✅ In range (>5%)" : "⚠️ Out of range";
    }
    return "";
  };

  const handleDuplicateScenario = (scenario: PricingData) => {
    if (duplicatedScenarios.length < 3) {
      setDuplicatedScenarios(prev => [...prev, scenario]);
    }
  };

  const handleDeleteDuplicatedScenario = (index: number) => {
    setDuplicatedScenarios(prev => prev.filter((_, i) => i !== index));
    setShowComboDeletedNotification(true);
    setTimeout(() => setShowComboDeletedNotification(false), 3000);
  };

  const handleUseDuplicatedScenario = (scenario: PricingData) => {
    setCustomScenario({
      ...scenario,
      name: "Scenario Personalizzato"
    });
    setShowComboUsedNotification(true);
    setTimeout(() => setShowComboUsedNotification(false), 3000);
  };

  const updateDuplicatedScenario = (index: number, field: keyof PricingData, value: number) => {
    setDuplicatedScenarios(prev =>
      prev.map((scenario, i) =>
        i === index ? { ...scenario, [field]: value } : scenario
      )
    );
  };

  // Check if required data is complete for sharing
  const isDataCompleteForSharing = () => {
    const hasRequiredClientData = (
      (clientData.totalOrdersAnnual > 0 || clientData.resiAnnuali > 0 || clientData.returnRatePercentage > 0) &&
      clientData.carrelloMedio > 0
    );
    
    const hasRequiredScenarioData = (
      customScenario.saasFee > 0 &&
      customScenario.transactionFeeFixed > 0
    );
    
    return hasRequiredClientData && hasRequiredScenarioData;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>
          <div className="flex flex-col items-center justify-center">
            <div className="h-40 w-auto overflow-hidden mb-1">
              <img 
                src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png" 
                alt="REVER Logo" 
                className="h-48 w-auto object-cover object-top transform -translate-y-2"
              />
            </div>
            <p className="text-gray-600 text-center -mt-6 leading-tight relative z-10">{getTranslation(language, 'subtitle')}</p>
          </div>
          <div className="flex-1 flex justify-end">
            <LanguageSelector language={language} setLanguage={setLanguage} />
          </div>
        </div>

        {/* Notifications */}
        {showComboDeletedNotification && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md shadow-lg animate-fade-in z-50">
            ✅ Combo eliminata con successo
          </div>
        )}

        {showComboUsedNotification && (
          <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md shadow-lg animate-fade-in z-50">
            ✅ Business Case aggiornato con questa configurazione
          </div>
        )}

        {/* Client Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {getTranslation(language, 'clientData')}
              </CardTitle>
              <div className="flex flex-col items-end relative">
                <Button 
                  onClick={resetData}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {getTranslation(language, 'reset')}
                </Button>
                
                {/* Enhanced reset confirmation message */}
                {showResetConfirmation && (
                  <div className="mt-2 flex items-center gap-2 bg-[#DFF6E1] px-3 py-2 rounded-md border border-green-200 animate-fade-in">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      ✅ Tutti i dati sono stati azzerati con successo
                    </span>
                  </div>
                )}

                {/* Enhanced Undo button with fade animation */}
                {showUndoButton && (
                  <Button 
                    onClick={undoReset}
                    variant="outline" 
                    size="sm"
                    className="mt-2 flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100 animate-fade-in"
                  >
                    <Undo className="h-4 w-4" />
                    ↩️ Annulla reset
                  </Button>
                )}
              </div>
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

        <Tabs defaultValue="predefiniti" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="predefiniti"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(language, 'predefinedScenarios')}
            </TabsTrigger>
            <TabsTrigger 
              value="personalizzato"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-md font-medium"
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
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(language, 'businessCase')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predefiniti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predefinedScenarios.map((scenario, index) => {
                const calculation = calculateScenario(scenario);
                
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
                        
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>{getTranslation(language, 'takeRate')}:</span>
                          <span className="text-[#1790FF]">{formatPercentage(calculation.takeRate)}</span>
                        </div>

                        <div className="mt-4">
                          <FeeDistributionChart
                            saasFee={calculation.saasFee}
                            transactionFee={calculation.transactionFee}
                            rdvFee={calculation.rdvFee}
                            upsellingFee={calculation.upsellingFee}
                            totalMensile={calculation.totalMensile}
                          />
                        </div>
                        
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {getTranslation(language, 'customScenario')}
                  </CardTitle>
                  {isDataCompleteForSharing() && (
                    <ShareModal
                      clientData={clientData}
                      customScenario={customScenario}
                      language={language}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="customTotalOrders">{getTranslation(language, 'totalAnnualOrders')}</Label>
                    <Input
                      id="customTotalOrders"
                      type="number"
                      value={clientData.totalOrdersAnnual || ''}
                      onChange={(e) => updateCustomScenarioField('totalOrdersAnnual', parseInt(e.target.value) || 0)}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customAnnualReturns">{getTranslation(language, 'annualReturns')}</Label>
                    <Input
                      id="customAnnualReturns"
                      type="number"
                      value={clientData.resiAnnuali || ''}
                      onChange={(e) => updateCustomScenarioField('resiAnnuali', parseInt(e.target.value) || 0)}
                      placeholder="23900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customReturnRatePersonal">{getTranslation(language, 'returnRate')}</Label>
                    <Input
                      id="customReturnRatePersonal"
                      type="number"
                      step="0.1"
                      value={clientData.returnRatePercentage || ''}
                      onChange={(e) => updateCustomScenarioField('returnRatePercentage', parseFloat(e.target.value) || 0)}
                      placeholder="23.9"
                    />
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

                {(() => {
                  const calculation = calculateScenario(customScenario);
                  const businessData = calculateBusinessCaseData();
                  
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
                        </div>
                      </div>

                      {/* Payback calculation box */}
                      {calculatePayback !== null && (
                        <div className="mt-6 bg-[#E5F0FF] border border-[#1790FF] rounded-lg p-4 animate-fade-in">
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

                      {/* ROI Breakdown Section */}
                      {businessData.fatturazioneNettaPreRever > 0 && businessData.netRevenuesEcommerce > 0 && businessData.totalPlatformCost > 0 && (
                        <div className="mt-6 bg-white p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            📊 Breakdown ROI (annuo):
                          </h3>
                          <div className="space-y-2 text-gray-700">
                            <div>• Ricavi Netti attuali (senza REVER): <span className="font-medium">{formatCurrency(businessData.fatturazioneNettaPreRever)}</span></div>
                            <div>• Ricavi Netti con REVER: <span className="font-medium">{formatCurrency(businessData.netRevenuesEcommerce)}</span></div>
                            <div>• Costi piattaforma REVER: <span className="font-medium">{formatCurrency(businessData.totalPlatformCost)}</span></div>
                            <div>• Incremento netto stimato: <span className="font-medium text-green-600">{formatCurrency(businessData.aumentoNetRevenues)}</span></div>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              Con questa configurazione, REVER può generare un extra fatturato netto di <span className="font-semibold text-blue-700">{formatCurrency(businessData.aumentoNetRevenues)}</span> all'anno rispetto al tuo scenario attuale.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Monthly Costs Breakdown Section */}
                      {customScenario.saasFee > 0 && (
                        <div className="mt-6 bg-white p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            💰 Breakdown Costi mensili:
                          </h3>
                          <div className="space-y-2 text-gray-700">
                            <div>• SaaS Fee: <span className="font-medium">{formatCurrency(customScenario.saasFee)}</span></div>
                            <div>• Transaction Fee: <span className="font-medium">{formatCurrency(customScenario.transactionFeeFixed * (businessData.annualReturns / 12))}</span></div>
                            <div>• RDV Fee: <span className="font-medium">{formatCurrency(businessData.rdvFeeAnnuale / 12)}</span></div>
                            <div>• Upselling Fee: <span className="font-medium">{formatCurrency(businessData.upsellingFeeAnnuale / 12)}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <ComboActions
                  currentScenario={customScenario}
                  onDuplicate={handleDuplicateScenario}
                  language={language}
                  duplicateCount={duplicatedScenarios.length}
                />
              </CardContent>
            </Card>

            {duplicatedScenarios.map((scenario, index) => (
              <Card key={index} className="border-dashed border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-5 w-5" />
                    {scenario.name} #{index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label>{getTranslation(language, 'saasFee')}</Label>
                      <Input
                        type="number"
                        value={scenario.saasFee || ''}
                        onChange={(e) => updateDuplicatedScenario(index, 'saasFee', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{getTranslation(language, 'transactionFee')}</Label>
                      <Input
                        type="number"
                        step="0.10"
                        value={scenario.transactionFeeFixed || ''}
                        onChange={(e) => updateDuplicatedScenario(index, 'transactionFeeFixed', parseFloat(e.target.value) || 0)}
                        placeholder="0.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{getTranslation(language, 'rdvFee')}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={scenario.rdvPercentage || ''}
                        onChange={(e) => updateDuplicatedScenario(index, 'rdvPercentage', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{getTranslation(language, 'upsellingFee')}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={scenario.upsellingPercentage || ''}
                        onChange={(e) => updateDuplicatedScenario(index, 'upsellingPercentage', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {(() => {
                    const calculation = calculateScenario(scenario);
                    return (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
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
            ))}
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

</initial_code>

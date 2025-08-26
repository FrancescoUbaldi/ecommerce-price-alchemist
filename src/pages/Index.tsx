
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, RotateCcw, Check, Undo, Clock, X, Plus } from 'lucide-react';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import BusinessCase from '@/components/BusinessCase';
import LanguageSelector from '@/components/LanguageSelector';
import ComboActions from '@/components/ComboActions';
import ShareModal from '@/components/ShareModal';
import ReadOnlyPayback from '@/components/ReadOnlyPayback';
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
  const [showUpfrontDiscount, setShowUpfrontDiscount] = useState(false);
  const [absorbTransactionFee, setAbsorbTransactionFee] = useState<boolean>(false);
  
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
      upsellingPercentage: 0,
      name: "ECO MODE"
    },
    {
      saasFee: 299,
      transactionFeeFixed: 1.50,
      rdvPercentage: 2,
      upsellingPercentage: 0,
      name: "GAS"
    },
    {
      saasFee: 399,
      transactionFeeFixed: 1.70,
      rdvPercentage: 3,
      upsellingPercentage: 3,
      name: "FULL GAS"
    }
  ]);
  
  const [predefinedEditFlags, setPredefinedEditFlags] = useState({
    rdvEdited: [false, false, false],
    upsellingEdited: [false, false, false],
  });
  
  const [duplicatedScenarios, setDuplicatedScenarios] = useState<PricingData[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [extraServices, setExtraServices] = useState({
    reverProtect: false,
    sizeSuggestions: false
  });
  const [showAddFeatureInput, setShowAddFeatureInput] = useState(false);

  // Calculate GTV - FIXED: should be Annual Returns × Average Cart OR Monthly Returns × 12 × Average Cart
  const gtv = useMemo(() => {
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Enforce progressive rules (Eco -> Gas -> Full Gas) and min SaaS fee 89€
  const enforceProgressivePredefined = (scenarios: PricingData[]): PricingData[] => {
    const adjusted = scenarios.map(s => ({ ...s }));
    for (let i = 0; i < adjusted.length; i++) {
      // SaaS must be defined and at least 89
      adjusted[i].saasFee = Math.max(89, Number.isFinite(adjusted[i].saasFee) ? adjusted[i].saasFee : 89);
      if (i > 0) {
        if (adjusted[i].saasFee < adjusted[i - 1].saasFee) adjusted[i].saasFee = adjusted[i - 1].saasFee;
        if (adjusted[i].transactionFeeFixed < adjusted[i - 1].transactionFeeFixed) adjusted[i].transactionFeeFixed = adjusted[i - 1].transactionFeeFixed;
        if (adjusted[i].rdvPercentage < adjusted[i - 1].rdvPercentage) adjusted[i].rdvPercentage = adjusted[i - 1].rdvPercentage;
        if (adjusted[i].upsellingPercentage < adjusted[i - 1].upsellingPercentage) adjusted[i].upsellingPercentage = adjusted[i - 1].upsellingPercentage;
      }
    }
    return adjusted;
  };

  // Auto-adjust predefined scenarios based on Take Rate targets with minimum SaaS fee
  useEffect(() => {
    if (gtv > 0) {
      const round1 = (n: number) => Math.round(n * 10) / 10;

      // Target Take Rate ranges: ECO MODE (flexible), GAS (2.8%-4.8%), FULL GAS (>5%)
      const targetTakeRates = [0.025, 0.035, 0.055]; // Base target rates
      
      const updatedScenarios = predefinedScenarios.map((scenario, index) => {
        const targetTakeRate = targetTakeRates[index];
        const targetACV = gtv * targetTakeRate;
        const targetMonthlyCost = targetACV / 12;
        
        // Base figures
        const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
        const resiMensili = annualReturns / 12;
        const transactionFee = resiMensili * scenario.transactionFeeFixed;

        const rdvAnnuali = annualReturns * 0.35;
        const rdvMensili = rdvAnnuali / 12;
        const rdvPerPercent = (rdvMensili * clientData.carrelloMedio) / 100; // € per 1% RDV
        
        const upsellingAnnuali = annualReturns * 0.0378;
        const upsellingMensili = upsellingAnnuali / 12;
        const incrementoCarrello = clientData.carrelloMedio * 0.3;
        const upsPerPercent = (upsellingMensili * incrementoCarrello) / 100; // € per 1% Upselling

        // Decide dynamic defaults if not user-edited
        let rdvPct = scenario.rdvPercentage;
        let upsPct = scenario.upsellingPercentage;

        const rdvEdited = predefinedEditFlags.rdvEdited[index];
        const upsEdited = predefinedEditFlags.upsellingEdited[index];

        // Always keep ECO MODE at 0% RDV and 0% Upselling in defaults
        if (index === 0) {
          if (!rdvEdited) rdvPct = 0;
          if (!upsEdited) upsPct = 0;
        }

        // GAS: RDV in [1,4], Upselling = 0 by default
        if (index === 1) {
          if (!upsEdited) upsPct = 0;
          if (!rdvEdited) {
            const gapForMinSaaS = targetMonthlyCost - transactionFee - 89;
            if (rdvPerPercent > 0) {
              const neededPct = gapForMinSaaS > 0 ? gapForMinSaaS / rdvPerPercent : 1; // ensure > 0
              rdvPct = Math.min(4, Math.max(1, round1(neededPct)));
            } else {
              rdvPct = 1;
            }
          }
        }

        // FULL GAS: RDV in [2,4], Upselling in [3,5]
        if (index === 2) {
          const rdvMin = 2, rdvMax = 4;
          const upsMin = 3, upsMax = 5;

          if (!rdvEdited) rdvPct = rdvMin;
          if (!upsEdited) upsPct = upsMin;

          if (!rdvEdited || !upsEdited) {
            const baseContribution = (rdvPct * rdvPerPercent) + (upsPct * upsPerPercent);
            const gapForMinSaaS = targetMonthlyCost - transactionFee - 89 - baseContribution;

            const rdvRange = rdvMax - Math.max(rdvPct, rdvMin);
            const upsRange = upsMax - Math.max(upsPct, upsMin);
            const maxAddContribution = (rdvRange * rdvPerPercent) + (upsRange * upsPerPercent);

            if (gapForMinSaaS > 0 && maxAddContribution > 0) {
              if (gapForMinSaaS >= maxAddContribution) {
                // Use full ranges
                if (!rdvEdited) rdvPct = rdvMin + rdvRange;
                if (!upsEdited) upsPct = upsMin + upsRange;
              } else {
                const scale = gapForMinSaaS / maxAddContribution;
                if (!rdvEdited) rdvPct = round1(rdvMin + rdvRange * scale);
                if (!upsEdited) upsPct = round1(upsMin + upsRange * scale);
              }
            }
          }
        }

        // Compute fees with decided percentages
        const rdvFee = (rdvMensili * clientData.carrelloMedio * rdvPct) / 100;
        const upsellingFee = (upsellingMensili * incrementoCarrello * upsPct) / 100;
        
        // Calculate required SaaS fee to reach target with minimum 89€
        const requiredSaasFee = Math.max(89, targetMonthlyCost - transactionFee - rdvFee - upsellingFee);
        
        return { 
          ...scenario, 
          rdvPercentage: Math.round(rdvPct), 
          upsellingPercentage: Math.round(upsPct), 
          saasFee: Math.round(requiredSaasFee) 
        };
      });
      
      setPredefinedScenarios(enforceProgressivePredefined(updatedScenarios));
    }
  }, [gtv, clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Ensure progressive constraints are applied on initial load and any external changes
  useEffect(() => {
    setPredefinedScenarios(prev => enforceProgressivePredefined(prev));
  }, []);

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
    setPredefinedScenarios(prev => {
      const updated = prev.map((scenario, i) =>
        i === index ? { ...scenario, [field]: value } : scenario
      );
      // Allow full manual override - no validation constraints
      return updated;
    });

    // Mark user edits so auto-balance won't override them later
    if (field === 'rdvPercentage') {
      setPredefinedEditFlags(prev => ({
        ...prev,
        rdvEdited: prev.rdvEdited.map((v, i) => (i === index ? true : v)),
      }));
    }
    if (field === 'upsellingPercentage') {
      setPredefinedEditFlags(prev => ({
        ...prev,
        upsellingEdited: prev.upsellingEdited.map((v, i) => (i === index ? true : v)),
      }));
    }
  };
  const selectPredefinedScenario = (scenario: PricingData, scenarioIndex?: number) => {
    setCustomScenario({
      ...scenario,
      name: "Scenario Personalizzato"
    });
    
    // Copy features from the selected scenario
    if (scenarioIndex !== undefined) {
      setCustomFeatures(getScenarioFeatures(scenarioIndex));
    }
    
    setShowScenarioNotification(true);
    setTimeout(() => setShowScenarioNotification(false), 3000);
  };

  const removeCustomFeature = (index: number) => {
    setCustomFeatures(customFeatures.filter((_, i) => i !== index));
  };

  const addCustomFeature = () => {
    if (newFeature.trim() && !customFeatures.includes(newFeature.trim())) {
      setCustomFeatures([...customFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const toggleExtraService = (service: 'reverProtect' | 'sizeSuggestions') => {
    setExtraServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
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
    setPredefinedScenarios(enforceProgressivePredefined([
      {
        saasFee: 199,
        transactionFeeFixed: 1.50,
        rdvPercentage: 0,
        upsellingPercentage: 0,
        name: "ECO MODE"
      },
      {
        saasFee: 299,
        transactionFeeFixed: 1.20,
        rdvPercentage: 1,
        upsellingPercentage: 0,
        name: "GAS"
      },
      {
        saasFee: 399,
        transactionFeeFixed: 1.00,
        rdvPercentage: 2,
        upsellingPercentage: 3,
        name: "FULL GAS"
      }
    ]));

    // Reset edit flags so defaults can apply again
    setPredefinedEditFlags({ rdvEdited: [false, false, false], upsellingEdited: [false, false, false] });

    // Reset last modified field tracker and field modification order
    setLastModifiedField(null);
    setFieldModificationOrder([]);

    // Reset new toggles
    setShowUpfrontDiscount(false);
    setAbsorbTransactionFee(false);

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

  // Modified calculateScenario to handle absorbed transaction fee
  const calculateScenario = (scenario: PricingData, absorb: boolean = false) => {
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
    
    // Transaction fee is 0 if absorbed, otherwise normal calculation
    const transactionFee = absorb ? 0 : resiMensili * scenario.transactionFeeFixed;
    
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
    const transactionFeeAnnuale = absorbTransactionFee ? 0 : customScenario.transactionFeeFixed * annualReturns;
    const rdvFeeAnnuale = (rdvValue * customScenario.rdvPercentage) / 100;
    const upsellingFeeAnnuale = (upsellingValue * customScenario.upsellingPercentage) / 100;
    const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
    const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
    const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

    return {
      fatturazioneNettaPreRever,
      netRevenuesEcommerce,
      totalPlatformCost,
      aumentoNetRevenues
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
    
    // REVER Platform Cost - considering absorbed transaction fee
    const saasFeeAnnuale = customScenario.saasFee * 12;
    const transactionFeeAnnuale = absorbTransactionFee ? 0 : customScenario.transactionFeeFixed * annualReturns;
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
  }, [clientData, customScenario, absorbTransactionFee]);

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

  const getScenarioFeatures = (index: number) => {
    const featuresByScenario = [
      // ECO MODE (index 0)
      [
        'Copertura nazionale',
        'Rimborso: "item verified"',
        'Only refunds',
        '-',
        '-'
      ],
      // GAS (index 1)
      [
        'Copertura internazionale',
        'Rimborso: "verified", "sent"',
        'Gift cards',
        '1:1 exchanges',
        '-'
      ],
      // FULL GAS (index 2)
      [
        'Copertura internazionale',
        'Rimborso: "verified", "sent", "start"',
        'Gift cards + RDV surplus',
        '1:n exchanges',
        'Full catalogo'
      ]
    ];
    
    return featuresByScenario[index] || [];
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
              value="business-case"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(language, 'businessCase')}
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
          </TabsList>

          <TabsContent value="predefiniti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predefinedScenarios.map((scenario, index) => {
                const calculation = calculateScenario(scenario);
                
                return (
                  <Card 
                    key={index} 
                    className="border-2 hover:border-[#1790FF] transition-colors flex flex-col h-full"
                  >
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{getScenarioEmoji(index)}</span>
                          {scenario.name}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                       {/* Input Fields Section */}
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
                             step="1"
                             value={scenario.rdvPercentage}
                             onChange={(e) => updatePredefinedScenario(index, 'rdvPercentage', Math.round(parseFloat(e.target.value)) || 0)}
                             className="h-8 text-sm"
                           />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">{getTranslation(language, 'upsellingFee')}</label>
                           <Input
                             type="number"
                             step="1"
                             value={scenario.upsellingPercentage}
                             onChange={(e) => updatePredefinedScenario(index, 'upsellingPercentage', Math.round(parseFloat(e.target.value)) || 0)}
                             className="h-8 text-sm"
                           />
                        </div>
                      </div>

                       {/* Caratteristiche Incluse Section */}
                       <div className="space-y-3 border-t pt-3">
                        <h4 className="text-sm font-semibold text-gray-700">Caratteristiche Incluse</h4>
                        <div className="space-y-2">
                          {getScenarioFeatures(index).map((feature, featureIndex) => (
                             <div key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600 h-5">
                               <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                               <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                       {/* Fee Breakdown Section */}
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
                      </div>

                       {/* Chart Section */}
                       <div className="mt-4">
                        <FeeDistributionChart
                          saasFee={calculation.saasFee}
                          transactionFee={calculation.transactionFee}
                          rdvFee={calculation.rdvFee}
                          upsellingFee={calculation.upsellingFee}
                          totalMensile={calculation.totalMensile}
                        />
                      </div>
                      
                       {/* Button Section */}
                       <div className="mt-auto pt-3">
                        <Button 
                          onClick={() => selectPredefinedScenario(scenario, index)}
                          className="w-full bg-[#1790FF] hover:bg-[#1470CC] text-white"
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
                      showUpfrontDiscount={showUpfrontDiscount}
                      absorbTransactionFee={absorbTransactionFee}
                      customFeatures={customFeatures}
                      extraServices={extraServices}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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
                  <div className="space-y-2 flex flex-col justify-end">
                    {/* Upfront discount toggle */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <Label htmlFor="upfront-toggle" className="text-sm font-medium">
                        Pagamento anticipato
                      </Label>
                      <Switch
                        id="upfront-toggle"
                        checked={showUpfrontDiscount}
                        onCheckedChange={setShowUpfrontDiscount}
                      />
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
                      className={absorbTransactionFee ? 'text-gray-400' : ''}
                    />
                    {/* Checkbox to absorb transaction fee */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="absorb-transaction-fee"
                        checked={absorbTransactionFee}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          if (typeof checked === 'boolean') {
                            setAbsorbTransactionFee(checked);
                          }
                        }}
                      />
                      <Label htmlFor="absorb-transaction-fee" className="text-sm text-gray-700">
                        Assorbi costi Transaction Fee
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customRdvFee">{getTranslation(language, 'rdvFee')}</Label>
                    <Input
                      id="customRdvFee"
                      type="number"
                      step="1"
                      value={customScenario.rdvPercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        rdvPercentage: Math.round(parseFloat(e.target.value)) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customUpsellingFee">{getTranslation(language, 'upsellingFee')}</Label>
                     <Input
                       id="customUpsellingFee"
                       type="number"
                       step="1"
                       value={customScenario.upsellingPercentage || ''}
                       onChange={(e) => setCustomScenario({
                         ...customScenario,
                         upsellingPercentage: Math.round(parseFloat(e.target.value)) || 0
                       })}
                       placeholder="0"
                     />
                  </div>
                </div>

                {(() => {
                  const calculation = calculateScenario(customScenario, absorbTransactionFee);
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
                            <span className={`font-medium ${absorbTransactionFee ? 'text-gray-400 line-through' : ''}`}>
                              {formatCurrency(absorbTransactionFee ? 0 : calculation.transactionFee)}
                            </span>
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
                          {/* Upfront discount options */}
                          {showUpfrontDiscount && calculation.totalMensile > 0 && (
                            <div className="bg-rever-blue-light border border-rever-blue p-4 rounded-xl" style={{ marginTop: '-24px' }}>
                              <h4 className="font-semibold mb-3 text-gray-800">Sconto upfront:</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span>6 mesi (-10% SaaS):</span>
                                  <div className="text-right">
                                    <span className="line-through text-red-500">{formatCurrency(calculation.saasFee)}</span>
                                    <span className="ml-2 font-medium">➜ {formatCurrency(calculation.saasFee * 0.9)}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 text-right">
                                  Nuovo mensile: {formatCurrency(calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.9))}
                                </div>
                                <div className="text-xs text-gray-600 text-right">
                                  Totale annuo: {formatCurrency((calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.9)) * 12)}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>12 mesi (-15% SaaS):</span>
                                  <div className="text-right">
                                    <span className="line-through text-red-500">{formatCurrency(calculation.saasFee)}</span>
                                    <span className="ml-2 font-medium">➜ {formatCurrency(calculation.saasFee * 0.85)}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 text-right">
                                  Nuovo mensile: {formatCurrency(calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.85))}
                                </div>
                                <div className="text-xs text-gray-600 text-right">
                                  Totale annuo: {formatCurrency((calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.85)) * 12)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Payback time box - positioned right below monthly total */}
                      <div className="mt-4">
                        <ReadOnlyPayback
                          businessCaseData={clientData}
                          scenarioData={customScenario}
                          monthlyTotal={calculation.totalMensile}
                          language={language}
                        />
                      </div>

                      {/* Caratteristiche Incluse Section - Redesigned */}
                      {(customFeatures.length > 0 || newFeature || true) && (
                        <div className="mt-6 bg-white p-4 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            ✅ Caratteristiche Incluse nel piano selezionato
                          </h3>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Editable Features */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-700 mb-2">Caratteristiche Incluse</h4>
                              
                              {/* Feature List */}
                              <div className="space-y-1">
                                {customFeatures.map((feature, featureIndex) => (
                                  <div 
                                    key={featureIndex} 
                                    className="group flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-rever-blue flex-shrink-0" />
                                      <span className="text-sm text-gray-600">{feature}</span>
                                    </div>
                                    <button
                                      onClick={() => removeCustomFeature(featureIndex)}
                                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Add New Feature - toggle input visibility */}
                              {!showAddFeatureInput ? (
                                <button
                                  onClick={() => setShowAddFeatureInput(true)}
                                  className="text-sm text-rever-blue hover:text-rever-navy flex items-center gap-1 px-1 py-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Aggiungi caratteristica
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Aggiungi caratteristica"
                                    className="text-xs h-8 flex-1"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && newFeature.trim()) {
                                        addCustomFeature();
                                        setShowAddFeatureInput(false);
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    onClick={() => {
                                      if (newFeature.trim()) {
                                        addCustomFeature();
                                        setShowAddFeatureInput(false);
                                      }
                                    }}
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowAddFeatureInput(false);
                                      setNewFeature('');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Show active extras in blue box at bottom */}
                              {(extraServices.reverProtect || extraServices.sizeSuggestions) && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="text-xs text-gray-500 mb-2">EXTRA:</div>
                                  <div className="space-y-1">
                                    {extraServices.reverProtect && (
                                      <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <span>REVER Protect</span>
                                      </div>
                                    )}
                                    {extraServices.sizeSuggestions && (
                                      <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <span>Size Suggestions</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Column - Extra Services */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-700 mb-2">Extra selezionabili</h4>
                              
                              <div className="space-y-2">
                                {/* REVER Protect */}
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-800">REVER Protect</div>
                                    <div className="text-xs text-gray-600">Protezione avanzata per i tuoi resi</div>
                                  </div>
                                  <Switch
                                    checked={extraServices.reverProtect}
                                    onCheckedChange={() => toggleExtraService('reverProtect')}
                                  />
                                </div>

                                {/* Size Suggestions */}
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-800">Size Suggestions</div>
                                    <div className="text-xs text-gray-600">Suggerimenti intelligenti per le taglie</div>
                                  </div>
                                  <Switch
                                    checked={extraServices.sizeSuggestions}
                                    onCheckedChange={() => toggleExtraService('sizeSuggestions')}
                                  />
                                </div>
                              </div>
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
                         step="1"
                         value={scenario.rdvPercentage || ''}
                         onChange={(e) => updateDuplicatedScenario(index, 'rdvPercentage', Math.round(parseFloat(e.target.value)) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{getTranslation(language, 'upsellingFee')}</Label>
                       <Input
                         type="number"
                         step="1"
                         value={scenario.upsellingPercentage || ''}
                         onChange={(e) => updateDuplicatedScenario(index, 'upsellingPercentage', Math.round(parseFloat(e.target.value)) || 0)}
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

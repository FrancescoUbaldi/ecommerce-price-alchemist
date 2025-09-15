import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTranslation } from '@/utils/translations';
import ClientLogoBanner from './ClientLogoBanner';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface FieldOverrides {
  rdvRate?: number;
  upsellingRate?: number;
  saasFee?: number;
  transactionFeeFixed?: number;
  rdvPercentage?: number;
  upsellingPercentage?: number;
  [key: string]: number | undefined;
}

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: ClientData;
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
    rdvConversionRate?: number;
    upsellingConversionRate?: number;
  };
  language: string;
  updateClientData: (field: keyof ClientData, value: number) => void;
  updateRdvRate?: (rate: number) => void;
  updateUpsellingRate?: (rate: number) => void;
  readOnly?: boolean;
  absorbTransactionFee?: boolean;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language, 
  updateClientData,
  updateRdvRate,
  updateUpsellingRate,
  absorbTransactionFee,
  readOnly = false
}: BusinessCaseProps) => {
  const [fieldOverrides, setFieldOverrides] = useState<FieldOverrides>({});

  // Editable Value Component
  interface EditableValueProps {
    value: number;
    format: 'currency' | 'percentage';
    field: string;
    disabled?: boolean;
    onUpdate?: (value: number) => void;
  }

  const EditableValue: React.FC<EditableValueProps> = ({ 
    value, 
    format, 
    field, 
    disabled = false,
    onUpdate 
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const formatValue = (val: number) => {
      return format === 'currency' ? formatCurrency(val) : formatPercentage(val);
    };

    const handleClick = () => {
      if (readOnly || disabled) return;
      setIsEditing(true);
      setEditValue(format === 'percentage' ? value.toString() : value.toString());
    };

    const handleSave = () => {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue)) {
        // Handle special cases for RDV and upselling rates
        if (field === 'rdvRate' && updateRdvRate) {
          updateRdvRate(numValue);
        } else if (field === 'upsellingRate' && updateUpsellingRate) {
          updateUpsellingRate(numValue);
        } else {
          setFieldOverrides(prev => ({ ...prev, [field]: numValue }));
          if (onUpdate) onUpdate(numValue);
        }
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-20 h-6 text-center text-sm"
          autoFocus
        />
      );
    }

    return (
      <span 
        className={`${!readOnly && !disabled ? 'cursor-pointer hover:bg-blue-50 px-1 rounded' : ''}`}
        onClick={handleClick}
        title={!readOnly && !disabled ? getTranslation(language, 'clickToEdit') : ''}
      >
        {formatValue(value)}
      </span>
    );
  };

  // Editable Client Name Component
  interface EditableClientNameProps {
    value: string;
    onUpdate?: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
  }

  const EditableClientName: React.FC<EditableClientNameProps> = ({ 
    value, 
    onUpdate, 
    placeholder,
    disabled = false
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleClick = () => {
      if (disabled || !onUpdate) return;
      setIsEditing(true);
      setEditValue(value);
    };

    const handleSave = () => {
      if (onUpdate) {
        onUpdate(editValue.trim());
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="inline-block w-auto min-w-[200px] h-8 text-lg font-semibold"
          autoFocus
        />
      );
    }

    const displayValue = value || placeholder;
    
    return (
      <span 
        className={`${!disabled && onUpdate ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''} ${!value ? 'text-gray-500 italic' : ''}`}
        onClick={handleClick}
        title={!disabled && onUpdate ? getTranslation(language, 'clickToEdit') : ''}
      >
        {displayValue}
      </span>
    );
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

  // Get the annual returns (use annual if available, otherwise calculate from monthly)
  const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
  
  // Business Case calculations using scenario values
  const effectiveRdvRate = (scenario.rdvConversionRate || 35) / 100; // RDV conversion rate
  const effectiveUpsellingRate = (scenario.upsellingConversionRate || 3.78) / 100; // Upselling conversion rate
  const effectiveSaasFee = scenario.saasFee;
  const effectiveTransactionFee = scenario.transactionFeeFixed;
  const effectiveRdvPercentage = scenario.rdvPercentage;
  const effectiveUpsellingPercentage = scenario.upsellingPercentage;
  
  // Fatturazione (Pre REVER) = Orders × AOV
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  
  // Resi (Pre REVER) = Returns × AOV  
  const resiValue = annualReturns * clientData.carrelloMedio;
  
  // Fatturazione netta (Pre REVER) = Fatturazione - Resi
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  // Vendite ritenute (with editable RDV rate) = Returns × RDV rate × AOV
  const rdvResi = annualReturns * effectiveRdvRate;
  const rdvValue = rdvResi * clientData.carrelloMedio;
  
  // Upselling (with editable upselling rate) = Upsell Orders × Upsell AOV
  const upsellingResi = annualReturns * effectiveUpsellingRate;
  const upsellingAOV = clientData.carrelloMedio * 1.2; // 20% increase
  const upsellingValue = upsellingResi * upsellingAOV;
  
  // Fatturazione Netta Finale = Fatturazione Netta Pre REVER + Vendite Ritenute + Upselling
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  
  // Fatturazione Netta Generata da REVER = RDV + Upselling
  const fatturazioneGenerataRever = rdvValue + upsellingValue;
  
  // REVER Platform Cost calculation with ANNUAL values (using effective overrides)
  const saasFeeAnnuale = effectiveSaasFee * 12;
  const transactionFeeAnnuale = (absorbTransactionFee ? 0 : effectiveTransactionFee * annualReturns);
  const rdvFeeAnnuale = (rdvValue * effectiveRdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * effectiveUpsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  
  // Net Revenues Nome Ecommerce = Fatturazione Netta Finale - REVER Platform Cost
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  
  // REVER ROI = (Fatturazione Netta Generata da REVER / REVER Platform Cost) * 100
  const reverROIPercentage = totalPlatformCost > 0 ? (fatturazioneGenerataRever / totalPlatformCost) * 100 : 0;
  
  // Aumento Net Revenues con REVER = Net Revenues Nome Ecommerce - Fatturazione Netta Pre REVER
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

  // Calculate payback period
  const calculatePayback = () => {
    if (!clientData.carrelloMedio || !annualReturns || !clientData.totalOrdersAnnual) {
      return null;
    }

    const netRevenueIncrease = aumentoNetRevenues;
    
    if (netRevenueIncrease <= 0 || totalPlatformCost <= 0) {
      return null;
    }
    
    const paybackMonths = totalPlatformCost / (netRevenueIncrease / 12);
    
    return paybackMonths < 6 ? paybackMonths : null;
  };

  const paybackMonths = calculatePayback();

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Business Case table with custom border frame */}
        <div 
          className="bg-white rounded-xl p-6"
          style={{
            border: '2px solid #000D1F',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: 'white'
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold leading-none tracking-tight">
              Business Case: <EditableClientName 
                value={clientName}
                onUpdate={readOnly ? undefined : setClientName}
                placeholder={getTranslation(language, 'ecommerceName')}
                disabled={readOnly}
              />
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1790FF]">
                <TableHead className="font-semibold text-white"></TableHead>
                <TableHead className="text-center font-semibold text-white">{getTranslation(language, 'orders')}</TableHead>
                <TableHead className="text-center font-semibold text-white">{getTranslation(language, 'aov')}</TableHead>
                <TableHead className="text-center font-semibold text-white">{getTranslation(language, 'percentage')}</TableHead>
                <TableHead className="text-center font-semibold text-white">{getTranslation(language, 'total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b">
                <TableCell className="font-medium">{getTranslation(language, 'preReverBilling')}</TableCell>
                <TableCell className="text-center">{clientData.totalOrdersAnnual.toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">100.00%</TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{formatCurrency(fatturazione)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'orders')}: {clientData.totalOrdersAnnual.toLocaleString()}</div>
                        <div>× {getTranslation(language, 'aov')}: {formatCurrency(clientData.carrelloMedio)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(fatturazione)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">{getTranslation(language, 'preReverReturns')}</TableCell>
                <TableCell className="text-center">{annualReturns.toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">{formatPercentage(clientData.returnRatePercentage)} <span className="text-sm text-gray-500">{getTranslation(language, 'returnRate2')}</span></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{formatCurrency(resiValue)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'annualReturns')}: {annualReturns.toLocaleString()}</div>
                        <div>× {getTranslation(language, 'aov')}: {formatCurrency(clientData.carrelloMedio)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(resiValue)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>{getTranslation(language, 'preReverNetBilling')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold">{formatCurrency(fatturazioneNettaPreRever)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'preReverBilling')}: {formatCurrency(fatturazione)}</div>
                        <div>− {getTranslation(language, 'preReverReturns')}: {formatCurrency(resiValue)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(fatturazioneNettaPreRever)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">
                  {language === 'it' ? `Vendite ritenute (${Math.round(effectiveRdvRate * 100)}% con REVER)` :
                   language === 'en' ? `Retained Sales (${Math.round(effectiveRdvRate * 100)}% with REVER)` :
                   language === 'es' ? `Ventas Retenidas (${Math.round(effectiveRdvRate * 100)}% con REVER)` :
                   language === 'fr' ? `Ventes Conservées (${Math.round(effectiveRdvRate * 100)}% avec REVER)` :
                   language === 'de' ? `Zurückbehaltene Verkäufe (${Math.round(effectiveRdvRate * 100)}% mit REVER)` :
                   language === 'nl' ? `Behouden Verkopen (${Math.round(effectiveRdvRate * 100)}% met REVER)` :
                   `Vendite ritenute (${Math.round(effectiveRdvRate * 100)}% con REVER)`}
                </TableCell>
                <TableCell className="text-center">{Math.round(rdvResi).toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">
                  <EditableValue 
                    value={scenario.rdvConversionRate || 35} 
                    format="percentage" 
                    field="rdvRate"
                  /> <span className="text-sm text-gray-500">{getTranslation(language, 'rdvRate')}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{formatCurrency(rdvValue)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                       <div className="space-y-1 text-sm">
                         <div>{getTranslation(language, 'annualReturns')}: {annualReturns.toLocaleString()}</div>
                         <div>× {getTranslation(language, 'rdvRate')}: {formatPercentage(effectiveRdvRate * 100)}</div>
                         <div>× {getTranslation(language, 'aov')}: {formatCurrency(clientData.carrelloMedio)}</div>
                         <div className="border-t pt-1 mt-2 font-semibold">
                           = {getTranslation(language, 'total')}: {formatCurrency(rdvValue)}
                         </div>
                       </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">{getTranslation(language, 'upsellingWithRever')}</TableCell>
                <TableCell className="text-center">{Math.round(upsellingResi).toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(upsellingAOV)}</TableCell>
                <TableCell className="text-center">
                  <EditableValue 
                    value={scenario.upsellingConversionRate || 3.78} 
                    format="percentage" 
                    field="upsellingRate"
                  /> <span className="text-sm text-gray-500">{getTranslation(language, 'upsellingRate')}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{formatCurrency(upsellingValue)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'upsellOrders')}: {Math.round(upsellingResi).toLocaleString()}</div>
                        <div>× Upsell {getTranslation(language, 'aov')}: {formatCurrency(upsellingAOV)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(upsellingValue)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>{getTranslation(language, 'finalNetBilling')} {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold">{formatCurrency(fatturazioneNettaFinale)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'preReverNetBilling')}: {formatCurrency(fatturazioneNettaPreRever)}</div>
                        <div>+ {getTranslation(language, 'retainedSalesWithRever')}: {formatCurrency(rdvValue)}</div>
                        <div>+ {getTranslation(language, 'upsellingWithRever')}: {formatCurrency(upsellingValue)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(fatturazioneNettaFinale)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>{getTranslation(language, 'netBillingGeneratedByRever')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold">{formatCurrency(fatturazioneGenerataRever)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'retainedSalesWithRever')}: {formatCurrency(rdvValue)}</div>
                        <div>+ {getTranslation(language, 'upsellingWithRever')}: {formatCurrency(upsellingValue)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(fatturazioneGenerataRever)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">{getTranslation(language, 'reverPlatformCost')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{formatCurrency(totalPlatformCost)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>SaaS Fee: <EditableValue value={saasFeeAnnuale} format="currency" field="saasFee" /></div>
                        <div>+ Transaction Fee: <EditableValue value={transactionFeeAnnuale} format="currency" field="transactionFeeFixed" /></div>
                        <div>+ RDV Fee ({effectiveRdvPercentage}%): <EditableValue value={rdvFeeAnnuale} format="currency" field="rdvPercentage" /></div>
                        <div>+ Upselling Fee ({effectiveUpsellingPercentage}%): <EditableValue value={upsellingFeeAnnuale} format="currency" field="upsellingPercentage" /></div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(totalPlatformCost)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-blue-50 font-semibold border-b">
                <TableCell>{getTranslation(language, 'reverROI')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold text-green-600">{formatPercentage(reverROIPercentage)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'netBillingGeneratedByRever')}: {formatCurrency(fatturazioneGenerataRever)}</div>
                        <div>÷ {getTranslation(language, 'reverPlatformCost')}: {formatCurrency(totalPlatformCost)}</div>
                        <div>× 100</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = ROI: {formatPercentage(reverROIPercentage)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-green-50 font-semibold border-b">
                <TableCell>{getTranslation(language, 'netRevenues')} {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold">{formatCurrency(netRevenuesEcommerce)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'finalNetBilling')}: {formatCurrency(fatturazioneNettaFinale)}</div>
                        <div>− {getTranslation(language, 'reverPlatformCost')}: {formatCurrency(totalPlatformCost)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(netRevenuesEcommerce)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-green-100 font-semibold">
                <TableCell>{getTranslation(language, 'netRevenueUplift')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help font-bold">{formatCurrency(aumentoNetRevenues)}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                      <div className="space-y-1 text-sm">
                        <div>{getTranslation(language, 'netRevenues')}: {formatCurrency(netRevenuesEcommerce)}</div>
                        <div>− {getTranslation(language, 'preReverNetBilling')}: {formatCurrency(fatturazioneNettaPreRever)}</div>
                        <div className="border-t pt-1 mt-2 font-semibold">
                          = {getTranslation(language, 'total')}: {formatCurrency(aumentoNetRevenues)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Payback information if applicable */}
        {paybackMonths !== null && (
          <div className="text-center">
            <div className="inline-block p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ⏱️ {getTranslation(language, 'paybackEstimated')}: {paybackMonths.toFixed(1)} {getTranslation(language, 'monthsToRecoverInvestment')}
              </p>
            </div>
          </div>
        )}

        {/* Client Logo Banner */}
        <ClientLogoBanner language={language} />
      </div>
    </TooltipProvider>
  );
};

export default BusinessCase;

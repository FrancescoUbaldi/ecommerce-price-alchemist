import React from 'react';
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
import RevenueComparisonChart from './RevenueComparisonChart';
import RevenueSuggestionBox from './RevenueSuggestionBox';
import ClientLogoBanner from './ClientLogoBanner';

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
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  language: string;
  updateClientData: (field: keyof ClientData, value: number) => void;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language, 
  updateClientData 
}: BusinessCaseProps) => {
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
  
  // Business Case calculations matching the screenshot exactly
  
  // Fatturazione (Pre REVER) = Orders × AOV
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  
  // Resi (Pre REVER) = Returns × AOV  
  const resiValue = annualReturns * clientData.carrelloMedio;
  
  // Fatturazione netta (Pre REVER) = Fatturazione - Resi
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  // Vendite ritenute (35% con REVER) = Returns × RDV rate × AOV
  const rdvResi = annualReturns * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;
  
  // Upselling (con REVER) = Upsell Orders × Upsell AOV
  const upsellingResi = annualReturns * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3; // 30% increase
  const upsellingValue = upsellingResi * upsellingAOV;
  
  // Fatturazione Netta Finale = Fatturazione Netta Pre REVER + Vendite Ritenute + Upselling
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  
  // Fatturazione Netta Generata da REVER = RDV + Upselling
  const fatturazioneGenerataRever = rdvValue + upsellingValue;
  
  // REVER Platform Cost calculation with ANNUAL values
  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  
  // Net Revenues Nome Ecommerce = Fatturazione Netta Finale - REVER Platform Cost
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  
  // REVER ROI = (Fatturazione Netta Generata da REVER / REVER Platform Cost) * 100
  const reverROIPercentage = totalPlatformCost > 0 ? (fatturazioneGenerataRever / totalPlatformCost) * 100 : 0;
  
  // Aumento Net Revenues con REVER = Net Revenues Nome Ecommerce - Fatturazione Netta Pre REVER
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, 'businessCaseConfig')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">{getTranslation(language, 'ecommerceName')}</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={getTranslation(language, 'enterEcommerceName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnRateBusiness">{getTranslation(language, 'returnRate')}</Label>
                <Input
                  id="returnRateBusiness"
                  type="number"
                  step="0.1"
                  value={clientData.returnRatePercentage || ''}
                  onChange={(e) => updateClientData('returnRatePercentage', parseFloat(e.target.value) || 0)}
                  placeholder="23.9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Case with external dark container */}
        <div 
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#000D1F',
            borderRadius: '16px',
            padding: '32px'
          }}
        >
          <div 
            className="bg-white rounded-xl"
            style={{
              borderRadius: '12px',
              padding: '24px',
              backgroundColor: 'white'
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                Business Case: {clientName || getTranslation(language, 'ecommerceName')}
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
                  <TableCell className="font-medium">{getTranslation(language, 'retainedSalesWithRever')}</TableCell>
                  <TableCell className="text-center">{Math.round(rdvResi).toLocaleString()}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">35.00% <span className="text-sm text-gray-500">{getTranslation(language, 'rdvRate')}</span></TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{formatCurrency(rdvValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                        <div className="space-y-1 text-sm">
                          <div>{getTranslation(language, 'annualReturns')}: {annualReturns.toLocaleString()}</div>
                          <div>× {getTranslation(language, 'rdvRate')}: 35%</div>
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
                  <TableCell className="text-center">3.78% <span className="text-sm text-gray-500">{getTranslation(language, 'upsellingRate')}</span></TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{formatCurrency(upsellingValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                        <div className="space-y-1 text-sm">
                          <div>Upsell Orders: {Math.round(upsellingResi).toLocaleString()}</div>
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
                          <div>SaaS Fee: {formatCurrency(saasFeeAnnuale)}</div>
                          <div>+ Transaction Fee: {formatCurrency(transactionFeeAnnuale)}</div>
                          <div>+ RDV Fee: {formatCurrency(rdvFeeAnnuale)}</div>
                          <div>+ Upselling Fee: {formatCurrency(upsellingFeeAnnuale)}</div>
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
        </div>

        {/* Revenue Comparison Chart */}
        <RevenueComparisonChart
          preReverNetBilling={fatturazioneNettaPreRever}
          finalNetBilling={fatturazioneNettaFinale}
          language={language}
        />

        {/* Revenue Suggestion Box */}
        <RevenueSuggestionBox
          extraRevenue={aumentoNetRevenues}
          language={language}
        />

        {/* Client Logo Banner */}
        <ClientLogoBanner language={language} />
      </div>
    </TooltipProvider>
  );
};

export default BusinessCase;

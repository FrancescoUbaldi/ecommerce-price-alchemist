
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

        <Card>
          <CardHeader>
            <CardTitle>Business Case: {clientName || getTranslation(language, 'ecommerceName')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1790FF]">
                  <TableHead className="font-semibold text-white"></TableHead>
                  <TableHead className="text-center font-semibold text-white">Ordini</TableHead>
                  <TableHead className="text-center font-semibold text-white">AOV</TableHead>
                  <TableHead className="text-center font-semibold text-white">%</TableHead>
                  <TableHead className="text-center font-semibold text-white">Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b">
                  <TableCell className="font-medium">Fatturazione (Pre REVER)</TableCell>
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
                          <div>Ordini: {clientData.totalOrdersAnnual.toLocaleString()}</div>
                          <div>AOV: {formatCurrency(clientData.carrelloMedio)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(fatturazione)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="border-b">
                  <TableCell className="font-medium">Resi (Pre REVER)</TableCell>
                  <TableCell className="text-center">{annualReturns.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">{formatPercentage(clientData.returnRatePercentage)} <span className="text-sm text-gray-500">return rate</span></TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{formatCurrency(resiValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                        <div className="space-y-1 text-sm">
                          <div>Resi: {annualReturns.toLocaleString()}</div>
                          <div>AOV: {formatCurrency(clientData.carrelloMedio)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(resiValue)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-gray-50 font-semibold italic border-b">
                  <TableCell>Fatturazione netta (Pre REVER)</TableCell>
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
                          <div>Fatturazione: {formatCurrency(fatturazione)}</div>
                          <div>Resi: {formatCurrency(resiValue)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(fatturazioneNettaPreRever)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="border-b">
                  <TableCell className="font-medium">Vendite ritenute (35% con REVER)</TableCell>
                  <TableCell className="text-center">{Math.round(rdvResi).toLocaleString()}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">35.00% <span className="text-sm text-gray-500">RDV rate</span></TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{formatCurrency(rdvValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                        <div className="space-y-1 text-sm">
                          <div>Resi: {annualReturns.toLocaleString()}</div>
                          <div>RDV Rate: 35%</div>
                          <div>AOV: {formatCurrency(clientData.carrelloMedio)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(rdvValue)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="border-b">
                  <TableCell className="font-medium">Upselling (con REVER)</TableCell>
                  <TableCell className="text-center">{Math.round(upsellingResi).toLocaleString()}</TableCell>
                  <TableCell className="text-center">{formatCurrency(upsellingAOV)}</TableCell>
                  <TableCell className="text-center">3.78% <span className="text-sm text-gray-500">Upselling rate</span></TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{formatCurrency(upsellingValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg">
                        <div className="space-y-1 text-sm">
                          <div>Upsell Orders: {Math.round(upsellingResi).toLocaleString()}</div>
                          <div>Upsell AOV: {formatCurrency(upsellingAOV)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(upsellingValue)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-gray-50 font-semibold italic border-b">
                  <TableCell>Fatturazione Netta Finale {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
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
                          <div>Fatturazione Netta Pre REVER: {formatCurrency(fatturazioneNettaPreRever)}</div>
                          <div>Vendite Ritenute: {formatCurrency(rdvValue)}</div>
                          <div>Upselling: {formatCurrency(upsellingValue)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(fatturazioneNettaFinale)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-gray-50 font-semibold italic border-b">
                  <TableCell>Fatturazione Netta Generata da REVER</TableCell>
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
                          <div>Vendite Ritenute: {formatCurrency(rdvValue)}</div>
                          <div>Upselling: {formatCurrency(upsellingValue)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(fatturazioneGenerataRever)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="border-b">
                  <TableCell className="font-medium">REVER Platform Cost</TableCell>
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
                          <div>SaaS Fee Annuale: {formatCurrency(saasFeeAnnuale)}</div>
                          <div>Total Transaction Fee: {formatCurrency(transactionFeeAnnuale)}</div>
                          <div>Total RDV Fee: {formatCurrency(rdvFeeAnnuale)}</div>
                          <div>Total Upselling Fee: {formatCurrency(upsellingFeeAnnuale)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(totalPlatformCost)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-blue-50 font-semibold border-b">
                  <TableCell>REVER ROI</TableCell>
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
                          <div>Fatturazione Netta Generata da REVER: {formatCurrency(fatturazioneGenerataRever)}</div>
                          <div>REVER Platform Cost: {formatCurrency(totalPlatformCost)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            ROI: {formatPercentage(reverROIPercentage)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-green-50 font-semibold border-b">
                  <TableCell>Net Revenues {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
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
                          <div>Fatturazione Netta Finale: {formatCurrency(fatturazioneNettaFinale)}</div>
                          <div>REVER Platform Cost: {formatCurrency(totalPlatformCost)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(netRevenuesEcommerce)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-green-100 font-semibold">
                  <TableCell>Aumento Net Revenues con REVER</TableCell>
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
                          <div>Net Revenues Ecommerce: {formatCurrency(netRevenuesEcommerce)}</div>
                          <div>Fatturazione Netta Pre REVER: {formatCurrency(fatturazioneNettaPreRever)}</div>
                          <div className="border-t pt-1 mt-2 font-semibold">
                            Totale: {formatCurrency(aumentoNetRevenues)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default BusinessCase;

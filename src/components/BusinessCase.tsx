
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
  
  // REVER Platform Cost = SaaS Fee Annuale + Total Transaction Fee + Total RDV Fee + Total Upselling Fee
  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  
  // Net Revenues Nome Ecommerce = Fatturazione Netta Finale - REVER Platform Cost
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  
  // REVER ROI = Fatturazione Netta Finale - REVER Platform Cost
  const reverROI = fatturazioneNettaFinale - totalPlatformCost;
  
  // Aumento Net Revenues con REVER = Net Revenues Nome Ecommerce - Fatturazione Netta Pre REVER
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

  return (
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
              <TableRow className="bg-gray-100">
                <TableHead className="font-semibold"></TableHead>
                <TableHead className="text-center font-semibold">Ordini</TableHead>
                <TableHead className="text-center font-semibold">AOV</TableHead>
                <TableHead className="text-center font-semibold">%</TableHead>
                <TableHead className="text-center font-semibold">Totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b">
                <TableCell className="font-medium">Fatturazione (Pre REVER)</TableCell>
                <TableCell className="text-center">{clientData.totalOrdersAnnual.toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">100.00%</TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazione)}</TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">Resi (Pre REVER)</TableCell>
                <TableCell className="text-center">{annualReturns.toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">{formatPercentage(clientData.returnRatePercentage)} <span className="text-sm text-gray-500">return rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(resiValue)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>Fatturazione netta (Pre REVER)</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaPreRever)}</TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">Vendite ritenute (35% con REVER)</TableCell>
                <TableCell className="text-center">{Math.round(rdvResi).toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">35.00% <span className="text-sm text-gray-500">RDV rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(rdvValue)}</TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">Upselling (con REVER)</TableCell>
                <TableCell className="text-center">{Math.round(upsellingResi).toLocaleString()}</TableCell>
                <TableCell className="text-center">{formatCurrency(upsellingAOV)}</TableCell>
                <TableCell className="text-center">3.78% <span className="text-sm text-gray-500">Upselling rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(upsellingValue)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>Fatturazione Netta Finale {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaFinale)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-gray-50 font-semibold italic border-b">
                <TableCell>Fatturazione Netta Generata da REVER</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneGenerataRever)}</TableCell>
              </TableRow>
              
              <TableRow className="border-b">
                <TableCell className="font-medium">REVER Platform Cost</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(totalPlatformCost)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-blue-50 font-semibold border-b">
                <TableCell>REVER ROI</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold text-green-600">{formatCurrency(reverROI)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-green-50 font-semibold border-b">
                <TableCell>Net Revenues {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(netRevenuesEcommerce)}</TableCell>
              </TableRow>
              
              <TableRow className="bg-green-100 font-semibold">
                <TableCell>Aumento Net Revenues con REVER</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(aumentoNetRevenues)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCase;

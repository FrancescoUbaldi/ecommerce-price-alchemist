
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

  // Calcoli business case
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resi = clientData.resiAnnuali;
  const returnRate = clientData.returnRatePercentage;
  const resiValue = resi * clientData.carrelloMedio;
  
  // Fatturazione netta pre-REVER = n° ordini x AOV - valore resi
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  // RDV calculations (35% dei resi)
  const rdvResi = resi * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;
  
  // Upselling calculations (3.78% dei resi con AOV incrementato del 30%)
  const upsellingResi = resi * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;
  
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  const fatturazioneGenerataRever = rdvValue + upsellingValue;
  
  // Platform costs
  const resiMensili = resi / 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * resi;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const saasFeeAnnuale = scenario.saasFee * 12;
  
  const totalPlatformCost = transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale + saasFeeAnnuale;
  
  // ROI calculations - REVER ROI = Fatturazione netta generata da REVER / REVER Platform Cost
  const reverROI = totalPlatformCost > 0 ? (fatturazioneGenerataRever / totalPlatformCost) * 100 : 0;
  
  // Net Revenues calculations
  const netRevenuesWithoutRever = fatturazioneNettaPreRever * 0.1; // Assumendo 10% margine
  const aumentoNetRevenues = fatturazioneGenerataRever * 0.1 - totalPlatformCost;

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
              <TableRow className="bg-[#1790FF] bg-opacity-10">
                <TableHead></TableHead>
                <TableHead className="text-center">Ordini</TableHead>
                <TableHead className="text-center">AOV</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">Totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Fatturazione (Pre REVER)</TableCell>
                <TableCell className="text-center">{clientData.totalOrdersAnnual}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">100.00%</TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazione)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Resi (Pre REVER)</TableCell>
                <TableCell className="text-center">{resi}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">{formatPercentage(returnRate)} <span className="text-sm text-gray-500">return rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(resiValue)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold italic">
                <TableCell>Fatturazione netta (Pre REVER)</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaPreRever)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Vendite ritenute (35% con REVER)</TableCell>
                <TableCell className="text-center">{Math.round(rdvResi)}</TableCell>
                <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                <TableCell className="text-center">35.00% <span className="text-sm text-gray-500">RDV rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(rdvValue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Upselling (con REVER)</TableCell>
                <TableCell className="text-center">{Math.round(upsellingResi)}</TableCell>
                <TableCell className="text-center">{formatCurrency(upsellingAOV)}</TableCell>
                <TableCell className="text-center">3.78% <span className="text-sm text-gray-500">Upselling rate</span></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(upsellingValue)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold italic">
                <TableCell>Fatturazione Netta Finale {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaFinale)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold italic">
                <TableCell>Fatturazione Netta Generata da REVER</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(fatturazioneGenerataRever)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">REVER Platform Cost</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(totalPlatformCost)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>REVER ROI</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold text-green-600">{formatPercentage(reverROI)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-50 font-semibold">
                <TableCell>Net Revenues {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(netRevenuesWithoutRever)}</TableCell>
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

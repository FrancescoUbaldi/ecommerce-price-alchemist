
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

  // Calcoli business case CORRETTI
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
  
  // Platform costs - FIXED CALCULATIONS
  const transactionFeeAnnuale = scenario.transactionFeeFixed * resi;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const saasFeeAnnuale = scenario.saasFee * 12;
  
  const totalPlatformCost = transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale + saasFeeAnnuale;
  
  // CORRECTED CALCULATIONS matching the reference image
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const reverROI = fatturazioneNettaFinale - totalPlatformCost;
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b-2 border-gray-300">
                  <TableHead className="font-bold text-gray-800"></TableHead>
                  <TableHead className="text-center font-bold text-gray-800">Ordini</TableHead>
                  <TableHead className="text-center font-bold text-gray-800">AOV</TableHead>
                  <TableHead className="text-center font-bold text-gray-800">%</TableHead>
                  <TableHead className="text-center font-bold text-gray-800">Totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-gray-200">
                  <TableCell className="font-medium py-3">Fatturazione (Pre REVER)</TableCell>
                  <TableCell className="text-center">{clientData.totalOrdersAnnual}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">100.00%</TableCell>
                  <TableCell className="text-center font-bold">{formatCurrency(fatturazione)}</TableCell>
                </TableRow>
                <TableRow className="border-b border-gray-200">
                  <TableCell className="font-medium py-3">Resi (Pre REVER)</TableCell>
                  <TableCell className="text-center">{resi}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">{formatPercentage(returnRate)} <span className="text-sm text-gray-500">return rate</span></TableCell>
                  <TableCell className="text-center font-bold">{formatCurrency(resiValue)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold italic bg-gray-50 border-b border-gray-200">
                  <TableCell className="py-3">Fatturazione netta (Pre REVER)</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaPreRever)}</TableCell>
                </TableRow>
                <TableRow className="border-b border-gray-200 bg-green-50">
                  <TableCell className="font-medium py-3">Vendite ritenute (35% con REVER)</TableCell>
                  <TableCell className="text-center">{Math.round(rdvResi)}</TableCell>
                  <TableCell className="text-center">{formatCurrency(clientData.carrelloMedio)}</TableCell>
                  <TableCell className="text-center">35.00% <span className="text-sm text-gray-500">RDV rate</span></TableCell>
                  <TableCell className="text-center font-bold text-green-700">{formatCurrency(rdvValue)}</TableCell>
                </TableRow>
                <TableRow className="border-b border-gray-200 bg-green-50">
                  <TableCell className="font-medium py-3">Upselling (con REVER)</TableCell>
                  <TableCell className="text-center">{Math.round(upsellingResi)}</TableCell>
                  <TableCell className="text-center">{formatCurrency(upsellingAOV)}</TableCell>
                  <TableCell className="text-center">3.78% <span className="text-sm text-gray-500">Upselling rate</span></TableCell>
                  <TableCell className="text-center font-bold text-green-700">{formatCurrency(upsellingValue)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold italic bg-gray-50 border-b border-gray-200">
                  <TableCell className="py-3">Fatturazione Netta Finale {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold">{formatCurrency(fatturazioneNettaFinale)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold italic bg-green-100 border-b border-gray-200">
                  <TableCell className="py-3">Fatturazione Netta Generata da REVER</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold text-green-700">{formatCurrency(fatturazioneGenerataRever)}</TableCell>
                </TableRow>
                <TableRow className="border-b border-gray-200 bg-blue-50">
                  <TableCell className="font-medium py-3">REVER Platform Cost</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold text-blue-700">{formatCurrency(totalPlatformCost)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold border-b border-gray-200 bg-yellow-50">
                  <TableCell className="py-3">REVER ROI</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold text-green-600">0.00%</TableCell>
                </TableRow>
                <TableRow className="bg-green-100 font-semibold border-b-2 border-green-300">
                  <TableCell className="py-3">Net Revenues {clientName || getTranslation(language, 'ecommerceName')}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold text-green-700">{formatCurrency(netRevenuesEcommerce)}</TableCell>
                </TableRow>
                <TableRow className="bg-green-200 font-semibold">
                  <TableCell className="py-3">Aumento Net Revenues con REVER</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold text-green-800">{formatCurrency(aumentoNetRevenues)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCase;

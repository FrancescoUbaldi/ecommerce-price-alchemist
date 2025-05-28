
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

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: {
    resiAnnuali: number;
    carrelloMedio: number;
  };
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
}

const BusinessCase = ({ clientName, setClientName, clientData, scenario }: BusinessCaseProps) => {
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
  const fatturazione = clientData.resiAnnuali * clientData.carrelloMedio;
  const resi = clientData.resiAnnuali;
  const returnRate = clientData.resiAnnuali > 0 ? (resi / (resi / 0.239)) * 100 : 23.9; // Assumendo 23.9% return rate
  const resiValue = resi * clientData.carrelloMedio;
  
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
  
  // ROI calculations
  const netRevenuesWithoutRever = fatturazioneNettaPreRever * 0.1; // Assumendo 10% margine
  const aumentoNetRevenues = fatturazioneGenerataRever * 0.1 - totalPlatformCost;
  const reverROI = totalPlatformCost > 0 ? (aumentoNetRevenues / totalPlatformCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Case Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome Ecommerce</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Inserisci il nome dell'ecommerce"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Case: {clientName || 'Nome Ecommerce'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-100">
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
                <TableCell className="text-center">{clientData.resiAnnuali > 0 ? Math.round(resi / 0.239) : 0}</TableCell>
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
                <TableCell>Fatturazione Netta Finale {clientName || 'Nome Ecommerce'}</TableCell>
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
                <TableCell>Net Revenues {clientName || 'Nome Ecommerce'}</TableCell>
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

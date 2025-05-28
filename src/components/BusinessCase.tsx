
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTranslation } from '@/utils/translations';
import jsPDF from 'jspdf';

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
  
  // Platform costs - FIXED CALCULATIONS
  const transactionFeeAnnuale = scenario.transactionFeeFixed * resi;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const saasFeeAnnuale = scenario.saasFee * 12;
  
  const totalPlatformCost = transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale + saasFeeAnnuale;
  
  // FIXED CALCULATIONS according to requirements
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const reverROI = fatturazioneNettaFinale - totalPlatformCost;
  const netRevenuesPreRever = fatturazioneNettaPreRever * 0.1; // Assumendo 10% margine
  const aumentoNetRevenues = netRevenuesEcommerce - netRevenuesPreRever;

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const storeName = clientName || 'Ecommerce';
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Business Case: ' + storeName, 20, 30);
    
    pdf.setFontSize(12);
    let yPosition = 50;
    
    // Table data
    const tableData = [
      ['Fatturazione (Pre REVER)', clientData.totalOrdersAnnual.toString(), formatCurrency(clientData.carrelloMedio), '100.00%', formatCurrency(fatturazione)],
      ['Resi (Pre REVER)', resi.toString(), formatCurrency(clientData.carrelloMedio), formatPercentage(returnRate), formatCurrency(resiValue)],
      ['Fatturazione netta (Pre REVER)', '', '', '', formatCurrency(fatturazioneNettaPreRever)],
      ['Vendite ritenute (35% con REVER)', Math.round(rdvResi).toString(), formatCurrency(clientData.carrelloMedio), '35.00%', formatCurrency(rdvValue)],
      ['Upselling (con REVER)', Math.round(upsellingResi).toString(), formatCurrency(upsellingAOV), '3.78%', formatCurrency(upsellingValue)],
      ['Fatturazione Netta Finale ' + storeName, '', '', '', formatCurrency(fatturazioneNettaFinale)],
      ['Fatturazione Netta Generata da REVER', '', '', '', formatCurrency(fatturazioneGenerataRever)],
      ['REVER Platform Cost', '', '', '', formatCurrency(totalPlatformCost)],
      ['REVER ROI', '', '', '', formatCurrency(reverROI)],
      ['Net Revenues ' + storeName, '', '', '', formatCurrency(netRevenuesEcommerce)],
      ['Aumento Net Revenues con REVER', '', '', '', formatCurrency(aumentoNetRevenues)]
    ];
    
    // Table headers
    pdf.text('Ordini', 20, yPosition);
    pdf.text('AOV', 60, yPosition);
    pdf.text('%', 100, yPosition);
    pdf.text('Totale', 140, yPosition);
    yPosition += 10;
    
    // Table rows
    tableData.forEach((row) => {
      pdf.text(row[0], 20, yPosition);
      pdf.text(row[1], 60, yPosition);
      pdf.text(row[2], 100, yPosition);
      pdf.text(row[3], 100, yPosition);
      pdf.text(row[4], 140, yPosition);
      yPosition += 8;
    });
    
    // Save PDF
    pdf.save(`BusinessCase_${storeName.replace(/\s+/g, '_')}.pdf`);
  };

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
          <div className="flex items-center justify-between">
            <CardTitle>Business Case: {clientName || getTranslation(language, 'ecommerceName')}</CardTitle>
            <Button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-[#1790FF] hover:bg-[#1470CC] text-white"
            >
              <FileText className="h-4 w-4" />
              Esporta in PDF
            </Button>
          </div>
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
                <TableCell className="text-center font-bold text-green-600">{formatCurrency(reverROI)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-50 font-semibold">
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

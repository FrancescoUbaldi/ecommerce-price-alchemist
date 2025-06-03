
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface BusinessCaseProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientData: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
    totalOrdersAnnual: number;
    returnRatePercentage: number;
  };
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  language: string;
  updateClientData?: (field: string, value: number) => void;
  isReadOnly?: boolean;
}

const BusinessCase = ({ 
  clientName, 
  setClientName, 
  clientData, 
  scenario, 
  language,
  updateClientData,
  isReadOnly = false
}: BusinessCaseProps) => {
  // Calcola il GTV annuale
  const gtv = useMemo(() => {
    if (clientData.resiAnnuali > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiAnnuali * clientData.carrelloMedio;
    } else if (clientData.resiMensili > 0 && clientData.carrelloMedio > 0) {
      return clientData.resiMensili * 12 * clientData.carrelloMedio;
    }
    return 0;
  }, [clientData.resiAnnuali, clientData.resiMensili, clientData.carrelloMedio]);

  // Calcola i valori pre-REVER
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resiValue = clientData.resiAnnuali * clientData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;

  // Calcola i valori con REVER
  const rdvResi = clientData.resiAnnuali * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;

  const upsellingResi = clientData.resiAnnuali * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;

  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;

  // Calcola i costi della piattaforma REVER
  const saasFeeAnnuale = scenario.saasFee * 12;
  const transactionFeeAnnuale = scenario.transactionFeeFixed * clientData.resiAnnuali;
  const rdvFeeAnnuale = (rdvValue * scenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * scenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;

  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const netRevenueIncrease = netRevenuesEcommerce - fatturazioneNettaPreRever;

  // Calcola il payback period
  const calculatePayback = useMemo(() => {
    if (!clientData.carrelloMedio || !clientData.resiAnnuali || !clientData.totalOrdersAnnual) {
      return null;
    }

    if (netRevenueIncrease <= 0 || totalPlatformCost <= 0) {
      return null;
    }

    const paybackMonths = totalPlatformCost / (netRevenueIncrease / 12);
    return paybackMonths < 6 ? paybackMonths : null;
  }, [clientData, scenario, netRevenueIncrease, totalPlatformCost]);

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

  return (
    <div className="space-y-6">
      {/* Client Name Input - hidden in read-only mode */}
      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {getTranslation(language, 'businessCase')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="clientName">{getTranslation(language, 'clientName')}</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Inserisci il nome del cliente"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Logo Banner - with proper client name display */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Business Case per {clientName || 'Cliente'}
        </h2>
        <p className="text-gray-600">
          Analisi economica personalizzata con REVER
        </p>
      </div>

      {/* Business Analysis Section - Original Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analisi Business Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabella Business Case originale con 4 colonne */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left font-semibold border border-gray-300">Categoria</th>
                  <th className="p-3 text-center font-semibold border border-gray-300">Ordini</th>
                  <th className="p-3 text-center font-semibold border border-gray-300">AOV</th>
                  <th className="p-3 text-center font-semibold border border-gray-300">%</th>
                  <th className="p-3 text-center font-semibold border border-gray-300">Totale</th>
                </tr>
              </thead>
              <tbody>
                {/* Fatturazione Totale */}
                <tr className="bg-gray-50">
                  <td className="p-3 font-medium border border-gray-300">Fatturazione Totale</td>
                  <td className="p-3 text-center border border-gray-300">{clientData.totalOrdersAnnual.toLocaleString()}</td>
                  <td className="p-3 text-center border border-gray-300">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="p-3 text-center border border-gray-300">100%</td>
                  <td className="p-3 text-center font-bold border border-gray-300">{formatCurrency(fatturazione)}</td>
                </tr>

                {/* Resi */}
                <tr>
                  <td className="p-3 font-medium border border-gray-300">Resi</td>
                  <td className="p-3 text-center border border-gray-300">{clientData.resiAnnuali.toLocaleString()}</td>
                  <td className="p-3 text-center border border-gray-300">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="p-3 text-center border border-gray-300">{formatPercentage(clientData.returnRatePercentage)}</td>
                  <td className="p-3 text-center font-bold text-red-600 border border-gray-300">-{formatCurrency(resiValue)}</td>
                </tr>

                {/* Fatturazione Netta (pre-REVER) */}
                <tr className="bg-yellow-50">
                  <td className="p-3 font-bold border border-gray-300">Fatturazione Netta (pre-REVER)</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center font-bold text-lg border border-gray-300">{formatCurrency(fatturazioneNettaPreRever)}</td>
                </tr>

                {/* RDV */}
                <tr className="bg-green-50">
                  <td className="p-3 font-medium border border-gray-300">RDV (Recupero)</td>
                  <td className="p-3 text-center border border-gray-300">{rdvResi.toFixed(0)}</td>
                  <td className="p-3 text-center border border-gray-300">{formatCurrency(clientData.carrelloMedio)}</td>
                  <td className="p-3 text-center border border-gray-300">35%</td>
                  <td className="p-3 text-center font-bold text-green-600 border border-gray-300">+{formatCurrency(rdvValue)}</td>
                </tr>

                {/* Upselling */}
                <tr className="bg-green-50">
                  <td className="p-3 font-medium border border-gray-300">Upselling</td>
                  <td className="p-3 text-center border border-gray-300">{upsellingResi.toFixed(0)}</td>
                  <td className="p-3 text-center border border-gray-300">{formatCurrency(upsellingAOV)}</td>
                  <td className="p-3 text-center border border-gray-300">3.78%</td>
                  <td className="p-3 text-center font-bold text-green-600 border border-gray-300">+{formatCurrency(upsellingValue)}</td>
                </tr>

                {/* Fatturazione Finale */}
                <tr className="bg-blue-50">
                  <td className="p-3 font-bold border border-gray-300">Fatturazione Finale</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center font-bold text-xl border border-gray-300">{formatCurrency(fatturazioneNettaFinale)}</td>
                </tr>

                {/* Costi Piattaforma */}
                <tr className="bg-red-50">
                  <td className="p-3 font-medium border border-gray-300">Costi Piattaforma REVER</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center font-bold text-red-600 border border-gray-300">-{formatCurrency(totalPlatformCost)}</td>
                </tr>

                {/* Ricavi Netti E-commerce */}
                <tr className="bg-green-100">
                  <td className="p-3 font-bold text-lg border border-gray-300">Ricavi Netti E-commerce</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center border border-gray-300">-</td>
                  <td className="p-3 text-center font-bold text-2xl text-green-600 border border-gray-300">{formatCurrency(netRevenuesEcommerce)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Incremento Ricavi */}
          <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Incremento Ricavi:</span>
              <span className="text-2xl font-bold text-cyan-600">{formatCurrency(netRevenueIncrease)}</span>
            </div>
          </div>

          {/* ROI */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">ROI (Return on Investment):</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalPlatformCost > 0 ? formatPercentage((netRevenueIncrease / totalPlatformCost) * 100) : '0%'}
              </span>
            </div>
          </div>

          {/* Payback Period */}
          {calculatePayback !== null && (
            <div className="mt-4 bg-[#E5F0FF] border border-[#1790FF] rounded-lg p-4 animate-fade-in">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCase;

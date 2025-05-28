
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Euro, TrendingUp, Settings } from 'lucide-react';

interface PricingData {
  saasFee: number;
  transactionFeePercentage: number;
  rdvPercentage: number;
  upsellingPercentage: number;
  name: string;
}

interface ClientData {
  resiAnnuali: number;
  carrelloMedio: number;
}

const Index = () => {
  const [clientData, setClientData] = useState<ClientData>({
    resiAnnuali: 0,
    carrelloMedio: 0
  });

  const [customScenario, setCustomScenario] = useState<PricingData>({
    saasFee: 0,
    transactionFeePercentage: 0,
    rdvPercentage: 0,
    upsellingPercentage: 0,
    name: "Scenario Personalizzato"
  });

  const [predefinedScenarios] = useState<PricingData[]>([
    {
      saasFee: 299,
      transactionFeePercentage: 2.5,
      rdvPercentage: 15,
      upsellingPercentage: 25,
      name: "Scenario Base"
    },
    {
      saasFee: 499,
      transactionFeePercentage: 2.0,
      rdvPercentage: 12,
      upsellingPercentage: 20,
      name: "Scenario Premium"
    },
    {
      saasFee: 799,
      transactionFeePercentage: 1.5,
      rdvPercentage: 10,
      upsellingPercentage: 18,
      name: "Scenario Enterprise"
    }
  ]);

  const calculateScenario = (scenario: PricingData) => {
    if (!clientData.resiAnnuali || !clientData.carrelloMedio) {
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

    const resiMensili = clientData.resiAnnuali / 12;
    
    // Calcolo Transaction Fee
    const transactionFee = (resiMensili * clientData.carrelloMedio * scenario.transactionFeePercentage) / 100;
    
    // Calcolo RDV (37% dei resi in un anno)
    const rdvAnnuali = clientData.resiAnnuali * 0.37;
    const rdvMensili = rdvAnnuali / 12;
    const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
    
    // Calcolo Upselling (3.78% dei resi in un anno con incremento del 30%)
    const upsellingAnnuali = clientData.resiAnnuali * 0.0378;
    const upsellingMensili = upsellingAnnuali / 12;
    const incrementoCarrello = clientData.carrelloMedio * 0.3;
    const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
    
    const totalMensile = scenario.saasFee + transactionFee + rdvFee + upsellingFee;
    const annualContractValue = totalMensile * 12;
    
    // Calcolo GTV (Gross Transaction Value)
    const gtv = clientData.resiAnnuali * clientData.carrelloMedio;
    
    // Calcolo Take Rate
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            Tool di Pricing Ecommerce
          </h1>
          <p className="text-gray-600">Calcola il pricing ottimale per i tuoi clienti ecommerce</p>
        </div>

        {/* Dati Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dati Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resiAnnuali">Resi Annuali</Label>
                <Input
                  id="resiAnnuali"
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  onChange={(e) => setClientData({
                    ...clientData,
                    resiAnnuali: parseInt(e.target.value) || 0
                  })}
                  placeholder="Inserisci il numero di resi annuali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrelloMedio">Carrello Medio (€)</Label>
                <Input
                  id="carrelloMedio"
                  type="number"
                  value={clientData.carrelloMedio || ''}
                  onChange={(e) => setClientData({
                    ...clientData,
                    carrelloMedio: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Inserisci il carrello medio"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenari di Pricing */}
        <Tabs defaultValue="predefiniti" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefiniti">Scenari Predefiniti</TabsTrigger>
            <TabsTrigger value="personalizzato">Scenario Personalizzato</TabsTrigger>
          </TabsList>

          <TabsContent value="predefiniti" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {predefinedScenarios.map((scenario, index) => {
                const calculation = calculateScenario(scenario);
                return (
                  <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {scenario.name}
                        <Euro className="h-5 w-5 text-green-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Parametri */}
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>SaaS Fee:</span>
                          <span className="font-medium">{formatCurrency(scenario.saasFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction Fee:</span>
                          <span className="font-medium">{scenario.transactionFeePercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RDV Fee:</span>
                          <span className="font-medium">{scenario.rdvPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Upselling Fee:</span>
                          <span className="font-medium">{scenario.upsellingPercentage}%</span>
                        </div>
                      </div>

                      {/* Calcoli */}
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
                          <span>Totale Mensile:</span>
                          <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                          <span>Take Rate:</span>
                          <span className="font-medium text-blue-600">{formatPercentage(calculation.takeRate)}</span>
                        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Scenario Personalizzato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="customSaasFee">SaaS Fee (€/mese)</Label>
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
                    <Label htmlFor="customTransactionFee">Transaction Fee (%)</Label>
                    <Input
                      id="customTransactionFee"
                      type="number"
                      step="0.1"
                      value={customScenario.transactionFeePercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        transactionFeePercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customRdvFee">RDV Fee (%)</Label>
                    <Input
                      id="customRdvFee"
                      type="number"
                      step="0.1"
                      value={customScenario.rdvPercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        rdvPercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customUpsellingFee">Upselling Fee (%)</Label>
                    <Input
                      id="customUpsellingFee"
                      type="number"
                      step="0.1"
                      value={customScenario.upsellingPercentage || ''}
                      onChange={(e) => setCustomScenario({
                        ...customScenario,
                        upsellingPercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Risultati Scenario Personalizzato */}
                {(() => {
                  const calculation = calculateScenario(customScenario);
                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Risultati Calcolo</h3>
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
                            <span>Totale Mensile:</span>
                            <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>GTV Annuale:</span>
                            <span className="font-medium">{formatCurrency(calculation.gtv)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ACV Annuale:</span>
                            <span className="font-medium">{formatCurrency(calculation.annualContractValue)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold bg-blue-100 p-3 rounded">
                            <span>Take Rate:</span>
                            <span className="text-blue-600">{formatPercentage(calculation.takeRate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

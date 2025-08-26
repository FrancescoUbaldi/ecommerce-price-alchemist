import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getTranslation } from '@/utils/translations';
import BusinessCase from '@/components/BusinessCase';
import ReadOnlyPayback from '@/components/ReadOnlyPayback';

interface ShareData {
  id: string;
  name: string | null;
  language: string;
  scenario_data: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
    name: string;
    showUpfrontDiscount?: boolean;
    absorbTransactionFee?: boolean;
    features?: string[];
    extraServices?: {
      reverProtect: boolean;
      sizeSuggestions: boolean;
    };
  };
  business_case_data: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
    totalOrdersAnnual: number;
    returnRatePercentage: number;
  };
}

const ClientView = () => {
  const { id } = useParams<{ id: string }>();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      if (!id) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_shares')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError('Link not found or expired');
        } else {
          setShareData(data);
        }
      } catch (error) {
        console.error('Error fetching share data:', error);
        setError('Link not valid or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [id]);

  const calculateScenario = (scenario: ShareData['scenario_data'], clientData: ShareData['business_case_data']) => {
    const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
    
    if (!annualReturns || !clientData.carrelloMedio) {
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

    const resiMensili = annualReturns / 12;
    const originalTransactionFee = resiMensili * scenario.transactionFeeFixed;
    const transactionFee = scenario.absorbTransactionFee ? 0 : originalTransactionFee;
    
    const rdvAnnuali = annualReturns * 0.35;
    const rdvMensili = rdvAnnuali / 12;
    const rdvFee = (rdvMensili * clientData.carrelloMedio * scenario.rdvPercentage) / 100;
    
    const upsellingAnnuali = annualReturns * 0.0378;
    const upsellingMensili = upsellingAnnuali / 12;
    const incrementoCarrello = clientData.carrelloMedio * 0.3;
    const upsellingFee = (upsellingMensili * incrementoCarrello * scenario.upsellingPercentage) / 100;
    
    const totalMensile = scenario.saasFee + transactionFee + rdvFee + upsellingFee;
    const annualContractValue = totalMensile * 12;
    
    const gtv = annualReturns * clientData.carrelloMedio;
    const takeRate = gtv > 0 ? (annualContractValue / gtv) * 100 : 0;

    return {
      saasFee: scenario.saasFee,
      transactionFee: originalTransactionFee,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getTranslation(shareData?.language || 'it', 'linkNotFound')}
          </h2>
          <p className="text-gray-600">
            {getTranslation(shareData?.language || 'it', 'linkExpiredMessage')}
          </p>
        </div>
      </div>
    );
  }

  const calculation = calculateScenario(shareData.scenario_data, shareData.business_case_data);
  
  // Calculate Business Case data for breakdowns
  const annualReturns = shareData.business_case_data.resiAnnuali > 0 ? shareData.business_case_data.resiAnnuali : shareData.business_case_data.resiMensili * 12;
  const fatturazione = shareData.business_case_data.totalOrdersAnnual * shareData.business_case_data.carrelloMedio;
  const resiValue = annualReturns * shareData.business_case_data.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  
  const rdvResi = annualReturns * 0.35;
  const rdvValue = rdvResi * shareData.business_case_data.carrelloMedio;
  const upsellingResi = annualReturns * 0.0378;
  const upsellingAOV = shareData.business_case_data.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  
  const saasFeeAnnuale = shareData.scenario_data.saasFee * 12;
  const transactionFeeAnnuale = shareData.scenario_data.absorbTransactionFee ? 0 : shareData.scenario_data.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * shareData.scenario_data.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * shareData.scenario_data.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;
  
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <div className="h-40 w-auto overflow-hidden mb-1">
              <img 
                src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png" 
                alt="REVER Logo" 
                className="h-48 w-auto object-cover object-top transform -translate-y-2"
              />
            </div>
            <p className="text-gray-600 text-center -mt-6 leading-tight relative z-10">
              {getTranslation(shareData.language, 'subtitle')}
            </p>
          </div>
        </div>

        {shareData.name && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {getTranslation(shareData.language, 'businessCaseFor')} {shareData.name}
            </h1>
          </div>
        )}

        <Tabs defaultValue="business-case" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="business-case"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(shareData.language, 'businessCase')}
            </TabsTrigger>
            <TabsTrigger 
              value="personalizzato"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(shareData.language, 'customScenario')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalizzato" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTranslation(shareData.language, 'customScenario')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'totalAnnualOrders')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.business_case_data.totalOrdersAnnual.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'annualReturns')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.business_case_data.resiAnnuali.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'returnRate')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.business_case_data.returnRatePercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'saasFee')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {formatCurrency(shareData.scenario_data.saasFee)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'transactionFee')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.scenario_data.absorbTransactionFee ? (
                        <span className="line-through text-gray-400">
                          {formatCurrency(shareData.scenario_data.transactionFeeFixed)}
                        </span>
                      ) : (
                        formatCurrency(shareData.scenario_data.transactionFeeFixed)
                      )}
                      {shareData.scenario_data.absorbTransactionFee && (
                        <div className="text-xs text-green-600 mt-1">Assorbito</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'rdvFee')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.scenario_data.rdvPercentage}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{getTranslation(shareData.language, 'upsellingFee')}</span>
                    <div className="p-3 bg-white rounded-md border">
                      {shareData.scenario_data.upsellingPercentage}%
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">{getTranslation(shareData.language, 'calculationResults')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>SaaS Fee:</span>
                        <span className="font-medium">{formatCurrency(calculation.saasFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Fee:</span>
                        <span className="font-medium">
                          {shareData.scenario_data.absorbTransactionFee ? (
                            <>
                              <span className="line-through text-gray-400 mr-2">
                                {formatCurrency(calculation.transactionFee)}
                              </span>
                              <span className="text-green-600">{formatCurrency(0)}</span>
                            </>
                          ) : (
                            formatCurrency(calculation.transactionFee)
                          )}
                        </span>
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
                        <span>{getTranslation(shareData.language, 'monthlyTotal')}:</span>
                        <span className="text-green-600">{formatCurrency(calculation.totalMensile)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Upfront discount options - shown only if it was active when link was generated */}
                      {shareData.scenario_data.showUpfrontDiscount && calculation.totalMensile > 0 && (
                        <div className="bg-rever-blue-light border border-rever-blue p-4 rounded-xl" style={{ marginTop: '-24px' }}>
                          <h4 className="font-semibold mb-3 text-gray-800">Sconto upfront:</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span>6 mesi (-10% SaaS):</span>
                              <div className="text-right">
                                <span className="line-through text-red-500 mr-2">{formatCurrency(calculation.saasFee)}</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(calculation.saasFee * 0.9)}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              Nuovo mensile: {formatCurrency(calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.9))}
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              Totale annuo: {formatCurrency((calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.9)) * 12)}
                            </div>
                            <div className="flex justify-between items-center">
                              <span>12 mesi (-15% SaaS):</span>
                              <div className="text-right">
                                <span className="line-through text-red-500 mr-2">{formatCurrency(calculation.saasFee)}</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(calculation.saasFee * 0.85)}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              Nuovo mensile: {formatCurrency(calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.85))}
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              Totale annuo: {formatCurrency((calculation.totalMensile - calculation.saasFee + (calculation.saasFee * 0.85)) * 12)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Use the new ReadOnlyPayback component */}
                  <ReadOnlyPayback
                    businessCaseData={shareData.business_case_data}
                    scenarioData={shareData.scenario_data}
                    monthlyTotal={calculation.totalMensile}
                    language={shareData.language}
                  />

                  {/* Caratteristiche Incluse Section - Redesigned */}
                  {(shareData.scenario_data.features && shareData.scenario_data.features.length > 0) || shareData.scenario_data.extraServices ? (
                    <div className="mt-6 bg-white p-4 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        ✅ Caratteristiche Incluse nel piano selezionato
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Features */}
                        {shareData.scenario_data.features && shareData.scenario_data.features.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">Caratteristiche Incluse</h4>
                            <div className="space-y-1">
                              {shareData.scenario_data.features.map((feature: string, featureIndex: number) => (
                                <div key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                                  {feature === "–" ? (
                                    <span className="text-gray-400 font-medium">–</span>
                                  ) : (
                                    <Check className="h-4 w-4 text-rever-blue flex-shrink-0" />
                                  )}
                                  <span className={feature === "–" ? "text-gray-400" : ""}>{feature}</span>
                                </div>
                              ))}
                              
                              {/* Display active extra services */}
                              {shareData.scenario_data.extraServices?.reverProtect && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
                                  <Check className="h-4 w-4 text-rever-blue flex-shrink-0" />
                                  <span>REVER Protect</span>
                                </div>
                              )}
                              {shareData.scenario_data.extraServices?.sizeSuggestions && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
                                  <Check className="h-4 w-4 text-rever-blue flex-shrink-0" />
                                  <span>Size Suggestions</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Show active extras in blue box at bottom */}
                            {shareData.scenario_data.extraServices && (shareData.scenario_data.extraServices.reverProtect || shareData.scenario_data.extraServices.sizeSuggestions) && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-xs text-gray-500 mb-2">EXTRA:</div>
                                <div className="space-y-1">
                                  {shareData.scenario_data.extraServices.reverProtect && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                      <span>REVER Protect</span>
                                    </div>
                                  )}
                                  {shareData.scenario_data.extraServices.sizeSuggestions && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                      <span>Size Suggestions</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Right Column - Extra Services */}
                        {shareData.scenario_data.extraServices && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">Extra selezionabili</h4>
                            
                            <div className="space-y-2">
                              {/* REVER Protect */}
                              <div className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">REVER Protect</div>
                                  <div className="text-xs text-gray-600">Protezione avanzata per i tuoi resi</div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  shareData.scenario_data.extraServices.reverProtect 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {shareData.scenario_data.extraServices.reverProtect ? 'Attivo' : 'Non attivo'}
                                </div>
                              </div>

                              {/* Size Suggestions */}
                              <div className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">Size Suggestions</div>
                                  <div className="text-xs text-gray-600">Suggerimenti intelligenti per le taglie</div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  shareData.scenario_data.extraServices.sizeSuggestions 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {shareData.scenario_data.extraServices.sizeSuggestions ? 'Attivo' : 'Non attivo'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* ROI Breakdown Section */}
                {fatturazioneNettaPreRever > 0 && netRevenuesEcommerce > 0 && totalPlatformCost > 0 && (
                  <div className="mt-6 bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      📊 Breakdown ROI (annuo):
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <div>• Ricavi Netti attuali (senza REVER): <span className="font-medium">{formatCurrency(fatturazioneNettaPreRever)}</span></div>
                      <div>• Ricavi Netti con REVER: <span className="font-medium">{formatCurrency(netRevenuesEcommerce)}</span></div>
                      <div>• Costi piattaforma REVER: <span className="font-medium">{formatCurrency(totalPlatformCost)}</span></div>
                      <div>• Incremento netto stimato: <span className="font-medium text-green-600">{formatCurrency(aumentoNetRevenues)}</span></div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Con questa configurazione, REVER può generare un extra fatturato netto di <span className="font-semibold text-blue-700">{formatCurrency(aumentoNetRevenues)}</span> all'anno rispetto al tuo scenario attuale.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-case" className="space-y-6">
            <BusinessCase
              clientName={shareData.name || getTranslation(shareData.language, 'ecommerceName')}
              setClientName={() => {}} // Read-only
              clientData={shareData.business_case_data}
              scenario={shareData.scenario_data}
              language={shareData.language}
              updateClientData={() => {}} // Read-only
              readOnly={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientView;

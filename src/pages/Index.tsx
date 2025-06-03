import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import BusinessCase from '@/components/BusinessCase';
import { getTranslation, translations } from '@/utils/translations';
import { Toaster } from "@/components/ui/toaster"
import { Copy, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import RevenueComparisonChart from '@/components/RevenueComparisonChart';
import RevenueSuggestionBox from '@/components/RevenueSuggestionBox';
import ClientLogoBanner from '@/components/ClientLogoBanner';
import ShareModal from '@/components/ShareModal';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface Scenario {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
}

const Index = () => {
  const [clientName, setClientName] = useState('');
  const [clientData, setClientData] = useState<ClientData>({
    resiAnnuali: 0,
    resiMensili: 0,
    carrelloMedio: 0,
    totalOrdersAnnual: 0,
    returnRatePercentage: 0,
  });
  const [selectedScenario, setSelectedScenario] = useState<string>('scenario1');
  const [customScenario, setCustomScenario] = useState<Scenario>({
    saasFee: 500,
    transactionFeeFixed: 2,
    rdvPercentage: 35,
    upsellingPercentage: 5,
  });
  const [language, setLanguage] = useState<string>('it');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const predefinedScenarios = {
    scenario1: { saasFee: 500, transactionFeeFixed: 2, rdvPercentage: 35, upsellingPercentage: 5 },
    scenario2: { saasFee: 750, transactionFeeFixed: 1.5, rdvPercentage: 40, upsellingPercentage: 7 },
    scenario3: { saasFee: 1000, transactionFeeFixed: 1, rdvPercentage: 45, upsellingPercentage: 10 },
  };

  useEffect(() => {
    setCustomScenario(predefinedScenarios[selectedScenario as keyof typeof predefinedScenarios]);
  }, [selectedScenario]);

  const updateClientData = (field: keyof ClientData, value: number) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const updateCustomScenario = (field: keyof Scenario, value: number) => {
    setCustomScenario(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setCustomScenario({
      saasFee: 500,
      transactionFeeFixed: 2,
      rdvPercentage: 35,
      upsellingPercentage: 5,
    });
  };

  const handleScenarioSelection = (scenario: string) => {
    setSelectedScenario(scenario);
    // No need to update customScenario here, useEffect will handle it
  };

  const generateShareableLink = () => {
    // Generate unique ID
    const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare data to share
    const dataToShare = {
      clientName,
      clientData,
      scenario: customScenario,
      language
    };
    
    // Save to localStorage with the unique ID
    localStorage.setItem(`share_${shareId}`, JSON.stringify(dataToShare));
    
    // Generate the full URL
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/client-view/${shareId}`;
    
    return shareUrl;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header con logo REVER */}
      <div className="text-center py-8 bg-white">
        <div className="mb-2">
          <img 
            src="/lovable-uploads/9ad908f1-cb78-48b2-b139-c37e34f01040.png" 
            alt="REVER Logo" 
            className="h-16 mx-auto"
            style={{ marginBottom: '4px' }}
          />
        </div>
        <h1 
          className="text-3xl font-semibold text-gray-800"
          style={{ marginTop: '-10px', lineHeight: '1.2' }}
        >
          {getTranslation(language, 'title')}
        </h1>
        <h2 
          className="text-xl font-medium text-gray-700"
          style={{ marginTop: '-10px', lineHeight: '1.2' }}
        >
          {getTranslation(language, 'subtitle')}
        </h2>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Client Data */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{getTranslation(language, 'clientData')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualReturns">{getTranslation(language, 'annualReturns')}</Label>
                <Input
                  id="annualReturns"
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  onChange={(e) => updateClientData('resiAnnuali', parseFloat(e.target.value) || 0)}
                  placeholder="1200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyReturns">{getTranslation(language, 'monthlyReturns')}</Label>
                <Input
                  id="monthlyReturns"
                  type="number"
                  value={clientData.resiMensili || ''}
                  onChange={(e) => updateClientData('resiMensili', parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageCart">{getTranslation(language, 'averageCart')}</Label>
                <Input
                  id="averageCart"
                  type="number"
                  step="0.01"
                  value={clientData.carrelloMedio || ''}
                  onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualGTV">{getTranslation(language, 'annualGTV')}</Label>
                <Input
                  id="annualGTV"
                  type="number"
                  value={clientData.totalOrdersAnnual || ''}
                  onChange={(e) => updateClientData('totalOrdersAnnual', parseFloat(e.target.value) || 0)}
                  placeholder="100000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenari Predefiniti */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{getTranslation(language, 'predefinedScenarios')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleScenarioSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona uno scenario" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(predefinedScenarios).map((scenario) => (
                  <SelectItem key={scenario} value={scenario}>
                    Scenario {scenario.replace('scenario', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Scenario Personalizzato */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {getTranslation(language, 'customScenario')}
              </h2>
              <Button
                onClick={() => setShareModalOpen(true)}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                {getTranslation(language, 'shareWithClient')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(language, 'saasFee')}
                </Label>
                <Input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded border text-gray-800"
                  value={customScenario.saasFee}
                  onChange={(e) => updateCustomScenario('saasFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(language, 'transactionFee')}
                </Label>
                <Input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded border text-gray-800"
                  value={customScenario.transactionFeeFixed}
                  onChange={(e) => updateCustomScenario('transactionFeeFixed', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(language, 'rdvFee')}
                </Label>
                <Input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded border text-gray-800"
                  value={customScenario.rdvPercentage}
                  onChange={(e) => updateCustomScenario('rdvPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(language, 'upsellingFee')}
                </Label>
                <Input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded border text-gray-800"
                  value={customScenario.upsellingPercentage}
                  onChange={(e) => updateCustomScenario('upsellingPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                {getTranslation(language, 'reset')}
              </Button>
            </div>
          </div>
        </div>

        {/* Business Case */}
        <BusinessCase
          clientName={clientName}
          setClientName={setClientName}
          clientData={clientData}
          scenario={customScenario}
          language={language}
          updateClientData={updateClientData}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          language={language}
          onGenerateLink={generateShareableLink}
        />
      </div>
    </div>
  );
};

export default Index;

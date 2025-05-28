import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Copy, Check } from 'lucide-react';
import { getTranslation } from '@/utils/translations';
import BusinessCase from '@/components/BusinessCase';
import ComboActions from '@/components/ComboActions';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

const Index = () => {
  const [language, setLanguage] = useState('it');
  const [clientName, setClientName] = useState('');
  const [clientData, setClientData] = useState<ClientData>({
    resiAnnuali: 1000,
    resiMensili: 0,
    carrelloMedio: 100,
    totalOrdersAnnual: 10000,
    returnRatePercentage: 23.9
  });
  const [scenario, setScenario] = useState({
    saasFee: 1000,
    transactionFeeFixed: 1,
    rdvPercentage: 30,
    upsellingPercentage: 5
  });
  const [duplicatedScenario, setDuplicatedScenario] = useState(null);
  const [activeComboId, setActiveComboId] = useState<string>('custom');

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const updateClientData = (field: keyof ClientData, value: number) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const updateScenario = (field: keyof typeof scenario, value: number) => {
    setScenario(prev => ({ ...prev, [field]: value }));
  };

  const handleDuplicate = (newScenario: any) => {
    setDuplicatedScenario(newScenario);
  };

  const updateDuplicatedScenario = (field: keyof typeof scenario, value: number) => {
    setDuplicatedScenario(prev => ({ ...prev, [field]: { ...prev, [field]: value } }));
  };

  const handleUseCombo = (scenario: any, comboId: string) => {
    setScenario(scenario);
    setActiveComboId(comboId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">REVER Business Case</h1>
          <div>
            <Button onClick={() => handleLanguageChange('it')} variant="outline" className={language === 'it' ? 'bg-gray-100' : ''}>Italiano</Button>
            <Button onClick={() => handleLanguageChange('en')} variant="outline" className={language === 'en' ? 'bg-gray-100' : ''}>English</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, 'clientData')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resiAnnuali">{getTranslation(language, 'annualReturns')}</Label>
                <Input
                  id="resiAnnuali"
                  type="number"
                  value={clientData.resiAnnuali || ''}
                  onChange={(e) => updateClientData('resiAnnuali', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resiMensili">{getTranslation(language, 'monthlyReturns')}</Label>
                <Input
                  id="resiMensili"
                  type="number"
                  value={clientData.resiMensili || ''}
                  onChange={(e) => updateClientData('resiMensili', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrelloMedio">{getTranslation(language, 'averageCartValue')}</Label>
                <Input
                  id="carrelloMedio"
                  type="number"
                  step="0.01"
                  value={clientData.carrelloMedio || ''}
                  onChange={(e) => updateClientData('carrelloMedio', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalOrdersAnnual">{getTranslation(language, 'annualOrders')}</Label>
                <Input
                  id="totalOrdersAnnual"
                  type="number"
                  value={clientData.totalOrdersAnnual || ''}
                  onChange={(e) => updateClientData('totalOrdersAnnual', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Personalizzato */}
        <Card className={`transition-all duration-300 ${
          activeComboId === 'custom' ? 'ring-2 ring-[#1790FF] shadow-lg' : ''
        }`}>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#1790FF]" />
              {getTranslation(language, 'createYourCombo')}
            </CardTitle>
            {activeComboId === 'custom' && (
              <div className="absolute top-4 right-4">
                <span className="bg-[#1790FF] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {getTranslation(language, 'comboInUse')}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saasFee">{getTranslation(language, 'saasFee')}</Label>
                <Input
                  id="saasFee"
                  type="number"
                  value={scenario.saasFee || ''}
                  onChange={(e) => updateScenario('saasFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionFeeFixed">{getTranslation(language, 'transactionFee')}</Label>
                <Input
                  id="transactionFeeFixed"
                  type="number"
                  step="0.01"
                  value={scenario.transactionFeeFixed || ''}
                  onChange={(e) => updateScenario('transactionFeeFixed', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rdvPercentage">{getTranslation(language, 'rdvPercentage')}</Label>
                <Input
                  id="rdvPercentage"
                  type="number"
                  value={scenario.rdvPercentage || ''}
                  onChange={(e) => updateScenario('rdvPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upsellingPercentage">{getTranslation(language, 'upsellingPercentage')}</Label>
                <Input
                  id="upsellingPercentage"
                  type="number"
                  value={scenario.upsellingPercentage || ''}
                  onChange={(e) => updateScenario('upsellingPercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <ComboActions
              currentScenario={scenario}
              onDuplicate={handleDuplicate}
              language={language}
            />
          </CardContent>
        </Card>

        {/* Combo duplicata */}
        {duplicatedScenario && (
          <Card className={`transition-all duration-300 ${
            activeComboId === 'duplicated' ? 'ring-2 ring-[#1790FF] shadow-lg' : ''
          }`}>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-[#1790FF]" />
                {getTranslation(language, 'duplicatedCombo')}
              </CardTitle>
              {activeComboId === 'duplicated' && (
                <div className="absolute top-4 right-4">
                  <span className="bg-[#1790FF] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {getTranslation(language, 'comboInUse')}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duplicatedSaasFee">{getTranslation(language, 'saasFee')}</Label>
                  <Input
                    id="duplicatedSaasFee"
                    type="number"
                    value={duplicatedScenario.saasFee || ''}
                    onChange={(e) => updateDuplicatedScenario('saasFee', parseFloat(e.target.value) || 0)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duplicatedTransactionFeeFixed">{getTranslation(language, 'transactionFee')}</Label>
                  <Input
                    id="duplicatedTransactionFeeFixed"
                    type="number"
                    step="0.01"
                    value={duplicatedScenario.transactionFeeFixed || ''}
                    onChange={(e) => updateDuplicatedScenario('transactionFeeFixed', parseFloat(e.target.value) || 0)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duplicatedRdvPercentage">{getTranslation(language, 'rdvPercentage')}</Label>
                  <Input
                    id="duplicatedRdvPercentage"
                    type="number"
                    value={duplicatedScenario.rdvPercentage || ''}
                    onChange={(e) => updateDuplicatedScenario('rdvPercentage', parseFloat(e.target.value) || 0)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duplicatedUpsellingPercentage">{getTranslation(language, 'upsellingPercentage')}</Label>
                  <Input
                    id="duplicatedUpsellingPercentage"
                    type="number"
                    value={duplicatedScenario.upsellingPercentage || ''}
                    onChange={(e) => updateDuplicatedScenario('upsellingPercentage', parseFloat(e.target.value) || 0)}
                    disabled
                  />
                </div>
              </div>
              
              <ComboActions
                currentScenario={duplicatedScenario}
                onDuplicate={handleDuplicate}
                onUseCombo={(combo) => handleUseCombo(combo, 'duplicated')}
                language={language}
                isDuplicated={true}
              />
            </CardContent>
          </Card>
        )}

        <BusinessCase
          clientName={clientName}
          setClientName={setClientName}
          clientData={clientData}
          scenario={scenario}
          language={language}
          updateClientData={updateClientData}
        />
      </div>
    </div>
  );
};

export default Index;

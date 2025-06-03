
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/utils/translations';
import { BusinessCase } from '@/components/BusinessCase';
import LanguageSelector from '@/components/LanguageSelector';
import ClientLogoBanner from '@/components/ClientLogoBanner';
import ComboActions from '@/components/ComboActions';
import FeeDistributionChart from '@/components/FeeDistributionChart';
import RevenueComparisonChart from '@/components/RevenueComparisonChart';
import RevenueSuggestionBox from '@/components/RevenueSuggestionBox';
import { Share2 } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

export default function Index() {
  const [totalAnnualOrders, setTotalAnnualOrders] = useState<number>(10000);
  const [averageCart, setAverageCart] = useState<number>(75);
  const [returnRate, setReturnRate] = useState<number>(10);
  const [saasFee, setSaasFee] = useState<number>(1000);
  const [transactionFee, setTransactionFee] = useState<number>(5);
  const [rdvFee, setRdvFee] = useState<number>(2);
  const [upsellingFee, setUpsellingFee] = useState<number>(5);
  const [currentLanguage, setCurrentLanguage] = useState<string>('it');
  const [savedCombos, setSavedCombos] = useState<any[]>([]);
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const storedCombos = localStorage.getItem('savedCombos');
    if (storedCombos) {
      setSavedCombos(JSON.parse(storedCombos));
    }
  }, []);

  const calculateMonthlyTotal = () => {
    const monthlyOrders = totalAnnualOrders / 12;
    const monthlyReturns = (totalAnnualOrders * returnRate / 100) / 12;
    const monthlyUpselling = (totalAnnualOrders * averageCart * upsellingFee / 100) / 12;
    const monthlyRdv = (totalAnnualOrders * averageCart * rdvFee / 100) / 12;
    const monthlyTransactionFees = transactionFee * monthlyReturns;

    return saasFee + monthlyTransactionFees + monthlyUpselling + monthlyRdv;
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
  };

  const handleSaveCombo = (comboName: string) => {
    const newCombo = {
      name: comboName,
      totalAnnualOrders,
      averageCart,
      returnRate,
      saasFee,
      transactionFee,
      rdvFee,
      upsellingFee,
      language: currentLanguage,
    };

    const updatedCombos = [...savedCombos, newCombo];
    setSavedCombos(updatedCombos);
    localStorage.setItem('savedCombos', JSON.stringify(updatedCombos));

    toast({
      title: getTranslation(currentLanguage, 'comboSaved'),
      description: `${comboName} ${getTranslation(currentLanguage, 'comboSaved')}`,
    });
  };

  const handleDuplicateCombo = (combo: any) => {
    setTotalAnnualOrders(combo.totalAnnualOrders);
    setAverageCart(combo.averageCart);
    setReturnRate(combo.returnRate);
    setSaasFee(combo.saasFee);
    setTransactionFee(combo.transactionFee);
    setRdvFee(combo.rdvFee);
    setUpsellingFee(combo.upsellingFee);
    setCurrentLanguage(combo.language);

    toast({
      title: getTranslation(currentLanguage, 'duplicatedCombo'),
      description: `${combo.name} ${getTranslation(currentLanguage, 'duplicatedCombo')}`,
    });
  };

  const handleReset = () => {
    setTotalAnnualOrders(10000);
    setAverageCart(75);
    setReturnRate(10);
    setSaasFee(1000);
    setTransactionFee(5);
    setRdvFee(2);
    setUpsellingFee(5);

    toast({
      title: getTranslation(currentLanguage, 'reset'),
      description: getTranslation(currentLanguage, 'reset'),
    });
  };

  const handleScenarioChange = (scenario: any) => {
    setReturnRate(scenario.returnRate);
    setRdvFee(scenario.rdvFee);
    setUpsellingFee(scenario.upsellingFee);

    toast({
      title: getTranslation(currentLanguage, 'scenarioApplied'),
      description: scenario.name,
    });
  };

  // Check if all required data is available for sharing
  const canShare = totalAnnualOrders > 0 && averageCart > 0 && returnRate > 0;

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const getScenarioData = () => ({
    totalAnnualOrders,
    averageCart,
    returnRate,
    annualGTV: totalAnnualOrders * averageCart,
    monthlyReturns: Math.round((totalAnnualOrders * returnRate / 100) / 12),
    annualReturns: Math.round(totalAnnualOrders * returnRate / 100)
  });

  const getBusinessCaseData = () => ({
    saasFee,
    transactionFee,
    rdvFee,
    upsellingFee,
    monthlyTotal: calculateMonthlyTotal(),
    annualACV: calculateMonthlyTotal() * 12
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{getTranslation(currentLanguage, 'title')}</h1>
            <p className="text-md text-blue-100">{getTranslation(currentLanguage, 'subtitle')}</p>
          </div>
          <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Client Data Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'clientData')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAnnualOrders">{getTranslation(currentLanguage, 'totalAnnualOrders')}</Label>
                <Input
                  type="number"
                  id="totalAnnualOrders"
                  value={totalAnnualOrders}
                  onChange={(e) => setTotalAnnualOrders(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="averageCart">{getTranslation(currentLanguage, 'averageCart')}</Label>
                <Input
                  type="number"
                  id="averageCart"
                  value={averageCart}
                  onChange={(e) => setAverageCart(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="returnRate">{getTranslation(currentLanguage, 'returnRate')}</Label>
                <Input
                  type="number"
                  id="returnRate"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Predefined Scenarios Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'predefinedScenarios')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleScenarioChange({ name: 'Scenario 1', returnRate: 5, rdvFee: 1, upsellingFee: 3 })}>
                Scenario 1: Low Return
              </Button>
              <Button variant="outline" onClick={() => handleScenarioChange({ name: 'Scenario 2', returnRate: 10, rdvFee: 2, upsellingFee: 5 })}>
                Scenario 2: Medium Return
              </Button>
              <Button variant="outline" onClick={() => handleScenarioChange({ name: 'Scenario 3', returnRate: 15, rdvFee: 3, upsellingFee: 7 })}>
                Scenario 3: High Return
              </Button>
            </CardContent>
          </Card>

          {/* Custom Scenario Section */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800">
                {getTranslation(currentLanguage, 'customScenario')}
              </CardTitle>
              {canShare && (
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Condividi con cliente
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saasFee">{getTranslation(currentLanguage, 'saasFee')}</Label>
                <Input
                  type="number"
                  id="saasFee"
                  value={saasFee}
                  onChange={(e) => setSaasFee(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="transactionFee">{getTranslation(currentLanguage, 'transactionFee')}</Label>
                <Input
                  type="number"
                  id="transactionFee"
                  value={transactionFee}
                  onChange={(e) => setTransactionFee(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="rdvFee">{getTranslation(currentLanguage, 'rdvFee')}</Label>
                <Input
                  type="number"
                  id="rdvFee"
                  value={rdvFee}
                  onChange={(e) => setRdvFee(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="upsellingFee">{getTranslation(currentLanguage, 'upsellingFee')}</Label>
                <Input
                  type="number"
                  id="upsellingFee"
                  value={upsellingFee}
                  onChange={(e) => setUpsellingFee(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Case Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'businessCase')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessCase
                language={currentLanguage}
                scenarioData={{
                  totalAnnualOrders,
                  averageCart,
                  returnRate,
                }}
                businessCaseData={{
                  saasFee,
                  transactionFee,
                  rdvFee,
                  upsellingFee,
                  monthlyTotal: calculateMonthlyTotal(),
                  annualACV: calculateMonthlyTotal() * 12
                }}
              />
            </CardContent>
          </Card>

          {/* Calculation Results Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'calculationResults')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{getTranslation(currentLanguage, 'monthlyTotal')}</Label>
                  <p className="text-2xl font-bold">€{calculateMonthlyTotal().toLocaleString()}</p>
                </div>
                <div>
                  <Label>{getTranslation(currentLanguage, 'annualACV')}</Label>
                  <p className="text-2xl font-bold">€{(calculateMonthlyTotal() * 12).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combo Actions Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'businessCaseConfig')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ComboActions
                onSaveCombo={handleSaveCombo}
                onDuplicateCombo={handleDuplicateCombo}
                onReset={handleReset}
                savedCombos={savedCombos}
                language={currentLanguage}
              />
            </CardContent>
          </Card>

          {/* Fee Distribution Chart Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Fee Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <FeeDistributionChart
                saasFee={saasFee}
                transactionFee={transactionFee}
                rdvFee={rdvFee}
                upsellingFee={upsellingFee}
                totalAnnualOrders={totalAnnualOrders}
                averageCart={averageCart}
                returnRate={returnRate}
              />
            </CardContent>
          </Card>

          {/* Revenue Comparison Chart Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">{getTranslation(currentLanguage, 'netRevenueGrowthTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueComparisonChart
                totalAnnualOrders={totalAnnualOrders}
                averageCart={averageCart}
                returnRate={returnRate}
                rdvFee={rdvFee}
                upsellingFee={upsellingFee}
              />
            </CardContent>
          </Card>

          {/* Revenue Suggestion Box Section */}
           <RevenueSuggestionBox
            totalAnnualOrders={totalAnnualOrders}
            averageCart={averageCart}
            returnRate={returnRate}
            rdvFee={rdvFee}
            upsellingFee={upsellingFee}
            language={currentLanguage}
          />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        scenarioData={getScenarioData()}
        businessCaseData={getBusinessCaseData()}
        language={currentLanguage}
      />

      {/* Client Logos Banner */}
      <ClientLogoBanner language={currentLanguage} />
    </div>
  );
}

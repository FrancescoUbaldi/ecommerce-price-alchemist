import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Copy, Check } from "lucide-react"
import { useCopyToClipboard } from '@uidotdev/usehooks';

import { supabase } from '@/integrations/supabase/client';
import { getTranslation } from '@/utils/translations';
import BusinessCase from '@/components/BusinessCase';

const Index = () => {
  const [clientName, setClientName] = useState('');
  const [clientData, setClientData] = useState({
    resiAnnuali: 4000,
    resiMensili: 0,
    carrelloMedio: 100,
    totalOrdersAnnual: 10000,
    returnRatePercentage: 23.9,
  });
  const [currentScenario, setCurrentScenario] = useState({
    name: 'Scenario 1',
    saasFee: 100,
    transactionFeeFixed: 1,
    rdvPercentage: 20,
    upsellingPercentage: 10,
  });
  const [currentLanguage, setCurrentLanguage] = useState('it');
  const [activeTab, setActiveTab] = useState('business-case');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, copy] = useCopyToClipboard();
  const [showUpfrontOptions, setShowUpfrontOptions] = useState(false);

  const updateClientData = (field: keyof typeof clientData, value: number) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const shareBusinessCase = async () => {
    if (!clientName.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci il nome dell'ecommerce prima di condividere",
        variant: "destructive",
      });
      return;
    }

    try {
      const shareData = {
        name: clientName,
        language: currentLanguage,
        scenario_data: {
          ...currentScenario,
          name: currentScenario.name
        },
        business_case_data: clientData,
        show_upfront_options: showUpfrontOptions
      };

      const { data, error } = await supabase
        .from('client_shares')
        .insert([shareData])
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/view/${data.id}`;
      setShareUrl(shareUrl);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Error sharing business case:', error);
      toast({
        title: "Errore",
        description: "Errore durante la creazione del link di condivisione",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const annualReturns = clientData.resiAnnuali > 0 ? clientData.resiAnnuali : clientData.resiMensili * 12;
  const fatturazione = clientData.totalOrdersAnnual * clientData.carrelloMedio;
  const resiValue = annualReturns * clientData.carrelloMedio;
  const fatturazioneNettaPreRever = fatturazione - resiValue;
  const rdvResi = annualReturns * 0.35;
  const rdvValue = rdvResi * clientData.carrelloMedio;
  const upsellingResi = annualReturns * 0.0378;
  const upsellingAOV = clientData.carrelloMedio * 1.3;
  const upsellingValue = upsellingResi * upsellingAOV;
  const fatturazioneNettaFinale = fatturazioneNettaPreRever + rdvValue + upsellingValue;
  const saasFeeAnnuale = currentScenario.saasFee * 12;
  const transactionFeeAnnuale = currentScenario.transactionFeeFixed * annualReturns;
  const rdvFeeAnnuale = (rdvValue * currentScenario.rdvPercentage) / 100;
  const upsellingFeeAnnuale = (upsellingValue * currentScenario.upsellingPercentage) / 100;
  const totalPlatformCost = saasFeeAnnuale + transactionFeeAnnuale + rdvFeeAnnuale + upsellingFeeAnnuale;
  const netRevenuesEcommerce = fatturazioneNettaFinale - totalPlatformCost;
  const aumentoNetRevenues = netRevenuesEcommerce - fatturazioneNettaPreRever;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-auto overflow-hidden">
              <img
                src="/lovable-uploads/f7dbf19a-18fa-4078-980a-2e6cc9c4fd45.png"
                alt="REVER Logo"
                className="h-24 w-auto object-cover object-top transform -translate-y-2"
              />
            </div>
            <p className="text-gray-600 leading-tight relative z-10">
              {getTranslation(currentLanguage, 'subtitle')}
            </p>
          </div>

          <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleziona la lingua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="personalizzato"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(currentLanguage, 'customScenario')}
            </TabsTrigger>
            <TabsTrigger
              value="business-case"
              className="relative data-[state=active]:bg-[#1790FF] data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all duration-300 cursor-pointer rounded-md font-medium"
            >
              {getTranslation(currentLanguage, 'businessCase')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalizzato" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{getTranslation(currentLanguage, 'customScenario')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saasFee">{getTranslation(currentLanguage, 'saasFee')}</Label>
                    <Input
                      id="saasFee"
                      type="number"
                      value={currentScenario.saasFee}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, saasFee: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionFeeFixed">{getTranslation(currentLanguage, 'transactionFee')}</Label>
                    <Input
                      id="transactionFeeFixed"
                      type="number"
                      value={currentScenario.transactionFeeFixed}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, transactionFeeFixed: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="rdvPercentage">{getTranslation(currentLanguage, 'rdvFee')}</Label>
                    <Input
                      id="rdvPercentage"
                      type="number"
                      value={currentScenario.rdvPercentage}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, rdvPercentage: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upsellingPercentage">{getTranslation(currentLanguage, 'upsellingFee')}</Label>
                    <Input
                      id="upsellingPercentage"
                      type="number"
                      value={currentScenario.upsellingPercentage}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, upsellingPercentage: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-case" className="space-y-6">
            <BusinessCase
              clientName={clientName}
              setClientName={setClientName}
              clientData={clientData}
              scenario={currentScenario}
              language={currentLanguage}
              updateClientData={updateClientData}
              showUpfrontOptions={showUpfrontOptions}
              setShowUpfrontOptions={setShowUpfrontOptions}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{getTranslation(currentLanguage, 'shareBusinessCase')}</DialogTitle>
              <DialogDescription>
                {getTranslation(currentLanguage, 'shareLinkMessage')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">
                  {getTranslation(currentLanguage, 'shareLink')}
                </Label>
                <Input id="link" value={shareUrl} className="col-span-3" readOnly />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => {
                copy(shareUrl);
                toast({
                  title: getTranslation(currentLanguage, 'linkCopied'),
                  description: getTranslation(currentLanguage, 'pasteAndShare'),
                });
              }}
                disabled={copied.value === shareUrl}
              >
                {copied.value === shareUrl ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {getTranslation(currentLanguage, 'copied')}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {getTranslation(currentLanguage, 'copyLink')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={shareBusinessCase}>{getTranslation(currentLanguage, 'generateShareLink')}</Button>
      </div>
    </div>
  );
};

export default Index;

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTranslation } from '@/utils/translations';

interface ShareModalProps {
  clientData: {
    resiAnnuali: number;
    resiMensili: number;
    carrelloMedio: number;
    totalOrdersAnnual: number;
    returnRatePercentage: number;
  };
  customScenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
    name: string;
  };
  language: string;
  clientName?: string;
  showUpfrontDiscount?: boolean;
  absorbTransactionFee?: boolean;
  offerExpirationDate?: Date;
  customFeatures?: string[];
  extraServices?: {
    reverProtect: boolean;
    sizeSuggestions: boolean;
  };
}

const ShareModal = ({ clientData, customScenario, language, clientName: initialClientName = '', showUpfrontDiscount = false, absorbTransactionFee = false, offerExpirationDate, customFeatures = [], extraServices = { reverProtect: false, sizeSuggestions: false } }: ShareModalProps) => {
  const [clientName, setClientName] = useState(initialClientName);
  const [isOpen, setIsOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const shareData = {
        name: clientName || null,
        language,
        scenario_data: {
          ...customScenario,
          showUpfrontDiscount,
          absorbTransactionFee,
          offerExpirationDate: offerExpirationDate?.toISOString(),
          features: customFeatures,
          extraServices
        },
        business_case_data: clientData
      };

      const { data, error } = await supabase
        .from('client_shares')
        .insert(shareData)
        .select('id')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/view/${data.id}`;
      setGeneratedLink(link);
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetModal = () => {
    setClientName(initialClientName);
    setGeneratedLink('');
    setCopied(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetModal();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#1790FF] hover:bg-[#1470CC] text-white"
          type="button"
        >
          <Share className="h-4 w-4 mr-2" />
          {getTranslation(language, 'shareWithClient')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation(language, 'shareWithClient')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!generatedLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="clientName">{getTranslation(language, 'clientName')} ({getTranslation(language, 'optional')})</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={getTranslation(language, 'enterClientName')}
                />
              </div>
              <Button 
                onClick={generateLink} 
                disabled={isGenerating}
                className="w-full bg-[#1790FF] hover:bg-[#1470CC] text-white"
              >
                {isGenerating ? getTranslation(language, 'generating') : getTranslation(language, 'generateLink')}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{getTranslation(language, 'generatedLink')}</Label>
                <div className="flex space-x-2">
                  <Input value={generatedLink} readOnly className="flex-1" />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    className="px-3"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {getTranslation(language, 'linkDescription')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface PricingData {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
  name: string;
}

interface ShareModalProps {
  clientData: ClientData;
  customScenario: PricingData;
  language: string;
  showUpfrontDiscount?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  clientData, 
  customScenario, 
  language,
  showUpfrontDiscount = false
}) => {
  const [clientName, setClientName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareableLink = () => {
    const data = {
      clientName,
      clientData,
      customScenario,
      showUpfrontDiscount
    };
    
    const encodedData = btoa(JSON.stringify(data));
    const baseUrl = window.location.origin;
    return `${baseUrl}/view/${encodedData}`;
  };

  const copyToClipboard = async () => {
    const link = generateShareableLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {getTranslation(language, 'share')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation(language, 'shareBusinessCase')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">{getTranslation(language, 'clientName')}</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={getTranslation(language, 'enterClientName')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={generateShareableLink()}
              className="flex-1"
            />
            <Button onClick={copyToClipboard} size="sm" variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {getTranslation(language, 'shareLinkDescription')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;

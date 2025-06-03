
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onGenerateLink: () => string;
}

const ShareModal = ({ isOpen, onClose, language, onGenerateLink }: ShareModalProps) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    const url = onGenerateLink();
    setShareUrl(url);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation(language, 'shareWithClient')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!shareUrl ? (
            <>
              <p className="text-sm text-gray-600">
                Vuoi generare un link condivisibile in sola lettura per il cliente?
              </p>
              <Button 
                onClick={handleGenerateLink} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generazione...' : 'Genera Link'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                {getTranslation(language, 'shareDescription')}
              </p>
              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="flex-1"
                />
                <Button onClick={handleCopy} size="sm" variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600">
                  {getTranslation(language, 'linkCopied')}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;

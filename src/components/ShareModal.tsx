
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  language: string;
}

const ShareModal = ({ isOpen, onClose, shareUrl, language }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation(language, 'shareWithClient')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;

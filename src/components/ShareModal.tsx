
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share } from 'lucide-react';
import { getTranslation } from '@/utils/translations';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientData: any;
  scenario: any;
  language: string;
}

const ShareModal = ({ isOpen, onClose, clientName, clientData, scenario, language }: ShareModalProps) => {
  const [clientEmail, setClientEmail] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerateLink = async () => {
    if (!clientName.trim()) {
      alert(getTranslation(language, 'clientNameRequired') || 'Nome cliente obbligatorio');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase
        .from('shared_business_cases')
        .insert({
          client_name: clientName,
          client_email: clientEmail || null,
          client_data: clientData,
          scenario: scenario,
          language: language
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating shared business case:', error);
        alert('Errore durante la creazione del link condivisibile');
        return;
      }

      const url = `${window.location.origin}/view/${data.id}`;
      setShareUrl(url);
      setIsGenerated(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Errore durante la creazione del link condivisibile');
    } finally {
      setIsGenerating(false);
    }
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
    setIsGenerated(false);
    setCopied(false);
    setClientEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            {getTranslation(language, 'shareWithClient')}
          </DialogTitle>
        </DialogHeader>
        
        {!isGenerated ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Genera un link condivisibile in sola lettura per il cliente
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email cliente (opzionale)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <Button 
              onClick={handleGenerateLink} 
              disabled={isGenerating || !clientName.trim()}
              className="w-full"
            >
              {isGenerating ? 'Generazione...' : 'Genera Link Condivisibile'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-green-600 font-medium">
              ✅ Link generato con successo!
            </p>
            
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm"
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
                ✅ Link copiato negli appunti
              </p>
            )}
            
            <p className="text-xs text-gray-500">
              Il link rimane attivo permanentemente e può essere condiviso con il cliente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;

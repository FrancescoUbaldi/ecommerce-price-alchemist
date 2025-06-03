
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData: any;
  businessCaseData: any;
  language: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  scenarioData,
  businessCaseData,
  language
}) => {
  const [clientName, setClientName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('client_shares')
        .insert({
          name: clientName || null,
          language,
          scenario_data: scenarioData,
          business_case_data: businessCaseData
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/view/${data.id}`;
      setGeneratedLink(shareUrl);
      
      toast({
        title: "Link generato!",
        description: "Il link condivisibile è stato creato con successo.",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Errore",
        description: "Impossibile generare il link condivisibile.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copiato!",
        description: "Link copiato negli appunti.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il link.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setClientName('');
    setGeneratedLink('');
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Condividi con cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="clientName">Nome cliente (opzionale)</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Inserisci il nome del cliente"
            />
          </div>
          
          {!generatedLink ? (
            <Button 
              onClick={generateLink} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generazione...' : 'Genera link condivisibile'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Label>Link condivisibile generato:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

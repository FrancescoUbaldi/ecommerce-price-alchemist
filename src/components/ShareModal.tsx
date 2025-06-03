
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  clientData: any;
  customScenario: any;
  clientName: string;
  language: string;
}

const ShareModal = ({ clientData, customScenario, clientName, language }: ShareModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareLink = () => {
    // Generate a unique ID for the shared view
    const id = crypto.randomUUID();
    
    // Store the data in localStorage with the ID
    const shareData = {
      clientData,
      customScenario,
      clientName,
      language,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`share-${id}`, JSON.stringify(shareData));
    setShareId(id);
    
    toast({
      title: "✅ Link generato",
      description: "Il link di condivisione è stato creato con successo",
    });
  };

  const copyToClipboard = async () => {
    if (!shareId) return;
    
    const shareUrl = `${window.location.origin}/client-view?id=${shareId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "📋 Link copiato",
        description: "Il link è stato copiato negli appunti",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareUrl = shareId ? `${window.location.origin}/client-view?id=${shareId}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-[#1790FF] hover:bg-[#1470CC] text-white flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Condividi con cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Condividi Business Case
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Genera un link in sola lettura da condividere con il cliente. 
            Il link mostrerà solo lo scenario personalizzato e il business case.
          </div>
          
          {!shareId ? (
            <Button 
              onClick={generateShareLink}
              className="w-full bg-[#1790FF] hover:bg-[#1470CC] text-white"
            >
              🔗 Genera link di condivisione
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link di condivisione:</label>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiato!' : 'Copia'}
                  </Button>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm text-green-700">
                  ✅ <strong>Link generato con successo!</strong>
                  <br />
                  Il cliente potrà visualizzare solo lo scenario personalizzato e il business case.
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  setShareId(null);
                  setCopied(false);
                }}
                variant="outline"
                className="w-full"
              >
                🔄 Genera nuovo link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Save, Check, Play } from 'lucide-react';
import { getTranslation } from '@/utils/translations';

interface PricingData {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
  name: string;
}

interface ComboActionsProps {
  currentScenario: PricingData;
  onDuplicate: (scenario: PricingData) => void;
  onUseCombo?: (scenario: PricingData) => void;
  language: string;
  isDuplicated?: boolean;
}

const ComboActions = ({ 
  currentScenario, 
  onDuplicate, 
  onUseCombo,
  language, 
  isDuplicated = false 
}: ComboActionsProps) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleDuplicate = () => {
    const duplicatedScenario = {
      ...currentScenario,
      name: getTranslation(language, 'duplicatedCombo')
    };
    onDuplicate(duplicatedScenario);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleUseCombo = () => {
    if (onUseCombo) {
      onUseCombo(currentScenario);
    }
  };

  return (
    <div className="flex gap-3 mt-4 flex-wrap">
      {!isDuplicated && (
        <Button
          onClick={handleDuplicate}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <Copy className="h-4 w-4" />
          {getTranslation(language, 'duplicateCombo')}
        </Button>
      )}
      
      <Button
        onClick={handleSave}
        variant="outline"
        className={`flex items-center gap-2 transition-colors ${
          isSaved 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'hover:bg-gray-50'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="h-4 w-4" />
            {getTranslation(language, 'comboSaved')}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {getTranslation(language, 'saveCombo')}
          </>
        )}
      </Button>

      {isDuplicated && onUseCombo && (
        <Button
          onClick={handleUseCombo}
          className="flex items-center gap-2 bg-[#1790FF] hover:bg-[#1470CC] text-white"
        >
          <Play className="h-4 w-4" />
          {getTranslation(language, 'useThisCombo')}
        </Button>
      )}
    </div>
  );
};

export default ComboActions;

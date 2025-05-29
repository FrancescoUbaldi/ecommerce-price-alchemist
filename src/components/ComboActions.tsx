
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
  onDuplicate?: (scenario: PricingData) => void;
  onUse?: (scenario: PricingData) => void;
  onDelete?: () => void;
  language: string;
  showDuplicate?: boolean;
  showDelete?: boolean;
  showUse?: boolean;
  duplicateCount?: number;
}

const ComboActions = ({ 
  currentScenario, 
  onDuplicate, 
  onUse, 
  onDelete, 
  language, 
  showDuplicate = true,
  showDelete = false,
  showUse = false,
  duplicateCount = 0
}: ComboActionsProps) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleDuplicate = () => {
    if (onDuplicate) {
      const duplicatedScenario = {
        ...currentScenario,
        name: getTranslation(language, 'duplicatedCombo')
      };
      onDuplicate(duplicatedScenario);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleUse = () => {
    if (onUse) {
      onUse(currentScenario);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="flex gap-3 mt-4 flex-wrap">
      {showDuplicate && (
        <Button
          onClick={handleDuplicate}
          disabled={duplicateCount >= 3}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          {getTranslation(language, 'duplicateCombo')}
          {duplicateCount >= 3 && ' (Max 3)'}
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

      {showUse && (
        <Button
          onClick={handleUse}
          variant="outline"
          className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Play className="h-4 w-4" />
          Usa questa Combo
        </Button>
      )}

      {showDelete && (
        <Button
          onClick={handleDelete}
          variant="outline"
          className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          <span className="text-lg">🗑️</span>
          Elimina Combo
        </Button>
      )}
    </div>
  );
};

export default ComboActions;

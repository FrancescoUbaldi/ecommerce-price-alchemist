import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins } from 'lucide-react';
import { CURRENCY_OPTIONS } from '@/utils/translations';

interface CurrencySelectorProps {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencySelector = ({ currency, setCurrency }: CurrencySelectorProps) => (
  <div className="flex items-center gap-2">
    <Coins className="h-4 w-4 text-gray-600" />
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_OPTIONS.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} ({c.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default CurrencySelector;


import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getTranslation } from '@/utils/translations';
import { BusinessCase } from '@/components/BusinessCase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ClientView() {
  const { id } = useParams<{ id: string }>();
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      if (!id) {
        setError('ID non valido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_shares')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setShareData(data);
      } catch (error) {
        console.error('Error fetching share data:', error);
        setError('Impossibile caricare i dati condivisi');
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div>Caricamento...</div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Errore</h1>
          <p className="text-gray-600">{error || 'Dati non trovati'}</p>
        </div>
      </div>
    );
  }

  const language = shareData.language || 'it';
  const { scenario_data, business_case_data } = shareData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {getTranslation(language, 'title')}
          </h1>
          <p className="text-lg text-gray-600">
            {getTranslation(language, 'subtitle')}
          </p>
          {shareData.name && (
            <p className="text-lg text-blue-600 font-semibold mt-2">
              Cliente: {shareData.name}
            </p>
          )}
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Scenario Data */}
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, 'customScenario')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {getTranslation(language, 'totalAnnualOrders')}
                  </label>
                  <p className="text-lg font-semibold">{scenario_data.totalAnnualOrders?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {getTranslation(language, 'averageCart')}
                  </label>
                  <p className="text-lg font-semibold">€{scenario_data.averageCart?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {getTranslation(language, 'returnRate')}
                  </label>
                  <p className="text-lg font-semibold">{scenario_data.returnRate || '-'}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {getTranslation(language, 'annualGTV')}
                  </label>
                  <p className="text-lg font-semibold">€{scenario_data.annualGTV?.toLocaleString() || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Business Case */}
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, 'businessCase')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessCase 
                scenarioData={scenario_data}
                businessCaseData={business_case_data}
                language={language}
                isReadOnly={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BusinessCase from '@/components/BusinessCase';
import { getTranslation } from '@/utils/translations';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface Scenario {
  saasFee: number;
  transactionFeeFixed: number;
  rdvPercentage: number;
  upsellingPercentage: number;
}

interface SharedData {
  id: string;
  client_name: string;
  client_email: string | null;
  client_data: ClientData;
  scenario: Scenario;
  language: string;
  created_at: string;
}

const ClientView = () => {
  const { id } = useParams<{ id: string }>();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!id) {
        setError('ID del link non valido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shared_business_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching shared data:', error);
          setError('Link non trovato o scaduto');
          return;
        }

        // Type assertion to ensure proper typing
        const typedData: SharedData = {
          id: data.id,
          client_name: data.client_name,
          client_email: data.client_email,
          client_data: data.client_data as ClientData,
          scenario: data.scenario as Scenario,
          language: data.language,
          created_at: data.created_at
        };

        setSharedData(typedData);
      } catch (error) {
        console.error('Error:', error);
        setError('Errore durante il caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link non valido</h1>
          <p className="text-gray-600">{error || 'Il link condiviso non è più valido o è scaduto.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header con logo REVER */}
      <div className="text-center py-8 bg-white">
        <div className="mb-2">
          <img 
            src="/lovable-uploads/9ad908f1-cb78-48b2-b139-c37e34f01040.png" 
            alt="REVER Logo" 
            className="h-16 mx-auto"
            style={{ marginBottom: '4px' }}
          />
        </div>
        <h1 
          className="text-xl font-medium text-gray-700"
          style={{ marginTop: '-10px', lineHeight: '1.2' }}
        >
          {getTranslation(sharedData.language, 'subtitle')}
        </h1>
      </div>

      {/* Contenuto principale */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Sezione Scenario Personalizzato - Solo visualizzazione */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {getTranslation(sharedData.language, 'customScenario')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(sharedData.language, 'saasFee')}
                </label>
                <div className="p-3 bg-gray-50 rounded border text-gray-800">
                  €{sharedData.scenario.saasFee}/mese
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(sharedData.language, 'transactionFee')}
                </label>
                <div className="p-3 bg-gray-50 rounded border text-gray-800">
                  €{sharedData.scenario.transactionFeeFixed}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(sharedData.language, 'rdvFee')}
                </label>
                <div className="p-3 bg-gray-50 rounded border text-gray-800">
                  {sharedData.scenario.rdvPercentage}%
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getTranslation(sharedData.language, 'upsellingFee')}
                </label>
                <div className="p-3 bg-gray-50 rounded border text-gray-800">
                  {sharedData.scenario.upsellingPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Case completo */}
        <BusinessCase
          clientName={sharedData.client_name}
          setClientName={() => {}} // Non funzionale in modalità read-only
          clientData={sharedData.client_data}
          scenario={sharedData.scenario}
          language={sharedData.language}
          updateClientData={() => {}} // Non funzionale in modalità read-only
          isReadOnly={true}
        />
      </div>
    </div>
  );
};

export default ClientView;

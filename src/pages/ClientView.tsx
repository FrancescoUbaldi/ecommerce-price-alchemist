
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCase from '@/components/BusinessCase';
import { getTranslation } from '@/utils/translations';

interface ClientData {
  resiAnnuali: number;
  resiMensili: number;
  carrelloMedio: number;
  totalOrdersAnnual: number;
  returnRatePercentage: number;
}

interface SharedData {
  clientName: string;
  clientData: ClientData;
  scenario: {
    saasFee: number;
    transactionFeeFixed: number;
    rdvPercentage: number;
    upsellingPercentage: number;
  };
  language: string;
}

const ClientView = () => {
  const { id } = useParams<{ id: string }>();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Recupera i dati dal localStorage
      const storedData = localStorage.getItem(`share_${id}`);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setSharedData(data);
        } catch (error) {
          console.error('Error parsing shared data:', error);
        }
      }
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link non valido</h1>
          <p className="text-gray-600">Il link condiviso non è più valido o è scaduto.</p>
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
          clientName={sharedData.clientName}
          setClientName={() => {}} // Non funzionale in modalità read-only
          clientData={sharedData.clientData}
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

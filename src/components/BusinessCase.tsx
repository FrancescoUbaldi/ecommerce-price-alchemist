import React from 'react';
import { getTranslation } from '@/utils/translations';

interface BusinessCaseProps {
  scenarioData: any;
  businessCaseData?: any;
  language: string;
  isReadOnly?: boolean;
}

export const BusinessCase: React.FC<BusinessCaseProps> = ({ 
  scenarioData, 
  businessCaseData, 
  language,
  isReadOnly = false 
}) => {
  const {
    totalAnnualOrders,
    averageCart,
    returnRate,
  } = scenarioData;

  const {
    saasFee,
    transactionFee,
    rdvFee,
    upsellingFee,
  } = businessCaseData || {};

  const retainedSalesRate = 0.35;

  const calculateMonthlyTotal = () => {
    const saas = saasFee || 0;
    const transaction = transactionFee || 0;
    const rdv = rdvFee || 0;
    const upselling = upsellingFee || 0;

    return saas + transaction + rdv + upselling;
  };

  const annualGTV = totalAnnualOrders * averageCart;
  const annualReturns = totalAnnualOrders * returnRate / 100;
  const retainedSales = annualReturns * averageCart * retainedSalesRate;
  const upsellingRevenue = annualGTV * (upsellingFee / 100 || 0);
  const preReverNetBilling = annualGTV - (annualReturns * averageCart);
  const finalNetBilling = preReverNetBilling + retainedSales + upsellingRevenue;
  const netBillingGeneratedByRever = retainedSales + upsellingRevenue;
  const reverPlatformCost = calculateMonthlyTotal() * 12;
  const netRevenues = finalNetBilling - preReverNetBilling;
  const reverROI = (netBillingGeneratedByRever - reverPlatformCost) / reverPlatformCost;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders and AOV */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'orders')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'totalAnnualOrders')}</span>
            <span className="text-xl font-bold text-gray-800">{totalAnnualOrders?.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'aov')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'averageCart')}</span>
            <span className="text-xl font-bold text-gray-800">€{averageCart?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Return Rate */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'returnRate2')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'returnRate')}</span>
            <span className="text-xl font-bold text-gray-800">{returnRate}%</span>
          </div>
        </div>

        {/* RDV Rate */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'rdvRate')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'rdvFee')}</span>
            <span className="text-xl font-bold text-gray-800">{rdvFee || 0}%</span>
          </div>
        </div>

        {/* Upselling Rate */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'upsellingRate')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'upsellingFee')}</span>
            <span className="text-xl font-bold text-gray-800">{upsellingFee || 0}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Pre REVER */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'preReverBilling')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'annualGTV')}</span>
            <span className="text-xl font-bold text-gray-800">€{annualGTV?.toLocaleString()}</span>
          </div>
        </div>

        {/* Returns Pre REVER */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'preReverReturns')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'annualReturns')}</span>
            <span className="text-xl font-bold text-gray-800">{annualReturns?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Net Revenue Pre REVER */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'preReverNetBilling')}</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{getTranslation(language, 'netRevenuePreRever')}</span>
          <span className="text-xl font-bold text-gray-800">€{preReverNetBilling?.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retained Sales with REVER */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'retainedSalesWithRever')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'retainedSalesWithRever')}</span>
            <span className="text-xl font-bold text-green-500">+€{retainedSales?.toLocaleString()}</span>
          </div>
        </div>

        {/* Upselling with REVER */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'upsellingWithRever')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'upsellingWithRever')}</span>
            <span className="text-xl font-bold text-green-500">+€{upsellingRevenue?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Final Net Revenue */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'finalNetBilling')}</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{getTranslation(language, 'netRevenueWithRever')}</span>
          <span className="text-xl font-bold text-green-500">€{finalNetBilling?.toLocaleString()}</span>
        </div>
      </div>

      {/* Net Revenue Generated by REVER */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'netBillingGeneratedByRever')}</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{getTranslation(language, 'netBillingGeneratedByRever')}</span>
          <span className="text-xl font-bold text-green-500">+€{netBillingGeneratedByRever?.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* REVER Platform Cost */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'reverPlatformCost')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'saasFee')}</span>
            <span className="text-xl font-bold text-red-500">-€{reverPlatformCost?.toLocaleString()}</span>
          </div>
        </div>

        {/* REVER ROI */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'reverROI')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">ROI</span>
            <span className="text-xl font-bold text-green-500">{(reverROI * 100)?.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Net Revenues */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{getTranslation(language, 'netRevenues')}</h3>
        <div className="flex items-center justify-between">
            <span className="text-gray-600">{getTranslation(language, 'netRevenueUplift')}</span>
            <span className="text-xl font-bold text-green-500">+€{netRevenues?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

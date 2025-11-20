'use client'

import { useState } from 'react'

export default function TestLabelGenerator() {
  const [labelData, setLabelData] = useState({
    brandName: 'OLD TOM DISTILLERY',
    productType: 'Kentucky Straight Bourbon Whiskey',
    alcoholContent: '45% Alc./Vol. (90 Proof)',
    netContents: '750 mL',
    includeWarning: true
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setLabelData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ttb-blue mb-2">
            Test Label Generator
          </h1>
          <p className="text-gray-600">
            Generate sample labels for testing the verification system
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Label Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label-text" htmlFor="brandName">
                  Brand Name
                </label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  value={labelData.brandName}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label-text" htmlFor="productType">
                  Product Type
                </label>
                <input
                  type="text"
                  id="productType"
                  name="productType"
                  value={labelData.productType}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label-text" htmlFor="alcoholContent">
                  Alcohol Content
                </label>
                <input
                  type="text"
                  id="alcoholContent"
                  name="alcoholContent"
                  value={labelData.alcoholContent}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label-text" htmlFor="netContents">
                  Net Contents
                </label>
                <input
                  type="text"
                  id="netContents"
                  name="netContents"
                  value={labelData.netContents}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeWarning"
                  name="includeWarning"
                  checked={labelData.includeWarning}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="includeWarning" className="text-sm text-gray-700">
                  Include Government Warning
                </label>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Generated Label Preview</h2>
            
            <div className="border-4 border-gray-800 bg-gradient-to-b from-amber-50 to-amber-100 p-6 rounded-lg">
              <div className="text-center space-y-3">
                <div className="border-b-2 border-gray-600 pb-2">
                  <h3 className="text-2xl font-bold text-gray-800 font-serif">
                    {labelData.brandName}
                  </h3>
                </div>
                
                <div className="py-4">
                  <p className="text-lg font-semibold text-gray-700">
                    {labelData.productType}
                  </p>
                </div>
                
                <div className="border-t border-b border-gray-400 py-2">
                  <p className="text-base font-medium">
                    {labelData.alcoholContent}
                  </p>
                </div>
                
                <div className="py-2">
                  <p className="text-lg font-bold">
                    {labelData.netContents}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t-2 border-gray-600">
                  <p className="text-xs text-gray-600">
                    BOTTLED BY OLD TOM DISTILLERY
                  </p>
                  <p className="text-xs text-gray-600">
                    LAWRENCEBURG, KY 40342
                  </p>
                </div>
                
                {labelData.includeWarning && (
                  <div className="mt-4 p-2 bg-white border border-black text-left">
                    <p className="text-xs font-bold">
                      GOVERNMENT WARNING:
                    </p>
                    <p className="text-xs">
                      (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.
                    </p>
                    <p className="text-xs">
                      (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                💡 Tip: Take a screenshot of this label to test the verification system
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="btn-primary inline-block">
            Back to Verification System
          </a>
        </div>
      </div>
    </main>
  )
}

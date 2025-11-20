'use client'

interface ManualCorrectionPanelProps {
  extractedText: string
  onSave: (correctedText: string) => void
  onCancel: () => void
}

export default function ManualCorrectionPanel({
  extractedText,
  onSave,
  onCancel
}: ManualCorrectionPanelProps) {
  const [text, setText] = useState(extractedText)
  const [showInstructions, setShowInstructions] = useState(true)
  
  const handleSave = () => {
    onSave(text)
  }
  
  return (
    <div className="card border-2 border-ttb-blue">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Manual OCR Correction
        </h3>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-sm text-ttb-blue hover:underline"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>
      
      {showInstructions && (
        <div className="bg-blue-50 border-l-4 border-ttb-blue p-4 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Help improve accuracy:</strong> Edit the extracted text below to match what you see on the label.
            Make sure to include:
          </p>
          <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
            <li>Brand name (e.g., BAREFOOT)</li>
            <li>Product type (e.g., Pinot Grigio)</li>
            <li>Alcohol content (e.g., 12.5% or ALC. 12.5% BY VOL)</li>
            <li>Net contents (e.g., 750 mL)</li>
            <li>Government warning text if visible</li>
          </ul>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="label-text">
            Extracted Text (Edit as needed)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-ttb-blue focus:border-transparent"
            placeholder="Edit the text to match what you see on the label..."
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="btn-primary flex-1"
          >
            Save Corrections & Re-verify
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ImageModal from '@/components/ImageModal'
import ManualCorrectionPanel from '@/components/ManualCorrectionPanel'

interface FormData {
  brandName: string
  productType: string
  productCategory: 'spirits' | 'wine' | 'beer' | ''
  alcoholContent: string
  netContents: string
}

interface VerificationResult {
  success: boolean
  matches: {
    brandName: boolean
    productType: boolean
    alcoholContent: boolean
    netContents: boolean
    governmentWarning?: boolean  // Made optional
  }
  details: {
    brandName: string
    productType: string
    alcoholContent: string
    netContents: string
    governmentWarning?: string  // Made optional
  }
  confidence?: {
    brandName: number
    productType: number
    overall: number
  }
  extractedText?: string
  ocrConfidence?: number
  processingNote?: string
  error?: string
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    brandName: '',
    productType: '',
    productCategory: '',
    alcoholContent: '',
    netContents: ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [manualCorrection, setManualCorrection] = useState(false)
  const [correctedText, setCorrectedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backFileInputRef = useRef<HTMLInputElement>(null)
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBackImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBackImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const openImageModal = (imageSrc: string) => {
    setModalImage(imageSrc)
    setShowImageModal(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile) {
      alert('Please upload at least a front label image')
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('frontImage', imageFile)
      if (backImageFile) {
        formDataToSend.append('backImage', backImageFile)
      }
      formDataToSend.append('brandName', formData.brandName)
      formDataToSend.append('productType', formData.productType)
      formDataToSend.append('productCategory', formData.productCategory)
      formDataToSend.append('alcoholContent', formData.alcoholContent)
      formDataToSend.append('netContents', formData.netContents)
      
      const response = await fetch('/api/verify-demo', {
        method: 'POST',
        body: formDataToSend
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        matches: {
          brandName: false,
          productType: false,
          alcoholContent: false,
          netContents: false,
          governmentWarning: false
        },
        details: {
          brandName: 'Error processing',
          productType: 'Error processing',
          alcoholContent: 'Error processing',
          netContents: 'Error processing',
          governmentWarning: 'Error processing'
        },
        error: 'Failed to process the image. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      brandName: '',
      productType: '',
      productCategory: '',
      alcoholContent: '',
      netContents: ''
    })
    setImageFile(null)
    setBackImageFile(null)
    setImagePreview(null)
    setBackImagePreview(null)
    setResult(null)
    setManualCorrection(false)
    setCorrectedText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (backFileInputRef.current) {
      backFileInputRef.current.value = ''
    }
  }
  
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-ttb-blue mb-2">
            TTB Label Verification System
          </h1>
          <p className="text-gray-600">
            AI-powered alcohol label compliance verification
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Product Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="productCategory">
                  Product Category *
                </label>
                <select
                  id="productCategory"
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, productCategory: e.target.value as any }))}
                  className="input-field"
                  required
                >
                  <option value="">Select category...</option>
                  <option value="spirits">Distilled Spirits</option>
                  <option value="wine">Wine</option>
                  <option value="beer">Beer</option>
                </select>
              </div>
              
              <div>
                <label className="label-text" htmlFor="brandName">
                  Brand Name *
                </label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Old Tom Distillery"
                  required
                />
              </div>
              
              <div>
                <label className="label-text" htmlFor="productType">
                  Product Class/Type *
                </label>
                <input
                  type="text"
                  id="productType"
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Kentucky Straight Bourbon Whiskey"
                  required
                />
              </div>
              
              <div>
                <label className="label-text" htmlFor="alcoholContent">
                  Alcohol Content (ABV %) *
                </label>
                <input
                  type="text"
                  id="alcoholContent"
                  name="alcoholContent"
                  value={formData.alcoholContent}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 45% or 45"
                  required
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
                  value={formData.netContents}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 750 mL or 12 fl oz"
                />
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !imageFile}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Verifying...' : 'Verify Label'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
          
          {/* Image Upload Section */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Label Images
            </h2>
            
            <div className="space-y-6">
              {/* Front Label */}
              <div>
                <label className="label-text" htmlFor="image">
                  Front Label (Required) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ttb-blue file:text-white hover:file:bg-blue-800"
                />
                
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Front Label Preview:</p>
                    <div 
                      className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-zoom-in hover:border-ttb-blue transition-colors"
                      onClick={() => openImageModal(imagePreview)}
                    >
                      <img
                        src={imagePreview}
                        alt="Front label preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Click to zoom
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Back Label */}
              <div>
                <label className="label-text" htmlFor="backImage">
                  Back Label (Optional - for government warning)
                </label>
                <input
                  ref={backFileInputRef}
                  type="file"
                  id="backImage"
                  accept="image/*"
                  onChange={handleBackImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-500 file:text-white hover:file:bg-gray-600"
                />
                
                {backImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Back Label Preview:</p>
                    <div 
                      className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-zoom-in hover:border-ttb-blue transition-colors"
                      onClick={() => openImageModal(backImagePreview)}
                    >
                      <img
                        src={backImagePreview}
                        alt="Back label preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Click to zoom
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {!imagePreview && !backImagePreview && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Upload images of the alcohol label
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Front label is required, back label helps with government warning verification
                  </p>
                </div>
              )}
              
              {/* OCR Tips */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  📸 Tips for best results:
                </p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Use good lighting and avoid shadows</li>
                  <li>• Capture labels flat if possible (avoid curved bottles)</li>
                  <li>• Ensure text is clearly visible and in focus</li>
                  <li>• Include both front and back labels for complete verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        {result && (
          <div className="mt-8 card">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Verification Results
            </h2>
            
            <div className={`p-4 rounded-lg mb-6 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {result.success ? (
                  <>
                    <svg className="w-6 h-6 text-success-green mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-success-green">
                      ✓ The label matches the form data. Core requirements verified.
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-error-red mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold text-error-red">
                      ✗ The label does not match the form.
                    </span>
                  </>
                )}
              </div>
              
              {result.error && (
                <p className="mt-2 text-sm text-gray-600">
                  ⚠ {result.error}
                </p>
              )}
            </div>
            
            {/* OCR Confidence and Processing Info */}
            {(result.ocrConfidence !== undefined || result.processingNote) && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                {result.ocrConfidence !== undefined && (
                  <p className="text-sm text-blue-800">
                    <strong>OCR Confidence:</strong> {result.ocrConfidence}%
                  </p>
                )}
                {result.processingNote && (
                  <p className="text-sm text-blue-700 mt-1">
                    {result.processingNote}
                  </p>
                )}
                {result.ocrConfidence !== undefined && result.ocrConfidence < 70 && (
                  <button
                    onClick={() => setManualCorrection(true)}
                    className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Manually Correct OCR Text
                  </button>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 mb-3">Field Verification:</h3>
              
              <div className="space-y-2">
                <VerificationItem
                  label="Brand Name"
                  matches={result.matches.brandName}
                  detail={result.details.brandName}
                  confidence={result.confidence?.brandName}
                />
                <VerificationItem
                  label="Product Type"
                  matches={result.matches.productType}
                  detail={result.details.productType}
                  confidence={result.confidence?.productType}
                />
                <VerificationItem
                  label="Alcohol Content"
                  matches={result.matches.alcoholContent}
                  detail={result.details.alcoholContent}
                />
                {result.details.netContents && result.details.netContents !== 'Net contents not specified' && (
                  <VerificationItem
                    label="Net Contents"
                    matches={result.matches.netContents}
                    detail={result.details.netContents}
                  />
                )}
                {result.details.governmentWarning && (
                  <VerificationItem
                    label="Government Warning"
                    matches={result.matches.governmentWarning || false}
                    detail={result.details.governmentWarning}
                  />
                )}
              </div>
            </div>
            
            {result.extractedText && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View extracted text from label
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {result.extractedText}
                </pre>
              </details>
            )}
          </div>
        )}
        
        {/* Manual Correction Panel */}
        {manualCorrection && result && (
          <div className="mt-8">
            <ManualCorrectionPanel
              extractedText={result.extractedText || ''}
              onSave={(correctedText) => {
                setCorrectedText(correctedText)
                setManualCorrection(false)
                // Re-run verification with corrected text
                // In a real app, you'd call the API with the corrected text
              }}
              onCancel={() => setManualCorrection(false)}
            />
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        imageSrc={modalImage}
        onClose={() => {
          setShowImageModal(false)
          setModalImage(null)
        }}
      />
    </main>
  )
}

function VerificationItem({ 
  label, 
  matches, 
  detail, 
  confidence 
}: { 
  label: string
  matches: boolean
  detail: string
  confidence?: number 
}) {
  return (
    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center flex-1">
        <span className="font-medium text-gray-700 min-w-[150px]">{label}:</span>
        <span className="text-sm text-gray-600 ml-3">{detail}</span>
      </div>
      <div className="flex items-center gap-3">
        {confidence !== undefined && (
          <span className={`text-xs px-2 py-1 rounded ${
            confidence >= 80 ? 'bg-green-100 text-green-800' : 
            confidence >= 50 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {confidence}% confidence
          </span>
        )}
        <span className={matches ? 'success-badge' : 'error-badge'}>
          {matches ? 'Matched' : 'Not Matched'}
        </span>
      </div>
    </div>
  )
}

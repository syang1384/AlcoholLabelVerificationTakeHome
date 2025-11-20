import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { createWorker } from 'tesseract.js'
import { 
  preprocessImage, 
  calculateConfidence, 
  detectBottleLabel,
  extractLabelRegion 
} from '@/utils/imageProcessing'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const frontImage = formData.get('frontImage') as File
    const backImage = formData.get('backImage') as File | null
    const brandName = formData.get('brandName') as string
    const productType = formData.get('productType') as string
    const productCategory = formData.get('productCategory') as string
    const alcoholContent = formData.get('alcoholContent') as string
    const netContents = formData.get('netContents') as string
    
    if (!frontImage) {
      return NextResponse.json(
        { error: 'No front image provided' },
        { status: 400 }
      )
    }
    
    // Process front image
    const frontBytes = await frontImage.arrayBuffer()
    const frontBuffer = Buffer.from(frontBytes)
    
    // Process back image if provided
    let backBuffer: Buffer | null = null
    if (backImage) {
      const backBytes = await backImage.arrayBuffer()
      backBuffer = Buffer.from(backBytes)
    }
    
    // Process front image with OCR
    const frontText = await processImageWithOCR(frontBuffer, 'front')
    
    // Process back image if provided
    let backText = ''
    if (backBuffer) {
      backText = await processImageWithOCR(backBuffer, 'back')
    }
    
    // Combine texts from both images
    const combinedText = `${frontText} ${backText}`.trim()
    
    // Verify with combined text
    const result = verifyLabel(combinedText, {
      brandName,
      productType,
      productCategory,
      alcoholContent,
      netContents
    })
    
    return NextResponse.json({
      ...result,
      extractedText: combinedText.substring(0, 1500),
      frontText: frontText.substring(0, 750),
      backText: backText.substring(0, 750),
      processingNote: backImage 
        ? 'Processed both front and back labels'
        : 'Processed front label only'
    })
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Separate function for OCR processing
async function processImageWithOCR(buffer: Buffer, label: string): Promise<string> {
  const tempPath = join(tmpdir(), `label-${label}-${Date.now()}.png`)
  
  try {
    await writeFile(tempPath, buffer)
    
    // Detect if this is a bottle and extract label region
    const bottleInfo = await detectBottleLabel(buffer)
    let processBuffer = buffer
    
    if (bottleInfo.isBottle && bottleInfo.labelRegion) {
      console.log(`Detected wine bottle on ${label} label, extracting label region`)
      processBuffer = await extractLabelRegion(buffer, bottleInfo.labelRegion)
    }
    
    // Preprocess image with multiple techniques
    console.log(`Preprocessing ${label} image for better OCR...`)
    const processedImages = await preprocessImage(processBuffer, {
      enhance: true,
      grayscale: true,
      contrast: 1.5,
      brightness: 1.0,
      threshold: 128
    })
    
    // Try OCR on each processed version
    const worker = await createWorker('eng')
    let bestText = ''
    let bestConfidence = 0
    
    for (let i = 0; i < processedImages.length; i++) {
      const processedPath = join(tmpdir(), `label-${label}-processed-${Date.now()}-${i}.png`)
      await writeFile(processedPath, processedImages[i])
      
      try {
        const { data: { text, confidence } } = await worker.recognize(processedPath)
        
        // Keep track of the best result
        if (text.length > bestText.length || confidence > bestConfidence) {
          bestText = text
          bestConfidence = confidence
        }
        
        await unlink(processedPath)
      } catch (err) {
        console.error(`OCR attempt ${i} on ${label} failed:`, err)
      }
    }
    
    await worker.terminate()
    await unlink(tempPath)
    
    return bestText
    
  } catch (error) {
    console.error(`Error processing ${label} image:`, error)
    try {
      await unlink(tempPath)
    } catch {}
    return ''
  }
}

function verifyLabel(
  extractedText: string,
  formData: {
    brandName: string
    productType: string
    productCategory: string
    alcoholContent: string
    netContents: string
  }
) {
  // Normalize text for comparison (case-insensitive, remove extra spaces)
  const normalizedText = extractedText.toLowerCase().replace(/\s+/g, ' ')
  
  // Calculate string similarity using Levenshtein distance
  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }
  
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  // Enhanced fuzzy matching with similarity threshold
  const containsMatch = (text: string, searchTerm: string, threshold = 0.8): boolean => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    if (!normalizedSearch) return false
    
    // Exact match
    if (text.includes(normalizedSearch)) return true
    
    // Word-by-word similarity check
    const words = normalizedSearch.split(/\s+/)
    const textWords = text.split(/\s+/)
    
    for (const searchWord of words) {
      let found = false
      for (const textWord of textWords) {
        if (calculateSimilarity(searchWord, textWord) >= threshold) {
          found = true
          break
        }
      }
      if (!found) return false
    }
    
    return true
  }
  
  // Check brand name with fuzzy matching
  const brandNameMatch = containsMatch(normalizedText, formData.brandName, 0.85)
  const brandNameConfidence = calculateConfidence(formData.brandName, extractedText, brandNameMatch)
  const brandNameDetail = brandNameMatch
    ? `Found "${formData.brandName}" on label (Confidence: ${brandNameConfidence}%)`
    : `Brand name "${formData.brandName}" not found on label (Confidence: ${brandNameConfidence}%)`
  
  // Check product type with fuzzy matching
  const productTypeMatch = containsMatch(normalizedText, formData.productType, 0.75)
  const productTypeConfidence = calculateConfidence(formData.productType, extractedText, productTypeMatch)
  const productTypeDetail = productTypeMatch
    ? `Found "${formData.productType}" on label (Confidence: ${productTypeConfidence}%)`
    : `Product type "${formData.productType}" not found on label (Confidence: ${productTypeConfidence}%)`
  
  // Enhanced alcohol content checking
  const alcoholContentNormalized = formData.alcoholContent.replace(/[^0-9.]/g, '')
  
  // Debug logging
  console.log('Looking for alcohol content:', alcoholContentNormalized)
  console.log('In text:', extractedText.substring(0, 200))
  
  // More flexible patterns
  const alcoholPatterns = [
    new RegExp(`\\b${alcoholContentNormalized}\\b`, 'i'), // Just the number alone
    new RegExp(`${alcoholContentNormalized}\\s*%`, 'i'),
    new RegExp(`${alcoholContentNormalized}%`, 'i'),
    new RegExp(`alc\\.?\\s*${alcoholContentNormalized}`, 'i'),
    new RegExp(`${alcoholContentNormalized}\\s*alc`, 'i'),
    new RegExp(`\\b${alcoholContentNormalized}\\s*proof\\b`, 'i'),
    new RegExp(`${parseFloat(alcoholContentNormalized) * 2}\\s*proof`, 'i') // Handle proof conversion
  ]
  
  // Check both normalized and original text
  const alcoholContentMatch = alcoholPatterns.some(pattern => 
    pattern.test(extractedText) || pattern.test(normalizedText)
  )
  const alcoholContentDetail = alcoholContentMatch
    ? `Found alcohol content ${formData.alcoholContent} on label`
    : `Alcohol content ${formData.alcoholContent} not found on label`
  
  // Check net contents with enhanced pattern matching
  let netContentsMatch = true
  let netContentsDetail = 'Net contents not specified'
  
  if (formData.netContents && formData.netContents.trim()) {
    const netContentsNormalized = formData.netContents
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace('ml', '')
      .replace('fl.oz', '')
      .replace('floz', '')
      .replace('oz', '')
      .replace('l', '')
    
    const volumePatterns = [
      new RegExp(`${netContentsNormalized}\\s*ml`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*milliliters?`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*fl`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*oz`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*ounces?`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*liters?`, 'i'),
      new RegExp(`${netContentsNormalized}\\s*l\\b`, 'i')
    ]
    
    netContentsMatch = volumePatterns.some(pattern => 
      pattern.test(extractedText.replace(/\s+/g, ''))
    )
    netContentsDetail = netContentsMatch
      ? `Found net contents "${formData.netContents}" on label`
      : `Net contents "${formData.netContents}" not found on label`
  }
  
  // Enhanced government warning check with exact wording verification
  const fullWarningText = [
    "according to the surgeon general",
    "women should not drink alcoholic beverages during pregnancy",
    "birth defects",
    "consumption of alcoholic beverages impairs your ability to drive",
    "operate machinery",
    "may cause health problems"
  ]
  
  const warningKeywords = ['government warning', 'surgeon general', 'warning:']
  const governmentWarningMatch = warningKeywords.some(keyword => 
    normalizedText.includes(keyword)
  )
  
  // Check for complete warning text
  const hasCompleteWarning = governmentWarningMatch && 
    fullWarningText.filter(phrase => normalizedText.includes(phrase)).length >= 3
  
  const governmentWarningDetail = hasCompleteWarning
    ? 'Complete government warning statement found on label'
    : governmentWarningMatch
    ? 'Partial government warning found (missing required text)'
    : 'Government warning statement not found on label'
  
  // Category-specific checks
  let additionalChecks: any = {}
  
  if (formData.productCategory === 'wine') {
    // Wine-specific: Check for sulfite declaration
    const hasSulfites = normalizedText.includes('sulfite') || normalizedText.includes('sulphite')
    additionalChecks.sulfiteDeclaration = hasSulfites
    additionalChecks.sulfiteDetail = hasSulfites
      ? 'Sulfite declaration found'
      : 'Sulfite declaration missing (required for wine)'
  }
  
  if (formData.productCategory === 'beer') {
    // Beer might list ingredients
    const hasIngredients = normalizedText.includes('ingredients') || 
                          normalizedText.includes('water') || 
                          normalizedText.includes('hops') ||
                          normalizedText.includes('barley')
    additionalChecks.ingredients = hasIngredients
    additionalChecks.ingredientsDetail = hasIngredients
      ? 'Ingredient information found'
      : 'No ingredient information found'
  }
  
  // Determine overall success (government warning is optional, sulfites are optional)
  const success = brandNameMatch && 
                  productTypeMatch && 
                  alcoholContentMatch
  
  return {
    success,
    matches: {
      brandName: brandNameMatch,
      productType: productTypeMatch,
      alcoholContent: alcoholContentMatch,
      netContents: netContentsMatch,
      ...(governmentWarningMatch && { governmentWarning: hasCompleteWarning || governmentWarningMatch }),
      ...additionalChecks
    },
    details: {
      brandName: brandNameDetail,
      productType: productTypeDetail,
      alcoholContent: alcoholContentDetail,
      netContents: netContentsDetail,
      ...(governmentWarningMatch && { governmentWarning: governmentWarningDetail }),
      ...(additionalChecks.sulfiteDetail ? { sulfite: additionalChecks.sulfiteDetail } : {}),
      ...(additionalChecks.ingredientsDetail ? { ingredients: additionalChecks.ingredientsDetail } : {})
    },
    confidence: {
      brandName: brandNameConfidence,
      productType: productTypeConfidence,
      overall: Math.round((brandNameConfidence + productTypeConfidence) / 2)
    }
  }
}

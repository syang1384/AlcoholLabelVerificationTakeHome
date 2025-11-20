import sharp from 'sharp'

export interface ProcessingOptions {
  enhance: boolean
  grayscale: boolean
  contrast: number
  brightness: number
  threshold?: number
}

/**
 * Preprocess image for better OCR results
 * Handles curved text, low contrast, and stylized fonts
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: ProcessingOptions = {
    enhance: true,
    grayscale: true,
    contrast: 1.5,
    brightness: 1.0
  }
): Promise<Buffer[]> {
  const processedImages: Buffer[] = []
  
  try {
    // Original image
    processedImages.push(imageBuffer)
    
    // Version 1: Basic enhancement
    const enhanced = await sharp(imageBuffer)
      .grayscale()
      .normalize() // Enhance contrast
      .sharpen() // Sharpen text edges
      .toBuffer()
    processedImages.push(enhanced)
    
    // Version 2: High contrast
    const highContrast = await sharp(imageBuffer)
      .grayscale()
      .linear(options.contrast, -(128 * (options.contrast - 1))) // Increase contrast
      .sharpen({ sigma: 2 })
      .toBuffer()
    processedImages.push(highContrast)
    
    // Version 3: Threshold (black and white)
    if (options.threshold) {
      const thresholded = await sharp(imageBuffer)
        .grayscale()
        .threshold(options.threshold)
        .toBuffer()
      processedImages.push(thresholded)
    }
    
    // Version 4: Edge detection for curved text
    const edgeEnhanced = await sharp(imageBuffer)
      .grayscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
      })
      .normalize()
      .toBuffer()
    processedImages.push(edgeEnhanced)
    
    // Version 5: Inverted (for light text on dark background)
    const inverted = await sharp(imageBuffer)
      .grayscale()
      .negate()
      .normalize()
      .toBuffer()
    processedImages.push(inverted)
    
  } catch (error) {
    console.error('Error preprocessing image:', error)
    // Return at least the original if processing fails
    return [imageBuffer]
  }
  
  return processedImages
}

/**
 * Calculate confidence score based on OCR results
 */
export function calculateConfidence(
  expectedText: string,
  extractedText: string,
  matchFound: boolean
): number {
  if (!expectedText || !extractedText) return 0
  
  const normalizedExpected = expectedText.toLowerCase().trim()
  const normalizedExtracted = extractedText.toLowerCase()
  
  if (matchFound) {
    // High confidence if exact match found
    if (normalizedExtracted.includes(normalizedExpected)) {
      return 95
    }
    // Medium-high confidence if all words found
    const words = normalizedExpected.split(/\s+/)
    const foundWords = words.filter(word => normalizedExtracted.includes(word))
    return Math.round((foundWords.length / words.length) * 85)
  } else {
    // Check for partial matches
    const words = normalizedExpected.split(/\s+/)
    const foundWords = words.filter(word => normalizedExtracted.includes(word))
    if (foundWords.length > 0) {
      return Math.round((foundWords.length / words.length) * 50)
    }
    return 5 // Very low confidence if nothing found
  }
}

/**
 * Detect if image might be a wine bottle (curved surface)
 */
export async function detectBottleLabel(imageBuffer: Buffer): Promise<{
  isBottle: boolean
  labelRegion?: { left: number; top: number; width: number; height: number }
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    
    // Simple heuristic: bottles are usually taller than wide
    const aspectRatio = (metadata.height || 1) / (metadata.width || 1)
    const isBottle = aspectRatio > 1.5
    
    // For a real implementation, we'd use ML to detect the label region
    // For now, assume label is in the middle third of the image
    if (isBottle && metadata.width && metadata.height) {
      return {
        isBottle: true,
        labelRegion: {
          left: Math.round(metadata.width * 0.2),
          top: Math.round(metadata.height * 0.3),
          width: Math.round(metadata.width * 0.6),
          height: Math.round(metadata.height * 0.4)
        }
      }
    }
    
    return { isBottle: false }
  } catch {
    return { isBottle: false }
  }
}

/**
 * Extract and enhance just the label region
 */
export async function extractLabelRegion(
  imageBuffer: Buffer,
  region: { left: number; top: number; width: number; height: number }
): Promise<Buffer> {
  try {
    const extracted = await sharp(imageBuffer)
      .extract(region)
      .resize(region.width * 2, region.height * 2) // Upscale for better OCR
      .sharpen()
      .toBuffer()
    return extracted
  } catch {
    return imageBuffer // Return original if extraction fails
  }
}

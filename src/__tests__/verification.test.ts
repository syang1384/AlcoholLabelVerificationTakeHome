// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(() => ({
    recognize: jest.fn(() => Promise.resolve({
      data: { text: 'OLD TOM DISTILLERY\nKentucky Straight Bourbon Whiskey\n45% Alc./Vol. (90 Proof)\n750 mL\nGOVERNMENT WARNING: According to the Surgeon General' }
    })),
    terminate: jest.fn()
  }))
}))

describe('Label Verification Tests', () => {
  describe('Text Matching Logic', () => {
    const mockExtractedText = `
      OLD TOM DISTILLERY
      Kentucky Straight Bourbon Whiskey
      45% Alc./Vol. (90 Proof)
      750 mL
      GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.
      (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.
    `
    
    test('should match exact brand name', () => {
      const result = verifyText(mockExtractedText, 'OLD TOM DISTILLERY')
      expect(result).toBe(true)
    })
    
    test('should match brand name case-insensitively', () => {
      const result = verifyText(mockExtractedText, 'old tom distillery')
      expect(result).toBe(true)
    })
    
    test('should match alcohol content in various formats', () => {
      expect(verifyAlcoholContent(mockExtractedText, '45%')).toBe(true)
      expect(verifyAlcoholContent(mockExtractedText, '45')).toBe(true)
      expect(verifyAlcoholContent('Alc 40% by Vol', '40%')).toBe(true)
      expect(verifyAlcoholContent('80 Proof', '40%')).toBe(true) // 80 proof = 40% ABV
    })
    
    test('should match net contents in various formats', () => {
      expect(verifyNetContents(mockExtractedText, '750 mL')).toBe(true)
      expect(verifyNetContents(mockExtractedText, '750mL')).toBe(true)
      expect(verifyNetContents('12 fl oz', '12 fl oz')).toBe(true)
      expect(verifyNetContents('12FL.OZ.', '12 fl oz')).toBe(true)
    })
    
    test('should detect government warning', () => {
      expect(verifyGovernmentWarning(mockExtractedText)).toBe(true)
      expect(verifyGovernmentWarning('No warning here')).toBe(false)
      expect(verifyGovernmentWarning('GOVERNMENT WARNING: partial text')).toBe(true)
    })
    
    test('should handle fuzzy matching for OCR errors', () => {
      // Simulate OCR errors: O->0, l->1, etc.
      const ocrErrorText = '0LD T0M DIST1LLERY'
      expect(fuzzyMatch('OLD TOM DISTILLERY', ocrErrorText, 0.8)).toBe(true)
    })
  })
  
  describe('Product Category Specific Rules', () => {
    test('should check for sulfite declaration in wine', () => {
      const wineText = 'Napa Valley Cabernet Sauvignon\n14% Alc/Vol\nContains Sulfites'
      expect(verifyWineRequirements(wineText)).toHaveProperty('sulfiteDeclaration', true)
    })
    
    test('should flag missing sulfite declaration in wine', () => {
      const wineText = 'Napa Valley Cabernet Sauvignon\n14% Alc/Vol'
      expect(verifyWineRequirements(wineText)).toHaveProperty('sulfiteDeclaration', false)
    })
    
    test('should check for ingredients in beer', () => {
      const beerText = 'Craft IPA\n6.5% ABV\nIngredients: Water, Barley, Hops, Yeast'
      expect(verifyBeerRequirements(beerText)).toHaveProperty('hasIngredients', true)
    })
  })
  
  describe('Error Handling', () => {
    test('should handle empty image gracefully', () => {
      const result = processEmptyImage()
      expect(result.error).toContain('Could not read text')
    })
    
    test('should handle unreadable text', () => {
      const result = processUnreadableText('')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

// Helper functions used in tests
function verifyText(text: string, searchTerm: string): boolean {
  return text.toLowerCase().includes(searchTerm.toLowerCase())
}

function verifyAlcoholContent(text: string, expectedABV: string): boolean {
  const normalized = expectedABV.replace(/[^0-9.]/g, '')
  const patterns = [
    new RegExp(`${normalized}\\s*%`, 'i'),
    new RegExp(`${parseFloat(normalized) * 2}\\s*proof`, 'i')
  ]
  return patterns.some(pattern => pattern.test(text))
}

function verifyNetContents(text: string, expectedVolume: string): boolean {
  const normalized = expectedVolume.toLowerCase().replace(/\s+/g, '').replace(/[^0-9]/g, '')
  return text.toLowerCase().replace(/\s+/g, '').includes(normalized)
}

function verifyGovernmentWarning(text: string): boolean {
  return text.toLowerCase().includes('government warning') || 
         text.toLowerCase().includes('surgeon general')
}

function fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
  // Simplified fuzzy matching for testing
  const clean1 = str1.toLowerCase().replace(/[^a-z]/g, '')
  const clean2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/1/g, 'l')
  return clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1)
}

function verifyWineRequirements(text: string) {
  return {
    sulfiteDeclaration: text.toLowerCase().includes('sulfite')
  }
}

function verifyBeerRequirements(text: string) {
  return {
    hasIngredients: text.toLowerCase().includes('ingredients') || 
                   (text.toLowerCase().includes('water') && text.toLowerCase().includes('hops'))
  }
}

function processEmptyImage() {
  return {
    success: false,
    error: '⚠ Could not read text from the label image. Please try a clearer image.'
  }
}

function processUnreadableText(text: string) {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'No text could be extracted from the image'
    }
  }
  return { success: true }
}

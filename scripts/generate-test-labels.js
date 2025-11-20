#!/usr/bin/env node

/**
 * Generate Test Label Images
 * This script creates sample label images for testing the verification system
 */

const fs = require('fs')
const path = require('path')
const { createCanvas } = require('canvas')

// Install canvas with: npm install canvas

function generateLabel(options = {}) {
  const {
    brandName = 'OLD TOM DISTILLERY',
    productType = 'Kentucky Straight Bourbon Whiskey',
    alcoholContent = '45% Alc./Vol. (90 Proof)',
    netContents = '750 mL',
    includeWarning = true,
    filename = 'test-label.png'
  } = options
  
  // Create canvas
  const width = 600
  const height = 800
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#f5e6d3')
  gradient.addColorStop(1, '#e8d4b0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Border
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 5
  ctx.strokeRect(10, 10, width - 20, height - 20)
  
  // Brand Name
  ctx.fillStyle = '#2c1810'
  ctx.font = 'bold 48px serif'
  ctx.textAlign = 'center'
  ctx.fillText(brandName, width / 2, 100)
  
  // Decorative line
  ctx.beginPath()
  ctx.moveTo(50, 130)
  ctx.lineTo(width - 50, 130)
  ctx.stroke()
  
  // Product Type
  ctx.font = '32px serif'
  ctx.fillText(productType, width / 2, 200)
  
  // Another decorative line
  ctx.beginPath()
  ctx.moveTo(100, 240)
  ctx.lineTo(width - 100, 240)
  ctx.stroke()
  
  // Alcohol Content
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(alcoholContent, width / 2, 350)
  
  // Net Contents
  ctx.font = 'bold 36px sans-serif'
  ctx.fillText(netContents, width / 2, 420)
  
  // Bottler info
  ctx.font = '16px sans-serif'
  ctx.fillText('BOTTLED BY OLD TOM DISTILLERY', width / 2, 520)
  ctx.fillText('LAWRENCEBURG, KY 40342', width / 2, 545)
  
  // Government Warning
  if (includeWarning) {
    // Warning box
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(30, 600, width - 60, 180)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(30, 600, width - 60, 180)
    
    // Warning text
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('GOVERNMENT WARNING:', 40, 620)
    
    ctx.font = '12px sans-serif'
    const warningText = [
      '(1) According to the Surgeon General, women should',
      'not drink alcoholic beverages during pregnancy',
      'because of the risk of birth defects.',
      '(2) Consumption of alcoholic beverages impairs your',
      'ability to drive a car or operate machinery, and',
      'may cause health problems.'
    ]
    
    warningText.forEach((line, index) => {
      ctx.fillText(line, 40, 640 + (index * 20))
    })
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png')
  const outputPath = path.join(__dirname, 'test-images', filename)
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(outputPath, buffer)
  console.log(`Generated: ${outputPath}`)
}

// Generate various test labels
console.log('Generating test label images...')

// Perfect match label
generateLabel({
  filename: 'perfect-match.png'
})

// Mismatched brand
generateLabel({
  brandName: 'DIFFERENT BRAND',
  filename: 'wrong-brand.png'
})

// Missing warning
generateLabel({
  includeWarning: false,
  filename: 'no-warning.png'
})

// Wine label
generateLabel({
  brandName: 'NAPA VALLEY WINERY',
  productType: 'Cabernet Sauvignon',
  alcoholContent: '14.5% Alc. by Vol.',
  netContents: '750 mL - Contains Sulfites',
  filename: 'wine-label.png'
})

// Beer label
generateLabel({
  brandName: 'CRAFT BREWERY CO.',
  productType: 'India Pale Ale',
  alcoholContent: '6.8% ABV',
  netContents: '12 FL OZ (355 mL)',
  filename: 'beer-label.png'
})

console.log('Test label generation complete!')
console.log('Use these images to test the verification system.')

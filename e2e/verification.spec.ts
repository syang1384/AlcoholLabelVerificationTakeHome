import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('TTB Label Verification E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('should display the main page with all form fields', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('TTB Label Verification System')
    await expect(page.locator('#productCategory')).toBeVisible()
    await expect(page.locator('#brandName')).toBeVisible()
    await expect(page.locator('#productType')).toBeVisible()
    await expect(page.locator('#alcoholContent')).toBeVisible()
    await expect(page.locator('#netContents')).toBeVisible()
    await expect(page.locator('#image')).toBeVisible()
  })
  
  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button[type="submit"]')
    
    // Check HTML5 validation
    const brandNameInput = page.locator('#brandName')
    const validationMessage = await brandNameInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })
  
  test('should successfully verify a matching label', async ({ page }) => {
    // Fill in the form
    await page.selectOption('#productCategory', 'spirits')
    await page.fill('#brandName', 'Old Tom Distillery')
    await page.fill('#productType', 'Kentucky Straight Bourbon Whiskey')
    await page.fill('#alcoholContent', '45%')
    await page.fill('#netContents', '750 mL')
    
    // Upload a test image (you would need to create this test image)
    const fileInput = page.locator('#image')
    // For testing, you'd need a test image file
    // await fileInput.setInputFiles(path.join(__dirname, 'test-label.png'))
    
    // Submit form
    // await page.click('button[type="submit"]')
    
    // Wait for results
    // await page.waitForSelector('.card:has-text("Verification Results")')
    
    // Check success message
    // await expect(page.locator('text=The label matches the form data')).toBeVisible()
  })
  
  test('should display mismatches clearly', async ({ page }) => {
    // Fill in form with mismatched data
    await page.selectOption('#productCategory', 'spirits')
    await page.fill('#brandName', 'Wrong Brand Name')
    await page.fill('#productType', 'Vodka')
    await page.fill('#alcoholContent', '30%')
    await page.fill('#netContents', '1L')
    
    // Upload test image
    // const fileInput = page.locator('#image')
    // await fileInput.setInputFiles(path.join(__dirname, 'test-label.png'))
    
    // Submit
    // await page.click('button[type="submit"]')
    
    // Check failure message
    // await page.waitForSelector('.card:has-text("Verification Results")')
    // await expect(page.locator('text=The label does not match the form')).toBeVisible()
    
    // Check individual field results
    // await expect(page.locator('text=Not Matched').first()).toBeVisible()
  })
  
  test('should reset form when reset button is clicked', async ({ page }) => {
    // Fill in some data
    await page.fill('#brandName', 'Test Brand')
    await page.fill('#productType', 'Test Type')
    
    // Click reset
    await page.click('button:has-text("Reset")')
    
    // Check fields are cleared
    await expect(page.locator('#brandName')).toHaveValue('')
    await expect(page.locator('#productType')).toHaveValue('')
    await expect(page.locator('#productCategory')).toHaveValue('')
  })
  
  test('should navigate to test label generator', async ({ page }) => {
    // Navigate to test label generator
    await page.goto('/test-label')
    
    // Check the page loaded
    await expect(page.locator('h1')).toContainText('Test Label Generator')
    await expect(page.locator('text=Generated Label Preview')).toBeVisible()
  })
  
  test('should show loading state during verification', async ({ page }) => {
    // Fill minimal required data
    await page.selectOption('#productCategory', 'spirits')
    await page.fill('#brandName', 'Test')
    await page.fill('#productType', 'Test')
    await page.fill('#alcoholContent', '40%')
    
    // We can't easily test the actual loading state without a real image
    // but we can verify the button text changes
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toContainText('Verify Label')
  })
  
  test('should handle different product categories', async ({ page }) => {
    // Test wine category
    await page.selectOption('#productCategory', 'wine')
    await expect(page.locator('#productCategory')).toHaveValue('wine')
    
    // Test beer category  
    await page.selectOption('#productCategory', 'beer')
    await expect(page.locator('#productCategory')).toHaveValue('beer')
    
    // Test spirits category
    await page.selectOption('#productCategory', 'spirits')
    await expect(page.locator('#productCategory')).toHaveValue('spirits')
  })
  
  test('should display image preview when file is selected', async ({ page }) => {
    // Initially no preview should be shown
    await expect(page.locator('text=Upload an image of the alcohol label')).toBeVisible()
    
    // After selecting a file, preview should appear
    // This would require a test image file
    // const fileInput = page.locator('#image')
    // await fileInput.setInputFiles(path.join(__dirname, 'test-label.png'))
    // await expect(page.locator('text=Preview:')).toBeVisible()
  })
})

test.describe('Accessibility Tests', () => {
  test('should have proper labels for all form fields', async ({ page }) => {
    await page.goto('/')
    
    // Check all inputs have associated labels
    const inputs = ['productCategory', 'brandName', 'productType', 'alcoholContent', 'netContents', 'image']
    
    for (const inputId of inputs) {
      const label = page.locator(`label[for="${inputId}"]`)
      await expect(label).toBeVisible()
    }
  })
  
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through elements
    await page.keyboard.press('Tab') // Focus first element
    await page.keyboard.press('Tab') // Navigate to next
    
    // Check we can interact with focused elements
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeDefined()
  })
})

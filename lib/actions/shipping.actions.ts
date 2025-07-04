'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema for shipping rates
const shippingRateSchema = z.object({
  countryCode: z.string().min(2, 'Country code must be at least 2 characters').max(10, 'Country code too long'),
  countryName: z.string().min(2, 'Country name must be at least 2 characters'),
  rate: z.number().min(0, 'Rate must be positive'),
  freeShippingThreshold: z.number().min(0, 'Free shipping threshold must be positive'),
  isActive: z.boolean().default(true)
})

// Get all shipping rates (for admin)
export async function getShippingRates() {
  try {
    const rates = await db.shippingRate.findMany({
      orderBy: [
        { countryCode: 'asc' }
      ]
    })
    
    return rates
  } catch (error) {
    console.error('Error fetching shipping rates:', error)
    throw new Error('Failed to fetch shipping rates')
  }
}

// Get active shipping rates (for frontend)
export async function getActiveShippingRates() {
  try {
    const rates = await db.shippingRate.findMany({
      where: { isActive: true },
      orderBy: [
        { countryCode: 'asc' }
      ]
    })
    
    return rates
  } catch (error) {
    console.error('Error fetching active shipping rates:', error)
    throw new Error('Failed to fetch active shipping rates')
  }
}

// Get shipping rate by country code
export async function getShippingRateByCountry(countryCode: string) {
  try {
    const rate = await db.shippingRate.findFirst({
      where: { 
        countryCode: countryCode.toUpperCase(),
        isActive: true 
      }
    })
    
    // If no specific rate found, get fallback rate
    if (!rate) {
      const fallbackRate = await db.shippingRate.findFirst({
        where: { 
          countryCode: 'FALLBACK',
          isActive: true 
        }
      })
      return fallbackRate
    }
    
    return rate
  } catch (error) {
    console.error('Error fetching shipping rate by country:', error)
    return null
  }
}

// Create shipping rate
export async function createShippingRate(data: z.infer<typeof shippingRateSchema>) {
  try {
    const validatedData = shippingRateSchema.parse(data)
    
    // Check if country code already exists
    const existingRate = await db.shippingRate.findUnique({
      where: { countryCode: validatedData.countryCode.toUpperCase() }
    })
    
    if (existingRate) {
      return { success: false, error: 'Shipping rate for this country already exists' }
    }
    
    const shippingRate = await db.shippingRate.create({
      data: {
        ...validatedData,
        countryCode: validatedData.countryCode.toUpperCase()
      }
    })
    
    revalidatePath('/admin/shipping-rates')
    
    return { success: true, data: shippingRate }
  } catch (error) {
    console.error('Error creating shipping rate:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { success: false, error: 'Failed to create shipping rate' }
  }
}

// Update shipping rate
export async function updateShippingRate(id: string, data: z.infer<typeof shippingRateSchema>) {
  try {
    const validatedData = shippingRateSchema.parse(data)
    
    // Check if country code already exists for another record
    const existingRate = await db.shippingRate.findFirst({
      where: { 
        countryCode: validatedData.countryCode.toUpperCase(),
        id: { not: id }
      }
    })
    
    if (existingRate) {
      return { success: false, error: 'Shipping rate for this country already exists' }
    }
    
    const shippingRate = await db.shippingRate.update({
      where: { id },
      data: {
        ...validatedData,
        countryCode: validatedData.countryCode.toUpperCase()
      }
    })
    
    revalidatePath('/admin/shipping-rates')
    revalidatePath('/shipping') // Revalidate shipping page for GLOBAL market
    
    return { success: true, data: shippingRate }
  } catch (error) {
    console.error('Error updating shipping rate:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { success: false, error: 'Failed to update shipping rate' }
  }
}

// Delete shipping rate
export async function deleteShippingRate(id: string) {
  try {
    await db.shippingRate.delete({
      where: { id }
    })
    
    revalidatePath('/admin/shipping-rates')
    revalidatePath('/shipping') // Revalidate shipping page for GLOBAL market
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting shipping rate:', error)
    return { success: false, error: 'Failed to delete shipping rate' }
  }
}

// Get shipping rate by ID
export async function getShippingRateById(id: string) {
  try {
    const rate = await db.shippingRate.findUnique({
      where: { id }
    })
    
    return rate
  } catch (error) {
    console.error('Error fetching shipping rate by ID:', error)
    return null
  }
}

// Calculate shipping cost for a country and order total
export async function calculateShippingCost(countryCode: string, orderTotal: number) {
  try {
    const rate = await getShippingRateByCountry(countryCode)
    
    if (!rate) {
      // Return fallback rate if no rate found
      return {
        rate: 2500, // $25.00 fallback
        freeShippingThreshold: 40000, // $400.00
        qualifiesForFreeShipping: orderTotal >= 40000,
        finalCost: orderTotal >= 40000 ? 0 : 2500
      }
    }
    
    const qualifiesForFreeShipping = orderTotal >= rate.freeShippingThreshold
    const finalCost = qualifiesForFreeShipping ? 0 : rate.rate
    
    return {
      rate: rate.rate,
      freeShippingThreshold: rate.freeShippingThreshold,
      qualifiesForFreeShipping,
      finalCost
    }
  } catch (error) {
    console.error('Error calculating shipping cost:', error)
    
    // Return fallback values on error
    return {
      rate: 2500,
      freeShippingThreshold: 40000,
      qualifiesForFreeShipping: orderTotal >= 40000,
      finalCost: orderTotal >= 40000 ? 0 : 2500
    }
  }
} 
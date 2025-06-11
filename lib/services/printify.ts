import { FulfillmentStatus } from '@prisma/client';

// Printify API Types
export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyVariant {
  id: number;
  title: string;
  options: {
    color?: string;
    size?: string;
    [key: string]: any;
  };
  placeholders: Array<{
    position: string;
    height: number;
    width: number;
  }>;
}

export interface PrintifyProductData {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
  }>;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: any[];
  variants: PrintifyVariant[];
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: any[];
  print_details: any[];
  sales_channel_properties: any[];
}

export interface PrintifyOrderData {
  external_id?: string;
  line_items: Array<{
    product_id: string;
    quantity: number;
    variant_id: number;
    print_areas?: any;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string;
    region?: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
  address_to?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string;
    region?: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

export interface PrintifyOrder {
  id: string;
  external_id?: string;
  status: string;
  line_items: Array<{
    product_id: string;
    quantity: number;
    variant_id: number;
    print_areas?: any;
    status: string;
    metadata: {
      title: string;
      price: string;
      variant_label: string;
      sku: string;
      country: string;
    };
    cost: number;
    shipping_cost: number;
  }>;
  address_to: any;
  shipments: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at?: string;
  }>;
  created_at: string;
  updated_at: string;
  total_price: number;
  total_shipping: number;
  total_tax: number;
}

export interface PrintifyOrderStatus {
  status: 'draft' | 'pending' | 'in_production' | 'shipped' | 'canceled';
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
}

export interface FulfillmentResult {
  success: boolean;
  error?: string;
  printifyOrderId?: string;
  failedItems?: any[];
  localStockReduced?: boolean;
}

// Rate limiting utility
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 600; // 600 requests per minute
  private readonly windowMs = 60 * 1000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }
}

export class PrintifyClient {
  private baseUrl = 'https://api.printify.com/v1';
  private accessToken: string;
  private shopId: number;
  private rateLimiter = new RateLimiter();

  constructor(accessToken: string, shopId: number) {
    this.accessToken = accessToken;
    this.shopId = shopId;
  }

  // Core API methods
  async getCatalog(): Promise<PrintifyBlueprint[]> {
    const response = await this.makeRequest<PrintifyBlueprint[]>('/catalog/blueprints.json');
    return Array.isArray(response) ? response : [];
  }

  async getBlueprint(blueprintId: number): Promise<PrintifyBlueprint> {
    return this.makeRequest<PrintifyBlueprint>(`/catalog/blueprints/${blueprintId}.json`);
  }

  async getBlueprintPrintProviders(blueprintId: number): Promise<Array<{ id: number; title: string }>> {
    const response = await this.makeRequest<Array<{ id: number; title: string }>>(
      `/catalog/blueprints/${blueprintId}/print_providers.json`
    );
    return Array.isArray(response) ? response : [];
  }

  async getBlueprintVariants(blueprintId: number, printProviderId: number): Promise<PrintifyVariant[]> {
    const response = await this.makeRequest<{ data: PrintifyVariant[] }>(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
    );
    return response.data || [];
  }

  async createProduct(productData: PrintifyProductData): Promise<PrintifyProduct> {
    return this.makeRequest<PrintifyProduct>(`/shops/${this.shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    return this.makeRequest<PrintifyProduct>(`/shops/${this.shopId}/products/${productId}.json`);
  }

  async updateProduct(productId: string, productData: Partial<PrintifyProductData>): Promise<PrintifyProduct> {
    return this.makeRequest<PrintifyProduct>(`/shops/${this.shopId}/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async publishProduct(productId: string, publishData: any): Promise<void> {
    await this.makeRequest(`/shops/${this.shopId}/products/${productId}/publish.json`, {
      method: 'POST',
      body: JSON.stringify(publishData),
    });
  }

  async submitOrder(orderData: PrintifyOrderData): Promise<PrintifyOrder> {
    console.log('🔄 Printify submitOrder: Starting order submission');
    console.log('📦 Order data:', {
      external_id: orderData.external_id,
      line_items_count: orderData.line_items.length,
      shipping_address: orderData.shipping_address
    });

    try {
      const result = await this.makeRequest<PrintifyOrder>(`/shops/${this.shopId}/orders.json`, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      console.log('✅ Printify submitOrder: Order created successfully');
      console.log('📋 Order ID:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Printify submitOrder: Order submission failed');
      console.error('📝 Error details:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<PrintifyOrder> {
    return this.makeRequest<PrintifyOrder>(`/shops/${this.shopId}/orders/${orderId}.json`);
  }

  async getOrderStatus(orderId: string): Promise<PrintifyOrderStatus> {
    const order = await this.getOrder(orderId);
    return {
      status: order.status as any,
      tracking_number: order.shipments[0]?.number,
      tracking_url: order.shipments[0]?.url,
      carrier: order.shipments[0]?.carrier,
    };
  }

  async uploadImage(imageUrl: string, fileName?: string): Promise<string> {
    const uploadData = {
      file_name: fileName || 'uploaded_image.png',
      url: imageUrl,
    };

    const response = await this.makeRequest<{ id: string }>('/uploads/images.json', {
      method: 'POST',
      body: JSON.stringify(uploadData),
    });

    return response.id;
  }

  async getShops(): Promise<Array<{ id: number; title: string; sales_channel: string }>> {
    const response = await this.makeRequest<Array<{ id: number; title: string; sales_channel: string }>>('/shops.json');
    return Array.isArray(response) ? response : [];
  }

  // Helper methods
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Rate limiting check
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
      await this.sleep(waitTime + 100); // Add small buffer
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TimelessAccessories/1.0',
      ...options.headers,
    };

    try {
      console.log(`🌐 Printify API: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 429) {
        // Handle rate limit response
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
        console.log(`⏳ API rate limited. Waiting ${waitTime}ms...`);
        await this.sleep(waitTime);
        return this.makeRequest<T>(endpoint, options); // Retry
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Printify API Error: ${response.status} ${response.statusText}`);
        console.error(`📝 Error response: ${errorText}`);
        throw new Error(`Printify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Printify API: Request successful`);
      return data;
    } catch (error) {
      console.error(`❌ Printify API Request failed:`, error);
      throw this.handleError(error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): never {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Printify API');
    }
    
    if (error.message?.includes('401')) {
      throw new Error('Authentication failed: Invalid Printify API token');
    }
    
    if (error.message?.includes('403')) {
      throw new Error('Authorization failed: Insufficient permissions for this operation');
    }
    
    if (error.message?.includes('404')) {
      throw new Error('Resource not found: The requested item does not exist');
    }
    
    if (error.message?.includes('422')) {
      throw new Error('Validation error: The provided data is invalid');
    }
    
    throw error;
  }
}

// Factory function to create Printify client
export function createPrintifyClient(): PrintifyClient {
  const accessToken = process.env.PRINTIFY_ACCESS_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!accessToken) {
    throw new Error('PRINTIFY_ACCESS_TOKEN environment variable is not set');
  }

  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID environment variable is not set');
  }

  return new PrintifyClient(accessToken, parseInt(shopId));
}

// Helper function to convert order data to Printify format
export function convertOrderToPrintifyFormat(order: any): PrintifyOrderData {
  // Parse shipping address if it's stored as JSON
  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? JSON.parse(order.shippingAddress) 
    : order.shippingAddress;

  return {
    external_id: order.id,
    line_items: order.items.map((item: any) => ({
      product_id: item.inventory.printifyVariantId || item.productId,
      quantity: item.quantity,
      variant_id: parseInt(item.inventory.printifyVariantId) || 1,
    })),
    shipping_address: {
      first_name: shippingAddress.firstName || 'Customer',
      last_name: shippingAddress.lastName || '',
      email: order.guestEmail || order.user?.email || 'customer@example.com',
      phone: shippingAddress.phone || '',
      country: shippingAddress.country || 'US',
      region: shippingAddress.state || shippingAddress.region || '',
      address1: shippingAddress.street || shippingAddress.address1 || '',
      address2: shippingAddress.address2 || '',
      city: shippingAddress.city || '',
      zip: shippingAddress.postalCode || shippingAddress.zip || '',
    },
  };
}

export default PrintifyClient; 
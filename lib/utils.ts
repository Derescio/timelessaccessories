import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function prismaToJSObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

// Shorten ID
export function formatId(id: string) {
  return `${id.substring(id.length - 6)}`;
}

//Format Date and Time
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    'en-US',
    dateTimeOptions
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    'en-US',
    dateOptions
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    'en-US',
    timeOptions
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};




//Format Number with decimal places

export function formatNumber(num: number): string {
  const [int, decimal] = num.toFixed(2).split(".")
  return `${int}.${decimal}`
}

//Round Numbers to 2 decimal places
export function roundNumber(value: number | string) {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100
  } else if (typeof value === 'string') {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100
  } else {
    throw new Error('Value must be a number or string')
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
export function formatNumberIntl(number: number) {
  return NUMBER_FORMATTER.format(number);
}

// Format currency
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === 'number') {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === 'string') {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return 'NaN';
  }
}

// Form Pagination Links
// export function formUrlQuery({
//   params,
//   key,
//   value,
// }: {
//   params: string;
//   key: string;
//   value: string | null;
// }) {
//   const query = qs.parse(params);

//   query[key] = value;

//   return qs.stringifyUrl(
//     {
//       url: window.location.pathname,
//       query,
//     },
//     { skipNull: true }
//   );
// }



//Format Errors
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any): string {
  if (error.name === 'ZodError') {
    // Handle Zod error
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const message = error.errors[field].message;
      // console.log(message)
      return typeof message === 'string' ? message : JSON.stringify(message);

    });
    //console.log('Field Errors', fieldErrors)
    return fieldErrors.join('. ');
  } else if (
    error.name === 'PrismaClientKnownRequestError' &&
    error.code === 'P2002'
  ) {
    // Handle Prisma error
    const field = error.meta?.target ? error.meta.target[0] : 'Field';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // Handle other errors
    return typeof error.message === 'string'
      ? error.message
      : JSON.stringify(error.message);
  }
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Triggers a cart updated event to refresh the cart UI
 */
export function triggerCartUpdate() {
  if (typeof window !== 'undefined') {
    console.log('Dispatching cart-updated event');
    // Use CustomEvent for better browser compatibility
    const event = new CustomEvent('cart-updated', { 
      detail: { 
        timestamp: new Date().getTime() 
      } 
    });
    window.dispatchEvent(event);
    console.log('Event dispatched');
  }
}

// Debugging utility for Stripe
export async function debugStripePaymentIntent(orderId: string) {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Debug function only available in development mode');
    return;
  }

  console.log('Starting Stripe payment intent debug...');
  
  try {
    // Import dynamically to avoid SSR issues
    const { createStripePaymentIntent } = await import('./actions/order.actions');
    const result = await createStripePaymentIntent(orderId);
    
    console.log('=== STRIPE DEBUG RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('=========================');
    
    return result;
  } catch (error) {
    console.error('Stripe debug error:', error);
    return {
      success: false,
      message: `Debug error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Converts a string to a URL-friendly slug
 * @param value The string to convert to a slug
 * @returns The slugified string
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove non-word characters except whitespace and hyphens
    .replace(/[\s_-]+/g, '-')    // Replace spaces, underscores and multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading and trailing hyphens
}

// Define a proper interface for category objects
interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  children?: Category[];
  [key: string]: unknown;
}

// Format a nested category tree for display or debugging
export function formatCategoryTree(categories: Category[], level = 0) {
  const indent = '  '.repeat(level);
  let result = '';
  
  for (const category of categories) {
    result += `${indent}- ${category.name}\n`;
    
    if (category.children && category.children.length > 0) {
      result += formatCategoryTree(category.children, level + 1);
    }
  }
  
  return result;
}

// Get hierarchy path for a category (e.g., "Electronics > Smartphones")
export function getCategoryPath(category: Category, categories: Category[]): string {
  if (!category) return '';
  
  if (!category.parentId) {
    return category.name;
  }
  
  const parent = categories.find(c => c.id === category.parentId);
  if (!parent) return category.name;
  
  return `${getCategoryPath(parent, categories)} > ${category.name}`;
}


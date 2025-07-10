import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'timeless-accessories-blog',
  title: 'Timeless Accessories Blog',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  
  basePath: '/studio',
  
  plugins: [
    structureTool(),
    visionTool(),
  ],
  
  schema: {
    types: schemaTypes,
  },
  
  document: {
    productionUrl: async (prev, context) => {
      const { document } = context
      if (document._type === 'post') {
        const slug = document.slug as { current?: string }
        return `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug?.current}`
      }
      return prev
    },
  },
}) 
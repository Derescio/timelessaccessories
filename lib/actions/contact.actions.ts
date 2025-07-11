'use server'

import { z } from 'zod'
import nodemailer from 'nodemailer'

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PWD,
    },
  })
}

// Generate HTML email template
const generateEmailHTML = (data: ContactFormData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; text-align: center;">
        Contact Form Submission
      </h2>
      
      <p style="color: #666; margin-bottom: 20px;">
        You have received a new message through your website contact form.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0; margin-bottom: 10px;">Contact Information</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0; margin-bottom: 10px;">Subject</h3>
        <p style="margin: 5px 0;">${data.subject}</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="color: #444; margin-top: 0; margin-bottom: 10px;">Message</h3>
        <p style="white-space: pre-wrap; margin: 5px 0;">${data.message}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />

      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This message was sent through the contact form on your website. 
        You can reply directly to this email to respond to ${data.name}.
      </p>
    </div>
  `
}

export async function sendContactEmail(data: ContactFormData) {
  try {
    // Validate the form data
    const validatedData = contactFormSchema.parse(data)

    // Create transporter
    const transporter = createTransporter()

    // Email options
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: 'info@shop-dw.com',
      subject: `Contact Form: ${validatedData.subject}`,
      html: generateEmailHTML(validatedData),
      replyTo: validatedData.email,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return { success: true, message: 'Your message has been sent successfully!' }
  } catch (error) {
    console.error('Error sending contact email:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Please check your form data',
        errors: error.errors 
      }
    }
    
    return { 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    }
  }
} 
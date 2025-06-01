// import { NextResponse } from "next/server";
// import nodemailer from "nodemailer";

// export async function POST(req) {
//     try {
//         const {
//             name,
//             email,
//             phone,
//             subject,
//             message,
//             isConsultation,
//             preferredDate,
//             preferredTime,
//             saunaType,
//             budgetRange,
//             contactMethod,
//         } = await req.json();

//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.MAIL_USER,
//                 pass: process.env.MAIL_PWD,
//             },
//         });

//         let emailContent;
//         if (isConsultation) {
//             emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">New Consultation Request</h2>
          
//           <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
//             <h3 style="color: #444; margin-top: 0;">Contact Information</h3>
//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> ${email}</p>
//             <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
//             <p><strong>Preferred Contact Method:</strong> ${contactMethod}</p>
//           </div>

//           <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
//             <h3 style="color: #444; margin-top: 0;">Consultation Details</h3>
//             <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
//             <p><strong>Preferred Time:</strong> ${preferredTime}</p>
//             <p><strong>Sauna Type Interest:</strong> ${saunaType}</p>
//             <p><strong>Budget Range:</strong> ${budgetRange}</p>
//           </div>

//           <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
//             <h3 style="color: #444; margin-top: 0;">Additional Information</h3>
//             <p style="white-space: pre-wrap;">${message}</p>
//           </div>
//         </div>
//       `;
//         } else {
//             emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">New General Inquiry</h2>
          
//           <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
//             <h3 style="color: #444; margin-top: 0;">Contact Information</h3>
//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> ${email}</p>
//             ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
//           </div>

//           <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
//             <h3 style="color: #444; margin-top: 0;">Message</h3>
//             <p style="white-space: pre-wrap;">${message}</p>
//           </div>
//         </div>
//       `;
//         }

//         const mailOptions = {
//             from: process.env.MAIL_USER,
//             to: "info@thetorontosaunaco.com",
//             subject: subject,
//             html: emailContent,
//         };

//         await transporter.sendMail(mailOptions);

//         return NextResponse.json(
//             { message: "Email sent successfully!" },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Error sending email:", error);
//         return NextResponse.json(
//             { message: "Error sending email" },
//             { status: 500 }
//         );
//     }
// }

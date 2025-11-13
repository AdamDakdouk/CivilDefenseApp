import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Configure OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // redirect URI used to get refresh token
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

export const sendResetCode = async (email: string, code: string): Promise<boolean> => {
  try {
    // Get access token dynamically
    const accessTokenObj = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj?.token;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken
      }
    });

    const mailOptions = {
      from: `Civil Defense <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'كود إعادة تعيين كلمة المرور - الدفاع المدني',
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">الدفاع المدني اللبناني</h2>
            <p style="color: #666; font-size: 16px;">مرحبا،</p>
            <p style="color: #666; font-size: 16px;">لقد طلبت إعادة تعيين كلمة المرور. استخدم الكود أدناه:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #d32f2f; letter-spacing: 5px; margin: 0; font-size: 32px;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              الكود صالح لمدة <strong>15 دقيقة</strong> فقط.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              هذا البريد الإلكتروني تم إرساله تلقائياً. يرجى عدم الرد عليه.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset code sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

import * as fs from 'fs';
import * as path from 'path';

export const sendResetCode = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send email to:', email);
    console.log('🔑 Using Mailgun API Key:', process.env.MAILGUN_API_KEY ? 'Configured' : 'MISSING');

    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = 'civildefense.online';
    const MAILGUN_API_URL = `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

    if (!MAILGUN_API_KEY) {
      console.error('❌ MAILGUN_API_KEY is not configured');
      return false;
    }

    // Get the logo image file
    const logoPath = path.join(process.cwd(), 'src', 'logo.png');
    let logoBuffer: Buffer | null = null;

    logoBuffer = fs.readFileSync(logoPath);

    const logoBlob = new Blob([new Uint8Array(logoBuffer)], { type: 'image/png' });



    // Prepare form data
    const formData = new FormData();
    formData.append('from', 'Civil Defense <noreply@civildefense.online>');
    formData.append('to', email);
    formData.append('subject', 'كود إعادة تعيين كلمة المرور - الدفاع المدني');
    formData.append('inline', logoBlob, 'logo.png');

    // HTML content with embedded logo
    const htmlContent = `
        <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo.png" alt="Civil Defense Logo" style="width: 90px; height: 90px; object-fit: contain; background: #ffffff;  padding: 12px; box-shadow: 0 10px 30px rgba(196, 30, 58, 0.25), 0 0 0 8px rgba(196, 30, 58, 0.05); display: inline-block;">
            </div>
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
      `;

    formData.append('html', htmlContent);

    // Make API request to Mailgun
    const response = await fetch(MAILGUN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
      },
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully via Mailgun API');
      console.log('📨 Message ID:', result.id);
      console.log(`✅ Reset code sent to ${email}`);
      return true;
    } else {
      console.error('❌ Mailgun API error:', result);
      return false;
    }

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    return false;
  }
};
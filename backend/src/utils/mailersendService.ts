// backend/src/services/mailersendService.ts
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

export const sendResetCode = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send email to:', email);
    console.log('🔑 Using MailerSend API Key:', process.env.MAILERSEND_API_KEY ? 'Configured' : 'MISSING');

    if (!process.env.MAILERSEND_API_KEY) {
      console.error('❌ MAILERSEND_API_KEY is not configured');
      return false;
    }

    // ✅ Use your hosted logo URL
    const logoUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/public/logo.png`
      : 'https://civil-defense-app.onrender/public/logo.png';

    // ✅ Gmail-compatible HTML with hosted logo
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; }
    .logo { display: block; margin: 10px auto 15px; width: 90px; height: 90px; }
    h2 { text-align: center; color: #333; margin: 0 0 20px; font-size: 22px; }
    p { color: #666; line-height: 1.6; margin: 10px 0; text-align: right; }
    .code-box { background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
    .code { color: #c41e3a; font-size: 36px; font-weight: bold; letter-spacing: 3px; }
    .footer { font-size: 12px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoUrl}" alt="الدفاع المدني اللبناني" class="logo" />
    <h2>الدفاع المدني اللبناني</h2>
    <p>،مرحبا</p>
    <p>:لقد طلبت إعادة تعيين كلمة المرور. استخدم الكود أدناه</p>
    
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    
    <p>.الكود صالح لمدة <strong>15 دقيقة</strong> فقط</p>
    <p>.إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد</p>
    
    <div class="footer">
      <p>.هذا البريد الإلكتروني تم إرساله تلقائياً. يرجى عدم الرد عليه</p>
    </div>
  </div>
</body>
</html>`;

    // Plain text version
    const textContent = `الدفاع المدني اللبناني

مرحباً،

لقد طلبت إعادة تعيين كلمة المرور. استخدم الكود أدناه:

${code}

الكود صالح لمدة 15 دقيقة فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.`;

    // Create sender
    const sentFrom = new Sender(
      process.env.EMAIL_FROM || 'noreply@civildefense.online',
      'الدفاع المدني اللبناني'
    );

    // Create recipient
    const recipients = [new Recipient(email)];

    // Create email parameters
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('كود إعادة تعيين كلمة المرور - الدفاع المدني')
      .setHtml(htmlContent)
      .setText(textContent);

    // Send email
    await mailerSend.email.send(emailParams);

    console.log('✅ Email sent successfully via MailerSend');
    console.log(`✅ Reset code sent to ${email}`);
    return true;

  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Full error details:', error.response?.body || error.message);
    return false;
  }
};
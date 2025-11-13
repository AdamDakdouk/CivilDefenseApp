import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetCode = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('📧 Attempting to send email to:', email);
    console.log('🔑 Using Resend API key:', process.env.RESEND_API_KEY ? 'Present' : 'MISSING');
    
    const result = await resend.emails.send({
      from: 'Civil Defense <noreply@civildefense.online>',
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
    });

    console.log('✅ Resend API response:', JSON.stringify(result, null, 2));
    console.log(`✅ Reset code sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    return false;
  }
};
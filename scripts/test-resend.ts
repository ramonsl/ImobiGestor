import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.AUTH_RESEND_KEY);

async function testResend() {
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['ramonsl@gmail.com'],
            subject: 'Teste ImobiGestor',
            html: '<p>Este é um email de teste do ImobiGestor!</p>',
        });

        if (error) {
            console.error('❌ Erro ao enviar email:', error);
            return;
        }

        console.log('✅ Email enviado com sucesso!');
        console.log('ID:', data?.id);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

testResend();

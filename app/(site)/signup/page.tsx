import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { SignupForm, type SignupCopy } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'สมัครสมาชิก · Sign up',
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect('/account');

  const locale = await getLocale();

  const copy: SignupCopy = {
    title: pick('สร้างบัญชี', 'Create your account', locale),
    description: pick(
      'สมัครสมาชิกเพื่อเริ่มต้น แล้วมาดื่มกาแฟด้วยกันที่โบสถ์',
      'Sign up to get started, then come sip a coffee with us.',
      locale,
    ),
    name: pick('ชื่อ', 'Name', locale),
    email: pick('อีเมล', 'Email', locale),
    password: pick('รหัสผ่าน', 'Password', locale),
    passwordHint: pick('อย่างน้อย 8 ตัวอักษร', 'At least 8 characters.', locale),
    phone: pick('เบอร์โทรศัพท์', 'Phone', locale),
    phoneOptional: pick('(ไม่บังคับ)', '(optional)', locale),
    submit: pick('สมัครสมาชิก', 'Sign up', locale),
    submitting: pick('กำลังสร้างบัญชี…', 'Creating account…', locale),
    haveAccount: pick('มีบัญชีอยู่แล้ว?', 'Already have an account?', locale),
    loginLink: pick('เข้าสู่ระบบ', 'Log in', locale),
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16">
      <SignupForm copy={copy} />
    </main>
  );
}

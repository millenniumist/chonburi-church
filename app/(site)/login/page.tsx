import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { LoginForm, type LoginCopy } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ · Log in',
};

export default async function LoginPage() {
  // Already signed in? Send them to their account.
  const user = await getCurrentUser();
  if (user) redirect('/account');

  const locale = await getLocale();

  const copy: LoginCopy = {
    title: pick('เข้าสู่ระบบ', 'Welcome back', locale),
    description: pick(
      'เข้าสู่ระบบเพื่อสั่งกาแฟและเช็คอินเข้าร่วมนมัสการ',
      'Log in to order coffee and check in to a service.',
      locale,
    ),
    email: pick('อีเมล', 'Email', locale),
    password: pick('รหัสผ่าน', 'Password', locale),
    submit: pick('เข้าสู่ระบบ', 'Log in', locale),
    submitting: pick('กำลังเข้าสู่ระบบ…', 'Logging in…', locale),
    noAccount: pick('ยังไม่มีบัญชี?', "Don't have an account?", locale),
    signupLink: pick('สมัครสมาชิก', 'Sign up', locale),
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16">
      <LoginForm copy={copy} />
    </main>
  );
}

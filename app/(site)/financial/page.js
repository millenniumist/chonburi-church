import FinancialClient from './page-client';

// Force dynamic rendering to avoid database access during build
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'การเงิน',
  description: 'รายงานการเงินและความโปร่งใสของคริสตจักรชลบุรี ภาค7 - ข้อมูลรายรับรายจ่ายและงบประมาณ',
  keywords: ['การเงิน', 'รายรับรายจ่าย', 'งบประมาณ', 'ความโปร่งใส'],
};

export default function FinancialPage() {
  return <FinancialClient />;
}

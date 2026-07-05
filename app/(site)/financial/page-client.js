'use client';

import { useState, useEffect } from 'react';
import StickyNav from '@/components/landing/StickyNav';
import FinancialDisplay from '@/components/FinancialDisplay';

export default function FinancialClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/financial-data')
      .then(response => response.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="text-3xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-destructive mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-2 text-center">
          <div className="h-2 w-32 bg-muted rounded mx-auto"></div>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white">
      <StickyNav />
      <FinancialDisplay initialData={data} />

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            ข้อมูลการเงินถูกรวมกลุ่มเป็นหมวดหมู่เพื่อความโปร่งใสและเข้าใจง่าย
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            © {currentYear} คริสตจักรชลบุรี ภาค7 - สงวนลิขสิทธิ์
          </p>
        </div>
      </footer>
    </main>
  );
}

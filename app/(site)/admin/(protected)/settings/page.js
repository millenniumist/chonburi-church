'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Palette, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { colorTheme, setColorTheme, isLoading } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(colorTheme);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setSelectedTheme(colorTheme);
    }
  }, [colorTheme, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setColorTheme(selectedTheme);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage application-wide configurations</p>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground block mb-4">
              Color Theme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted ${
                  selectedTheme === 'bw' ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="colorTheme"
                  value="bw"
                  checked={selectedTheme === 'bw'}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-foreground">ขาวดำ (Black & White)</div>
                  {selectedTheme === 'bw' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mb-4">มินิมอลสีเทาขาวดำ สะอาดตา สไตล์พรีเมียม</div>
                <div className="flex gap-2 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-white border border-border shadow-sm"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-900"></div>
                </div>
              </label>

              <label 
                className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted ${
                  selectedTheme === 'lowkey' ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="colorTheme"
                  value="lowkey"
                  checked={selectedTheme === 'lowkey'}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-foreground">สีอ่อน (Low-Key Colors)</div>
                  {selectedTheme === 'lowkey' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mb-4">สีอุ่นๆ อ่อนนุ่ม เหมาะกับการใช้งานต่อเนื่อง ลดความล้าของสายตา</div>
                <div className="flex gap-2 mt-auto">
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{backgroundColor: 'oklch(0.45 0.12 250)'}}></div>
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{backgroundColor: 'oklch(0.85 0.06 140)'}}></div>
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{backgroundColor: 'oklch(0.78 0.12 75)'}}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/50 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground italic">
            {success ? '✓ Settings saved successfully' : 'Changes apply globally to all users'}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (selectedTheme === colorTheme && !success)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              success 
                ? 'bg-green-600 text-white' 
                : 'bg-primary text-primary-foreground hover:opacity-90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

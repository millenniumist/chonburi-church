// Merge detected categories with saved settings
export function mergeSettings(detectedCategories, savedSettings) {
  const result = {
    incomeRows: [],
    expenseRows: []
  };

  // Merge income categories
  if (detectedCategories.incomeCategories) {
    result.incomeRows = detectedCategories.incomeCategories.map(detected => {
      const saved = savedSettings?.incomeRows?.find(s => s.id === detected.id);
      return saved || detected;
    });
  }

  // Merge expense categories
  if (detectedCategories.expenseCategories) {
    result.expenseRows = detectedCategories.expenseCategories.map(detected => {
      const saved = savedSettings?.expenseRows?.find(s => s.id === detected.id);
      return saved || detected;
    });
  }

  return result;
}

// Get settings from API (client-side only)
export async function getAdminSettings(year = new Date().getFullYear()) {
  if (typeof window === 'undefined') {
    return {
      incomeRows: [],
      expenseRows: []
    };
  }

  try {
    const response = await fetch(`/api/categories/settings?year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading admin settings:', error);
    return {
      incomeRows: [],
      expenseRows: []
    };
  }
}

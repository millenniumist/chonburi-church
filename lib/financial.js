import { getPayloadClient } from './payload-cms.js';
import { getMonthName } from './dateUtils.js';

const DEFAULT_YEAR = new Date().getFullYear();

async function getFinancialData(year) {
  const payload = await getPayloadClient();
  let targetYear = year;

  // If no year is provided, try to find the latest year with data
  if (!targetYear) {
    const { docs: latestDocs } = await payload.find({
      collection: 'financial-records',
      sort: '-date',
      limit: 1,
    });
    const latestRecord = latestDocs[0];

    if (latestRecord) {
      targetYear = new Date(latestRecord.date).getFullYear();
    } else {
      targetYear = DEFAULT_YEAR;
    }
  }

  // Create dates in Bangkok timezone to avoid off-by-one errors
  const startDate = new Date(Date.UTC(targetYear - 1, 11, 31, 17, 0, 0)); // Dec 31 previous year, 17:00 UTC = Jan 1, 00:00 Bangkok
  const endDate = new Date(Date.UTC(targetYear, 11, 31, 17, 0, 0)); // Dec 31, 17:00 UTC = Jan 1 next year, 00:00 Bangkok (exclusive)

  // Fetch all financial records for the target year (ascending by date so
  // monthlyData stays in calendar order for the charts/tables)
  const records = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await payload.find({
      collection: 'financial-records',
      where: {
        date: {
          greater_than_equal: startDate.toISOString(),
          less_than: endDate.toISOString(),
        },
      },
      sort: 'date',
      limit: 2000,
      page,
    });
    records.push(...result.docs);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  if (!records || records.length === 0) {
    return {
      income: [],
      expenses: [],
      monthlyData: [],
      year: targetYear,
      totals: { income: 0, expenses: 0, balance: 0 }
    };
  }

  // Aggregate categories from all records
  const incomeCategories = new Map();
  const expenseCategories = new Map();
  const monthlyData = [];

  records.forEach((record) => {
    // Use the notes field which already has the correct month name,
    // or fall back to calculating from date
    const monthName = record.notes || getMonthName(record.date);

    const incomeDetails = record.incomeDetails || [];
    const expenseDetails = record.expenseDetails || [];

    // Collect monthly data
    monthlyData.push({
      month: monthName,
      income: record.income,
      expense: record.expenses,
      balance: record.balance,
      incomeDetails: Array.isArray(incomeDetails) ? incomeDetails : [],
      expenseDetails: Array.isArray(expenseDetails) ? expenseDetails : []
    });

    // Aggregate categories
    if (Array.isArray(incomeDetails)) {
      incomeDetails.forEach((detail) => {
        const category = detail.category || detail.label || 'อื่นๆ';
        const amount = Number(detail.amount) || 0;
        incomeCategories.set(category, (incomeCategories.get(category) || 0) + amount);
      });
    }

    if (Array.isArray(expenseDetails)) {
      expenseDetails.forEach((detail) => {
        const category = detail.category || detail.label || 'อื่นๆ';
        const amount = Number(detail.amount) || 0;
        expenseCategories.set(category, (expenseCategories.get(category) || 0) + amount);
      });
    }
  });

  // Convert maps to arrays
  const income = Array.from(incomeCategories.entries()).map(([category, amount]) => ({
    category,
    amount
  }));

  const expenses = Array.from(expenseCategories.entries()).map(([category, amount]) => ({
    category,
    amount
  }));

  // Calculate totals
  const totalIncome = records.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = records.reduce((sum, r) => sum + r.expenses, 0);
  const balance = totalIncome - totalExpenses;

  return {
    income,
    expenses,
    monthlyData,
    year: targetYear,
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      balance
    }
  };
}

function normalizeDetail(detail) {
  if (!detail || typeof detail !== 'object') {
    return { id: 'unknown', label: 'ไม่ระบุ', amount: 0 };
  }

  const id = detail.id || detail.code || detail.category || detail.label || detail.name || 'unknown';
  const label = detail.label || detail.category || detail.name || id;
  const amount = Number(detail.amount) || 0;

  return { id, label, amount };
}

function aggregateDetails(details = [], settings = []) {
  const totals = new Map();
  const settingsById = new Map((settings ?? []).map((item) => [item.id || item.code || item.name, item]));

  details.forEach((detail) => {
    const normalized = normalizeDetail(detail);
    const setting = settingsById.get(normalized.id);

    if (setting) {
      if (setting.visible === false) return;
      const targetLabel = setting.aggregateInto || setting.name || normalized.label;
      totals.set(targetLabel, (totals.get(targetLabel) || 0) + normalized.amount);
    } else {
      totals.set(normalized.label, (totals.get(normalized.label) || 0) + normalized.amount);
    }
  });

  return totals;
}

function aggregateSummary(items = [], settings = []) {
  const details = (items ?? []).map((item) => ({
    id: item.id || item.category || item.label,
    label: item.category || item.label || item.name,
    amount: item.amount,
  }));

  return aggregateDetails(details, settings);
}

function mapToArray(map) {
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getFinancialOverview({ year, settings = {} } = {}) {
  const rawData = await getFinancialData(year);

  const incomeSettings = settings.incomeRows ?? [];
  const expenseSettings = settings.expenseRows ?? [];

  const incomeTotals = aggregateSummary(rawData.income, incomeSettings);
  const expenseTotals = aggregateSummary(rawData.expenses, expenseSettings);

  const monthlyData = (rawData.monthlyData ?? []).map((record) => {
    const monthlyIncome = aggregateDetails(record.incomeDetails ?? [], incomeSettings);
    const monthlyExpenses = aggregateDetails(record.expenseDetails ?? [], expenseSettings);

    if (monthlyIncome.size === 0 && (record.income ?? 0) !== 0) {
      monthlyIncome.set('รวมรายรับ', record.income ?? 0);
    }

    if (monthlyExpenses.size === 0 && (record.expense ?? 0) !== 0) {
      monthlyExpenses.set('รวมรายจ่าย', record.expense ?? 0);
    }

    const income = record.income ?? 0;
    const expense = record.expense ?? 0;
    const balance =
      typeof record.balance === 'number' ? record.balance : income - expense;

    return {
      month: record.month,
      income,
      expense,
      balance,
      incomeDetails: mapToArray(monthlyIncome),
      expenseDetails: mapToArray(monthlyExpenses),
    };
  });

  const totalIncome =
    rawData.totals?.income ??
    monthlyData.reduce((sum, item) => sum + (item.income ?? 0), 0);
  const totalExpenses =
    rawData.totals?.expenses ??
    monthlyData.reduce((sum, item) => sum + (item.expense ?? 0), 0);
  const balance =
    typeof rawData.totals?.balance === 'number'
      ? rawData.totals.balance
      : totalIncome - totalExpenses;

  return {
    income: mapToArray(incomeTotals),
    expenses: mapToArray(expenseTotals),
    monthlyData,
    year: rawData.year,
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      balance,
    },
  };
}

export async function getFinancialCategories() {
  const rawData = await getFinancialData();

  const incomeCategories = new Map();
  const expenseCategories = new Map();

  const collectCategory = (map, detail) => {
    const normalized = normalizeDetail(detail);
    if (!map.has(normalized.id)) {
      map.set(normalized.id, {
        id: normalized.id,
        name: normalized.label,
        visible: true,
        aggregateInto: null,
      });
    }
  };

  (rawData.income ?? []).forEach((item) => {
    collectCategory(incomeCategories, { id: item.id || item.category, label: item.category, amount: item.amount });
  });

  (rawData.expenses ?? []).forEach((item) => {
    collectCategory(expenseCategories, { id: item.id || item.category, label: item.category, amount: item.amount });
  });

  (rawData.monthlyData ?? []).forEach((record) => {
    (record.incomeDetails ?? []).forEach((detail) => collectCategory(incomeCategories, detail));
    (record.expenseDetails ?? []).forEach((detail) => collectCategory(expenseCategories, detail));
  });

  if (incomeCategories.size === 0 && (rawData.totals?.income ?? 0) !== 0) {
    collectCategory(incomeCategories, { id: 'รวมรายรับ', label: 'รวมรายรับ', amount: rawData.totals.income });
  }

  if (expenseCategories.size === 0 && (rawData.totals?.expenses ?? 0) !== 0) {
    collectCategory(expenseCategories, { id: 'รวมรายจ่าย', label: 'รวมรายจ่าย', amount: rawData.totals.expenses });
  }

  return {
    incomeCategories: Array.from(incomeCategories.values()),
    expenseCategories: Array.from(expenseCategories.values()),
  };
}

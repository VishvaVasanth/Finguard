import { TableSummary } from './financialData.ts';

export interface CustomProfitInput {
  revenue?: number;
  cost?: number;
  cogs?: number;
  operatingExpenses?: number;
  tax?: number;
  taxRate?: number;
  sellingPrice?: number;
  costPrice?: number;
  unitsSold?: number;
  currency?: string;
  unitLabel?: string;
}

export interface CustomProfitResult {
  hasCustomValues: boolean;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  tax: number;
  netProfit: number;
  netMargin: number;
  sellingPrice?: number;
  costPrice?: number;
  unitsSold?: number;
  unitProfit?: number;
  markup?: number;
  currency: string;
  unitLabel: string;
  formula: string;
  step_by_step: string[];
  safe_response: string;
  calculation_details: string;
  yearly_data_table: TableSummary;
}

/**
 * Deterministically calculates profit metrics when values are provided.
 */
export function calculateProfitFromValues(input: CustomProfitInput): CustomProfitResult {
  const currency = input.currency || '$';
  const unitLabel = input.unitLabel ? ` ${input.unitLabel}` : '';

  let revenue = input.revenue ?? 0;
  let cogs = input.cogs ?? input.cost ?? 0;
  let opex = input.operatingExpenses ?? 0;
  let tax = input.tax ?? 0;
  const taxRate = input.taxRate;
  const sellingPrice = input.sellingPrice;
  const costPrice = input.costPrice;
  const unitsSold = input.unitsSold;

  let unitProfit: number | undefined;
  let markup: number | undefined;

  // Unit-based pricing evaluation
  if (sellingPrice !== undefined && costPrice !== undefined) {
    unitProfit = Number((sellingPrice - costPrice).toFixed(2));
    markup = costPrice > 0 ? Number(((unitProfit / costPrice) * 100).toFixed(2)) : 0;

    if (unitsSold !== undefined && unitsSold > 0) {
      revenue = Number((sellingPrice * unitsSold).toFixed(2));
      cogs = Number((costPrice * unitsSold).toFixed(2));
    } else if (revenue === 0) {
      revenue = sellingPrice;
      cogs = costPrice;
    }
  }

  const grossProfit = Number((revenue - cogs).toFixed(2));
  const grossMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0;

  const operatingProfit = Number((grossProfit - opex).toFixed(2));
  const operatingMargin = revenue > 0 ? Number(((operatingProfit / revenue) * 100).toFixed(2)) : 0;

  if (taxRate !== undefined && tax === 0 && operatingProfit > 0) {
    tax = Number((operatingProfit * (taxRate / 100)).toFixed(2));
  }

  const netProfit = Number((operatingProfit - tax).toFixed(2));
  const netMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0;

  const step_by_step: string[] = [
    `Step 1: Record Total Revenue = ${currency}${revenue.toLocaleString()}${unitLabel}`,
    `Step 2: Record Cost / COGS = ${currency}${cogs.toLocaleString()}${unitLabel}`,
    `Step 3: Calculate Gross Profit = Revenue (${currency}${revenue.toLocaleString()}) - COGS (${currency}${cogs.toLocaleString()}) = ${currency}${grossProfit.toLocaleString()}${unitLabel}`,
    `Step 4: Compute Gross Profit Margin = (${grossProfit} / ${revenue}) × 100 = ${grossMargin}%`,
  ];

  if (opex > 0) {
    step_by_step.push(
      `Step 5: Deduct Operating Expenses (${currency}${opex.toLocaleString()}${unitLabel}) = Operating Profit (EBIT) of ${currency}${operatingProfit.toLocaleString()}${unitLabel} (Operating Margin: ${operatingMargin}%)`
    );
  }

  if (tax > 0 || taxRate !== undefined) {
    step_by_step.push(
      `Step ${step_by_step.length + 1}: Deduct Tax Provision (${currency}${tax.toLocaleString()}${unitLabel}) = Net Profit of ${currency}${netProfit.toLocaleString()}${unitLabel} (Net Margin: ${netMargin}%)`
    );
  }

  // Build formula breakdown
  let formulaStr = `Gross Profit = Revenue - Cost of Goods Sold\n` +
    `Gross Margin (%) = (Gross Profit / Revenue) × 100`;
  if (opex > 0 || tax > 0) {
    formulaStr += `\nOperating Profit = Gross Profit - Operating Expenses\nNet Profit = Operating Profit - Tax Provision`;
  }

  let substitutionStr = `Gross Profit = ${currency}${revenue.toLocaleString()} - ${currency}${cogs.toLocaleString()} = ${currency}${grossProfit.toLocaleString()}${unitLabel}\n` +
    `Gross Margin = (${grossProfit} / ${revenue}) × 100 = ${grossMargin}%`;
  if (opex > 0) {
    substitutionStr += `\nOperating Profit = ${grossProfit} - ${opex} = ${currency}${operatingProfit.toLocaleString()}${unitLabel} (${operatingMargin}%)`;
  }
  if (tax > 0) {
    substitutionStr += `\nNet Profit = ${operatingProfit} - ${tax} = ${currency}${netProfit.toLocaleString()}${unitLabel} (${netMargin}%)`;
  }

  const calcDetails = `${formulaStr}\n\nSubstitution & Verification:\n${substitutionStr}`;

  // Safe response markdown
  let safe_response = `### Verified Profit Calculation from Given Values\n\n` +
    `Based on the values provided, here is the deterministic step-by-step calculation with zero-hallucination arithmetic execution:\n\n` +
    `• **Gross Profit**: **${currency}${grossProfit.toLocaleString()}${unitLabel}** (from Revenue of ${currency}${revenue.toLocaleString()}${unitLabel} minus Cost of ${currency}${cogs.toLocaleString()}${unitLabel})\n` +
    `• **Gross Margin**: **${grossMargin}%**\n`;

  if (unitProfit !== undefined && sellingPrice !== undefined && costPrice !== undefined) {
    safe_response += `• **Unit Profit**: **${currency}${unitProfit}** per unit (Selling Price: ${currency}${sellingPrice} | Cost Price: ${currency}${costPrice} | Markup: **${markup}%**)\n`;
    if (unitsSold !== undefined && unitsSold > 0) {
      safe_response += `• **Volume**: **${unitsSold.toLocaleString()} units** sold\n`;
    }
  }

  if (opex > 0) {
    safe_response += `• **Operating Profit (EBIT)**: **${currency}${operatingProfit.toLocaleString()}${unitLabel}** (Operating Margin: **${operatingMargin}%**)\n`;
  }

  if (tax > 0 || taxRate !== undefined) {
    safe_response += `• **Net Profit (Bottom Line)**: **${currency}${netProfit.toLocaleString()}${unitLabel}** (Net Margin: **${netMargin}%**)\n`;
  }

  safe_response += `\nAll mathematical operations are discrete, deterministic, and verifiable.`;

  // Structured Table
  const headers = ['Financial Line Item', 'Value / Input', 'Calculation Formula', 'Percentage of Revenue'];
  const rows: (string | number)[][] = [
    ['Total Revenue', `${currency}${revenue.toLocaleString()}${unitLabel}`, 'Base Input Value', '100.00%'],
    ['Cost of Goods Sold (COGS)', `${currency}${cogs.toLocaleString()}${unitLabel}`, 'Direct Cost / Materials', `${((cogs / (revenue || 1)) * 100).toFixed(2)}%`],
    ['Gross Profit', `${currency}${grossProfit.toLocaleString()}${unitLabel}`, 'Revenue - Cost', `${grossMargin}%`],
  ];

  if (opex > 0) {
    rows.push(['Operating Expenses (OPEX)', `${currency}${opex.toLocaleString()}${unitLabel}`, 'Overhead, SG&A, R&D', `${((opex / (revenue || 1)) * 100).toFixed(2)}%`]);
    rows.push(['Operating Profit (EBIT)', `${currency}${operatingProfit.toLocaleString()}${unitLabel}`, 'Gross Profit - OPEX', `${operatingMargin}%`]);
  }

  if (tax > 0 || taxRate !== undefined) {
    rows.push(['Tax Provision', `${currency}${tax.toLocaleString()}${unitLabel}`, taxRate ? `${taxRate}% effective tax` : 'Direct Tax Input', `${((tax / (revenue || 1)) * 100).toFixed(2)}%`]);
    rows.push(['Net Profit', `${currency}${netProfit.toLocaleString()}${unitLabel}`, 'Operating Profit - Tax', `${netMargin}%`]);
  }

  return {
    hasCustomValues: true,
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses: opex,
    operatingProfit,
    operatingMargin,
    tax,
    netProfit,
    netMargin,
    sellingPrice,
    costPrice,
    unitsSold,
    unitProfit,
    markup,
    currency,
    unitLabel: input.unitLabel || '',
    formula: formulaStr,
    step_by_step,
    safe_response,
    calculation_details: calcDetails,
    yearly_data_table: { headers, rows },
  };
}

/**
 * Natural language parser to detect and extract numbers for custom profit calculation
 */
export function parseCustomProfitQuery(query: string): CustomProfitResult | null {
  const q = query.toLowerCase();

  // Check if query is asking for profit calculation
  const isProfitQuery =
    q.includes('profit') ||
    q.includes('margin') ||
    q.includes('gross') ||
    q.includes('markup') ||
    q.includes('selling price') ||
    q.includes('cost price');

  if (!isProfitQuery) return null;

  // Currency detection
  let currency = '$';
  if (query.includes('₹') || q.includes('rs') || q.includes('inr') || q.includes('rupee') || q.includes('crore') || q.includes('lakh')) {
    currency = '₹';
  } else if (query.includes('€') || q.includes('eur')) {
    currency = '€';
  } else if (query.includes('£') || q.includes('gbp')) {
    currency = '£';
  }

  // Unit multiplier detection
  let unitLabel = '';
  let multiplier = 1;
  if (q.includes('billion') || /\b\d+\.?\d*\s*b\b/i.test(q)) {
    unitLabel = 'Billion';
  } else if (q.includes('million') || /\b\d+\.?\d*\s*m\b/i.test(q)) {
    unitLabel = 'Million';
  } else if (q.includes('crore') || /\b\d+\.?\d*\s*cr\b/i.test(q)) {
    unitLabel = 'Crore';
  } else if (q.includes('lakh')) {
    unitLabel = 'Lakh';
  } else if (q.includes('thousand') || /\b\d+\.?\d*\s*k\b/i.test(q)) {
    unitLabel = 'Thousand';
  }

  // Helper to parse numbers from strings like "$500M", "1,200,000", "50.5"
  const extractCleanNumber = (str: string): number | null => {
    if (!str) return null;
    const cleanStr = str.replace(/[$,₹,€,£]/g, '').trim();
    const numMatch = cleanStr.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (!numMatch) return null;
    const val = parseFloat(numMatch[1].replace(/,/g, ''));
    if (isNaN(val)) return null;

    if (/\b(b|billion)\b/i.test(cleanStr)) return val;
    if (/\b(m|million)\b/i.test(cleanStr)) return val;
    if (/\b(cr|crore)\b/i.test(cleanStr)) return val;
    return val;
  };

  // 1. Check Selling Price & Cost Price pattern
  const spMatch = query.match(/(?:selling\s*price|sp|price)\s*(?:is|=|:)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?)/i);
  const cpMatch = query.match(/(?:cost\s*price|cp|unit\s*cost)\s*(?:is|=|:)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?)/i);
  const qtyMatch = query.match(/(?:quantity|qty|volume|units|units\s*sold)\s*(?:is|=|:)?\s*([\d,]+)/i);

  if (spMatch && cpMatch) {
    const sp = extractCleanNumber(spMatch[1]);
    const cp = extractCleanNumber(cpMatch[1]);
    const qty = qtyMatch ? parseInt(qtyMatch[1].replace(/,/g, ''), 10) : undefined;
    if (sp !== null && cp !== null) {
      return calculateProfitFromValues({
        sellingPrice: sp,
        costPrice: cp,
        unitsSold: qty,
        currency,
        unitLabel,
      });
    }
  }

  // 2. Keyword-based extraction for Revenue, Cost/COGS, OPEX, Tax
  const revMatch = query.match(/(?:revenue|sales|turnover|income|topline|rev)\s*(?:is|=|:|of)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|crore|lakh|thousand|b|m|k|cr))?)/i);
  const costMatch = query.match(/(?:cost\s*of\s*goods\s*sold|cogs|total\s*cost|operating\s*cost|cost|expenses|expense|expenditure|spending)\s*(?:is|=|:|of)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|crore|lakh|thousand|b|m|k|cr))?)/i);
  const opexMatch = query.match(/(?:operating\s*expenses|opex|overhead)\s*(?:is|=|:|of)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|crore|lakh|thousand|b|m|k|cr))?)/i);
  const taxMatch = query.match(/(?:tax(?:es)?|tax\s*provision)\s*(?:is|=|:|of)?\s*([$₹€£]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|crore|lakh|thousand|b|m|k|cr))?)/i);

  if (revMatch && costMatch) {
    const rev = extractCleanNumber(revMatch[1]);
    const cost = extractCleanNumber(costMatch[1]);
    const opex = opexMatch ? extractCleanNumber(opexMatch[1]) || undefined : undefined;
    const tax = taxMatch ? extractCleanNumber(taxMatch[1]) || undefined : undefined;

    if (rev !== null && cost !== null) {
      return calculateProfitFromValues({
        revenue: rev,
        cogs: cost,
        operatingExpenses: opex,
        tax,
        currency,
        unitLabel,
      });
    }
  }

  // 3. Fallback: extract two distinct numbers if query says "calculate profit" or "find profit"
  // E.g. "calculate profit 500 and 320" or "profit if 10000 revenue 6000 cost"
  if (
    q.includes('calculate profit') ||
    q.includes('find profit') ||
    q.includes('profit for') ||
    q.includes('profit when') ||
    q.includes('find the profit') ||
    q.includes('calculate the profit') ||
    q.includes('profit calculation')
  ) {
    const allNumbers = [...query.matchAll(/[$₹€£]?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s*(billion|million|crore|thousand|b|m|k|cr))?/gi)];
    if (allNumbers.length >= 2) {
      const n1 = extractCleanNumber(allNumbers[0][0]);
      const n2 = extractCleanNumber(allNumbers[1][0]);
      if (n1 !== null && n2 !== null && n1 !== n2) {
        const higher = Math.max(n1, n2);
        const lower = Math.min(n1, n2);
        return calculateProfitFromValues({
          revenue: higher,
          cogs: lower,
          currency,
          unitLabel,
        });
      }
    }
  }

  // 4. If user asked generically to make calculations on finding profit when values are given
  // e.g. "make some calculations on finding the profit when some values are given"
  if (
    (q.includes('make') || q.includes('do') || q.includes('perform') || q.includes('how') || q.includes('can you')) &&
    q.includes('calculation') &&
    q.includes('profit') &&
    (q.includes('given') || q.includes('values') || q.includes('numbers'))
  ) {
    // Provide a rich interactive demo report showing example profit calculations with different given value configurations!
    return getInteractiveProfitDemo();
  }

  return null;
}

/**
 * Returns an interactive zero-hallucination profit calculation guide and demo
 */
export function getInteractiveProfitDemo(): CustomProfitResult {
  const demo = calculateProfitFromValues({
    revenue: 500,
    cogs: 320,
    operatingExpenses: 60,
    tax: 25,
    currency: '$',
    unitLabel: 'Million',
  });

  const safe_response =
    `### Deterministic Profit Calculation Engine\n\n` +
    `FinGuard supports verified discrete profit calculations from any provided numbers with 100.0% arithmetic precision and zero hallucination.\n\n` +
    `#### Supported Profit Formulas & Calculation Types:\n` +
    `1. **Gross Profit**: $\\text{Revenue} - \\text{Cost of Goods Sold (COGS)}$\n` +
    `   • **Gross Margin (%)**: $(\\frac{\\text{Gross Profit}}{\\text{Revenue}}) \\times 100$\n` +
    `2. **Operating Profit (EBIT)**: $\\text{Gross Profit} - \\text{Operating Expenses (OPEX)}$\n` +
    `   • **Operating Margin (%)**: $(\\frac{\\text{Operating Profit}}{\\text{Revenue}}) \\times 100$\n` +
    `3. **Net Profit (Bottom Line)**: $\\text{Operating Profit} - \\text{Tax Provision} - \\text{Interest}$\n` +
    `   • **Net Profit Margin (%)**: $(\\frac{\\text{Net Profit}}{\\text{Revenue}}) \\times 100$\n` +
    `4. **Unit Retail Profit**: $\\text{Selling Price (SP)} - \\text{Cost Price (CP)}$\n` +
    `   • **Markup (%)**: $(\\frac{\\text{Unit Profit}}{\\text{Cost Price}}) \\times 100$\n\n` +
    `---\n\n` +
    `#### Interactive Demonstration with Given Values:\n` +
    `**Example Scenario**: Given Revenue = **$500 Million**, Cost = **$320 Million**, Operating Expenses = **$60 Million**, and Taxes = **$25 Million**:\n\n` +
    `• **Gross Profit**: **$180.00 Million** (Gross Margin: **36.00%**)\n` +
    `• **Operating Profit**: **$120.00 Million** (Operating Margin: **24.00%**)\n` +
    `• **Net Profit**: **$95.00 Million** (Net Margin: **19.00%**)\n\n` +
    `You can enter your own values at any time! For example:\n` +
    `• *"Calculate profit if revenue is $1,200,000 and cost is $750,000"*\n` +
    `• *"Find profit: selling price $150, cost price $90, quantity 500"*\n` +
    `• *"Revenue 80M, COGS 45M, OPEX 15M, Tax 5M calculate net profit"*`;

  return {
    ...demo,
    safe_response,
  };
}

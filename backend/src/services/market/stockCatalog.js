/**
 * Comprehensive Catalog of Top 150+ Global Equities & ETFs
 * Provides instant autocomplete and fallback metadata for search.
 */
const stockCatalog = [
  // Mega-Cap Tech & Semis
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Electronics' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Software & Cloud' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce & Cloud' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Internet & Search' },
  { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)', sector: 'Internet & Search' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Social Media & AI' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive & Clean Energy' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', sector: 'Semiconductors' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Co.', sector: 'Semiconductors' },
  { symbol: 'ASML', name: 'ASML Holding N.V.', sector: 'Semiconductor Equipment' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors' },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors & Wireless' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', sector: 'Semiconductors' },
  { symbol: 'ARM', name: 'Arm Holdings plc', sector: 'Semiconductor IP' },
  { symbol: 'MU', name: 'Micron Technology Inc.', sector: 'Memory & Storage' },

  // Streaming, AI & Emerging Tech
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment & Streaming' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Enterprise AI & Big Data' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'Cryptocurrency Exchange' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', sector: 'Mobility & Delivery' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', sector: 'Travel & Hospitality' },
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'E-Commerce Platforms' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.', sector: 'Audio Streaming' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Cloud Data Warehousing' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.', sector: 'Cybersecurity' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.', sector: 'Cybersecurity' },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Cloud Monitoring & DevOps' },
  { symbol: 'NET', name: 'Cloudflare Inc.', sector: 'Cloud & Web Infrastructure' },

  // Software & Cloud Giants
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Enterprise CRM' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Database & Cloud' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Creative Software' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'IT Service Management' },
  { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Financial & Tax Software' },
  { symbol: 'IBM', name: 'International Business Machines Corp.', sector: 'IT Services & AI' },
  { symbol: 'SAP', name: 'SAP SE', sector: 'Enterprise Resource Planning' },

  // Financial Services & Fintech
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking & Financials' },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Banking & Financials' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Banking & Financials' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Investment Banking' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Payment Processing' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Payment Processing' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Fintech & Digital Payments' },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Fintech & Payments' },
  { symbol: 'HOOD', name: 'Robinhood Markets Inc.', sector: 'Retail Brokerage & Fintech' },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Asset Management' },

  // Healthcare & Biotechnology
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Pharmaceuticals' },
  { symbol: 'NVO', name: 'Novo Nordisk A/S', sector: 'Pharmaceuticals' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare & Pharma' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Managed Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Pharmaceuticals' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Biopharmaceuticals' },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Biotechnology' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.', sector: 'Biotechnology' },

  // Consumer & Retail Leaders
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail & Superstores' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Warehouse Retail' },
  { symbol: 'TGT', name: 'Target Corporation', sector: 'General Retail' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'Home Improvement' },
  { symbol: 'LOW', name: "Lowe's Companies Inc.", sector: 'Home Improvement' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Footwear & Apparel' },
  { symbol: 'LULU', name: 'Lululemon Athletica Inc.', sector: 'Athletic Apparel' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Restaurants & Coffee' },
  { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Fast Food' },
  { symbol: 'CMG', name: 'Chipotle Mexican Grill Inc.', sector: 'Fast Casual' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Beverages' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Snacks & Beverages' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Goods' },

  // Industrial, Aerospace & Automotive
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Aerospace & Defense' },
  { symbol: 'LMT', name: 'Lockheed Martin Corp.', sector: 'Defense & Aerospace' },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Aerospace & Defense' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Aerospace & Engineering' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Heavy Machinery' },
  { symbol: 'DE', name: 'Deere & Company', sector: 'Agricultural Machinery' },
  { symbol: 'F', name: 'Ford Motor Company', sector: 'Automotive' },
  { symbol: 'GM', name: 'General Motors Company', sector: 'Automotive' },
  { symbol: 'RIVN', name: 'Rivian Automotive Inc.', sector: 'Electric Vehicles' },

  // Energy & Utilities
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Oil & Gas Integrated' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Oil & Gas Integrated' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Oil & Gas Exploration' },
  { symbol: 'SLB', name: 'SLB (Schlumberger)', sector: 'Oilfield Services' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'Clean Energy & Utilities' },

  // Media & Telecom
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Entertainment & Media' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Telecommunications & Cable' },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Telecommunications' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Telecommunications' },

  // Major Index ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'Index ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq-100)', sector: 'Index ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'Small-Cap ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', sector: 'Index ETF' },
  { symbol: 'VXX', name: 'iPath Series B S&P 500 VIX Short-Term Futures', sector: 'Volatility ETF' },
];

module.exports = stockCatalog;

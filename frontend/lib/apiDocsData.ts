export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type LanguageId =
  | 'curl'
  | 'javascript'
  | 'python'
  | 'php'
  | 'go'
  | 'java'
  | 'csharp'
  | 'ruby'
  | 'rust'

export interface ParamDoc {
  name: string
  type: string
  required?: boolean
  description: string
  example?: string
}

export interface EndpointDoc {
  id: string
  category: string
  method: HttpMethod
  path: string
  title: string
  summary: string
  permission: string | null
  authRequired: boolean
  idempotent?: boolean
  isBinary?: boolean
  notes?: string[]
  pathParams?: ParamDoc[]
  queryParams?: ParamDoc[]
  bodyParams?: ParamDoc[]
  defaultQuery?: Record<string, string>
  sampleBody?: Record<string, any>
  sampleResponse: Record<string, any> | string
}

export const LANGUAGES: Array<{ id: LanguageId; label: string; badge: string }> = [
  { id: 'curl', label: 'cURL', badge: 'SH' },
  { id: 'javascript', label: 'JavaScript / Node.js', badge: 'JS' },
  { id: 'python', label: 'Python', badge: 'PY' },
  { id: 'php', label: 'PHP', badge: 'PHP' },
  { id: 'go', label: 'Go', badge: 'GO' },
  { id: 'java', label: 'Java 11+', badge: 'JAVA' },
  { id: 'csharp', label: 'C# (.NET)', badge: 'C#' },
  { id: 'ruby', label: 'Ruby', badge: 'RB' },
  { id: 'rust', label: 'Rust', badge: 'RS' },
]

export const PERMISSION_DOCS = [
  { scope: 'accounts:create', group: 'Accounts', description: 'Create new bank checking accounts via API' },
  { scope: 'accounts:read', group: 'Accounts', description: 'Read account profiles, balances, dashboard, tokens, and restrictions' },
  { scope: 'accounts:write', group: 'Accounts', description: 'Update account profiles, change passwords, set PINs, and submit KYC' },
  { scope: 'transactions:read', group: 'Transactions', description: 'List transactions, inspect entries, and download PDF receipts' },
  { scope: 'transactions:deposit', group: 'Transactions', description: 'Execute deposits into accessible checking accounts' },
  { scope: 'transactions:withdraw', group: 'Transactions', description: 'Submit withdrawal requests or instant disbursements' },
  { scope: 'transactions:transfer', group: 'Transactions', description: 'Transfer funds between accounts or external counterparties' },
  { scope: 'transactions:bill_pay', group: 'Transactions', description: 'Pay merchant and utility bills from account balance' },
  { scope: 'cards:read', group: 'Cards', description: 'Check debit card status and reveal active card credentials' },
  { scope: 'cards:write', group: 'Cards', description: 'Request new commercial Visa or Mastercard debit cards' },
  { scope: 'wealth:read', group: 'Wealth', description: 'Read crypto, treasury, investments, trust, and linked banks' },
  { scope: 'notifications:read', group: 'Notifications', description: 'Read account notifications and unread counts' },
  { scope: 'notifications:write', group: 'Notifications', description: 'Mark notifications as read or delete notifications' },
  { scope: 'chat:read', group: 'Support', description: 'Retrieve client support chat history' },
  { scope: 'chat:write', group: 'Support', description: 'Send real-time messages to the bank support desk' },
  { scope: 'bank:read', group: 'Bank', description: 'Read bank routing details, FX rates, payment rails, and token packages' },
]

export const ERROR_CODES = [
  { http: 400, code: 'VALIDATION_ERROR', meaning: 'Required request fields are missing or malformed.' },
  { http: 400, code: 'INSUFFICIENT_FUNDS', meaning: 'Checking balance is below the required amount plus fees.' },
  { http: 400, code: 'LIMIT_EXCEEDED', meaning: 'Transaction amount exceeds single deposit, withdrawal, or transfer cap.' },
  { http: 400, code: 'SELF_TRANSFER_FORBIDDEN', meaning: 'Source and recipient account cannot be identical.' },
  { http: 401, code: 'API_KEY_MISSING', meaning: 'Neither X-API-Key nor Authorization: Bearer header was supplied.' },
  { http: 401, code: 'INVALID_API_KEY', meaning: 'API key format is invalid or key hash was not found.' },
  { http: 401, code: 'API_KEY_EXPIRED', meaning: 'The API key has passed its administrator-configured expiration date.' },
  { http: 402, code: 'INSUFFICIENT_TOKENS', meaning: 'Key enforces TTN/Tokens and account holds fewer than 10 security tokens.' },
  { http: 403, code: 'API_KEY_SUSPENDED', meaning: 'Administrator temporarily suspended this API key.' },
  { http: 403, code: 'API_KEY_REVOKED', meaning: 'Administrator permanently revoked this API key.' },
  { http: 403, code: 'IP_NOT_ALLOWED', meaning: 'Request origin IP is not in this key\'s IP whitelist.' },
  { http: 403, code: 'INSUFFICIENT_PERMISSION', meaning: 'This API key lacks the required permission scope for the endpoint.' },
  { http: 403, code: 'ACCOUNT_OUT_OF_SCOPE', meaning: 'Target account is outside this key\'s assigned scope (all / owned / single_user).' },
  { http: 403, code: 'TRANSFERS_BLOCKED', meaning: 'Compliance review has disabled outbound transfers on the target account.' },
  { http: 403, code: 'WITHDRAWALS_BLOCKED', meaning: 'Compliance review has disabled withdrawals on the target account.' },
  { http: 404, code: 'ACCOUNT_NOT_FOUND', meaning: 'No matching bank client account was found.' },
  { http: 409, code: 'EMAIL_ALREADY_EXISTS', meaning: 'An account with the provided email address already exists.' },
  { http: 409, code: 'IDEMPOTENCY_KEY_REUSED', meaning: 'Same Idempotency-Key was sent to a different HTTP method or path.' },
  { http: 429, code: 'RATE_LIMIT_EXCEEDED', meaning: 'Per-key requests/minute quota exceeded; check Retry-After header.' },
  { http: 503, code: 'MAINTENANCE_MODE', meaning: 'Bank portal and API are temporarily paused for core ledger maintenance.' },
]

export const API_CATEGORIES = [
  'System',
  'Bank Configuration',
  'Accounts & Onboarding',
  'Balances & Overview',
  'Money Movement',
  'Transactions & Receipts',
  'Debit Cards',
  'Wealth & Reserves',
  'Security Tokens',
  'Notifications',
  'Support Chat',
]

export const ENDPOINTS: EndpointDoc[] = [
  // ── System ───────────────────────────────────────────────────────────────────
  {
    id: 'sys-health',
    category: 'System',
    method: 'GET',
    path: '/health',
    title: 'API Health Check',
    summary: 'Verify API v1 uptime, institution identifier, and ABA routing number without authentication.',
    permission: null,
    authRequired: false,
    sampleResponse: {
      success: true,
      requestId: 'req_4f2a9c10b7d8e1a2',
      data: {
        status: 'operational',
        version: 'v1',
        institution: 'Blue ridge Bank',
        routingNumber: '021000021',
        timestamp: '2026-11-22T08:00:00.000Z',
      },
    },
  },
  {
    id: 'sys-openapi',
    category: 'System',
    method: 'GET',
    path: '/openapi.json',
    title: 'OpenAPI 3.0 Specification',
    summary: 'Download the live machine-readable OpenAPI 3.0.3 schema for code generation in 50+ languages, Postman, or Insomnia.',
    permission: null,
    authRequired: false,
    sampleResponse: {
      openapi: '3.0.3',
      info: { title: 'Blue ridge Bank External Banking API', version: '1.0.0' },
      servers: [{ url: 'https://api.theblueridges.com/api/v1' }],
    },
  },
  {
    id: 'sys-key',
    category: 'System',
    method: 'GET',
    path: '/key',
    title: 'Inspect Active API Key',
    summary: 'Return permissions, account scope, rate limit, transaction policies, and bound client details for your API key.',
    permission: null,
    authRequired: true,
    sampleResponse: {
      success: true,
      requestId: 'req_81b4c20012a9e771',
      data: {
        name: 'Acme Treasury Integration',
        keyPrefix: 'brb_live_a8f91c2',
        environment: 'live',
        accountScope: 'all',
        rateLimitPerMinute: 120,
        enforcePinAndTtn: false,
        instantWithdrawal: false,
        permissions: ['accounts:create', 'accounts:read', 'transactions:deposit'],
      },
    },
  },

  // ── Bank Configuration ───────────────────────────────────────────────────────
  {
    id: 'bank-settings',
    category: 'Bank Configuration',
    method: 'GET',
    path: '/bank/settings',
    title: 'Bank Configuration & FX Rates',
    summary: 'Retrieve ABA routing number, SWIFT BIC, supported FX conversion rates, card issuance fee, transaction limits, and token bundles.',
    permission: 'bank:read',
    authRequired: true,
    sampleResponse: {
      success: true,
      requestId: 'req_2c91a440f012bc91',
      data: {
        institution: 'Blue ridge Bank',
        routingNumber: '021000021',
        swiftCode: 'BRBKUS33',
        supportedCurrencies: ['USD', 'GBP', 'EUR'],
        fxRates: { USD: 1, GBP: 0.79, EUR: 0.92 },
        cardIssuanceFeeUSD: 50,
        tokensPerTransaction: 10,
      },
    },
  },
  {
    id: 'bank-deposit-methods',
    category: 'Bank Configuration',
    method: 'GET',
    path: '/bank/deposit-methods',
    title: 'List Deposit Rails',
    summary: 'Retrieve enabled deposit methods, fee structures, crypto wallet addresses, and settlement instructions.',
    permission: 'bank:read',
    authRequired: true,
    sampleResponse: {
      success: true,
      requestId: 'req_31e02f19a812cc01',
      data: {
        methods: [
          { id: 'bank_transfer', label: 'Bank Transfer', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'wire', label: 'Wire Transfer', fee: 15, feeType: 'fixed', enabled: true },
          { id: 'card', label: 'Debit/Credit Card', fee: 2.5, feeType: 'percent', enabled: true },
        ],
      },
    },
  },
  {
    id: 'bank-withdrawal-methods',
    category: 'Bank Configuration',
    method: 'GET',
    path: '/bank/withdrawal-methods',
    title: 'List Withdrawal Rails',
    summary: 'Retrieve enabled payout channels, withdrawal fees, and expected clearing windows.',
    permission: 'bank:read',
    authRequired: true,
    sampleResponse: {
      success: true,
      requestId: 'req_7d91c029f901ac11',
      data: {
        methods: [
          { id: 'ach', label: 'ACH Transfer', fee: 0, feeType: 'fixed', enabled: true, processingTime: '1-3 business days' },
          { id: 'wire', label: 'Wire Transfer', fee: 25, feeType: 'fixed', enabled: true, processingTime: 'Same day' },
        ],
      },
    },
  },

  // ── Accounts & Onboarding ────────────────────────────────────────────────────
  {
    id: 'acct-create',
    category: 'Accounts & Onboarding',
    method: 'POST',
    path: '/accounts',
    title: 'Create Bank Account',
    summary: 'Open a new Blue ridge Bank checking account with automatic 12-digit account number, routing number, and welcome notification.',
    permission: 'accounts:create',
    authRequired: true,
    idempotent: true,
    notes: [
      'Requires key scope "all" or "owned". Keys locked to "single_user" cannot create accounts.',
      'Optional 4-6 digit transaction PIN can be supplied at creation time.',
    ],
    bodyParams: [
      { name: 'firstName', type: 'string', required: true, description: 'Client legal first name' },
      { name: 'lastName', type: 'string', required: true, description: 'Client legal last name' },
      { name: 'email', type: 'string', required: true, description: 'Unique email address for the account' },
      { name: 'password', type: 'string', required: true, description: 'Portal password (minimum 8 characters)' },
      { name: 'phone', type: 'string', description: 'Phone number with country code' },
      { name: 'country', type: 'string', description: 'Country of residence' },
      { name: 'location', type: 'string', description: 'City / jurisdiction' },
      { name: 'savingsGoal', type: 'number', description: 'Target savings goal in USD' },
      { name: 'pin', type: 'string', description: 'Optional 4-6 digit numeric transaction PIN' },
    ],
    sampleBody: {
      firstName: 'Elena',
      lastName: 'Vance',
      email: 'elena.vance@example.com',
      password: 'SecurePassword123!',
      phone: '+1-212-555-0194',
      country: 'United States',
      location: 'New York',
      pin: '4829',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_019af88e1c4a2b71',
      data: {
        account: {
          _id: '673f1c8a9e2b1d0012a4b5c6',
          firstName: 'Elena',
          lastName: 'Vance',
          email: 'elena.vance@example.com',
          accountNumber: '482910384712',
          routingNumber: '021000021',
          balance: 0,
          status: 'active',
          kyc: 'Pending',
          hasPin: true,
        },
      },
    },
  },
  {
    id: 'acct-auth',
    category: 'Accounts & Onboarding',
    method: 'POST',
    path: '/accounts/authenticate',
    title: 'Authenticate Bank Client Credentials',
    summary: 'Verify an existing bank client\'s email and password and retrieve their sanitized account record.',
    permission: 'accounts:read',
    authRequired: true,
    bodyParams: [
      { name: 'email', type: 'string', required: true, description: 'Account email address' },
      { name: 'password', type: 'string', required: true, description: 'Account password' },
    ],
    sampleBody: {
      email: 'elena.vance@example.com',
      password: 'SecurePassword123!',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_12e0b4f8c901aa20',
      data: {
        authenticated: true,
        account: {
          _id: '673f1c8a9e2b1d0012a4b5c6',
          firstName: 'Elena',
          lastName: 'Vance',
          accountNumber: '482910384712',
          balance: 2500,
        },
      },
    },
  },
  {
    id: 'acct-list',
    category: 'Accounts & Onboarding',
    method: 'GET',
    path: '/accounts',
    title: 'List Accessible Accounts',
    summary: 'Retrieve paginated bank accounts accessible to this API key with optional search and status filters.',
    permission: 'accounts:read',
    authRequired: true,
    queryParams: [
      { name: 'page', type: 'number', description: 'Page number (default 1)' },
      { name: 'limit', type: 'number', description: 'Items per page (max 100, default 20)' },
      { name: 'search', type: 'string', description: 'Match first name, last name, email, or accountNumber' },
      { name: 'status', type: 'string', description: 'active | suspended | pending' },
      { name: 'kyc', type: 'string', description: 'Verified | Pending | Rejected | Not Started' },
    ],
    defaultQuery: { page: '1', limit: '20' },
    sampleResponse: {
      success: true,
      requestId: 'req_4591bc2a11d0ee82',
      data: { accounts: [{ _id: '673f1c8a9e2b1d0012a4b5c6', firstName: 'Elena', lastName: 'Vance', balance: 2500 }] },
      meta: { pagination: { page: 1, limit: 20, total: 1, pages: 1 } },
    },
  },
  {
    id: 'acct-get',
    category: 'Accounts & Onboarding',
    method: 'GET',
    path: '/accounts/:accountId',
    title: 'Get Account Details',
    summary: 'Fetch full sanitized details for a bank account by ObjectId, 12-digit accountNumber, email, or "me".',
    permission: 'accounts:read',
    authRequired: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'MongoDB ObjectId, 12-digit accountNumber, email, or "me"', example: 'me' },
    ],
    sampleResponse: {
      success: true,
      requestId: 'req_aa7712e90b34120c',
      data: {
        account: {
          _id: '673f1c8a9e2b1d0012a4b5c6',
          firstName: 'Elena',
          lastName: 'Vance',
          accountNumber: '482910384712',
          routingNumber: '021000021',
          balance: 2500,
          kyc: 'Verified',
        },
      },
    },
  },
  {
    id: 'acct-update',
    category: 'Accounts & Onboarding',
    method: 'PATCH',
    path: '/accounts/:accountId',
    title: 'Update Account Profile',
    summary: 'Update client name, phone, location, address, notification preferences, or savings goal.',
    permission: 'accounts:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'firstName', type: 'string', description: 'Updated first name' },
      { name: 'lastName', type: 'string', description: 'Updated last name' },
      { name: 'phone', type: 'string', description: 'Phone number' },
      { name: 'location', type: 'string', description: 'City / location' },
      { name: 'country', type: 'string', description: 'Country' },
      { name: 'savingsGoal', type: 'number', description: 'Target savings amount in USD' },
    ],
    sampleBody: { phone: '+1-212-555-0199', location: 'Chicago', savingsGoal: 25000 },
    sampleResponse: {
      success: true,
      requestId: 'req_cc2198ff0112a9b4',
      data: { account: { firstName: 'Elena', phone: '+1-212-555-0199', location: 'Chicago', savingsGoal: 25000 } },
    },
  },
  {
    id: 'acct-password',
    category: 'Accounts & Onboarding',
    method: 'PATCH',
    path: '/accounts/:accountId/password',
    title: 'Change Account Password',
    summary: 'Verify the current account password and rotate to a new password (min 8 characters).',
    permission: 'accounts:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'currentPassword', type: 'string', required: true, description: 'Current portal password' },
      { name: 'newPassword', type: 'string', required: true, description: 'New password (min 8 chars)' },
    ],
    sampleBody: { currentPassword: 'SecurePassword123!', newPassword: 'NewStrongPassword456!' },
    sampleResponse: {
      success: true,
      requestId: 'req_19bc0e72ab0139cd',
      data: { updated: true, message: 'Password updated successfully.' },
    },
  },
  {
    id: 'acct-pin',
    category: 'Accounts & Onboarding',
    method: 'POST',
    path: '/accounts/:accountId/pin',
    title: 'Set or Rotate Transaction PIN',
    summary: 'Configure a 4-6 digit transaction PIN. If already set, include currentPin to change it.',
    permission: 'accounts:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'pin', type: 'string', required: true, description: 'New 4-6 digit numeric PIN' },
      { name: 'currentPin', type: 'string', description: 'Required only when updating an existing PIN' },
    ],
    sampleBody: { pin: '4829' },
    sampleResponse: {
      success: true,
      requestId: 'req_81c0123ba91e4f00',
      data: { pinConfigured: true, message: 'Transaction PIN saved successfully.' },
    },
  },
  {
    id: 'acct-kyc',
    category: 'Accounts & Onboarding',
    method: 'POST',
    path: '/accounts/:accountId/kyc',
    title: 'Submit KYC Verification',
    summary: 'Submit government ID, secondary verification document (URL or base64 data URI), and SSN/BVN for compliance review.',
    permission: 'accounts:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'ssnOrBvn', type: 'string', required: true, description: 'National Tax ID / SSN / BVN' },
      { name: 'idCard', type: 'string', required: true, description: 'HTTPS image URL or data:image base64 URI of government ID' },
      { name: 'otherVerification', type: 'string', required: true, description: 'HTTPS image URL or data:image base64 URI of proof of address/selfie' },
    ],
    sampleBody: {
      ssnOrBvn: '123-45-6789',
      idCard: 'https://cdn.example.com/kyc/passport.png',
      otherVerification: 'https://cdn.example.com/kyc/utility-bill.png',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_903fa812cd4e01b2',
      data: { kycStatus: 'Pending', message: 'KYC verification documents submitted for review.' },
    },
  },

  // ── Balances & Overview ──────────────────────────────────────────────────────
  {
    id: 'bal-get',
    category: 'Balances & Overview',
    method: 'GET',
    path: '/accounts/:accountId/balance',
    title: 'Get Account Balance & Multi-Currency Valuation',
    summary: 'Retrieve real-time checking balance, savings balance, total net worth, and optional FX conversion (USD, GBP, EUR).',
    permission: 'accounts:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    queryParams: [{ name: 'currency', type: 'string', description: 'USD (default) | GBP | EUR' }],
    defaultQuery: { currency: 'USD' },
    sampleResponse: {
      success: true,
      requestId: 'req_e8120312fa09be11',
      data: {
        accountNumber: '482910384712',
        routingNumber: '021000021',
        currency: 'USD',
        exchangeRate: 1,
        balance: 15420.5,
        savingsBalance: 5000,
        totalNetWorth: 20420.5,
        tokenBalance: 100,
      },
    },
  },
  {
    id: 'bal-dashboard',
    category: 'Balances & Overview',
    method: 'GET',
    path: '/accounts/:accountId/dashboard',
    title: 'Get Account Dashboard Summary',
    summary: 'Fetch account metadata, wealth totals, last 5 transactions, completed credit/debit aggregates, and unread notification count.',
    permission: 'accounts:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_b92014c88f1200ab',
      data: {
        account: { firstName: 'Elena', balance: 15420.5 },
        wealthTotals: { checking: 15420.5, totalNetWorth: 20420.5 },
        recentTransactions: [],
        unreadNotifications: 2,
      },
    },
  },
  {
    id: 'bal-restrictions',
    category: 'Balances & Overview',
    method: 'GET',
    path: '/accounts/:accountId/restrictions',
    title: 'Get Compliance & Withdrawal Restrictions',
    summary: 'Inspect transfer/withdrawal enablement flags, single withdrawal limit, block reasons, and compliance requirements.',
    permission: 'accounts:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_47bc88291a0ef12c',
      data: {
        transfersEnabled: true,
        withdrawalsEnabled: true,
        withdrawalLimit: 10000,
        transfersBlockReason: '',
        withdrawalsBlockReason: '',
      },
    },
  },

  // ── Money Movement ───────────────────────────────────────────────────────────
  {
    id: 'tx-deposit',
    category: 'Money Movement',
    method: 'POST',
    path: '/accounts/:accountId/deposit',
    title: 'Deposit Money',
    summary: 'Credit funds into a checking account, generate an official PDF receipt, and send email & in-app confirmations.',
    permission: 'transactions:deposit',
    authRequired: true,
    idempotent: true,
    notes: [
      'Maximum single deposit is $50,000 USD.',
      'Supply Idempotency-Key header so network retries never double-credit the account.',
      'If your API key enforces PIN & TTN, include "pin" and "trackTokenNumber" in the JSON body.',
    ],
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Deposit amount in USD (0.01 - 50000)' },
      { name: 'method', type: 'string', description: 'bank_transfer (default), ach, wire, card, crypto_btc, crypto_eth, crypto_usdt, paypal, etc.' },
      { name: 'description', type: 'string', description: 'Custom ledger description' },
      { name: 'note', type: 'string', description: 'Optional audit memo' },
      { name: 'pin', type: 'string', description: 'Transaction PIN (required if key enforces PIN/TTN)' },
      { name: 'trackTokenNumber', type: 'string', description: 'Track Token Number (required if key enforces PIN/TTN)' },
    ],
    sampleBody: {
      amount: 1500,
      method: 'ach',
      description: 'API Treasury Funding',
      note: 'Invoice #INV-204',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_5a918bc7001928fe',
      data: {
        transaction: { transactionId: 'TXN7A8B9C0D1E2F', amount: 1500, status: 'completed', balanceAfter: 16920.5 },
        newBalance: 16920.5,
        receiptPdfEndpoint: '/api/v1/accounts/673f.../receipts/TXN7A8B9C0D1E2F/pdf',
      },
    },
  },
  {
    id: 'tx-withdraw',
    category: 'Money Movement',
    method: 'POST',
    path: '/accounts/:accountId/withdraw',
    title: 'Withdraw Money',
    summary: 'Submit an outbound withdrawal request (pending approval by default, or instant atomic settlement if enabled on the API key).',
    permission: 'transactions:withdraw',
    authRequired: true,
    idempotent: true,
    notes: [
      'Enforces account withdrawalsEnabled flag, withdrawalLimit, and sufficient balance (amount + rail fee).',
      'Fees: ach ($0), wire ($25), card ($1.50), crypto_* ($5).',
    ],
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Withdrawal amount in USD' },
      { name: 'method', type: 'string', description: 'ach (default), wire, iban, card, crypto_btc, crypto_eth, crypto_usdt, crypto_sol' },
      { name: 'description', type: 'string', description: 'Withdrawal description' },
      { name: 'note', type: 'string', description: 'Optional memo' },
      { name: 'bankDetails', type: 'object', description: 'Optional beneficiary routing/account/IBAN details' },
      { name: 'cryptoDetails', type: 'object', description: 'Optional { coin, coinAmount, network, walletAddress }' },
    ],
    sampleBody: {
      amount: 450,
      method: 'ach',
      description: 'Vendor Payout',
      bankDetails: { bankName: 'Chase', routingNumber: '021000021', accountNumber: '0009918273' },
    },
    sampleResponse: {
      success: true,
      requestId: 'req_11cc829ab7f10301',
      data: {
        transaction: { transactionId: 'TXN3C4D5E6F7A8B', amount: 450, status: 'pending' },
        pendingApproval: true,
        currentBalance: 16920.5,
      },
    },
  },
  {
    id: 'tx-transfer',
    category: 'Money Movement',
    method: 'POST',
    path: '/accounts/:accountId/transfer',
    title: 'Transfer Money',
    summary: 'Atomically transfer funds to another Blue ridge Bank account (by email or 12-digit accountNumber) or external recipient.',
    permission: 'transactions:transfer',
    authRequired: true,
    idempotent: true,
    notes: [
      'Maximum single transfer is $100,000 USD.',
      'Blocks self-transfers and respects account transfersEnabled compliance controls.',
    ],
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Source account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Transfer amount in USD (0.01 - 100000)' },
      { name: 'recipientEmail', type: 'string', description: 'Recipient email address (supply email or accountNumber)' },
      { name: 'recipientAccountNumber', type: 'string', description: 'Recipient 12-digit Blue ridge Bank account number' },
      { name: 'description', type: 'string', description: 'Custom transfer description' },
      { name: 'note', type: 'string', description: 'Reference note' },
    ],
    sampleBody: {
      amount: 250,
      recipientEmail: 'sam@nexabanking.com',
      description: 'Consulting Retainer',
      note: 'Q4 Settlement',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_ff91a032b8e1102a',
      data: {
        transaction: { transactionId: 'TXN9B8A7C6D5E4F', amount: 250, status: 'completed', balanceAfter: 16670.5 },
        newBalance: 16670.5,
        recipientFound: true,
      },
    },
  },
  {
    id: 'tx-bill-pay',
    category: 'Money Movement',
    method: 'POST',
    path: '/accounts/:accountId/bill-pay',
    title: 'Pay Utility or Merchant Bill',
    summary: 'Settle a utility, telecom, or merchant invoice directly from the client\'s checking balance with PDF receipt generation.',
    permission: 'transactions:bill_pay',
    authRequired: true,
    idempotent: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [
      { name: 'amount', type: 'number', required: true, description: 'Bill amount in USD' },
      { name: 'billType', type: 'string', required: true, description: 'Biller or category (e.g. Electricity, Cloud Hosting)' },
      { name: 'billerAccountNumber', type: 'string', required: true, description: 'Customer reference/account number with biller' },
      { name: 'description', type: 'string', description: 'Optional description' },
    ],
    sampleBody: {
      amount: 120.5,
      billType: 'Electricity Utility',
      billerAccountNumber: 'EL-9948201',
      description: 'Monthly Power Statement',
    },
    sampleResponse: {
      success: true,
      requestId: 'req_4103ac91b8e72011',
      data: {
        transaction: { transactionId: 'TXN1E2F3A4B5C6D', amount: 120.5, category: 'bill', status: 'completed' },
        newBalance: 16550,
      },
    },
  },

  // ── Transactions & Receipts ──────────────────────────────────────────────────
  {
    id: 'hist-list',
    category: 'Transactions & Receipts',
    method: 'GET',
    path: '/accounts/:accountId/transactions',
    title: 'Get Account Transaction History',
    summary: 'Retrieve paginated transaction history with filtering by status, category, type (credit/debit), date range, and search query.',
    permission: 'transactions:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    queryParams: [
      { name: 'page', type: 'number', description: 'Page number (default 1)' },
      { name: 'limit', type: 'number', description: 'Results per page (max 100, default 20)' },
      { name: 'status', type: 'string', description: 'completed | pending | failed | cancelled' },
      { name: 'type', type: 'string', description: 'credit | debit' },
      { name: 'category', type: 'string', description: 'deposit | withdrawal | transfer_in | transfer_out | bill | ...' },
      { name: 'search', type: 'string', description: 'Search description or transactionId' },
      { name: 'startDate', type: 'string', description: 'ISO 8601 start date' },
      { name: 'endDate', type: 'string', description: 'ISO 8601 end date' },
    ],
    defaultQuery: { page: '1', limit: '10' },
    sampleResponse: {
      success: true,
      requestId: 'req_7744bc0912ea3110',
      data: { transactions: [], stats: { credit: { total: 1500, count: 1 }, debit: { total: 370.5, count: 2 } } },
      meta: { pagination: { page: 1, limit: 10, total: 3, pages: 1 } },
    },
  },
  {
    id: 'hist-get',
    category: 'Transactions & Receipts',
    method: 'GET',
    path: '/accounts/:accountId/transactions/:transactionId',
    title: 'Get Single Transaction Detail',
    summary: 'Look up an individual transaction by its TXN reference or MongoDB ID.',
    permission: 'transactions:read',
    authRequired: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' },
      { name: 'transactionId', type: 'string', required: true, description: 'Transaction ID (TXN...) or ObjectId', example: 'TXN7A8B9C0D1E2F' },
    ],
    sampleResponse: {
      success: true,
      requestId: 'req_3912bc8102aa4419',
      data: { transaction: { transactionId: 'TXN7A8B9C0D1E2F', amount: 1500, status: 'completed' } },
    },
  },
  {
    id: 'hist-receipt-json',
    category: 'Transactions & Receipts',
    method: 'GET',
    path: '/accounts/:accountId/receipts/:transactionId',
    title: 'Get Official Receipt Metadata',
    summary: 'Retrieve structured JSON receipt fields and PDF download endpoint for a transaction.',
    permission: 'transactions:read',
    authRequired: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' },
      { name: 'transactionId', type: 'string', required: true, description: 'Transaction ID (TXN...)', example: 'TXN7A8B9C0D1E2F' },
    ],
    sampleResponse: {
      success: true,
      requestId: 'req_a098123bce441209',
      data: {
        accountHolder: 'Elena Vance',
        accountNumberMasked: '****4712',
        routingNumber: '021000021',
        pdfDownloadUrl: '/api/v1/accounts/673f.../receipts/TXN7A8B9C0D1E2F/pdf',
      },
    },
  },
  {
    id: 'hist-receipt-pdf',
    category: 'Transactions & Receipts',
    method: 'GET',
    path: '/accounts/:accountId/receipts/:transactionId/pdf',
    title: 'Download Official PDF Receipt',
    summary: 'Stream a certified Blue ridge Bank PDF receipt binary document directly for storage or client download.',
    permission: 'transactions:read',
    authRequired: true,
    isBinary: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' },
      { name: 'transactionId', type: 'string', required: true, description: 'Transaction ID (TXN...)', example: 'TXN7A8B9C0D1E2F' },
    ],
    sampleResponse: '%PDF-1.4 (Binary PDF stream — Content-Type: application/pdf)',
  },

  // ── Debit Cards ──────────────────────────────────────────────────────────────
  {
    id: 'card-get',
    category: 'Debit Cards',
    method: 'GET',
    path: '/accounts/:accountId/card',
    title: 'Get Debit Card Status & Credentials',
    summary: 'Retrieve debit card issuance status and masked PAN. Pass ?reveal=true (with X-Account-Pin header if a PIN is set) to reveal full PAN, expiry, and CVV for Active cards.',
    permission: 'cards:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    queryParams: [
      { name: 'reveal', type: 'boolean', description: 'Set to true to reveal Active card PAN/CVV' },
      { name: 'pin', type: 'string', description: 'Account PIN if reveal=true and PIN is configured (or pass X-Account-Pin header)' },
    ],
    defaultQuery: { reveal: 'false' },
    sampleResponse: {
      success: true,
      requestId: 'req_1092cd81ff340291',
      data: {
        cardStatus: 'Active',
        cardType: 'Visa',
        cardNumberMasked: '**** **** **** 4491',
        cardExpiry: '••/••',
        cvv: '•••',
      },
    },
  },
  {
    id: 'card-request',
    category: 'Debit Cards',
    method: 'POST',
    path: '/accounts/:accountId/card/request',
    title: 'Request Commercial Debit Card',
    summary: 'Submit a new Visa or Mastercard debit card request. Deducts the configured card issuance fee from checking balance.',
    permission: 'cards:write',
    authRequired: true,
    idempotent: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [{ name: 'cardType', type: 'string', required: true, description: '"Visa" or "Mastercard"' }],
    sampleBody: { cardType: 'Visa' },
    sampleResponse: {
      success: true,
      requestId: 'req_8120ac91fe0012bc',
      data: { cardStatus: 'Pending Approval', cardType: 'Visa', feeDeducted: 50, newBalance: 16500 },
    },
  },

  // ── Wealth & Reserves ────────────────────────────────────────────────────────
  {
    id: 'wealth-overview',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth',
    title: 'Get Consolidated Wealth Valuation',
    summary: 'Aggregate checking, savings, crypto treasury, physical/bond reserves, investments, trust fund, and linked institutions with allocation percentages.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    queryParams: [{ name: 'currency', type: 'string', description: 'USD | GBP | EUR' }],
    defaultQuery: { currency: 'USD' },
    sampleResponse: {
      success: true,
      requestId: 'req_6109da8821cc3001',
      data: {
        currency: 'USD',
        totalNetWorth: 16470000,
        breakdown: { checking: 1430000, crypto: 1470000, treasury: 3100000, investments: 4670000, trust: 5000000 },
      },
    },
  },
  {
    id: 'wealth-crypto',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth/crypto',
    title: 'Get Digital Asset Custody Holdings',
    summary: 'List digital currency holdings (BTC, ETH, SOL, BNB, USDT), wallet addresses, networks, and live valuations.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_1102fa891c34ab02',
      data: { assets: [], totalValueUSD: 1470000, count: 5 },
    },
  },
  {
    id: 'wealth-treasury',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth/treasury',
    title: 'Get Treasury & Reserve Assets',
    summary: 'Retrieve vaulted bullion, sovereign bonds, fine art, luxury reserves, serial numbers, and custody locations.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_99402ab10f23cc44',
      data: { assets: [], totalValueUSD: 3100000, count: 9 },
    },
  },
  {
    id: 'wealth-investments',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth/investments',
    title: 'Get Equity & Investment Positions',
    summary: 'List stock, ETF, private equity, real estate fund, and fixed income holdings with ROI percentages.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_5501cd98ab123400',
      data: { investments: [], totalValueUSD: 4670000, count: 20 },
    },
  },
  {
    id: 'wealth-trust',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth/trust',
    title: 'Get Fiduciary Trust Fund',
    summary: 'Read revocable/irrevocable trust status, trustees, beneficiaries, balance, and custody notes.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_3120ff91a032bb11',
      data: { trust: { enabled: true, name: 'Chase Family Revocable Living Trust', balance: 5000000 } },
    },
  },
  {
    id: 'wealth-linked',
    category: 'Wealth & Reserves',
    method: 'GET',
    path: '/accounts/:accountId/wealth/linked-accounts',
    title: 'Get Linked External Institutions',
    summary: 'Retrieve connected external bank and digital wallet accounts with reported balances.',
    permission: 'wealth:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_0912cc7712ba8833',
      data: { linkedAccounts: [], totalBalanceUSD: 5800000, count: 6 },
    },
  },

  // ── Security Tokens ──────────────────────────────────────────────────────────
  {
    id: 'tokens-get',
    category: 'Security Tokens',
    method: 'GET',
    path: '/accounts/:accountId/tokens',
    title: 'Get Security Token Balance & Packages',
    summary: 'Inspect current security authorization token balance, TTN status, per-transaction token cost, and available allocation packages.',
    permission: 'accounts:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_4901da98fe0210ab',
      data: {
        tokenBalance: 300,
        hasTrackToken: true,
        costPerTransaction: 10,
        enforcePinAndTtnOnKey: false,
        packages: [{ tokens: 100, price: 10 }, { tokens: 300, price: 20 }, { tokens: 500, price: 30 }],
      },
    },
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  {
    id: 'notif-list',
    category: 'Notifications',
    method: 'GET',
    path: '/accounts/:accountId/notifications',
    title: 'List Account Notifications',
    summary: 'Retrieve recent transaction, security, and system alerts along with total unread count.',
    permission: 'notifications:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    queryParams: [{ name: 'limit', type: 'number', description: 'Max notifications to return (default 30, max 100)' }],
    sampleResponse: {
      success: true,
      requestId: 'req_8831ab22cd9011ee',
      data: { notifications: [], unreadCount: 1 },
    },
  },
  {
    id: 'notif-read-all',
    category: 'Notifications',
    method: 'PATCH',
    path: '/accounts/:accountId/notifications/read-all',
    title: 'Mark All Notifications Read',
    summary: 'Mark every unread notification for the target account as read.',
    permission: 'notifications:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_7620aa1109bc8812',
      data: { markedRead: 3 },
    },
  },
  {
    id: 'notif-read-one',
    category: 'Notifications',
    method: 'PATCH',
    path: '/accounts/:accountId/notifications/:notificationId/read',
    title: 'Mark Single Notification Read',
    summary: 'Mark a specific notification record as read.',
    permission: 'notifications:write',
    authRequired: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' },
      { name: 'notificationId', type: 'string', required: true, description: 'Notification ObjectId', example: '673f1c8a9e2b1d0012a4b5c9' },
    ],
    sampleResponse: {
      success: true,
      requestId: 'req_6192aa30bc0192fe',
      data: { notification: { _id: '673f1c8a9e2b1d0012a4b5c9', read: true } },
    },
  },
  {
    id: 'notif-delete',
    category: 'Notifications',
    method: 'DELETE',
    path: '/accounts/:accountId/notifications/:notificationId',
    title: 'Delete Notification',
    summary: 'Permanently delete a notification from the client\'s inbox.',
    permission: 'notifications:write',
    authRequired: true,
    pathParams: [
      { name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' },
      { name: 'notificationId', type: 'string', required: true, description: 'Notification ObjectId', example: '673f1c8a9e2b1d0012a4b5c9' },
    ],
    sampleResponse: {
      success: true,
      requestId: 'req_9081bc4412aa7711',
      data: { deleted: true, id: '673f1c8a9e2b1d0012a4b5c9' },
    },
  },

  // ── Support Chat ─────────────────────────────────────────────────────────────
  {
    id: 'chat-get',
    category: 'Support Chat',
    method: 'GET',
    path: '/accounts/:accountId/chat',
    title: 'Get Support Chat History',
    summary: 'Retrieve chronological support desk conversation history and mark admin replies as read.',
    permission: 'chat:read',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    sampleResponse: {
      success: true,
      requestId: 'req_2209ff18ba773311',
      data: { messages: [{ senderRole: 'user', message: 'Hello, checking my wire limit.' }] },
    },
  },
  {
    id: 'chat-post',
    category: 'Support Chat',
    method: 'POST',
    path: '/accounts/:accountId/chat',
    title: 'Send Support Chat Message',
    summary: 'Send a live message on behalf of the client to the Blue ridge Bank Admin Support Desk (pushed via Socket.io in real time).',
    permission: 'chat:write',
    authRequired: true,
    pathParams: [{ name: 'accountId', type: 'string', required: true, description: 'Account identifier or "me"', example: 'me' }],
    bodyParams: [{ name: 'message', type: 'string', required: true, description: 'Message content to transmit' }],
    sampleBody: { message: 'Hello Support, please verify our latest wire transfer TXN7A8B9C0D1E2F.' },
    sampleResponse: {
      success: true,
      requestId: 'req_5509ee21aa44bc81',
      data: { message: { _id: '673f...', senderRole: 'user', message: 'Hello Support...' } },
    },
  },
]

export function buildResolvedUrl(endpoint: EndpointDoc, baseUrl: string): string {
  let path = endpoint.path
  for (const p of endpoint.pathParams || []) {
    path = path.replace(`:${p.name}`, encodeURIComponent(p.example || 'me'))
  }
  const cleanBase = baseUrl.replace(/\/$/, '')
  const qs = endpoint.defaultQuery
    ? '?' + new URLSearchParams(endpoint.defaultQuery).toString()
    : ''
  return `${cleanBase}${path}${qs}`
}

export function generateCodeSnippet(
  endpoint: EndpointDoc,
  language: LanguageId,
  baseUrl: string,
  apiKeyInput: string
): string {
  const key = apiKeyInput.trim() || 'brb_live_YOUR_API_KEY'
  const url = buildResolvedUrl(endpoint, baseUrl)
  const hasBody = Boolean(endpoint.sampleBody && ['POST', 'PATCH'].includes(endpoint.method))
  const bodyJson = hasBody ? JSON.stringify(endpoint.sampleBody, null, 2) : ''
  const bodyCompact = hasBody ? JSON.stringify(endpoint.sampleBody) : ''

  switch (language) {
    case 'curl': {
      const lines = [`curl -X ${endpoint.method} "${url}"`]
      if (endpoint.authRequired) lines.push(`  -H "X-API-Key: ${key}"`)
      if (hasBody) lines.push(`  -H "Content-Type: application/json"`)
      if (endpoint.idempotent) lines.push(`  -H "Idempotency-Key: idem_$(date +%s)"`)
      if (hasBody) lines.push(`  -d '${bodyCompact.replace(/'/g, "'\\''")}'`)
      if (endpoint.isBinary) lines.push(`  -o receipt.pdf`)
      return lines.join(' \\\n')
    }

    case 'javascript': {
      const headers: Record<string, string> = {}
      if (endpoint.authRequired) headers['X-API-Key'] = key
      if (hasBody) headers['Content-Type'] = 'application/json'
      if (endpoint.idempotent) headers['Idempotency-Key'] = 'idem-unique-12345'

      const fetchOpts: string[] = [`  method: '${endpoint.method}'`]
      if (Object.keys(headers).length) {
        fetchOpts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`)
      }
      if (hasBody) {
        fetchOpts.push(`  body: JSON.stringify(${bodyJson.replace(/\n/g, '\n  ')})`)
      }

      if (endpoint.isBinary) {
        return `import fs from 'node:fs';

const response = await fetch('${url}', {
${fetchOpts.join(',\n')}
});
if (!response.ok) throw new Error(await response.text());
const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync('receipt.pdf', buffer);
console.log('Saved receipt.pdf');`
      }

      return `const response = await fetch('${url}', {
${fetchOpts.join(',\n')}
});

const result = await response.json();
console.log(result);`
    }

    case 'python': {
      const headers: Record<string, string> = {}
      if (endpoint.authRequired) headers['X-API-Key'] = key
      if (endpoint.idempotent) headers['Idempotency-Key'] = 'idem-unique-12345'

      const lines = ['import requests', '']
      lines.push(`url = "${url}"`)
      if (Object.keys(headers).length) {
        lines.push(`headers = ${JSON.stringify(headers, null, 4)}`)
      }
      if (hasBody) {
        lines.push(`payload = ${bodyJson}`)
      }

      const args = ['url']
      if (Object.keys(headers).length) args.push('headers=headers')
      if (hasBody) args.push('json=payload')

      lines.push(`response = requests.${endpoint.method.toLowerCase()}(${args.join(', ')})`)
      if (endpoint.isBinary) {
        lines.push('response.raise_for_status()')
        lines.push('with open("receipt.pdf", "wb") as f:')
        lines.push('    f.write(response.content)')
        lines.push('print("Saved receipt.pdf")')
      } else {
        lines.push('print(response.status_code, response.json())')
      }
      return lines.join('\n')
    }

    case 'php': {
      const headerArr: string[] = []
      if (endpoint.authRequired) headerArr.push(`"X-API-Key: ${key}"`)
      if (hasBody) headerArr.push(`"Content-Type: application/json"`)
      if (endpoint.idempotent) headerArr.push(`"Idempotency-Key: idem-unique-12345"`)

      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `<?php
$ch = curl_init("${url}");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${endpoint.method}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
${headerArr.length ? `curl_setopt($ch, CURLOPT_HTTPHEADER, [\n  ${headerArr.join(',\n  ')}\n]);\n` : ''}${hasBody ? `curl_setopt($ch, CURLOPT_POSTFIELDS, '${escapedBody}');\n` : ''}$response = curl_exec($ch);
curl_close($ch);
${endpoint.isBinary ? `file_put_contents("receipt.pdf", $response);\necho "Saved receipt.pdf\\n";` : `print_r(json_decode($response, true));`}
?>`
    }

    case 'go': {
      const imports = hasBody
        ? `import (\n\t"bytes"\n\t"fmt"\n\t"io"\n\t"net/http"${endpoint.isBinary ? '\n\t"os"' : ''}\n)`
        : `import (\n\t"fmt"\n\t"io"\n\t"net/http"${endpoint.isBinary ? '\n\t"os"' : ''}\n)`
      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `package main

${imports}

func main() {
${hasBody ? `\tpayload := []byte("${escapedBody}")\n\treq, _ := http.NewRequest("${endpoint.method}", "${url}", bytes.NewBuffer(payload))` : `\treq, _ := http.NewRequest("${endpoint.method}", "${url}", nil)`}
${endpoint.authRequired ? `\treq.Header.Set("X-API-Key", "${key}")\n` : ''}${hasBody ? `\treq.Header.Set("Content-Type", "application/json")\n` : ''}${endpoint.idempotent ? `\treq.Header.Set("Idempotency-Key", "idem-unique-12345")\n` : ''}\tresp, err := (&http.Client{}).Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tbody, _ := io.ReadAll(resp.Body)
${endpoint.isBinary ? `\t_ = os.WriteFile("receipt.pdf", body, 0644)\n\tfmt.Println("Saved receipt.pdf")` : `\tfmt.Println(string(body))`}
}`
    }

    case 'java': {
      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const bodyPublisher = hasBody
        ? `HttpRequest.BodyPublishers.ofString("${escapedBody}")`
        : 'HttpRequest.BodyPublishers.noBody()'

      return `import java.net.URI;
import java.net.http.*;
${endpoint.isBinary ? 'import java.nio.file.*;\n' : ''}
public class BlueRidgeBankClient {
  public static void main(String[] args) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create("${url}"))
${endpoint.authRequired ? `      .header("X-API-Key", "${key}")\n` : ''}${hasBody ? `      .header("Content-Type", "application/json")\n` : ''}${endpoint.idempotent ? `      .header("Idempotency-Key", "idem-unique-12345")\n` : ''}      .method("${endpoint.method}", ${bodyPublisher})
      .build();

${
  endpoint.isBinary
    ? `    HttpResponse<byte[]> res = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
    Files.write(Path.of("receipt.pdf"), res.body());`
    : `    HttpResponse<String> res = client.send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(res.body());`
}
  }
}`
    }

    case 'csharp': {
      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `using System.Net.Http;
using System.Text;

using var client = new HttpClient();
${endpoint.authRequired ? `client.DefaultRequestHeaders.Add("X-API-Key", "${key}");\n` : ''}${endpoint.idempotent ? `client.DefaultRequestHeaders.Add("Idempotency-Key", "idem-unique-12345");\n` : ''}using var req = new HttpRequestMessage(new HttpMethod("${endpoint.method}"), "${url}");
${hasBody ? `req.Content = new StringContent("${escapedBody}", Encoding.UTF8, "application/json");\n` : ''}using var res = await client.SendAsync(req);
${endpoint.isBinary ? `await File.WriteAllBytesAsync("receipt.pdf", await res.Content.ReadAsByteArrayAsync());\nConsole.WriteLine("Saved receipt.pdf");` : `Console.WriteLine(await res.Content.ReadAsStringAsync());`}`
    }

    case 'ruby': {
      const methodClassMap: Record<HttpMethod, string> = {
        GET: 'Net::HTTP::Get',
        POST: 'Net::HTTP::Post',
        PATCH: 'Net::HTTP::Patch',
        DELETE: 'Net::HTTP::Delete',
      }
      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `require 'net/http'
require 'uri'
require 'json'

uri = URI('${url}')
req = ${methodClassMap[endpoint.method]}.new(uri)
${endpoint.authRequired ? `req['X-API-Key'] = '${key}'\n` : ''}${hasBody ? `req['Content-Type'] = 'application/json'\n` : ''}${endpoint.idempotent ? `req['Idempotency-Key'] = 'idem-unique-12345'\n` : ''}${hasBody ? `req.body = '${escapedBody}'\n` : ''}res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(req) }
${endpoint.isBinary ? `File.binwrite('receipt.pdf', res.body)\nputs 'Saved receipt.pdf'` : `puts res.body`}`
    }

    case 'rust': {
      const methodCall = endpoint.method.toLowerCase()
      const escapedBody = bodyCompact.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `// Cargo.toml: reqwest = { version = "0.12", features = ["json"] }, tokio = { version = "1", features = ["full"] }
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let res = client
        .${methodCall}("${url}")
${endpoint.authRequired ? `        .header("X-API-Key", "${key}")\n` : ''}${hasBody ? `        .header("Content-Type", "application/json")\n` : ''}${endpoint.idempotent ? `        .header("Idempotency-Key", "idem-unique-12345")\n` : ''}${hasBody ? `        .body("${escapedBody}")\n` : ''}        .send()
        .await?;

${endpoint.isBinary ? `    std::fs::write("receipt.pdf", res.bytes().await?)?;` : `    println!("{}", res.text().await?);`}
    Ok(())
}`
    }
  }
}

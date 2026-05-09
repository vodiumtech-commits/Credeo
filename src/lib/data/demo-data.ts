/**
 * Vodium Ledger — rich demo data.
 * All names are realistic Nigerian campus characters.
 * All amounts are realistic NGN campus credit values.
 * Used when DB is not seeded / for preview mode.
 */

// ─── Vendor (logged-in context: Mama Taiwo, UNILAG) ─────────────────────────

export const DEMO_VENDOR = {
  id: "v-mama-taiwo",
  businessName: "Mama Taiwo's Provisions",
  ownerName: "Taiwo Adeyemi",
  phone: "+2348012345678",
  email: "taiwo@mamataiwoprovisions.ng",
  vendorType: "PROVISION_SHOP" as const,
  campusLocation: "Faculty of Arts Complex, Block C",
  university: { name: "University of Lagos", shortName: "UNILAG" },
  subscription: { plan: "GROWTH" as const, status: "ACTIVE" as const, monthlyAmount: 5000 },
  createdAt: new Date("2025-11-15"),
  totalCreditsLogged: 183,
};

// ─── Vendor KPIs ─────────────────────────────────────────────────────────────

export const VENDOR_STATS = {
  totalOwed: 324_500,
  paidThisMonth: 178_000,
  customersOwing: 47,
  overdueCount: 8,
  dueSoonCount: 5,
  recoveryRate: 82,
  avgCreditAmount: 3_200,
  totalStudents: 63,
  creditsThisMonth: 38,
};

// ─── Monthly volume (last 6 months) ──────────────────────────────────────────

export const VENDOR_MONTHLY_VOLUME = [
  { month: "Nov", extended: 45_000, recovered: 38_000 },
  { month: "Dec", extended: 89_000, recovered: 72_000 },
  { month: "Jan", extended: 124_000, recovered: 98_000 },
  { month: "Feb", extended: 156_000, recovered: 132_000 },
  { month: "Mar", extended: 198_000, recovered: 155_000 },
  { month: "Apr", extended: 245_000, recovered: 178_000 },
];

// ─── Customers (47 total, showing top 20 in table) ───────────────────────────

export type CustomerRow = {
  id: string;
  fullName: string;
  matricNumber: string;
  phone: string;
  vodiumScore: number;
  totalCredits: number;
  totalOwed: number;
  lastActivity: string;
  status: "outstanding" | "overdue" | "paid" | "due_soon";
};

export const DEMO_CUSTOMERS: CustomerRow[] = [
  { id: "s1",  fullName: "Emeka Okonkwo",       matricNumber: "2018/1234",  phone: "+2348011111111", vodiumScore: 820, totalCredits: 8,  totalOwed: 0,      lastActivity: "2h ago",    status: "paid" },
  { id: "s2",  fullName: "Chidinma Eze",         matricNumber: "2019/5678",  phone: "+2348022222222", vodiumScore: 760, totalCredits: 5,  totalOwed: 2_500,  lastActivity: "4h ago",    status: "due_soon" },
  { id: "s3",  fullName: "Babatunde Adeyemi",    matricNumber: "2020/9012",  phone: "+2348033333333", vodiumScore: 540, totalCredits: 4,  totalOwed: 4_200,  lastActivity: "3 days ago",status: "overdue" },
  { id: "s4",  fullName: "Folake Ogundimu",      matricNumber: "2018/3456",  phone: "+2348044444444", vodiumScore: 890, totalCredits: 12, totalOwed: 0,      lastActivity: "Yesterday", status: "paid" },
  { id: "s5",  fullName: "Ibrahim Suleiman",     matricNumber: "2021/7890",  phone: "+2348055555555", vodiumScore: 680, totalCredits: 3,  totalOwed: 1_800,  lastActivity: "1 day ago", status: "outstanding" },
  { id: "s6",  fullName: "Chiamaka Obi",         matricNumber: "2019/2345",  phone: "+2348066666666", vodiumScore: 390, totalCredits: 6,  totalOwed: 5_500,  lastActivity: "5 days ago",status: "overdue" },
  { id: "s7",  fullName: "Taiwo Adesanya",       matricNumber: "2020/6789",  phone: "+2348077777777", vodiumScore: 510, totalCredits: 2,  totalOwed: 2_200,  lastActivity: "2 days ago",status: "outstanding" },
  { id: "s8",  fullName: "Kunle Adeola",         matricNumber: "2021/1234",  phone: "+2348088888888", vodiumScore: 720, totalCredits: 5,  totalOwed: 3_000,  lastActivity: "5h ago",    status: "due_soon" },
  { id: "s9",  fullName: "Ngozi Okafor",         matricNumber: "2019/5678",  phone: "+2348099999999", vodiumScore: 320, totalCredits: 4,  totalOwed: 8_000,  lastActivity: "10 days ago",status: "overdue" },
  { id: "s10", fullName: "Adaeze Nwosu",         matricNumber: "2020/9012",  phone: "+2348000000001", vodiumScore: 670, totalCredits: 3,  totalOwed: 4_500,  lastActivity: "3 days ago",status: "outstanding" },
  { id: "s11", fullName: "Segun Balogun",        matricNumber: "2020/4445",  phone: "+2348000000002", vodiumScore: 450, totalCredits: 3,  totalOwed: 2_800,  lastActivity: "2 days ago",status: "overdue" },
  { id: "s12", fullName: "Amaka Chukwu",         matricNumber: "2021/1156",  phone: "+2348000000003", vodiumScore: 730, totalCredits: 4,  totalOwed: 3_200,  lastActivity: "1 day ago", status: "outstanding" },
  { id: "s13", fullName: "Chidi Onyekachi",      matricNumber: "2018/7782",  phone: "+2348000000004", vodiumScore: 850, totalCredits: 10, totalOwed: 0,      lastActivity: "Yesterday", status: "paid" },
  { id: "s14", fullName: "Fatimah Abubakar",     matricNumber: "2022/0023",  phone: "+2348000000005", vodiumScore: 500, totalCredits: 2,  totalOwed: 1_500,  lastActivity: "6 days ago",status: "outstanding" },
  { id: "s15", fullName: "Olawale Oladipo",      matricNumber: "2019/3390",  phone: "+2348000000006", vodiumScore: 600, totalCredits: 6,  totalOwed: 6_000,  lastActivity: "4 days ago",status: "outstanding" },
  { id: "s16", fullName: "Kemi Adegoke",         matricNumber: "2020/8821",  phone: "+2348000000007", vodiumScore: 780, totalCredits: 7,  totalOwed: 2_000,  lastActivity: "1 day ago", status: "due_soon" },
  { id: "s17", fullName: "Uche Obi",             matricNumber: "2021/5512",  phone: "+2348000000008", vodiumScore: 460, totalCredits: 2,  totalOwed: 9_500,  lastActivity: "12 days ago",status: "overdue" },
  { id: "s18", fullName: "Blessing Okeke",       matricNumber: "2019/7743",  phone: "+2348000000009", vodiumScore: 700, totalCredits: 5,  totalOwed: 3_800,  lastActivity: "2 days ago",status: "outstanding" },
  { id: "s19", fullName: "Damilola Ogundele",    matricNumber: "2022/1102",  phone: "+2348000000010", vodiumScore: 520, totalCredits: 1,  totalOwed: 2_500,  lastActivity: "8 days ago",status: "outstanding" },
  { id: "s20", fullName: "Yetunde Fasanya",      matricNumber: "2020/9934",  phone: "+2348000000011", vodiumScore: 840, totalCredits: 9,  totalOwed: 0,      lastActivity: "3h ago",    status: "paid" },
];

// ─── Due soon list ────────────────────────────────────────────────────────────

export const DEMO_DUE_SOON = [
  { id: "c1", studentName: "Emeka Okonkwo",    matricNumber: "2018/1234", amount: 3_500, dueDate: "Tomorrow",  daysUntilDue: 1 },
  { id: "c2", studentName: "Chidinma Eze",      matricNumber: "2019/5678", amount: 2_500, dueDate: "Friday",    daysUntilDue: 3 },
  { id: "c3", studentName: "Kunle Adeola",      matricNumber: "2021/1234", amount: 3_000, dueDate: "Saturday",  daysUntilDue: 4 },
  { id: "c4", studentName: "Kemi Adegoke",      matricNumber: "2020/8821", amount: 2_000, dueDate: "Sunday",    daysUntilDue: 5 },
  { id: "c5", studentName: "Ibrahim Suleiman",  matricNumber: "2021/7890", amount: 1_800, dueDate: "Next Monday", daysUntilDue: 7 },
];

// ─── Overdue list ─────────────────────────────────────────────────────────────

export const DEMO_OVERDUE = [
  { id: "c6", studentName: "Babatunde Adeyemi", matricNumber: "2020/9012", amount: 4_200, daysOverdue: 3 },
  { id: "c7", studentName: "Chiamaka Obi",      matricNumber: "2019/2345", amount: 5_500, daysOverdue: 5 },
  { id: "c8", studentName: "Ngozi Okafor",      matricNumber: "2019/5678", amount: 8_000, daysOverdue: 10 },
  { id: "c9", studentName: "Segun Balogun",     matricNumber: "2020/4445", amount: 2_800, daysOverdue: 2 },
  { id: "c10", studentName: "Uche Obi",         matricNumber: "2021/5512", amount: 9_500, daysOverdue: 12 },
];

// ─── Recent activity feed ──────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  type: "paid" | "credit" | "reminder" | "overdue" | "score";
  text: string;
  subtext?: string;
  at: string;
};

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "paid",     text: "Emeka Okonkwo paid ₦5,500",                   subtext: "Credit fully settled",                       at: "2 hours ago" },
  { id: "a2", type: "credit",   text: "Added ₦3,200 credit for Chidinma Eze",         subtext: "Due Friday — auto-reminder set",             at: "4 hours ago" },
  { id: "a3", type: "reminder", text: "Auto-reminder sent to Babatunde Adeyemi",      subtext: "₦4,200 — 3 days overdue",                   at: "Yesterday, 9:14 AM" },
  { id: "a4", type: "paid",     text: "Folake Ogundimu paid ₦8,000",                  subtext: "Paid 1 day early — score updated to 890",    at: "Yesterday, 7:30 AM" },
  { id: "a5", type: "credit",   text: "Added ₦2,500 credit for Ibrahim Suleiman",     subtext: "Due in 7 days",                              at: "2 days ago" },
  { id: "a6", type: "overdue",  text: "Ngozi Okafor — ₦8,000 is 10 days overdue",    subtext: "3rd reminder sent via WhatsApp",             at: "2 days ago" },
  { id: "a7", type: "paid",     text: "Amaka Chukwu paid ₦1,500",                     subtext: "Partial payment received",                   at: "3 days ago" },
  { id: "a8", type: "score",    text: "Chiamaka Obi's Vodium score dropped to 390",   subtext: "5 days overdue on ₦5,500",                   at: "3 days ago" },
];

// ─── All credits (for credits page) ──────────────────────────────────────────

export type CreditRow = {
  id: string;
  studentName: string;
  matricNumber: string;
  amount: number;
  amountRepaid: number;
  description: string;
  dateExtended: string;
  dueDate: string;
  status: "OUTSTANDING" | "DUE_SOON" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "WRITTEN_OFF";
};

export const DEMO_CREDITS: CreditRow[] = [
  { id: "cr1",  studentName: "Emeka Okonkwo",    matricNumber: "2018/1234", amount: 3_500, amountRepaid: 3_500, description: "Provisions",       dateExtended: "Apr 25", dueDate: "May 9",  status: "PAID" },
  { id: "cr2",  studentName: "Chidinma Eze",      matricNumber: "2019/5678", amount: 2_500, amountRepaid: 0,     description: "Beverages",        dateExtended: "May 1",  dueDate: "May 12", status: "DUE_SOON" },
  { id: "cr3",  studentName: "Babatunde Adeyemi", matricNumber: "2020/9012", amount: 4_200, amountRepaid: 0,     description: "Toiletries + food", dateExtended: "Apr 30", dueDate: "May 6",  status: "OVERDUE" },
  { id: "cr4",  studentName: "Folake Ogundimu",   matricNumber: "2018/3456", amount: 8_000, amountRepaid: 8_000, description: "Weekly tab",       dateExtended: "Apr 20", dueDate: "May 8",  status: "PAID" },
  { id: "cr5",  studentName: "Ibrahim Suleiman",  matricNumber: "2021/7890", amount: 1_800, amountRepaid: 0,     description: "Rice + stew",      dateExtended: "May 2",  dueDate: "May 16", status: "OUTSTANDING" },
  { id: "cr6",  studentName: "Chiamaka Obi",      matricNumber: "2019/2345", amount: 5_500, amountRepaid: 0,     description: "Provisions",       dateExtended: "Apr 28", dueDate: "May 4",  status: "OVERDUE" },
  { id: "cr7",  studentName: "Taiwo Adesanya",    matricNumber: "2020/6789", amount: 2_200, amountRepaid: 0,     description: "Snacks",           dateExtended: "May 3",  dueDate: "May 23", status: "OUTSTANDING" },
  { id: "cr8",  studentName: "Kunle Adeola",      matricNumber: "2021/1234", amount: 3_000, amountRepaid: 0,     description: "Groceries",        dateExtended: "May 4",  dueDate: "May 13", status: "DUE_SOON" },
  { id: "cr9",  studentName: "Ngozi Okafor",      matricNumber: "2019/5678", amount: 8_000, amountRepaid: 0,     description: "Weekly tab",       dateExtended: "Apr 25", dueDate: "Apr 29", status: "OVERDUE" },
  { id: "cr10", studentName: "Adaeze Nwosu",      matricNumber: "2020/9012", amount: 4_500, amountRepaid: 0,     description: "Provisions",       dateExtended: "May 1",  dueDate: "May 17", status: "OUTSTANDING" },
  { id: "cr11", studentName: "Segun Balogun",     matricNumber: "2020/4445", amount: 2_800, amountRepaid: 0,     description: "Snacks + drinks",  dateExtended: "May 3",  dueDate: "May 7",  status: "OVERDUE" },
  { id: "cr12", studentName: "Amaka Chukwu",      matricNumber: "2021/1156", amount: 3_200, amountRepaid: 1_500, description: "Provisions",       dateExtended: "Apr 29", dueDate: "May 14", status: "PARTIALLY_PAID" },
  { id: "cr13", studentName: "Chidi Onyekachi",   matricNumber: "2018/7782", amount: 5_000, amountRepaid: 5_000, description: "Monthly tab",      dateExtended: "Apr 1",  dueDate: "Apr 30", status: "PAID" },
  { id: "cr14", studentName: "Fatimah Abubakar",  matricNumber: "2022/0023", amount: 1_500, amountRepaid: 0,     description: "Food items",       dateExtended: "Apr 28", dueDate: "May 19", status: "OUTSTANDING" },
  { id: "cr15", studentName: "Olawale Oladipo",   matricNumber: "2019/3390", amount: 6_000, amountRepaid: 0,     description: "Provisions",       dateExtended: "Apr 26", dueDate: "May 16", status: "OUTSTANDING" },
];

// ─── ADMIN DEMO DATA ─────────────────────────────────────────────────────────

export const ADMIN_PLATFORM_STATS = {
  totalVendors: 127,
  activeVendors: 89,
  trialVendors: 31,
  inactiveVendors: 7,
  totalStudents: 4_832,
  uniqueStudentsWithHistory: 3_914,
  totalCreditsLogged: 18_745,
  totalNairaTracked: 47_392_000,
  totalNairaRecovered: 34_721_000,
  repaymentRate: 73.4,
  mrr: 890_000,
  arr: 10_680_000,
  newVendorsThisWeek: 7,
  creditsThisWeek: 423,
  averageCreditAmount: 2_529,
  defaultRate: 6.8,
};

export const ADMIN_MRR_HISTORY = [
  { month: "Nov '25", mrr: 180_000, vendors: 18 },
  { month: "Dec '25", mrr: 320_000, vendors: 36 },
  { month: "Jan '26", mrr: 490_000, vendors: 58 },
  { month: "Feb '26", mrr: 620_000, vendors: 79 },
  { month: "Mar '26", mrr: 750_000, vendors: 105 },
  { month: "Apr '26", mrr: 890_000, vendors: 127 },
];

export const ADMIN_UNIVERSITY_BREAKDOWN = [
  { name: "UNILAG", shortName: "UNILAG", vendors: 34, students: 1_823, creditsTracked: 8_920_000, repaymentRate: 76 },
  { name: "OAU",    shortName: "OAU",    vendors: 28, students: 1_245, creditsTracked: 6_780_000, repaymentRate: 74 },
  { name: "UI",     shortName: "UI",     vendors: 22, students: 987,   creditsTracked: 5_430_000, repaymentRate: 71 },
  { name: "Covenant University", shortName: "Covenant", vendors: 18, students: 456, creditsTracked: 2_890_000, repaymentRate: 82 },
  { name: "FUTA",   shortName: "FUTA",   vendors: 15, students: 234,   creditsTracked: 1_890_000, repaymentRate: 69 },
  { name: "LASU",   shortName: "LASU",   vendors: 10, students: 87,    creditsTracked: 782_000,   repaymentRate: 68 },
];

export type AdminVendorRow = {
  id: string;
  businessName: string;
  ownerName: string;
  university: string;
  vendorType: string;
  plan: "STARTER" | "GROWTH" | "CAMPUS_PRO";
  status: "ACTIVE" | "TRIAL" | "INACTIVE" | "SUSPENDED";
  studentsCount: number;
  creditsLogged: number;
  totalTracked: number;
  mrr: number;
  joinedAt: string;
  lastActive: string;
};

export const ADMIN_VENDORS: AdminVendorRow[] = [
  { id: "v1",  businessName: "Mama Taiwo's Provisions",  ownerName: "Taiwo Adeyemi",       university: "UNILAG",    vendorType: "Provision Shop",  plan: "GROWTH",      status: "ACTIVE",    studentsCount: 63,  creditsLogged: 183, totalTracked: 324_500, mrr: 5_000,  joinedAt: "Nov 15, 2025", lastActive: "2h ago" },
  { id: "v2",  businessName: "Baba Wale's Food Canteen", ownerName: "Waheed Babatunde",    university: "UNILAG",    vendorType: "Food Canteen",    plan: "CAMPUS_PRO",  status: "ACTIVE",    studentsCount: 89,  creditsLogged: 312, totalTracked: 780_000, mrr: 10_000, joinedAt: "Oct 2, 2025",  lastActive: "1h ago" },
  { id: "v3",  businessName: "FastPrint Solutions",       ownerName: "Emmanuel Osei",       university: "OAU",       vendorType: "Print Shop",      plan: "STARTER",     status: "TRIAL",     studentsCount: 12,  creditsLogged: 28,  totalTracked: 78_000,  mrr: 0,      joinedAt: "Apr 29, 2026", lastActive: "Yesterday" },
  { id: "v4",  businessName: "Campus Bites Canteen",      ownerName: "Ngozi Eze",           university: "UI",        vendorType: "Food Canteen",    plan: "GROWTH",      status: "ACTIVE",    studentsCount: 45,  creditsLogged: 134, totalTracked: 256_000, mrr: 5_000,  joinedAt: "Dec 10, 2025", lastActive: "3h ago" },
  { id: "v5",  businessName: "Kay Laundry Services",      ownerName: "Kayode Babatunde",    university: "Covenant",  vendorType: "Laundry",         plan: "STARTER",     status: "ACTIVE",    studentsCount: 28,  creditsLogged: 67,  totalTracked: 134_000, mrr: 2_000,  joinedAt: "Jan 5, 2026",  lastActive: "4h ago" },
  { id: "v6",  businessName: "Oga Emeka's Mini Mart",     ownerName: "Emeka Chibueze",      university: "UNILAG",    vendorType: "Mini Mart",       plan: "CAMPUS_PRO",  status: "ACTIVE",    studentsCount: 102, creditsLogged: 289, totalTracked: 512_000, mrr: 10_000, joinedAt: "Sep 18, 2025", lastActive: "30m ago" },
  { id: "v7",  businessName: "Ade's Barbing Salon",       ownerName: "Adewale Okon",        university: "OAU",       vendorType: "Barbing Salon",   plan: "STARTER",     status: "ACTIVE",    studentsCount: 19,  creditsLogged: 45,  totalTracked: 89_000,  mrr: 2_000,  joinedAt: "Feb 14, 2026", lastActive: "Yesterday" },
  { id: "v8",  businessName: "Queen's Hair Salon",         ownerName: "Queeneth Adeyemi",    university: "UI",        vendorType: "Hair Salon",      plan: "GROWTH",      status: "ACTIVE",    studentsCount: 35,  creditsLogged: 78,  totalTracked: 198_000, mrr: 5_000,  joinedAt: "Jan 22, 2026", lastActive: "5h ago" },
  { id: "v9",  businessName: "Campus Pharmacy Plus",       ownerName: "Pharmacist Chucks",   university: "FUTA",      vendorType: "Pharmacy",        plan: "GROWTH",      status: "TRIAL",     studentsCount: 8,   creditsLogged: 15,  totalTracked: 45_000,  mrr: 0,      joinedAt: "May 1, 2026",  lastActive: "2 days ago" },
  { id: "v10", businessName: "Mama Sade's Kitchen",        ownerName: "Folasade Ogunrinde",  university: "LASU",      vendorType: "Food Canteen",    plan: "STARTER",     status: "ACTIVE",    studentsCount: 22,  creditsLogged: 54,  totalTracked: 112_000, mrr: 2_000,  joinedAt: "Mar 8, 2026",  lastActive: "Today" },
  { id: "v11", businessName: "Tunde Printing Press",       ownerName: "Babatunde Akinyemi",  university: "UNILAG",    vendorType: "Print Shop",      plan: "STARTER",     status: "INACTIVE",  studentsCount: 4,   creditsLogged: 8,   totalTracked: 18_000,  mrr: 0,      joinedAt: "Feb 2, 2026",  lastActive: "3 weeks ago" },
  { id: "v12", businessName: "Ibadan Student Supplies",    ownerName: "Rasheed Lawal",       university: "UI",        vendorType: "Provision Shop",  plan: "GROWTH",      status: "ACTIVE",    studentsCount: 41,  creditsLogged: 98,  totalTracked: 245_000, mrr: 5_000,  joinedAt: "Dec 28, 2025", lastActive: "6h ago" },
];

// ─── Admin recent system activity ────────────────────────────────────────────

export const ADMIN_ACTIVITY = [
  { id: "aa1", type: "vendor_joined",  text: "FastPrint Solutions joined",            subtext: "OAU — Starter plan trial",            at: "1 day ago" },
  { id: "aa2", type: "credit_logged",  text: "287 credits logged across platform",    subtext: "Last 24 hours",                       at: "Today, 8:00 AM" },
  { id: "aa3", type: "payment",        text: "Baba Wale's collected ₦78,000",         subtext: "Top vendor this week",                at: "Today, 6:45 AM" },
  { id: "aa4", type: "vendor_joined",  text: "Campus Pharmacy Plus joined",           text2: "FUTA — Growth plan trial",              subtext: "FUTA — Growth plan trial",            at: "2 days ago" },
  { id: "aa5", type: "subscription",   text: "Oga Emeka's Mini Mart upgraded",        subtext: "Starter → Campus Pro",                at: "3 days ago" },
  { id: "aa6", type: "milestone",      text: "Platform hit ₦47M total tracked",       subtext: "Up from ₦38M last month (+23.6%)",   at: "4 days ago" },
];

// ─── Score helpers ───────────────────────────────────────────────────────────

export function getScoreTier(score: number): {
  label: string;
  className: string;
  color: string;
} {
  if (score >= 750) return { label: "Excellent", className: "score-excellent", color: "#16A34A" };
  if (score >= 650) return { label: "Good",      className: "score-good",      color: "#C9A961" };
  if (score >= 450) return { label: "Fair",      className: "score-fair",      color: "#D97706" };
  return                    { label: "Poor",      className: "score-poor",      color: "#DC2626" };
}

export function getPlanLabel(plan: string): string {
  const map: Record<string, string> = {
    STARTER: "Starter",
    GROWTH: "Growth",
    CAMPUS_PRO: "Campus Pro",
  };
  return map[plan] ?? plan;
}

export function getPlanAmount(plan: string): number {
  const map: Record<string, number> = {
    STARTER: 2_000,
    GROWTH: 5_000,
    CAMPUS_PRO: 10_000,
  };
  return map[plan] ?? 0;
}



export type Transaction = {
    invoice: string;
    amount: number;
    status: "pending" | "processing" | "paid" | "failed";
    date: string;
    description: string;
    vendor: string;
};

export const transactions: Transaction[] = $state([
  {
    invoice: "INV001",
    status: "paid",
    amount: 1510000.00,
    date: "2026-09-11T14:30:28.000Z",
    vendor: "Canon Inc.",
    description: "Purchase for Canon ML-100 camera for high resolution imaging"
  },
  {
    invoice: "INV002",
    status: "pending",
    amount: 10848650.75,
    date: "2026-09-10T09:15:00.000Z",
    vendor: "Silicon Valley Microelectronics",
    description: "200 mm prime silicon wafers for photolithography process development"
  },
  {
    invoice: "INV003",
    status: "processing",
    amount: 31278770.00,
    date: "2026-09-09T16:42:13.000Z",
    vendor: "Entegris",
    description: "FOUP carriers and wafer handling components for cleanroom production"
  },
  {
    invoice: "INV004",
    status: "paid",
    amount: 3491920.20,
    date: "2026-09-08T11:05:44.000Z",
    vendor: "Fisher Scientific",
    description: "Electronic grade solvents, acids, and photoresist processing chemicals"
  },
  {
    invoice: "INV005",
    status: "failed",
    amount: 8052090.00,
    date: "2026-09-07T13:28:09.000Z",
    vendor: "KLA Corporation",
    description: "Preventive maintenance service for wafer surface inspection system"
  },
  {
    invoice: "INV006",
    status: "paid",
    amount: 11297585.50,
    date: "2026-09-06T08:50:31.000Z",
    vendor: "Brewer Science",
    description: "Spin coating materials and temporary bonding adhesives for wafer thinning"
  },
  {
    invoice: "INV007",
    status: "pending",
    amount: 458080.00,
    date: "2026-09-05T15:12:18.000Z",
    vendor: "Oxford Instruments",
    description: "Reactive ion etch chamber replacement parts for plasma process experiments"
  },
  {
    invoice: "INV008",
    status: "processing",
    amount: 1215899.99,
    date: "2026-09-04T10:37:52.000Z",
    vendor: "Kimberly-Clark Professional",
    description: "Lint-free wipes, nitrile gloves, and cleanroom garments for fab operations"
  },
  {
    invoice: "INV009",
    status: "paid",
    amount: 29633100.00,
    date: "2026-09-03T17:20:06.000Z",
    vendor: "Veeco Instruments",
    description: "Calibration and target replacement for thin-film deposition system"
  },
  {
    invoice: "INV010",
    status: "pending",
    amount: 1738040.40,
    date: "2026-09-02T12:03:27.000Z",
    vendor: "MKS Instruments",
    description: "Mass flow controllers and vacuum pressure gauges for process monitoring"
  }
]);




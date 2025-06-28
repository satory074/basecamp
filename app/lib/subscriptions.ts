export interface Subscription {
  name: string;
  logo?: string;
  monthlyFee: string;
  isActive: boolean;
  category?: string;
}

export const subscriptions: Subscription[] = [
  // 現在課金中
  {
    name: "Claude Code",
    logo: "anthropic",
    monthlyFee: "$100",
    isActive: true,
    category: "AI"
  },
  {
    name: "ChatGPT Plus",
    logo: "openai",
    monthlyFee: "$20",
    isActive: true,
    category: "AI"
  },
  {
    name: "Netflix",
    logo: "netflix",
    monthlyFee: "¥990",
    isActive: true,
    category: "Entertainment"
  },
  {
    name: "U-NEXT",
    monthlyFee: "¥2,189",
    isActive: true,
    category: "Entertainment"
  },
  {
    name: "Spotify",
    logo: "spotify",
    monthlyFee: "¥980",
    isActive: true,
    category: "Music"
  },
  {
    name: "NHK 地上契約 (年払い)",
    monthlyFee: "¥12,276/年",
    isActive: true,
    category: "TV"
  },
  {
    name: "FF14 スタンダード",
    logo: "squareenix",
    monthlyFee: "¥1,628",
    isActive: true,
    category: "Gaming"
  },
  // 過去に課金していた
  {
    name: "Hulu",
    logo: "hulu",
    monthlyFee: "¥1,026",
    isActive: false,
    category: "Entertainment"
  },
  {
    name: "Cursor",
    monthlyFee: "$20",
    isActive: false,
    category: "Development"
  },
  {
    name: "Google Advanced",
    logo: "google",
    monthlyFee: "¥1,300",
    isActive: false,
    category: "Cloud"
  },
  {
    name: "マガポケ 定期購読",
    monthlyFee: "¥1,080",
    isActive: false,
    category: "Manga"
  },
  {
    name: "Amazon Prime",
    logo: "amazonprime",
    monthlyFee: "¥600",
    isActive: false,
    category: "Shopping"
  },
  {
    name: "FOD",
    logo: "fujitv",
    monthlyFee: "¥976",
    isActive: false,
    category: "Entertainment"
  }
];

export function getActiveSubscriptions(): Subscription[] {
  return subscriptions.filter(sub => sub.isActive);
}

export function getInactiveSubscriptions(): Subscription[] {
  return subscriptions.filter(sub => !sub.isActive);
}

export function getTotalMonthlyFee(): { jpy: number; usd: number } {
  const active = getActiveSubscriptions();
  let jpy = 0;
  let usd = 0;

  active.forEach(sub => {
    const fee = sub.monthlyFee;
    if (fee.startsWith('¥')) {
      jpy += parseInt(fee.replace(/[¥,]/g, ''));
    } else if (fee.startsWith('$')) {
      usd += parseInt(fee.replace('$', ''));
    }
  });

  return { jpy, usd };
}
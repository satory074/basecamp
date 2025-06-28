'use client';

import Image from 'next/image';
import { subscriptions } from '@/app/lib/subscriptions';

interface BadgeProps {
  subscription: {
    name: string;
    logo?: string;
    monthlyFee: string;
    isActive: boolean;
  };
}

function SubscriptionBadge({ subscription }: BadgeProps) {
  const { name, logo, isActive } = subscription;
  
  // shields.ioでダッシュは区切り文字として扱われるため、ダブルダッシュにエスケープ
  const escapedName = name.replace(/-/g, '--');
  
  // アクティブ/非アクティブで色を分ける
  const color = isActive ? '2ea44f' : '6c757d'; // 緑とグレー
  
  // バッジURL生成
  let badgeUrl = `https://img.shields.io/badge/${escapedName}-${color}`;
  
  // ロゴがある場合は追加
  if (logo) {
    badgeUrl += `?logo=${logo}&logoColor=white`;
  }
  
  return (
    <div className="relative h-7" style={{ width: '100px' }}>
      <Image
        src={badgeUrl}
        alt={`${name}${isActive ? ' (Active)' : ' (Inactive)'}`}
        fill
        sizes="100px"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}

export default function SubscriptionBadges() {
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  const inactiveSubscriptions = subscriptions.filter(sub => !sub.isActive);
  
  return (
    <div className="space-y-6">
      {/* アクティブなサブスクリプション */}
      <div>
        <h3 className="text-lg font-semibold mb-3">現在利用中のサービス</h3>
        <div className="flex flex-wrap gap-2">
          {activeSubscriptions.map((sub) => (
            <SubscriptionBadge key={sub.name} subscription={sub} />
          ))}
        </div>
      </div>
      
      {/* 非アクティブなサブスクリプション */}
      {inactiveSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-600">過去に利用していたサービス</h3>
          <div className="flex flex-wrap gap-2">
            {inactiveSubscriptions.map((sub) => (
              <SubscriptionBadge key={sub.name} subscription={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
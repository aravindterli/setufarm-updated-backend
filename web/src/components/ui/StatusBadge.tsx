import type { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | 'active' | 'sold_out' | 'draft' | string;
}

const labelMap: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready_for_pickup: 'Ready for Pickup',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  active: 'Active',
  sold_out: 'Sold Out',
  draft: 'Draft',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status.replace('ready_for_pickup', 'ready')}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

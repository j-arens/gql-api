import { registerEnumType } from 'type-graphql';

export enum PaymentStatus {
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  DECLINED = 'DECLINED',
  PROCESSING = 'PROCESSING',
}

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'payment status',
});

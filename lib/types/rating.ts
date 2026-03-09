export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  shipmentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

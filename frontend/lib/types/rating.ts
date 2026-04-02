export interface Rating {
  id: string;
  from_user_id: string;
  to_user_id: string;
  shipment_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  from_user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

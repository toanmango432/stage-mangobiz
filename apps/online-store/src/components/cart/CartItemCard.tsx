import { CartItem } from "@/types/cart";
import { ProductCartItem } from "./ProductCartItem";
import { ServiceCartItem } from "./ServiceCartItem";
import { MembershipCartItem } from "./MembershipCartItem";
import { GiftCardCartItem } from "./GiftCardCartItem";

interface CartItemCardProps {
  item: CartItem;
}

export const CartItemCard = ({ item }: CartItemCardProps) => {
  switch (item.type) {
    case 'product':
      return <ProductCartItem item={item} />;
    case 'service':
      return <ServiceCartItem item={item} />;
    case 'membership':
      return <MembershipCartItem item={item} />;
    case 'gift-card':
      return <GiftCardCartItem item={item} />;
    default:
      return null;
  }
};

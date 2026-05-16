import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "@/lib/api";

const FINAL_ORDER_STATUSES = ["CONFIRMED", "FAILED", "EXPIRED"];

export function useOrder(orderId) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;

      if (!status || FINAL_ORDER_STATUSES.includes(status)) {
        return false;
      }

      return 2000;
    },
  });
}
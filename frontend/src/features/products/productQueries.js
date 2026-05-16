import { useQuery } from "@tanstack/react-query";
import { fetchProducts, searchProducts } from "@/lib/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

export function useProductSearch(query) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => searchProducts(query),
    enabled: query.trim().length > 0,
  });
}
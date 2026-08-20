import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getShopApi } from "../../api/app.api";
import api from "../../api/axios";
import { useAuthStore } from "../../stores/useAuthStore";

function formatPrice(price: string | number) {
  return `$ ${Number(price).toLocaleString("es-AR")}`;
}

export default function ShopScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";
  const [cart, setCart] = useState<Record<string, number>>({});

  const {
    data: products = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["app-shop"],
    queryFn: getShopApi,
    enabled: isMember,
  });

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });
  };

  const totalItems = Object.values(cart).reduce((s, v) => s + v, 0);
  const totalPrice = products.reduce((s: number, p: any) => {
    return s + (cart[p.id] ?? 0) * Number(p.price);
  }, 0);

  const [ordering, setOrdering] = useState(false);

  const handleCheckout = () => {
    if (totalItems === 0) return;
    Alert.alert(
      "Confirmar pedido",
      `Total: ${formatPrice(totalPrice)}\n\nTu pedido será enviado al gym.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setOrdering(true);
            try {
              const items = Object.entries(cart).map(
                ([productId, quantity]) => ({
                  productId,
                  quantity,
                }),
              );
              await api.post("/app/orders", { items });
              setCart({});
              Alert.alert(
                "✅ Pedido enviado",
                "El gym recibió tu pedido y te contactará pronto.",
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.error ?? "No se pudo enviar el pedido",
              );
            } finally {
              setOrdering(false);
            }
          },
        },
      ],
    );
  };

  if (!isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tienda</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Función para miembros</Text>
          <Text style={styles.emptyText}>
            Asociate a un gym para acceder a la tienda.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tienda</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tienda</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Sin productos</Text>
          <Text style={styles.emptyText}>
            El gym todavía no cargó productos.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tienda</Text>
        <Text style={styles.subtitle}>{user?.gymName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563eb"
          />
        }
      >
        {products
          .filter((p: any) => p.category === "product")
          .map((product: any) => {
            const qty = cart[product.id] ?? 0;
            const inStock = product.stock === null || product.stock > 0;
            const category =
              product.category === "product"
                ? "Producto"
                : product.category === "service"
                  ? "Servicio"
                  : "Evento";

            return (
              <View key={product.id} style={styles.card}>
                {/* Imagen o placeholder */}
                <View style={styles.imageContainer}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>🛍</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  </View>

                  {product.description ? (
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description}
                    </Text>
                  ) : null}

                  <View style={styles.productFooter}>
                    <Text style={styles.price}>
                      {formatPrice(product.price)}
                    </Text>

                    {!inStock ? (
                      <View style={styles.outOfStock}>
                        <Text style={styles.outOfStockText}>Sin stock</Text>
                      </View>
                    ) : qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addToCart(product.id)}
                      >
                        <Text style={styles.addBtnText}>+ Agregar</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => removeFromCart(product.id)}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => addToCart(product.id)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {product.stock !== null &&
                    product.stock <= 3 &&
                    product.stock > 0 && (
                      <Text style={styles.lowStock}>
                        ⚠ Quedan {product.stock} unidades
                      </Text>
                    )}
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Carrito flotante */}
      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartItems}>
              {totalItems} producto{totalItems !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.cartTotal}>{formatPrice(totalPrice)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Confirmar pedido →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: "#f1f5f9" },
  subtitle: { fontSize: 13, color: "#2563eb", marginTop: 2, fontWeight: "600" },
  scroll: { padding: 16, gap: 12, paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f1f5f9",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 90,
  },
  imageContainer: { width: 90, minHeight: 90, backgroundColor: "#0f172a" },
  image: { width: 90, height: 90, resizeMode: "cover" },
  imagePlaceholder: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: { fontSize: 32 },
  productInfo: { flex: 1, padding: 14, gap: 6 },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  productName: { fontSize: 15, fontWeight: "700", color: "#f1f5f9", flex: 1 },
  categoryBadge: {
    backgroundColor: "#1e3a5f",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: "#60a5fa", fontWeight: "600" },
  productDesc: { fontSize: 12, color: "#64748b", lineHeight: 16 },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  price: { fontSize: 16, fontWeight: "800", color: "#f1f5f9" },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    backgroundColor: "#334155",
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { color: "#f1f5f9", fontSize: 18, fontWeight: "700" },
  qtyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
    minWidth: 20,
    textAlign: "center",
  },
  outOfStock: {
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  outOfStockText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  lowStock: { fontSize: 11, color: "#f59e0b" },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 24,
  },
  cartItems: { fontSize: 12, color: "#bfdbfe" },
  cartTotal: { fontSize: 18, fontWeight: "800", color: "#fff" },
  checkoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkoutBtnText: { color: "#2563eb", fontSize: 14, fontWeight: "800" },
});

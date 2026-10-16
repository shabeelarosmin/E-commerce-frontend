import { useEffect, useState } from "react";
import { getProducts } from "../../api/productApi";

function getProductImage(product) {
  const image = product.imageUrl || product.image || "";

  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `http://localhost:8000/${image.replace(/^\/+/, "")}`;
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await getProducts();

        const productList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.products)
              ? response.products
              : [];

        setProducts(productList);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Products load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <h2>Loading products...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "24px" }}>
      <h1>Products</h1>
      <p>Total Products: {products.length}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {products.map((product) => {
          const imageUrl = getProductImage(product);

          return (
            <div
              key={product._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "260px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.alt = "Image failed to load";
                  }}
                />
              ) : (
                <p style={{ padding: "20px" }}>No image URL available</p>
              )}

              <div style={{ padding: "14px" }}>
                <h2>{product.name}</h2>
                <p>{product.description || "No description available"}</p>
                <p>
                  Price: ₹
                  {Number(
                    product.basePrice ?? product.price ?? 0,
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Products;

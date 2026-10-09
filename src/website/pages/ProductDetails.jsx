import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProducts } from "../../api/productApi";
import { getProductVariants } from "../../api/productVariantApi";
import { addToCart } from "../../api/cartApi";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // FETCH PRODUCT AND VARIANTS
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const productResponse = await getProducts();
        const productList = productResponse.data || [];

        const selectedProduct = productList.find((item) => item._id === id);

        if (!selectedProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(selectedProduct);

        const variantResponse = await getProductVariants();
        const variantList = variantResponse.data || [];

        const productVariants = variantList.filter(
          (variant) =>
            String(variant.productId?._id || variant.productId) === id &&
            variant.active,
        );

        setVariants(productVariants);

        setSelectedVariant(productVariants[0] || null);
      } catch (err) {
        console.error("Product details error:", err);
        setError(
          err.response?.data?.message || "Failed to load product details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // ADD TO CART
  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      setCartMessage("Please select a size and color.");
      return;
    }

    if (selectedVariant.stockQuantity <= 0) {
      setCartMessage("This variant is out of stock.");
      return;
    }

    try {
      setAdding(true);
      setCartMessage("");

      await addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity: 1,
      });

      setCartMessage("Product added to cart successfully!");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }

      setCartMessage(
        err.response?.data?.message || "Failed to add product to cart.",
      );
    } finally {
      setAdding(false);
    }
  };

  // LOADING
  if (loading) {
    return <h2>Loading product...</h2>;
  }

  // ERROR
  if (error) {
    return <h2>{error}</h2>;
  }

  if (!product) {
    return <h2>Product not found.</h2>;
  }

  // PRODUCT DETAILS UI
  return (
    <div style={{ padding: "20px" }}>
      <h1>{product.name}</h1>

      <p>{product.description}</p>

      {product.brand && <p>Brand: {product.brand}</p>}

      <p>Base Price: ₹{product.basePrice}</p>

      {product.discount > 0 && <p>Discount: {product.discount}%</p>}

      <hr />

      <h3>Select Size / Color</h3>

      {variants.length === 0 ? (
        <p>No variants available for this product.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {variants.map((variant) => (
            <button
              key={variant._id}
              type="button"
              onClick={() => {
                setSelectedVariant(variant);
                setCartMessage("");
              }}
              style={{
                padding: "10px 15px",
                cursor: "pointer",
                border:
                  selectedVariant?._id === variant._id
                    ? "2px solid black"
                    : "1px solid gray",
                background:
                  selectedVariant?._id === variant._id ? "#eeeeee" : "white",
              }}
            >
              {variant.size} - {variant.color}
            </button>
          ))}
        </div>
      )}

      {selectedVariant && (
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Variant</h3>

          <p>Size: {selectedVariant.size}</p>

          <p>Color: {selectedVariant.color}</p>

          <p>SKU: {selectedVariant.sku}</p>

          <h3>Price: ₹{selectedVariant.sellingPrice}</h3>

          <p>
            {selectedVariant.stockQuantity > 0
              ? `Available stock: ${selectedVariant.stockQuantity}`
              : "Out of stock"}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || selectedVariant.stockQuantity <= 0}
            style={{
              padding: "12px 20px",
              cursor: adding ? "wait" : "pointer",
            }}
          >
            {adding
              ? "Adding..."
              : selectedVariant.stockQuantity > 0
                ? "Add to Cart"
                : "Out of Stock"}
          </button>

          {cartMessage && <p role="status">{cartMessage}</p>}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button type="button" onClick={() => navigate("/products")}>
          Back to Products
        </button>
      </div>
    </div>
  );
}

export default ProductDetails;

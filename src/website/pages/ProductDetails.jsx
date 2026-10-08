import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProducts } from "../../api/productApi";
import { getProductVariants } from "../../api/productVariantApi";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");

      // GET ALL PRODUCTS
      const productResponse = await getProducts();

      const productList = productResponse.data || [];

      const selectedProduct = productList.find((item) => item._id === id);

      if (!selectedProduct) {
        setError("Product not found");
        return;
      }

      setProduct(selectedProduct);

      // GET ALL VARIANTS
      const variantResponse = await getProductVariants();

      const variantList = variantResponse.data || [];

      // FILTER VARIANTS FOR CURRENT PRODUCT
      const productVariants = variantList.filter(
        (variant) => variant.productId === id,
      );

      setVariants(productVariants);

      if (productVariants.length > 0) {
        setSelectedVariant(productVariants[0]);
      }
    } catch (error) {
      console.error("Product details error:", error);

      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  if (loading) {
    return <h2>Loading product...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  if (!product) {
    return <h2>Product not found</h2>;
  }

  return (
    <div>
      <h1>{product.name}</h1>

      <p>{product.description}</p>

      <p>Brand: {product.brand}</p>

      <p>Base Price: ₹{product.basePrice}</p>

      <hr />

      <h3>Variants</h3>

      {variants.length === 0 ? (
        <p>No variants available.</p>
      ) : (
        variants.map((variant) => (
          <div key={variant._id}>
            <button
              onClick={() => setSelectedVariant(variant)}
              style={{
                margin: "5px",
                padding: "10px",
                border:
                  selectedVariant?._id === variant._id
                    ? "2px solid black"
                    : "1px solid gray",
              }}
            >
              {variant.size} - {variant.color}
            </button>
          </div>
        ))
      )}

      {selectedVariant && (
        <div>
          <hr />

          <h3>Selected Variant</h3>

          <p>Size: {selectedVariant.size}</p>

          <p>Color: {selectedVariant.color}</p>

          <p>SKU: {selectedVariant.sku}</p>

          <p>Price: ₹{selectedVariant.sellingPrice}</p>

          <p>Stock: {selectedVariant.stockQuantity}</p>

          <button disabled={selectedVariant.stockQuantity <= 0}>
            {selectedVariant.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;

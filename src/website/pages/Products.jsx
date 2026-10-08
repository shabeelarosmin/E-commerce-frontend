import { useEffect, useState } from "react";
import { getProducts } from "../../api/productApi";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Products fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <h2>Loading products...</h2>;
  }

  return (
    <div>
      <h1>Products</h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        products.map((product) => (
          <div key={product._id}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>₹{product.basePrice}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Products;

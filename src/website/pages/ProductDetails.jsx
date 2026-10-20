import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getWebsiteProducts } from "../../api/productApi";
import { getWebsiteProductVariants } from "../../api/productVariantApi";
import { addToCart } from "../../api/cartApi";

const API_BASE_URL = "http://localhost:8000";

function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data?.products)) return response.data.products;
  if (Array.isArray(response?.variants)) return response.variants;
  if (Array.isArray(response?.data?.variants)) return response.data.variants;

  return [];
}

function getImageUrl(value) {
  if (!value) return "";

  const path =
    typeof value === "string"
      ? value
      : value.url || value.path || value.secure_url || "";

  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function getProductImages(product) {
  const images = [];

  if (Array.isArray(product?.images)) {
    product.images.forEach((image) => {
      const url = getImageUrl(image);
      if (url && !images.includes(url)) images.push(url);
    });
  }

  const mainImage = getImageUrl(product?.imageUrl || product?.image);

  if (mainImage && !images.includes(mainImage)) {
    images.unshift(mainImage);
  }

  return images;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProductDetails() {
      try {
        setLoading(true);
        setError("");

        const [productResponse, variantResponse] = await Promise.all([
          getWebsiteProducts(),
          getWebsiteProductVariants(),
        ]);

        const productList = getArray(productResponse);
        const variantList = getArray(variantResponse);

        const selectedProduct = productList.find(
          (item) => String(item._id || item.id) === String(id),
        );

        if (!selectedProduct) {
          if (active) setError("We couldn't find this product.");
          return;
        }

        const productVariants = variantList.filter((variant) => {
          const variantProductId =
            variant.productId?._id ||
            variant.productId?.id ||
            variant.productId ||
            variant.product?._id ||
            variant.product?.id ||
            variant.product;

          return (
            String(variantProductId) === String(id) && variant.active !== false
          );
        });

        if (active) {
          setProduct(selectedProduct);
          setVariants(productVariants);
          setSelectedVariant(productVariants[0] || null);
          setSelectedImage(0);
          setQuantity(1);
        }
      } catch (err) {
        console.error("Product details error:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load this product. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProductDetails();

    return () => {
      active = false;
    };
  }, [id]);

  const images = useMemo(() => getProductImages(product || {}), [product]);

  const price = Number(
    selectedVariant?.sellingPrice ??
      selectedVariant?.price ??
      product?.basePrice ??
      product?.price ??
      0,
  );

  const originalPrice = Number(
    selectedVariant?.originalPrice ??
      product?.originalPrice ??
      product?.basePrice ??
      product?.price ??
      price,
  );

  const discount = Number(product?.discount || 0);
  const stock = Number(selectedVariant?.stockQuantity || 0);

  // LOGIN REQUIRED BEFORE ADDING TO CART
  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/products/${id}`,
          },
        },
      });
      return;
    }

    if (!selectedVariant) {
      setCartMessage("Please select a size and colour.");
      return;
    }

    if (stock < quantity || quantity < 1) {
      setCartMessage("The selected quantity is not available in stock.");
      return;
    }

    try {
      setAdding(true);
      setCartMessage("");

      await addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
      });

      setCartMessage("Added to cart successfully.");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login", {
          state: {
            from: {
              pathname: `/products/${id}`,
            },
          },
        });
        return;
      }

      setCartMessage(
        err.response?.data?.message || "Unable to add this item to cart.",
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F4EE] px-5 py-12 sm:px-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-3 w-40 bg-[#E0D9CF]" />

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-[4/5] bg-[#E0D9CF]" />

            <div className="space-y-5 py-8">
              <div className="h-3 w-32 bg-[#E0D9CF]" />
              <div className="h-10 w-3/4 bg-[#E0D9CF]" />
              <div className="h-4 w-1/3 bg-[#E0D9CF]" />
              <div className="h-20 bg-[#E0D9CF]" />
              <div className="h-12 bg-[#E0D9CF]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F4EE] px-5 text-center text-[#544339]">
        <span className="font-serif text-5xl">É</span>

        <h1 className="mt-5 font-serif text-3xl">
          {error || "Product not found"}
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-[#8A6C5F]">
          This piece may be unavailable right now. Explore the collection to
          discover something you love.
        </p>

        <Link
          to="/products"
          className="mt-7 bg-[#544339] px-7 py-4 text-[10px] uppercase tracking-[0.18em] text-white transition hover:bg-[#8A6C5F]"
        >
          Back to collection ↗
        </Link>
      </main>
    );
  }

  const category =
    typeof product.categoryId === "object"
      ? product.categoryId?.name
      : typeof product.category === "object"
        ? product.category?.name
        : product.categoryName || product.category || "ÉLORA Collection";

  return (
    <main className="min-h-screen bg-[#F8F4EE] text-[#544339]">
      {/* Breadcrumb */}
      <div className="border-b border-[#E6DBCF]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-5 text-[10px] tracking-wide text-[#968476] sm:px-8 lg:px-12"
        >
          <Link to="/" className="transition hover:text-[#544339]">
            Home
          </Link>

          <span>/</span>

          <Link to="/products" className="transition hover:text-[#544339]">
            Collection
          </Link>

          <span>/</span>

          <span className="max-w-[180px] truncate text-[#544339]">
            {product.name}
          </span>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="grid items-start gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
          {/* Product gallery */}
          <div className="min-w-0">
            <div className="group relative aspect-[4/5] overflow-hidden bg-[#EAE0D4]">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-[#8A6C5F]">
                  <span className="font-serif text-7xl">É</span>
                  <span className="mt-3 text-[10px] tracking-[0.3em]">
                    ÉLORA
                  </span>
                  <span className="mt-2 font-serif text-sm">
                    {product.name}
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#544339]/10 via-transparent to-transparent" />

              <span className="absolute left-4 top-4 bg-[#F8F4EE]/95 px-3 py-2 text-[9px] uppercase tracking-[0.17em]">
                {product.featured || product.isFeatured
                  ? "ÉLORA Favourite"
                  : "Thoughtfully Selected"}
              </span>

              {discount > 0 && (
                <span className="absolute right-4 top-4 bg-[#544339] px-3 py-2 text-[9px] tracking-wider text-white">
                  {discount}% OFF
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:gap-4">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`aspect-[3/4] overflow-hidden border transition ${
                      selectedImage === index
                        ? "border-[#544339] p-1"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 hidden grid-cols-3 border-y border-[#E4D8CB] py-5 sm:grid">
              <div className="pr-3">
                <span className="text-lg text-[#8A6C5F]">◇</span>
                <p className="mt-2 text-[10px] font-medium">Thoughtful style</p>
                <p className="mt-1 text-[10px] text-[#968476]">
                  Chosen with care
                </p>
              </div>

              <div className="border-x border-[#E4D8CB] px-4">
                <span className="text-lg text-[#8A6C5F]">✳</span>
                <p className="mt-2 text-[10px] font-medium">Timeless appeal</p>
                <p className="mt-1 text-[10px] text-[#968476]">
                  Made for your moments
                </p>
              </div>

              <div className="pl-4">
                <span className="text-lg text-[#8A6C5F]">♡</span>
                <p className="mt-2 text-[10px] font-medium">ÉLORA edit</p>
                <p className="mt-1 text-[10px] text-[#968476]">
                  Your style, your story
                </p>
              </div>
            </div>
          </div>

          {/* Product information */}
          <div className="lg:sticky lg:top-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#967A67]">
              {category}
            </p>

            <h1 className="mt-4 font-serif text-3xl font-normal leading-tight tracking-[-0.025em] sm:text-4xl lg:text-[46px]">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-lg font-medium tracking-wide">
                ₹{formatPrice(price)}
              </p>

              {originalPrice > price && (
                <p className="text-sm text-[#9A8777] line-through">
                  ₹{formatPrice(originalPrice)}
                </p>
              )}

              {originalPrice > price && (
                <span className="text-[10px] text-[#8A6C5F]">
                  You save ₹{formatPrice(originalPrice - price)}
                </span>
              )}
            </div>

            <div className="mt-7 h-px bg-[#E4D8CB]" />

            <p className="mt-7 text-sm leading-7 text-[#837365]">
              {product.description ||
                "A thoughtfully selected piece designed to bring effortless elegance to your wardrobe."}
            </p>

            {product.brand && (
              <p className="mt-4 text-xs text-[#837365]">
                Brand: <span className="text-[#544339]">{product.brand}</span>
              </p>
            )}

            {/* Size and colour */}
            <div className="mt-9">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[10px] font-medium uppercase tracking-[0.2em]">
                  Select your size & colour
                </h2>

                {selectedVariant && (
                  <span className="text-[10px] text-[#8A6C5F]">
                    {selectedVariant.size} / {selectedVariant.color}
                  </span>
                )}
              </div>

              {variants.length === 0 ? (
                <p className="mt-4 border border-[#E4D8CB] p-4 text-xs leading-6 text-[#8A6C5F]">
                  No variants are currently available for this product.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?._id === variant._id;

                    const isOutOfStock =
                      Number(variant.stockQuantity || 0) <= 0;

                    return (
                      <button
                        key={variant._id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                          setCartMessage("");
                        }}
                        aria-pressed={isSelected}
                        className={`relative border px-3 py-4 text-left transition ${
                          isSelected
                            ? "border-[#544339] bg-[#EAE0D4]"
                            : "border-[#E4D8CB] hover:border-[#8A6C5F]"
                        } ${
                          isOutOfStock
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer"
                        }`}
                      >
                        <span className="block text-xs font-medium">
                          {variant.size} · {variant.color}
                        </span>

                        <span className="mt-2 block text-[10px] text-[#8A6C5F]">
                          {isOutOfStock
                            ? "Out of stock"
                            : `₹${formatPrice(variant.sellingPrice ?? price)}`}
                        </span>

                        {isSelected && (
                          <span className="absolute right-2 top-2 text-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stock status */}
            {selectedVariant && (
              <div className="mt-5 flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    stock > 0 ? "bg-green-700" : "bg-red-600"
                  }`}
                />

                <span className={stock > 0 ? "text-[#6C7760]" : "text-red-700"}>
                  {stock > 0
                    ? stock <= 5
                      ? `Only ${stock} left in stock`
                      : "In stock and ready to order"
                    : "Currently out of stock"}
                </span>
              </div>
            )}

            {/* Quantity */}
            {selectedVariant && stock > 0 && (
              <div className="mt-7 flex items-center justify-between border-y border-[#E4D8CB] py-5">
                <span className="text-[10px] uppercase tracking-[0.18em]">
                  Quantity
                </span>

                <div className="flex items-center border border-[#DCCDBF]">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="h-10 w-10 text-lg transition hover:bg-[#EAE0D4] disabled:opacity-30"
                  >
                    −
                  </button>

                  <span className="min-w-10 text-center text-xs">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.min(stock, current + 1))
                    }
                    disabled={quantity >= stock}
                    aria-label="Increase quantity"
                    className="h-10 w-10 text-lg transition hover:bg-[#EAE0D4] disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || !selectedVariant || stock <= 0}
              className="mt-6 flex w-full items-center justify-center gap-3 bg-[#544339] px-6 py-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#F8F4EE] transition duration-300 hover:bg-[#8A6C5F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding to Cart..." : "Add to Cart"}
              {!adding && <span className="text-base">↗</span>}
            </button>

            {cartMessage && (
              <div
                role="status"
                className={`mt-4 border px-4 py-3 text-xs leading-5 ${
                  cartMessage.toLowerCase().includes("successfully")
                    ? "border-[#C9D2BE] bg-[#EEF1E8] text-[#53634A]"
                    : "border-[#E3C5B9] bg-[#F8ECE7] text-[#8B4E3D]"
                }`}
              >
                {cartMessage}
              </div>
            )}

            <p className="mt-4 text-center text-[10px] leading-5 text-[#968476]">
              A timeless addition to your wardrobe.
            </p>

            {selectedVariant?.sku && (
              <p className="mt-6 text-[10px] tracking-wide text-[#968476]">
                Product reference: {selectedVariant.sku}
              </p>
            )}

            <div className="mt-7 border-t border-[#E4D8CB]">
              <details className="group border-b border-[#E4D8CB]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[10px] uppercase tracking-[0.16em]">
                  Product details
                  <span className="text-lg transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="pb-5 text-xs leading-6 text-[#837365]">
                  {product.description ||
                    "Carefully selected for the ÉLORA collection. Refer to the product details for available size and colour options."}
                </p>
              </details>

              <details className="group border-b border-[#E4D8CB]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[10px] uppercase tracking-[0.16em]">
                  Delivery & returns
                  <span className="text-lg transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="pb-5 text-xs leading-6 text-[#837365]">
                  Delivery availability, shipping charges and return eligibility
                  depend on your location and the store's policies. Please check
                  the checkout page or contact the store for current details.
                </p>
              </details>
            </div>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-3 border-b border-[#BFA38A] pb-2 text-[10px] uppercase tracking-[0.16em] text-[#8A6C5F] transition hover:border-[#544339] hover:text-[#544339]"
            >
              ← Continue exploring
            </Link>
          </div>
        </div>
      </section>

      {/* Brand note */}
      <section className="border-t border-[#E6DBCF] px-5 py-12 text-center sm:py-16">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#967A67]">
          The ÉLORA promise
        </p>

        <h2 className="mt-4 font-serif text-2xl italic sm:text-3xl">
          Elegance in every detail.
        </h2>

        <p className="mt-3 text-[10px] tracking-wide text-[#968476]">
          Made for your moments.
        </p>
      </section>
    </main>
  );
}

export default ProductDetails;

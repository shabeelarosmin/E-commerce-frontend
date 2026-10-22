import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getWebsiteProducts } from "../../api/productApi";
import { getWebsiteProductVariants } from "../../api/productVariantApi";
import { addToCart } from "../../api/cartApi";

const API_BASE_URL = "http://localhost:8000";

function getArray(response) {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data,
    response?.data?.data,
    response?.products,
    response?.variants,
    response?.data?.products,
    response?.data?.variants,
  ];

  return candidates.find(Array.isArray) || [];
}

function getId(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getVariantProductId(variant) {
  return getId(
    variant?.productId ??
      variant?.product ??
      variant?.parentProductId ??
      variant?.productID ??
      variant?.product_id,
  );
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

      if (url && !images.includes(url)) {
        images.push(url);
      }
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

function getAvailableStock(item) {
  if (!item) return 0;

  const stockValue = item.stockQuantity ?? item.stock;
  const reservedValue = item.reservedQuantity ?? 0;

  if (stockValue === null || stockValue === undefined || stockValue === "") {
    return 0;
  }

  const stock = Number(stockValue);
  const reserved = Number(reservedValue);

  if (!Number.isFinite(stock) || !Number.isFinite(reserved)) {
    return 0;
  }

  return Math.max(0, stock - reserved);
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
        setCartMessage("");
        setProduct(null);
        setVariants([]);
        setSelectedVariant(null);
        setSelectedImage(0);
        setQuantity(1);

        const [productResponse, variantResponse] = await Promise.all([
          getWebsiteProducts(),
          getWebsiteProductVariants(),
        ]);

        const productList = getArray(productResponse);
        const variantList = getArray(variantResponse);

        // Debug: verify the URL ID against the API product IDs.
        console.log("URL PRODUCT ID:", id);
        console.log(
          "API PRODUCT IDS:",
          productList.map((item) => ({
            id: getId(item?._id || item?.id),
            name: item?.name,
          })),
        );

        const selectedProduct = productList.find(
          (item) => getId(item?._id || item?.id) === String(id || ""),
        );

        if (!selectedProduct) {
          if (active) {
            setError("We couldn't find this product.");
          }
          return;
        }

        const productId = getId(selectedProduct._id || selectedProduct.id);

        const productVariants = variantList.filter((variant) => {
          const variantProductId = getVariantProductId(variant);

          const isActive =
            variant.active !== false &&
            variant.active !== "false" &&
            variant.isActive !== false &&
            variant.isActive !== "false";

          return variantProductId === productId && isActive;
        });

        console.log("MATCHED PRODUCT:", selectedProduct);
        console.log("MATCHED VARIANTS:", productVariants);

        if (active) {
          setProduct(selectedProduct);
          setVariants(productVariants);

          const firstAvailableVariant = productVariants.find(
            (variant) => getAvailableStock(variant) > 0,
          );

          setSelectedVariant(
            firstAvailableVariant || productVariants[0] || null,
          );
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
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProductDetails();

    return () => {
      active = false;
    };
  }, [id]);

  const images = useMemo(() => getProductImages(product || {}), [product]);

  const hasVariants = variants.length > 0;

  const price = Number(
    selectedVariant?.sellingPrice ??
      selectedVariant?.price ??
      product?.basePrice ??
      product?.sellingPrice ??
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

  const stock = hasVariants
    ? selectedVariant
      ? getAvailableStock(selectedVariant)
      : 0
    : getAvailableStock(product);

  useEffect(() => {
    console.log("PRODUCT:", product);
    console.log("PRODUCT ID:", getId(product?._id || product?.id));
    console.log("VARIANTS:", variants);
    console.log("SELECTED VARIANT:", selectedVariant);
    console.log("PRODUCT STOCK:", product?.stockQuantity);
    console.log("VARIANT STOCK:", selectedVariant?.stockQuantity);
    console.log("AVAILABLE STOCK:", stock);
  }, [product, variants, selectedVariant, stock]);

  const category =
    typeof product?.categoryId === "object"
      ? product.categoryId?.name
      : typeof product?.category === "object"
        ? product.category?.name
        : product?.categoryName || product?.category || "ÉLORA Collection";

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

    if (hasVariants && !selectedVariant) {
      setCartMessage("Please select an available size and colour.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setCartMessage("Please select a valid quantity.");
      return;
    }

    if (stock <= 0 || quantity > stock) {
      setCartMessage("The selected quantity is not available in stock.");
      return;
    }

    try {
      setAdding(true);
      setCartMessage("");

      const cartItem = {
        productId: getId(product._id || product.id),
        quantity,
      };

      if (hasVariants && selectedVariant) {
        cartItem.variantId = getId(selectedVariant._id || selectedVariant.id);
      }

      await addToCart(cartItem);

      setCartMessage("Added to cart successfully.");
    } catch (err) {
      console.error("Add to cart error:", err);

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

  return (
    <main className="min-h-screen bg-[#F8F4EE] text-[#544339]">
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

            <div className="mt-9">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[10px] font-medium uppercase tracking-[0.2em]">
                  {hasVariants
                    ? "Select your size & colour"
                    : "Product options"}
                </h2>

                {selectedVariant && (
                  <span className="text-[10px] text-[#8A6C5F]">
                    {selectedVariant.size} / {selectedVariant.color}
                  </span>
                )}
              </div>

              {!hasVariants ? (
                <p className="mt-4 border border-[#E4D8CB] p-4 text-xs leading-6 text-[#8A6C5F]">
                  This product has no size or colour options. You can add it
                  directly to your cart.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {variants.map((variant) => {
                    const isSelected =
                      getId(selectedVariant?._id) === getId(variant._id);

                    const variantStock = getAvailableStock(variant);
                    const isOutOfStock = variantStock <= 0;

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
                          {variant.size || "Standard"} ·{" "}
                          {variant.color || "Default"}
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

            {stock > 0 && (
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

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                adding || stock <= 0 || (hasVariants && !selectedVariant)
              }
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

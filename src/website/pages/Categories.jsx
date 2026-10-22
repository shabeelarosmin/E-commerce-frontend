import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../api/categoryApi";

const API_BASE_URL = "http://localhost:8000";

function getCategoryImage(category) {
  const image =
    typeof category.image === "string"
      ? category.image
      : category.image?.url || category.image?.path || "";

  if (!image) return "";

  if (/^https?:\/\//i.test(image)) return image;

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function getCategoryList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.categories)) {
    return response.data.categories;
  }

  return [];
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        setLoading(true);
        setError("");

        const response = await getCategories();
        const list = getCategoryList(response).filter(
          (category) => category.active !== false,
        );

        if (active) setCategories(list);
      } catch (err) {
        console.error("Category loading error:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Categories load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F4EE] px-5 py-12 sm:px-10 lg:px-16">
      {/* Page heading */}
      <section className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-4 text-[10px] tracking-[0.35em] text-[#8A6C5F]">
            DISCOVER YOUR STYLE
          </p>

          <h1 className="font-serif text-4xl text-[#544339] sm:text-5xl">
            Our Categories
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#8A6C5F]">
            Explore the ÉLORA collection and find something that feels uniquely
            you.
          </p>

          <div className="mx-auto mt-6 h-px w-16 bg-[#BFA38A]" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center text-sm text-[#8A6C5F]">
            Loading categories...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-16 text-center">
            <p className="text-sm text-red-700">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 border border-[#BFA38A] px-6 py-3 text-xs tracking-widest text-[#544339] hover:bg-[#EAE0D4]"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && categories.length === 0 && (
          <div className="py-20 text-center">
            <h2 className="font-serif text-2xl text-[#544339]">Coming Soon</h2>

            <p className="mt-3 text-sm text-[#8A6C5F]">
              Our categories will appear here once they are added.
            </p>
          </div>
        )}

        {/* Category cards */}
        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const categoryId = category._id || category.id;
              const image = getCategoryImage(category);

              return (
                <Link
                  key={categoryId}
                  to={`/products?category=${encodeURIComponent(
                    category.slug || categoryId,
                  )}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE0D4]">
                    {image ? (
                      <img
                        src={image}
                        alt={category.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-serif text-3xl tracking-widest text-[#8A6C5F]/60">
                          ÉLORA
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C211C]/70 via-transparent to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h2 className="font-serif text-2xl text-white">
                        {category.name}
                      </h2>

                      {category.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/80">
                          {category.description}
                        </p>
                      )}

                      <span className="mt-4 inline-block border-b border-white/70 pb-1 text-[9px] tracking-[0.2em] text-white">
                        EXPLORE COLLECTION
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-block border border-[#BFA38A] px-8 py-4 text-[10px] tracking-[0.2em] text-[#544339] transition hover:bg-[#EAE0D4]"
          >
            SHOP ALL PRODUCTS
          </Link>
        </div>
      </section>
    </main>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:8000";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../api/productApi";

import { getCategories } from "../../api/categoryApi";

const EMPTY_FORM = {
  name: "",
  slug: "",
  categoryId: "",
  basePrice: "",
  description: "",
  active: true,
};

const inputClass =
  "w-full rounded-xl border border-[#E7D8C4] bg-[#FFFCF8] px-4 py-3 text-sm text-[#3F2D22] outline-none transition placeholder:text-[#B2A18E] focus:border-[#A9824D] focus:ring-2 focus:ring-[#A9824D]/20";

function Products() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Fetch products
  const {
    data: productResponse,
    isLoading: productsLoading,
    isError: productsError,
    error: productError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: getProducts,
  });

  // Fetch categories
  const { data: categoryResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["dashboard-categories"],
    queryFn: getCategories,
  });

  const products = useMemo(() => {
    const result = productResponse?.data ?? productResponse;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.products)) return result.products;
    if (Array.isArray(result?.data)) return result.data;

    return [];
  }, [productResponse]);

  const categories = useMemo(() => {
    const result = categoryResponse?.data ?? categoryResponse;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.categories)) return result.categories;
    if (Array.isArray(result?.data)) return result.data;

    return [];
  }, [categoryResponse]);

  // Create product
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Unable to create product.",
      );
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
      closeModal();
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Unable to update product.",
      );
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const activeCount = products.filter(
    (product) => product.active !== false,
  ).length;

  const inactiveCount = products.length - activeCount;

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(product.name || "")
        .toLowerCase()
        .includes(query) ||
      String(product.slug || "")
        .toLowerCase()
        .includes(query);

    const productCategoryId =
      product.categoryId?._id || product.categoryId || "";

    const matchesCategory =
      categoryFilter === "all" ||
      String(productCategoryId) === String(categoryFilter);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.active !== false) ||
      (statusFilter === "inactive" && product.active === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  function closeModal() {
    setModalOpen(false);
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    setSelectedImages([]);
    setExistingImages([]);
    setErrorMessage("");
  }

  function openCreateModal() {
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    setSelectedImages([]);
    setExistingImages([]);
    setErrorMessage("");
    setModalOpen(true);
  }

  function openEditModal(product) {
    setSelectedProduct(product);

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      categoryId: product.categoryId?._id || product.categoryId || "",
      basePrice: product.basePrice ?? "",
      description: product.description || "",
      active: product.active !== false,
    });

    setExistingImages(Array.isArray(product.images) ? product.images : []);

    setSelectedImages([]);
    setErrorMessage("");
    setModalOpen(true);
  }

  function handleNameChange(value) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: selectedProduct
        ? previous.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
    }));
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    if (files.length > 5) {
      setErrorMessage("You can select a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setSelectedImages(files);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setErrorMessage("Product slug is required.");
      return;
    }

    if (!form.categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }

    if (
      form.basePrice === "" ||
      !Number.isFinite(Number(form.basePrice)) ||
      Number(form.basePrice) < 0
    ) {
      setErrorMessage("Please enter a valid base price.");
      return;
    }

    const payload = new FormData();

    payload.append("name", form.name.trim());
    payload.append("slug", form.slug.trim());
    payload.append("categoryId", form.categoryId);
    payload.append("basePrice", String(Number(form.basePrice)));
    payload.append("description", form.description.trim());
    payload.append("active", String(form.active));

    selectedImages.forEach((file) => {
      payload.append("images", file);
    });

    // Keep old images unless the backend supports image removal.
    // The selected new images are sent using the "images" field.
    if (selectedProduct) {
      updateMutation.mutate({
        id: selectedProduct._id,
        data: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  }





  function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (confirmed) {
      deleteMutation.mutate(product._id);
    }
  }

  function handleToggleStatus(product) {
    const payload = {
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId?._id || product.categoryId,
      basePrice: product.basePrice,
      description: product.description || "",
      active: product.active === false,
    };

    updateMutation.mutate({
      id: product._id,
      data: payload,
    });
  }

  function getCategoryName(product) {
    if (product.categoryId?.name) return product.categoryId.name;

    const id = product.categoryId?._id || product.categoryId;

    return (
      categories.find((category) => String(category._id) === String(id))
        ?.name || "Uncategorized"
    );
  }

 function getImage(product) {
   const image = product.images?.[0];

   if (!image) return "";

   const imagePath =
     typeof image === "string" ? image : image.url || image.path || "";

   if (imagePath.startsWith("http")) return imagePath;

   return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
 }
  return (
    <div className="min-h-screen bg-[#F7F3ED] p-4 text-[#3F2D22] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-7 bg-[#A9824D]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A9824D]">
                ÉLORA / Catalog Management
              </p>
            </div>

            <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Products Management
            </h1>

            <p className="mt-2 text-sm text-[#8B7A68]">
              Manage your fashion collection and product details.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={productsLoading}
              className="rounded-xl border border-[#E7D8C4] bg-[#FFFCF8] px-5 py-3 text-sm font-semibold text-[#523A2C] transition hover:bg-[#EDE2D2] disabled:opacity-60"
            >
              <span
                className={productsLoading ? "inline-block animate-spin" : ""}
              >
                ↻
              </span>{" "}
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-[#523A2C] px-5 py-3 text-sm font-semibold text-[#FFFCF8] shadow-sm transition hover:bg-[#654936]"
            >
              + Create Product
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Products"
            value={products.length}
            subtitle="All catalog products"
            icon="✦"
          />

          <SummaryCard
            title="Active Products"
            value={activeCount}
            subtitle="Currently available"
            icon="◇"
          />

          <SummaryCard
            title="Inactive Products"
            value={inactiveCount}
            subtitle="Currently disabled"
            icon="◈"
            dark
          />

          <SummaryCard
            title="Categories"
            value={categories.length}
            subtitle="Available collections"
            icon="▦"
          />
        </div>

        {/* Search and filters */}
        <section className="mb-7 rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] p-5 shadow-[0_8px_30px_rgba(63,45,34,0.035)] sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A9824D]">
              Product Catalogue
            </p>

            <h2 className="mt-1 font-serif text-2xl">All Products</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or slug..."
              className={inputClass}
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Products</option>
              <option value="inactive">Inactive Products</option>
            </select>
          </div>
        </section>

        {/* Product listing */}
        {productsLoading || categoriesLoading ? (
          <div className="rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] p-14 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#E7D8C4] border-t-[#523A2C]" />
            <p className="mt-4 text-sm text-[#8B7A68]">
              Loading your collection...
            </p>
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] p-10 text-center">
            <p className="text-sm text-[#8A5940]">
              {productError?.response?.data?.message ||
                productError?.message ||
                "Unable to load products."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-xl bg-[#523A2C] px-5 py-3 text-sm font-semibold text-[#FFFCF8] hover:bg-[#654936]"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E7D8C4] bg-[#F4EBDD] font-serif text-2xl text-[#A9824D]">
              ✦
            </div>

            <h3 className="mt-4 font-serif text-xl">No products found</h3>

            <p className="mt-2 text-sm text-[#8B7A68]">
              Try another search or create a new product.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-[#523A2C] px-5 py-3 text-sm font-semibold text-[#FFFCF8] hover:bg-[#654936]"
            >
              Create Product
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#8B7A68]">
                Showing{" "}
                <span className="font-semibold text-[#523A2C]">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const image = getImage(product);
                const active = product.active !== false;

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] shadow-[0_8px_30px_rgba(63,45,34,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(63,45,34,0.09)]"
                  >
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#EDE2D2]">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-[#A9824D]">
                          <span className="font-serif text-5xl">É</span>
                          <span className="mt-2 text-[10px] uppercase tracking-[0.25em]">
                            ÉLORA
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                          active
                            ? "border-[#D4DFC9] bg-[#F0F4EB] text-[#49623F]"
                            : "border-[#E4CBB8] bg-[#F3E3D7] text-[#8A5940]"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>

                      <span className="absolute right-3 top-3 rounded-full border border-[#E7D8C4] bg-[#FFFCF8]/95 px-3 py-1.5 text-[10px] font-semibold text-[#765B35]">
                        {getCategoryName(product)}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9824D]">
                        {product.slug || "Product"}
                      </p>

                      <h3 className="mt-2 line-clamp-1 font-serif text-xl font-medium text-[#3F2D22]">
                        {product.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#8B7A68]">
                        {product.description || "No description available."}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[#E7D8C4] pt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#A9824D]">
                            Base Price
                          </p>

                          <p className="mt-1 font-serif text-2xl font-medium text-[#523A2C]">
                            ₹
                            {Number(product.basePrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="rounded-lg border border-[#DCC9AF] bg-[#EDE2D2] px-3 py-2 text-xs font-semibold text-[#523A2C] transition hover:bg-[#E3D3BD]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg border border-[#E4CBB8] bg-[#F3E3D7] px-3 py-2 text-xs font-semibold text-[#8A5940] transition hover:bg-[#EBD4C5] disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        disabled={updateMutation.isPending}
                        className="mt-4 w-full rounded-xl border border-[#E7D8C4] bg-[#F7F3ED] px-4 py-2.5 text-xs font-semibold text-[#624832] transition hover:bg-[#EDE2D2] disabled:opacity-50"
                      >
                        {active ? "Deactivate Product" : "Activate Product"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* Product create/edit modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#302116]/55 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div className="my-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E7D8C4] bg-[#FFFCF8] shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7D8C4] bg-[#EDE2D2] px-5 py-5 sm:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A9824D]">
                    ÉLORA Catalogue
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-medium text-[#3F2D22]">
                    {selectedProduct ? "Edit Product" : "Create Product"}
                  </h2>

                  <p className="mt-1 text-sm text-[#8B7A68]">
                    Enter the product details below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCC9AF] bg-[#F7F3ED] text-xl text-[#523A2C] transition hover:bg-[#E3D3BD]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-8">
                  <FormField label="Product Name" required>
                    <input
                      value={form.name}
                      onChange={(event) => handleNameChange(event.target.value)}
                      placeholder="e.g. Modesty Dress"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Product Slug" required>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        setForm({ ...form, slug: event.target.value })
                      }
                      placeholder="e.g. modesty-dress"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Category" required>
                    <select
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm({ ...form, categoryId: event.target.value })
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select a category"}
                      </option>

                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Base Price (₹)" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(event) =>
                        setForm({ ...form, basePrice: event.target.value })
                      }
                      placeholder="1499"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Description">
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            description: event.target.value,
                          })
                        }
                        placeholder="Describe the product..."
                        className={`${inputClass} resize-y`}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label="Product Images (maximum 5)">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="block w-full cursor-pointer rounded-xl border border-[#E7D8C4] bg-[#F4EBDD] text-sm text-[#624832] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#523A2C] file:px-4 file:py-3 file:font-semibold file:text-[#FFFCF8] hover:file:bg-[#654936]"
                      />
                    </FormField>

                    <p className="mt-2 text-xs text-[#8B7A68]">
                      {selectedImages.length} new image(s) selected.
                    </p>

                    {selectedProduct && existingImages.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-[#624832]">
                          Existing images
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {existingImages.map((image, index) => {
                            const url =
                              typeof image === "string"
                                ? image
                                : image?.url || image?.path || "";

                            return url ? (
                              <img
                                key={`${url}-${index}`}
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="h-20 w-20 rounded-xl border border-[#E7D8C4] bg-[#EDE2D2] object-cover"
                              />
                            ) : null;
                          })}
                        </div>

                        <p className="mt-2 text-xs text-[#8B7A68]">
                          Existing images are displayed for reference. Image
                          replacement/removal depends on your backend
                          implementation.
                        </p>
                      </div>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E7D8C4] bg-[#F7F3ED] p-4 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        setForm({ ...form, active: event.target.checked })
                      }
                      className="h-4 w-4 accent-[#523A2C]"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-[#523A2C]">
                        Active Product
                      </span>

                      <span className="mt-1 block text-xs text-[#8B7A68]">
                        Enable this product in the catalogue.
                      </span>
                    </span>
                  </label>

                  {errorMessage && (
                    <div className="rounded-xl border border-[#E4CBB8] bg-[#F3E3D7] p-4 text-sm text-[#8A5940] sm:col-span-2">
                      {errorMessage}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#E7D8C4] bg-[#EDE2D2] px-5 py-5 sm:flex-row sm:justify-end sm:px-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-[#DCC9AF] bg-[#FFFCF8] px-6 py-3 text-sm font-semibold text-[#523A2C] transition hover:bg-[#F7F3ED]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#523A2C] px-6 py-3 text-sm font-semibold text-[#FFFCF8] transition hover:bg-[#654936] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedProduct
                        ? "Save Changes"
                        : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mutation errors */}
        {(deleteMutation.isError || updateMutation.isError) && !modalOpen && (
          <div className="mt-5 rounded-xl border border-[#E4CBB8] bg-[#F3E3D7] p-4 text-sm text-[#8A5940]">
            {deleteMutation.error?.response?.data?.message ||
              updateMutation.error?.response?.data?.message ||
              "The requested action could not be completed."}

            <button
              type="button"
              onClick={() => {
                deleteMutation.reset();
                updateMutation.reset();
              }}
              className="ml-3 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, dark = false }) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-[0_8px_25px_rgba(63,45,34,0.04)] transition hover:-translate-y-1 ${
        dark
          ? "border-[#523A2C] bg-[#523A2C] text-[#FFFCF8]"
          : "border-[#E7D8C4] bg-[#FFFCF8] text-[#3F2D22]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm font-medium ${
            dark ? "text-[#D5C3AF]" : "text-[#8B7A68]"
          }`}
        >
          {title}
        </p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl ${
            dark ? "bg-[#684D3B] text-[#E7D1AF]" : "bg-[#F4EBDD] text-[#A9824D]"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 font-serif text-4xl font-medium">{value}</p>

      <p
        className={`mt-2 text-xs ${dark ? "text-[#D5C3AF]" : "text-[#A08D77]"}`}
      >
        {subtitle}
      </p>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#624832]">
        {label}
        {required && <span className="ml-1 text-[#A45D45]">*</span>}
      </label>
      {children}
    </div>
  );
}

export default Products;

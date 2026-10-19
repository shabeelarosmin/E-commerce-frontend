import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders } from "../../api/orderApi";

function Reports() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reports-orders"],
    queryFn: getAllOrders,
  });

  const orders = useMemo(() => {
    const result = response?.data ?? response;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.orders)) return result.orders;
    return [];
  }, [response]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : null;

      const matchesStatus =
        statusFilter === "all" ||
        String(order.orderStatus || order.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const searchText = search.trim().toLowerCase();
      const matchesSearch =
        !searchText ||
        String(order._id || order.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(order.customer?.name || order.customerName || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStart =
        !startDate ||
        (orderDate && orderDate >= new Date(`${startDate}T00:00:00`));

      const matchesEnd =
        !endDate || (orderDate && orderDate <= new Date(`${endDate}T23:59:59`));

      return matchesStatus && matchesSearch && matchesStart && matchesEnd;
    });
  }, [orders, statusFilter, search, startDate, endDate]);

  const totalSales = filteredOrders.reduce(
    (sum, order) =>
      sum + Number(order.totalAmount ?? order.totalPrice ?? order.total ?? 0),
    0,
  );

  const completedOrders = filteredOrders.filter((order) =>
    ["delivered", "completed"].includes(
      String(order.orderStatus || order.status || "").toLowerCase(),
    ),
  ).length;

  const pendingOrders = filteredOrders.filter((order) =>
    ["pending", "placed", "confirmed", "processing"].includes(
      String(order.orderStatus || order.status || "").toLowerCase(),
    ),
  ).length;

  const averageOrderValue = filteredOrders.length
    ? totalSales / filteredOrders.length
    : 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Date",
      "Status",
      "Payment Status",
      "Total",
    ];

    const rows = filteredOrders.map((order) => [
      order._id || order.id || "",
      order.customer?.name || order.customerName || "Customer",
      order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "",
      order.orderStatus || order.status || "",
      order.paymentStatus || "",
      order.totalAmount ?? order.totalPrice ?? order.total ?? 0,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "elora-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "delivered":
      case "completed":
        return "bg-green-50 text-green-700";
      case "cancelled":
      case "failed":
        return "bg-red-50 text-red-700";
      case "confirmed":
      case "processing":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef] p-4 text-[#38291f] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a18455]">
              ÉLORA Administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-sm text-[#8b7b6d]">
              Review order performance and export your sales data.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => refetch()}
              className="rounded-xl border border-[#d9cbbb] bg-white px-4 py-3 text-sm font-medium transition hover:bg-[#f1e9dd]"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={filteredOrders.length === 0}
              className="rounded-xl bg-[#493426] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#654832] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Sales",
              value: formatCurrency(totalSales),
              note: "Based on filtered orders",
            },
            {
              label: "Total Orders",
              value: filteredOrders.length,
              note: "Orders matching your filters",
            },
            {
              label: "Completed Orders",
              value: completedOrders,
              note: "Delivered or completed",
            },
            {
              label: "Average Order Value",
              value: formatCurrency(averageOrderValue),
              note: `${pendingOrders} pending or processing`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#e8dfd2] bg-[#f8f5ef] p-5 shadow-sm"
            >
              <p className="text-sm text-[#8b7b6d]">{item.label}</p>
              <p className="mt-3 break-words text-2xl font-semibold text-[#493426]">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-[#a18455]">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-[#e8dfd2] bg-[#f8f5ef] p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Filter Reports</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-[#756457]">
                Search orders
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order ID or customer"
                className="w-full rounded-xl border border-[#e3d8c9] bg-[#fdfbf8] px-4 py-3 text-sm outline-none focus:border-[#a18455]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#756457]">
                Order status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-[#e3d8c9] bg-[#f3ede3] px-4 py-3 text-sm outline-none focus:border-[#a18455]"
              >
                <option value="all">All statuses</option>
                <option value="placed">Placed</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#756457]">
                From date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#e3d8c9] bg-[#f3ede3] px-4 py-3 text-sm outline-none focus:border-[#a18455]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#756457]">
                To date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-[#e3d8c9] bg-[#f3ede3] px-4 py-3 text-sm outline-none focus:border-[#a18455]"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setStartDate("");
              setEndDate("");
            }}
            className="mt-4 text-sm font-medium text-[#947344] hover:text-[#493426]"
          >
            Clear filters
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8dfd2] bg-[#f8f5ef] shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-[#eee5d9] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Order Report</h2>
              <p className="mt-1 text-sm text-[#8b7b6d]">
                {filteredOrders.length} order(s) found
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-[#8b7b6d]">
              Loading report data...
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="font-medium text-red-700">
                Failed to load reports.
              </p>
              <p className="mt-2 text-sm text-[#8b7b6d]">
                {error?.message || "Please check your API connection."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-xl bg-[#493426] px-4 py-2 text-sm text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium">No orders found</p>
              <p className="mt-2 text-sm text-[#8b7b6d]">
                Try changing your filters or check whether orders exist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#f8f5ef] text-xs uppercase tracking-wider text-[#756457]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Order ID</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Order Status</th>
                    <th className="px-5 py-4 font-semibold">Payment</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8dd]">
                  {filteredOrders.map((order) => {
                    const status =
                      order.orderStatus || order.status || "pending";

                    return (
                      <tr
                        key={order._id || order.id}
                        className="transition hover:bg-[#eee4d6]"
                      >
                        <td className="px-5 py-4 font-medium text-[#493426]">
                          {String(order._id || order.id || "—").slice(-8)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {order.customer?.name ||
                              order.customerName ||
                              "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-[#9b8c7e]">
                            {order.customer?.email || ""}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-[#756457]">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize text-[#756457]">
                            {order.paymentStatus || order.paymentMethod || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatCurrency(
                            Number(
                              order.totalAmount ??
                                order.totalPrice ??
                                order.total ??
                                0,
                            ),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;

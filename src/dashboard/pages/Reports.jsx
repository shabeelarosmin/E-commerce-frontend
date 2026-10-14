import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import { getAllOrders } from "../../api/orderApi";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getStatus = (order) => String(order.orderStatus || "").toLowerCase();

const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(getStatus(order));

const getOrderAmount = (order) =>
  Number(order.totalAmount ?? order.totalPrice ?? 0);

function Reports() {
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reportOrders"],
    queryFn: getAllOrders,
  });

  // Supports common API response structures.
  const orders = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : Array.isArray(data)
        ? data
        : [];

  // Date and order-status filters.
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = dayjs(order.createdAt);

      const matchesDate =
        !dateRange ||
        (date.isValid() &&
          !date.isBefore(dateRange[0].startOf("day")) &&
          !date.isAfter(dateRange[1].endOf("day")));

      const matchesStatus =
        statusFilter === "all" || getStatus(order) === statusFilter;

      return matchesDate && matchesStatus;
    });
  }, [orders, dateRange, statusFilter]);

  // Non-cancelled orders for sales calculations.
  const salesOrders = filteredOrders.filter((order) => !isCancelled(order));

  const totalSales = salesOrders.reduce(
    (sum, order) => sum + getOrderAmount(order),
    0,
  );

  const deliveredOrders = filteredOrders.filter(
    (order) => getStatus(order) === "delivered",
  );

  const cancelledOrders = filteredOrders.filter(isCancelled);

  const averageOrderValue =
    salesOrders.length > 0 ? totalSales / salesOrders.length : 0;

  // Monthly comparison.
  const now = dayjs();
  const lastMonth = now.subtract(1, "month");

  const calculateMonthSales = (month) =>
    orders
      .filter((order) => {
        const date = dayjs(order.createdAt);

        return (
          date.isValid() && date.isSame(month, "month") && !isCancelled(order)
        );
      })
      .reduce((sum, order) => sum + getOrderAmount(order), 0);

  const thisMonthSales = calculateMonthSales(now);
  const lastMonthSales = calculateMonthSales(lastMonth);

  const monthlyChange =
    lastMonthSales > 0
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
      : null;

  // Daily sales chart: selected period or last 7 days.
  const chartData = useMemo(() => {
    const start = dateRange
      ? dateRange[0].startOf("day")
      : dayjs().subtract(6, "day").startOf("day");

    const end = dateRange
      ? dateRange[1].startOf("day")
      : dayjs().startOf("day");

    const dayCount = Math.max(end.diff(start, "day") + 1, 1);
    const visibleDays = Math.min(dayCount, 31);
    const chartStart =
      dayCount > 31 ? end.subtract(30, "day").startOf("day") : start;

    return Array.from({ length: visibleDays }, (_, index) => {
      const date = chartStart.add(index, "day");

      const sales = salesOrders
        .filter((order) => {
          const orderDate = dayjs(order.createdAt);
          return orderDate.isValid() && orderDate.isSame(date, "day");
        })
        .reduce((sum, order) => sum + getOrderAmount(order), 0);

      return {
        date: date.format("DD MMM"),
        sales,
      };
    });
  }, [salesOrders, dateRange]);

  const maxSales = Math.max(...chartData.map((item) => item.sales), 1);

  // BEST-SELLING PRODUCTS: ranked by units sold.
  const bestSellingProducts = useMemo(() => {
    const productMap = {};

    salesOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const productId =
          item.productId?._id || item.productId || item.name || "unknown";

        const productName =
          item.productId?.name || item.name || "Unknown Product";

        const key = String(productId);
        const quantity = Number(item.quantity || 0);
        const itemSales = Number(
          item.subtotal ?? Number(item.price || 0) * quantity,
        );

        if (!productMap[key]) {
          productMap[key] = {
            key,
            name: productName,
            quantity: 0,
            sales: 0,
          };
        }

        productMap[key].quantity += quantity;
        productMap[key].sales += itemSales;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity || b.sales - a.sales)
      .slice(0, 5);
  }, [salesOrders]);

  // CATEGORY-WISE SALES.
  // Works best when items.productId.categoryId is populated.
  const categorySales = useMemo(() => {
    const categoryMap = {};

    salesOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const product = item.productId;
        const category = product?.categoryId;

        const categoryName =
          category && typeof category === "object"
            ? category.name || "Uncategorized"
            : item.categoryName || "Uncategorized";

        const quantity = Number(item.quantity || 0);
        const itemSales = Number(
          item.subtotal ?? Number(item.price || 0) * quantity,
        );

        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = {
            key: categoryName,
            category: categoryName,
            quantity: 0,
            sales: 0,
          };
        }

        categoryMap[categoryName].quantity += quantity;
        categoryMap[categoryName].sales += itemSales;
      });
    });

    return Object.values(categoryMap).sort((a, b) => b.sales - a.sales);
  }, [salesOrders]);

  // CSV EXPORT.
  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      message.info("Export cheyyan orders illa");
      return;
    }

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Order ID",
      "Customer",
      "Amount",
      "Payment Status",
      "Order Status",
      "Created Date",
    ];

    const rows = filteredOrders.map((order) => [
      order._id,
      order.customerId?.name ||
        order.customer?.name ||
        order.shippingAddress?.name ||
        "Customer",
      getOrderAmount(order),
      order.paymentStatus || "unknown",
      order.orderStatus || "unknown",
      order.createdAt && dayjs(order.createdAt).isValid()
        ? dayjs(order.createdAt).format("YYYY-MM-DD")
        : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "elora-sales-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // ORDER TABLE COLUMNS.
  const orderColumns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "id",
      render: (id) =>
        `#${String(id || "")
          .slice(-8)
          .toUpperCase()}`,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) =>
        order.customerId?.name ||
        order.customer?.name ||
        order.shippingAddress?.name ||
        "Customer",
    },
    {
      title: "Items",
      key: "items",
      render: (_, order) =>
        order.items?.map((item, index) => (
          <div key={item._id || index}>
            {item.productId?.name || item.name || "Product"} ×{" "}
            {item.quantity || 1}
          </div>
        )) || "-",
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, order) => money(getOrderAmount(order)),
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "payment",
      render: (status) => (
        <Tag color={status === "paid" ? "green" : "orange"}>
          {status || "unknown"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "status",
      render: (status) => {
        const colors = {
          confirmed: "blue",
          cancelled: "red",
          canceled: "red",
          delivered: "green",
          shipped: "cyan",
          pending: "orange",
          placed: "gold",
        };

        const normalized = String(status || "").toLowerCase();

        return (
          <Tag color={colors[normalized] || "default"}>
            {status || "unknown"}
          </Tag>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) =>
        date && dayjs(date).isValid() ? dayjs(date).format("DD MMM YYYY") : "-",
    },
  ];

  // BEST-SELLING PRODUCT TABLE COLUMNS.
  const productColumns = [
    {
      title: "Rank",
      key: "rank",
      width: 75,
      render: (_, record, index) => (
        <span style={{ fontWeight: 600, color: "#98734f" }}>#{index + 1}</span>
      ),
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Units Sold",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Sales Value",
      dataIndex: "sales",
      key: "sales",
      render: (value) => money(value),
      sorter: (a, b) => a.sales - b.sales,
    },
  ];

  // CATEGORY TABLE COLUMNS.
  const categoryColumns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Units Sold",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Sales Value",
      dataIndex: "sales",
      key: "sales",
      render: (value) => money(value),
      sorter: (a, b) => a.sales - b.sales,
    },
  ];

  const panelStyle = {
    borderRadius: 12,
    height: "100%",
    border: "1px solid #e9e0d4",
    boxShadow: "0 3px 12px rgba(65, 48, 35, 0.04)",
  };

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>ELORA Reports</Title>
        <Text type="danger">
          Reports load cheyyan kazhinjilla. Admin login/API check cheyyuka.
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        background: "#faf8f4",
        minHeight: "100%",
        color: "#332a24",
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Text
            style={{
              color: "#9a795b",
              letterSpacing: 2,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ELORA / ANALYTICS
          </Text>
          <Title level={2} style={{ margin: "8px 0" }}>
            Sales Reports
          </Title>
          <Text type="secondary">
            Review sales, best-selling products and categories.
          </Text>
        </div>

        <Space wrap>
          <RangePicker value={dateRange} onChange={setDateRange} allowClear />
          <Button onClick={exportCSV}>Export CSV ↓</Button>
        </Space>
      </div>

      {/* SUMMARY CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={isLoading} style={panelStyle}>
            <Text type="secondary">Sales Value*</Text>
            <Title level={3}>{money(totalSales)}</Title>
            <Text type="secondary">Excludes cancelled orders</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={isLoading} style={panelStyle}>
            <Text type="secondary">Average Order Value</Text>
            <Title level={3}>{money(averageOrderValue)}</Title>
            <Text type="secondary">Per non-cancelled order</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={isLoading} style={panelStyle}>
            <Text type="secondary">Delivered Orders</Text>
            <Title level={3}>{deliveredOrders.length}</Title>
            <Text type="secondary">In selected period</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={isLoading} style={panelStyle}>
            <Text type="secondary">Cancelled Orders</Text>
            <Title level={3}>{cancelledOrders.length}</Title>
            <Text type="secondary">In selected period</Text>
          </Card>
        </Col>
      </Row>

      {/* SALES TREND AND MONTHLY COMPARISON */}
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} xl={16}>
          <Card title="Daily Sales Trend" style={panelStyle}>
            <Text type="secondary">
              Daily order value, excluding cancelled orders.
            </Text>

            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 8,
                height: 220,
                marginTop: 24,
                overflowX: "auto",
                padding: "8px 2px 0",
              }}
            >
              {chartData.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  title={`${item.date}: ${money(item.sales)}`}
                  style={{
                    flex: "1 0 18px",
                    minWidth: 18,
                    maxWidth: 52,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "end",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#7b6653",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {item.sales > 0 ? money(item.sales) : ""}
                  </div>

                  <div
                    style={{
                      width: "70%",
                      minWidth: 8,
                      height: `${Math.max((item.sales / maxSales) * 135, 3)}px`,
                      background: "#b58b65",
                      borderRadius: "5px 5px 0 0",
                    }}
                  />

                  <Text style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                    {item.date}
                  </Text>
                </div>
              ))}
            </div>

            {chartData.every((item) => item.sales === 0) && (
              <Text type="secondary">No sales data for this period.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Monthly Comparison" style={panelStyle}>
            <Text type="secondary">{now.format("MMMM YYYY")}</Text>
            <Title level={3}>{money(thisMonthSales)}</Title>

            <div style={{ margin: "20px 0" }}>
              <Text type="secondary">{lastMonth.format("MMMM YYYY")}</Text>
              <Title level={4}>{money(lastMonthSales)}</Title>
            </div>

            {monthlyChange === null ? (
              <Text type="secondary">
                No previous-month sales available for comparison.
              </Text>
            ) : (
              <Tag color={monthlyChange >= 0 ? "green" : "red"}>
                {monthlyChange >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(monthlyChange).toFixed(1)}% vs last month
              </Tag>
            )}

            <Text
              type="secondary"
              style={{ display: "block", marginTop: 16, fontSize: 12 }}
            >
              Based on non-cancelled order totals, not verified profit.
            </Text>
          </Card>
        </Col>
      </Row>

      {/* BEST-SELLING PRODUCTS */}
      <Card
        title="Top 5 Best-selling Products"
        style={{ ...panelStyle, marginTop: 24 }}
        loading={isLoading}
        extra={<Text type="secondary">By units sold</Text>}
      >
        <Table
          rowKey="key"
          columns={productColumns}
          dataSource={bestSellingProducts}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No product sales found" }}
        />
      </Card>

      {/* CATEGORY-WISE SALES */}
      <Card
        title="Category-wise Sales"
        style={{ ...panelStyle, marginTop: 24 }}
        loading={isLoading}
      >
        <Table
          rowKey="key"
          columns={categoryColumns}
          dataSource={categorySales}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No category sales found" }}
        />
      </Card>

      {/* DETAILED ORDERS */}
      <Card
        title="Detailed Orders Report"
        style={{ ...panelStyle, marginTop: 24 }}
        extra={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "All statuses" },
              { value: "placed", label: "Placed" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        }
      >
        <Table
          rowKey="_id"
          columns={orderColumns}
          dataSource={filteredOrders}
          loading={isLoading}
          scroll={{ x: 850 }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No orders found" }}
        />
      </Card>

      <Text
        type="secondary"
        style={{ display: "block", marginTop: 20, fontSize: 12 }}
      >
        *Sales Value excludes cancelled orders. Orders with pending payment may
        still be included. Verify payment status before treating this amount as
        collected revenue.
      </Text>
    </main>
  );
}

export default Reports;

export const requireLogin = (navigate, actionPath) => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login", {
      state: {
        from: {
          pathname: actionPath || "/products",
        },
      },
    });

    return false;
  }

  return true;
};

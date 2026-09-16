import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link className="brand" to="/">
        SmartOrder
      </Link>

      <div className="nav-links">
        {user?.role === "CUSTOMER" && (
          <>
            <Link to="/dashboard">Shop</Link>
            <Link to="/orders">My Orders</Link>
          </>
        )}

        {user?.role === "ADMIN" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/products">Products</Link>
            <Link to="/admin/branches">Branches</Link>
          </>
        )}

        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
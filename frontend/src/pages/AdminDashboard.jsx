import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">
            Welcome, {user?.name}.
          </p>
        </div>
      </div>

      <div className="empty-card">
        Dashboard statistics and management tools coming next.
      </div>
    </div>
  );
};

export default AdminDashboard;
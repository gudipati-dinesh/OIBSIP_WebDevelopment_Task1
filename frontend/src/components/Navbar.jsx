import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  return (
    <header className="nav">
      <div className="container nav-in">
        <Link to="/" className="logo">🍕 Slice<span className="dot">.</span></Link>
        <nav className="nav-links">
          <NavLink to="/" end className="nav-link">Menu</NavLink>
          <NavLink to="/build" className="nav-link">Build your own</NavLink>
          <NavLink to="/orders" className="nav-link">My orders</NavLink>
          <NavLink to="/cart" className="nav-link">Cart{count > 0 && <span className="cart-pill">{count}</span>}</NavLink>
          <span className="avatar" title={user?.name} style={{ marginLeft: 8 }}>{user?.name?.[0]?.toUpperCase()}</span>
          <button className="btn btn-ghost btn-sm hide-sm" onClick={() => { logout(); nav('/login'); }}>Log out</button>
        </nav>
      </div>
    </header>
  );
}

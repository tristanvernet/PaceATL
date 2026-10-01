import { NavLink } from "react-router-dom";
export default function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/login">Log in</NavLink>
      <NavLink className="nav-signup" to="/signup">
        Sign up
      </NavLink>
    </nav>
  );
}

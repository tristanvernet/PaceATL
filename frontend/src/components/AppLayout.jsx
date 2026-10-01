import { Outlet, Link } from "react-router-dom";
import Navigation from "./Navigation.jsx";
export default function AppLayout() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="PaceATL home">
            <span className="brand-mark" aria-hidden="true">
              P
            </span>{" "}
            PaceATL
          </Link>
          <Navigation />
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <span>PaceATL</span>
          <span>Built together. One step at a time.</span>
        </div>
      </footer>
    </>
  );
}

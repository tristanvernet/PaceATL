import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import { apiRequest } from "../api/client.js";
export default function HomePage() {
  const [connection, setConnection] = useState("Checking connection…");
  const [busy, setBusy] = useState(false);
  async function checkConnection() {
    setBusy(true);
    try {
      await apiRequest("/health");
      setConnection("Connected");
    } catch {
      setConnection("Unavailable — start the backend to connect.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    checkConnection();
  }, []);
  return (
    <section className="home">
      <div className="home-main">
        <p className="eyebrow">WELCOME TO PACEATL</p>
        <h1>
          Your next step
          <br />
          starts here.
        </h1>
        <p className="lead">A shared space for your PaceATL account.</p>
        <div className="actions">
          <Link className="button" to="/signup">
            Create an account <span aria-hidden="true">→</span>
          </Link>
          <Link className="text-link" to="/login">
            Already a member? Log in
          </Link>
        </div>
        <p className="muted">
          Account screens are ready to preview. Account access is coming next.
        </p>
      </div>
      <aside className="foundation">
        <p className="eyebrow">PROJECT FOUNDATION</p>
        <h2>
          One app.
          <br />
          Built together.
        </h2>
        <p>
          Shared navigation, forms and page layouts give each feature a
          consistent starting point.
        </p>
        <div className="connection">
          <span>Frontend ↔ backend</span>
          <strong role="status">{connection}</strong>
          <Button variant="secondary" onClick={checkConnection} disabled={busy}>
            {busy ? "Checking…" : "Check connection"}
          </Button>
        </div>
      </aside>
    </section>
  );
}

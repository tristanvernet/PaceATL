import { Routes, Route, Link } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./features/auth/AuthPage.jsx";
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route
          path="signup"
          element={<AuthPage key="signup" mode="signup" />}
        />
        <Route
          path="*"
          element={
            <section>
              <h1>Page not found</h1>
              <Link to="/">Return home</Link>
            </section>
          }
        />
      </Route>
    </Routes>
  );
}

import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import Notice from "../../components/Notice.jsx";
import { validateAuth } from "./validation.js";
export default function AuthPage({ mode }) {
  const signup = mode === "signup";
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef(null);
  function change(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setMessage("");
  }
  function submit(event) {
    event.preventDefault();
    const nextErrors = validateAuth(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Check the highlighted fields.");
      requestAnimationFrame(() =>
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setMessage(
      "Account access is not connected yet. No information has been saved or sent.",
    );
  }
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">YOUR PACEATL ACCOUNT</p>
        <h1>{signup ? "Make your first move." : "Welcome back."}</h1>
        <p className="lead">
          {signup
            ? "Start with an account. Keep everything in one place."
            : "Your account is where it all comes together."}
        </p>
        <div className="intro-rule" />
        <p className="muted">
          {signup ? "Already have an account?" : "New to PaceATL?"}
        </p>
        <Link className="text-link" to={signup ? "/login" : "/signup"}>
          {signup ? "Log in instead" : "Create an account"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="auth-form-wrap">
        <h2>{signup ? "Create your account" : "Log in to PaceATL"}</h2>
        <p className="muted">
          {signup
            ? "A few details to get started."
            : "Enter your email and password."}
        </p>
        <Notice>Preview only: account access is not connected yet.</Notice>
        <form ref={formRef} onSubmit={submit} noValidate>
          {signup && (
            <FormField
              label="Name"
              name="name"
              autoComplete="name"
              maxLength={100}
              value={values.name}
              onChange={change}
              error={errors.name}
              required
            />
          )}
          <FormField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            onChange={change}
            error={errors.email}
            required
          />
          <FormField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={signup ? "new-password" : "current-password"}
            value={values.password}
            onChange={change}
            error={errors.password}
            hint={signup ? "Use at least 12 characters." : undefined}
            required
            maxLength={128}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Show password
          </label>
          {signup && (
            <FormField
              label="Confirm password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={change}
              error={errors.confirmPassword}
              required
              maxLength={128}
            />
          )}
          <Button type="submit" className="submit-button">
            {signup ? "Create account" : "Log in"}{" "}
            <span aria-hidden="true">→</span>
          </Button>
          <div aria-live="polite">
            {message && (
              <Notice tone={Object.keys(errors).length ? "error" : "info"}>
                {message}
              </Notice>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

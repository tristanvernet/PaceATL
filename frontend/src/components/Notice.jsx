export default function Notice({ children, tone = "info", ...props }) {
  return (
    <div className={`notice notice-${tone}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = "gray" }: { children: React.ReactNode, variant?: "blue" | "gray" }) {
  const styles = {
    blue: "bg-primary-50 text-primary-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}
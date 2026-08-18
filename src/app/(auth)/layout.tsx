export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="min-h-full flex justify-center items-center">{children}</section>;
}
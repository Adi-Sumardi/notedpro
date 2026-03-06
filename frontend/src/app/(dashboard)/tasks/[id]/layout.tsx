export async function generateStaticParams() {
  return [{ id: "0" }];
}

export default function TaskIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

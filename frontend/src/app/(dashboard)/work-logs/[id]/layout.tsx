export async function generateStaticParams() {
  return [{ id: "0" }];
}

export default function WorkLogIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

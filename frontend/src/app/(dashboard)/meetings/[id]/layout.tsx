export async function generateStaticParams() {
  return [{ id: "0" }];
}

export default function MeetingIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import dynamic from "next/dynamic";

const EditWorkLogPage = dynamic(() => import("./client-page"), { ssr: false });

export async function generateStaticParams() {
  return [{ id: "0" }];
}

export default function Page() {
  return <EditWorkLogPage />;
}

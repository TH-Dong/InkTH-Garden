import Sidebar from "@/components/knowledge/Sidebar";
import { getKnowledgeTree } from "@/lib/content/knowledgeTree";

export default function KnowledgesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = getKnowledgeTree();

  return (
    <div className="mx-auto flex max-w-6xl px-4 py-10 sm:px-6">
      <div className="hidden md:block">
        <Sidebar tree={tree} />
      </div>
      {children}
    </div>
  );
}

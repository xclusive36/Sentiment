import { getAllMarkdownFiles, getAllTags } from '@/lib/files';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function HomePage() {
  const fullStructure = getAllMarkdownFiles();
  const allTags = getAllTags(fullStructure);

  return <LayoutWrapper initialStructure={fullStructure} allTags={allTags} />;
}

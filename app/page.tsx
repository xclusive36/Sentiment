import { getAllMarkdownFiles, getAllTags } from '@/lib/files';
import HomePageClient from '@/components/HomePageClient';

export default function HomePage() {
  const fullStructure = getAllMarkdownFiles();
  const allTags = getAllTags(fullStructure);

  return <HomePageClient initialStructure={fullStructure} allTags={allTags} />;
}

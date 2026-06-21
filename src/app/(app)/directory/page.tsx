import { redirect } from 'next/navigation';

export default function DirectoryPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams).toString();
  redirect(params ? `/specialists?${params}` : '/specialists');
}

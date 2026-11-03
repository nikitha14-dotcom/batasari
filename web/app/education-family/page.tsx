import { redirect } from 'next/navigation';
import { RequireSession } from '@/lib/supabase/RequireSession';
import { EducationFamilyPageView } from '@/components/education/EducationFamilyPage';

interface Props {
  searchParams: Promise<{ group?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { group } = await searchParams;

  // /education-family with no ?group param is a blank page (no sub-category selected).
  // Redirect to the first sub-category so the user always sees content.
  // The parent "Education & Family" nav item is now a toggle button, so it never
  // navigates here directly — this redirect only fires on direct URL visits.
  if (!group) {
    redirect('/education-family?group=childcare');
  }

  return (
    <RequireSession>
      <EducationFamilyPageView />
    </RequireSession>
  );
}


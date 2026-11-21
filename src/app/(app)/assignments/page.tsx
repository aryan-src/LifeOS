import { getAssignmentsWithStatus } from '@/lib/actions/assignments';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { getUserProfile } from '@/lib/actions/profile';
import { AssignmentsView } from '@/components/assignments/assignments-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Assignments',
  description: 'Manage academic assignments, submission pending workflows, and grades.',
};

export default async function AssignmentsPage() {
  const [{ assignments, error, isSchemaMissing }, projects, profile] = await Promise.all([
    getAssignmentsWithStatus(),
    getProjectOptions(),
    getUserProfile().catch(() => null),
  ]);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1720px] mx-auto">
      <AssignmentsView
        initialAssignments={assignments}
        projects={projects}
        initialError={error}
        isSchemaMissing={isSchemaMissing}
        userTimezone={profile?.timezone ?? undefined}
      />
    </main>
  );
}

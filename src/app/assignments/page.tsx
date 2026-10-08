import { getAssignmentsWithStatus } from '@/lib/actions/assignments';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { AssignmentsView } from '@/components/assignments/assignments-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Assignment Tracker | LifeOS',
  description: 'Manage academic assignments, submission pending workflows, and grades.',
};

export default async function AssignmentsPage() {
  const [{ assignments, error, isSchemaMissing }, projects] = await Promise.all([
    getAssignmentsWithStatus(),
    getProjectOptions(),
  ]);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <AssignmentsView
        initialAssignments={assignments}
        projects={projects}
        initialError={error}
        isSchemaMissing={isSchemaMissing}
      />
    </main>
  );
}

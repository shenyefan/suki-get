import { createFileRoute } from '@tanstack/react-router';
import { ErrorScreen } from '../components/error-screen';
import { normaliseErrorCode } from '../lib/errors';

export const Route = createFileRoute('/error')({
  validateSearch: (search: Record<string, unknown>) => ({ code: normaliseErrorCode(search.code) }),
  head: () => ({ meta: [{ title: '遇到问题 · Suki Get' }] }),
  component: ErrorPage
});

function ErrorPage() {
  const { code } = Route.useSearch();
  return <ErrorScreen code={code} />;
}

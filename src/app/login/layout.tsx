import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | LifeOS',
  description: 'Sign in to your private LifeOS workspace. Protected by Row-Level Security.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

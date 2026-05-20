import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <SignIn />
    </div>
  );
}

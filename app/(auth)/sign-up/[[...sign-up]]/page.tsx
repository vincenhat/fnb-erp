import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <SignUp />
    </div>
  );
}

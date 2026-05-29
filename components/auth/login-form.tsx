'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/auth';
import { IDLE_FORM_STATE } from '@/lib/forms';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldError } from '@/components/auth/field-error';
import { SubmitButton } from '@/components/auth/submit-button';

export type LoginCopy = {
  title: string;
  description: string;
  email: string;
  password: string;
  submit: string;
  submitting: string;
  noAccount: string;
  signupLink: string;
};

export function LoginForm({ copy }: { copy: LoginCopy }) {
  const [state, formAction] = useActionState(loginAction, IDLE_FORM_STATE);
  const fieldErrors = state.fieldErrors;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form action={formAction} noValidate>
        <CardContent className="flex flex-col gap-4">
          {state.status === 'error' && state.message ? (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{copy.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={fieldErrors?.email ? true : undefined}
              aria-describedby={fieldErrors?.email ? 'email-error' : undefined}
            />
            <FieldError id="email-error" errors={fieldErrors?.email} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{copy.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={fieldErrors?.password ? true : undefined}
              aria-describedby={fieldErrors?.password ? 'password-error' : undefined}
            />
            <FieldError id="password-error" errors={fieldErrors?.password} />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <SubmitButton label={copy.submit} pendingLabel={copy.submitting} />
          <p className="text-center text-sm text-muted-foreground">
            {copy.noAccount}{' '}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              {copy.signupLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

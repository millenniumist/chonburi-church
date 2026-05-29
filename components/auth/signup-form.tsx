'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signupAction } from '@/lib/actions/auth';
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

export type SignupCopy = {
  title: string;
  description: string;
  name: string;
  email: string;
  password: string;
  passwordHint: string;
  phone: string;
  phoneOptional: string;
  submit: string;
  submitting: string;
  haveAccount: string;
  loginLink: string;
};

export function SignupForm({ copy }: { copy: SignupCopy }) {
  const [state, formAction] = useActionState(signupAction, IDLE_FORM_STATE);
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
            <Label htmlFor="name">{copy.name}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-invalid={fieldErrors?.name ? true : undefined}
              aria-describedby={fieldErrors?.name ? 'name-error' : undefined}
            />
            <FieldError id="name-error" errors={fieldErrors?.name} />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={fieldErrors?.password ? true : undefined}
              aria-describedby={fieldErrors?.password ? 'password-error' : 'password-hint'}
            />
            <FieldError id="password-error" errors={fieldErrors?.password} />
            {!fieldErrors?.password ? (
              <p id="password-hint" className="text-xs text-muted-foreground">
                {copy.passwordHint}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">
              {copy.phone}{' '}
              <span className="font-normal text-muted-foreground">{copy.phoneOptional}</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={fieldErrors?.phone ? true : undefined}
              aria-describedby={fieldErrors?.phone ? 'phone-error' : undefined}
            />
            <FieldError id="phone-error" errors={fieldErrors?.phone} />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <SubmitButton label={copy.submit} pendingLabel={copy.submitting} />
          <p className="text-center text-sm text-muted-foreground">
            {copy.haveAccount}{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {copy.loginLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

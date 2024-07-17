import { useFormStatus } from "react-dom";
import { Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { TextField } from "react-aria-components";
import { useActionState } from "react";
import { Button } from "@repo/ui/components/Button";
import { Form } from "@repo/ui/components/Form";
import { Link } from "@repo/ui/components/Link";
import { FieldError } from "@repo/ui/components/FieldError";
import { Input } from "@repo/ui/components/Input";
import { Label } from "@repo/ui/components/Label";
import poweredByUrl from "@/shared/ui/images/powered-by.png";
import logoMarkUrl from "@/shared/ui/images/logo-mark.png";
import { type AuthenticationState, useSignInAction } from "@repo/infrastructure/auth/hooks";

export default function LoginForm() {
  const signInAction = useSignInAction();
  const { i18n } = useLingui();
  const initialState: AuthenticationState = { message: null, errors: {} };

  const [state, action] = useActionState(signInAction, initialState);

  return (
    <Form action={action} validationErrors={state.errors} className="space-y-3 w-full max-w-sm">
      <div className="flex flex-col gap-4 rounded-lg px-6 pb-4 pt-8 w-full">
        <div className="flex justify-center">
          <img src={logoMarkUrl} className="h-12 w-12" alt="logo mark" />
        </div>
        <h1 className="mb-3 text-2xl w-full text-center">
          <Trans>Please sign in to continue</Trans>
        </h1>
        <div className="text-gray-500 text-sm text-center">
          <Trans>
            Sign in with your company email address to get started building on PlatformPlatform - just like thousands of
            other developers.
          </Trans>
        </div>
        <div className="w-full flex flex-col gap-4">
          <TextField className="flex flex-col">
            <Label>
              <Trans>Email</Trans>
            </Label>
            <Input
              type="email"
              name="email"
              autoComplete="email webauthn"
              autoFocus
              required
              placeholder={i18n.t("yourname@example.com")}
            />
            <FieldError />
          </TextField>

          <TextField type="password" name="password" className="flex flex-col">
            <Label>
              <Trans>Password</Trans>
            </Label>
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={i18n.t("Enter password")}
              required
            />
            <FieldError />
          </TextField>
        </div>
        <LoginButton />
        <div className="flex flex-col text-neutral-500 items-center gap-6">
          <p className="text-xs text-neutral-500">
            <Trans>Don't have an account?</Trans>{" "}
            <Link href="/register">
              <Trans>Sign up</Trans>
            </Link>
          </p>
          <img src={poweredByUrl} alt="powered by" />
        </div>
      </div>
    </Form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="mt-4 w-full text-center" aria-disabled={pending}>
      <Trans>Sign in</Trans>
    </Button>
  );
}

import { AuthContainer, ResetPasswordForm } from "@/components/auth"

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<URLSearchParams>
}) {
	const params = await searchParams
	const token = params.get("token") ?? ""

	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Reset password"
				description="Choose a new password for your account."
			/>
			<AuthContainer.Content>
				<ResetPasswordForm token={token} />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}

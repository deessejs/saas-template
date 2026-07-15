"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog"

interface Session {
	id: string
	token: string
	userAgent: string
	ipAddress: string
	expiresAt: Date
	isCurrent: boolean
}

export function SessionsTable() {
	const [sessions, setSessions] = useState<Session[]>([])
	const [loading, setLoading] = useState(true)
	const [revoking, setRevoking] = useState<string | null>(null)
	const [revokeAllOpen, setRevokeAllOpen] = useState(false)
	const [revokingAll, setRevokingAll] = useState(false)

	useEffect(() => {
		loadSessions()
	}, [])

	async function loadSessions() {
		setLoading(true)
		const [{ data: sessions }, { data: currentSession }] = await Promise.all([
			authClient.listSessions(),
			authClient.useSession(),
		])
		setLoading(false)

		if (!sessions || !currentSession) {
			setSessions([])
			return
		}

		const currentToken = currentSession.session?.token

		setSessions(
			sessions.map((s) => ({
				id: s.id,
				token: s.token,
				userAgent: s.userAgent ?? "Unknown",
				ipAddress: s.ipAddress ?? "—",
				expiresAt: s.expiresAt,
				isCurrent: s.token === currentToken,
			})),
		)
	}

	async function handleRevoke(id: string) {
		setRevoking(id)
		const { error } = await authClient.revokeSession({ token: id })
		setRevoking(null)

		if (error) {
			toast.error(error.message ?? "Failed to revoke session")
			return
		}

		setSessions((prev) => prev.filter((s) => s.id !== id))
	}

	async function handleRevokeAll() {
		setRevokingAll(true)
		const { error } = await authClient.revokeOtherSessions()
		setRevokingAll(false)
		setRevokeAllOpen(false)

		if (error) {
			toast.error(error.message ?? "Failed to sign out other sessions")
			return
		}

		setSessions((prev) => prev.filter((s) => s.isCurrent))
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Dialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							Sign out everywhere else
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Sign out of other sessions?</DialogTitle>
							<DialogDescription>
								You will be signed out of all other devices and browsers.
								Only your current session will remain active.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setRevokeAllOpen(false)}>
								Cancel
							</Button>
							<Button variant="destructive" onClick={handleRevokeAll} disabled={revokingAll}>
								{revokingAll ? "Signing out…" : "Sign out everywhere"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex flex-col gap-2">
				{loading && sessions.length === 0 && (
					<p className="text-sm text-muted-foreground">Loading sessions…</p>
				)}
				{!loading && sessions.length === 0 && (
					<p className="text-sm text-muted-foreground">No other active sessions.</p>
				)}
				{sessions.map((session) => (
					<div
						key={session.id}
						className="flex items-center justify-between rounded-lg border p-3"
					>
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">{session.userAgent}</p>
								{session.isCurrent && (
									<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
										Current
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								{session.ipAddress} · Expires {new Date(session.expiresAt).toLocaleDateString()}
							</p>
						</div>
						{!session.isCurrent && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleRevoke(session.id)}
								disabled={revoking === session.id}
							>
								{revoking === session.id ? "Signing out…" : "Sign out"}
							</Button>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

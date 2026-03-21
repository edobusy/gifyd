import React from "react"

type State = {
	hasError: boolean
	error?: Error
}

class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	State
> {
	state: State = { hasError: false, error: undefined }

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "2rem", textAlign: "center" }}>
					<h1>Something went wrong</h1>
					<p>{this.state.error?.message}</p>
					<button onClick={() => window.location.reload()}>
						Reload
					</button>
				</div>
			)
		}
		return this.props.children
	}
}

export default ErrorBoundary

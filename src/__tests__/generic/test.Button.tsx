import React, { useState } from "react"
import ReactDOM from "react-dom"
import {
	render,
	screen,
	fireEvent,
	cleanup,
	getNodeText,
	waitFor,
} from "@testing-library/react"
import Button from "../../components/generic/Button"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

afterEach(cleanup)

// Trying out react-testing-library with simple tests on the component Button

describe("Simple tests on the custom Button component", () => {
	it("Button name is correctly displayed on render", () => {
		render(
			<Button
				buttonProps={{ buttonName: "Done", tilt: false, disabled: false }}
			/>
		)

		expect(screen.getByText("Done")).toBeInTheDocument()
	})

	type Props = {}

	const TestWrapper = (props: Props) => {
		const [buttonName, setButtonName] = useState("Done")

		return (
			<div>
				<button
					onClick={() => {
						setButtonName("Upload")
					}}
				>
					Change Button Name
				</button>
				<Button buttonProps={{ buttonName, tilt: false, disabled: false }} />
			</div>
		)
	}

	it("Button name is correctly updated when props change", async () => {
		const { container, getByText, getByRole } = render(<TestWrapper />)
		const changeNameButton = getByText("Change Button Name")
		const buttonGeneric = getByRole("button", { name: "Done" })

		expect(buttonGeneric).toBeInTheDocument()

		await userEvent.click(changeNameButton)

		expect(buttonGeneric).toHaveTextContent("Upload")
	})
})

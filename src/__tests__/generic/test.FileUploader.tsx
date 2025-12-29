import React, { ChangeEvent, useState } from "react"
import ReactDOM from "react-dom"
import {
	render,
	screen,
	fireEvent,
	cleanup,
	getNodeText,
	waitFor,
} from "@testing-library/react"
import FileUploader from "../../components/generic/FileUploader"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

afterEach(cleanup)

describe("Simple tests on the custom File Uploader component", () => {
	let file: File[] | null = null
	let uploadedFile: File | null = null
	let errorString = ""

	beforeEach(() => {
		file = null
		uploadedFile = null
		errorString = ""
	})

	// Function slightly tweaked to make testing easier, functionality is kept intact
	const videoUploadMock = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) {
			errorString = "There are no files here"
			return
		}

		if (e.target.files.length !== 1) {
			errorString = "Please upload one file!"
			return
		}
		if (e.target.files[0].type !== "video/mp4") {
			errorString = "Please upload an mp4 video"
			return
		}
		if (e.target.files[0].size < 20000) {
			errorString = "Video is too tiny!"
			return
		}
		if (e.target.files[0].size > 358406553600) {
			errorString = "Video is too big!"
			return
		}
		uploadedFile = e.target.files[0]
	}

	it("rejects two or more files", async () => {
		file = [
			new File(["This is a beautiful mocked video"], "testVid2.mp4", {
				type: "video/mp4",
			}),
			new File(["This is a beautiful mocked video"], "testVid1.mp4", {
				type: "video/mp4",
			}),
		]

		render(
			<FileUploader
				fileUploaderProps={{ fileUploadFunc: videoUploadMock, disabled: false }}
			/>
		)

		const inputComponent: HTMLInputElement =
			screen.getByTitle("fileUploaderInput")

		fireEvent.change(inputComponent, { target: { files: file } })

		expect(errorString).toBe("Please upload one file!")
	})

	it("rejects non-video files", async () => {
		file = [
			new File(["This is a beautiful mocked video"], "testPng.png", {
				type: "image/png",
			}),
		]

		render(
			<FileUploader
				fileUploaderProps={{ fileUploadFunc: videoUploadMock, disabled: false }}
			/>
		)

		const inputComponent: HTMLInputElement =
			screen.getByTitle("fileUploaderInput")

		fireEvent.change(inputComponent, { target: { files: file } })

		expect(errorString).toBe("Please upload an mp4 video")
	})

	it("rejects videos that are too small", async () => {
		file = [
			new File(["This is a beautiful mocked video"], "testVid.mp4", {
				type: "video/mp4",
			}),
		]

		render(
			<FileUploader
				fileUploaderProps={{ fileUploadFunc: videoUploadMock, disabled: false }}
			/>
		)

		const inputComponent: HTMLInputElement =
			screen.getByTitle("fileUploaderInput")

		fireEvent.change(inputComponent, { target: { files: file } })

		expect(errorString).toBe("Video is too tiny!")
	})

	it("rejects videos that are too big", async () => {
		file = [
			new File(["This is a beautiful mocked video"], "testVid.mp4", {
				type: "video/mp4",
			}),
		]

		Object.defineProperty(file[0], "size", { value: 358406553601 })

		render(
			<FileUploader
				fileUploaderProps={{ fileUploadFunc: videoUploadMock, disabled: false }}
			/>
		)

		const inputComponent: HTMLInputElement =
			screen.getByTitle("fileUploaderInput")

		fireEvent.change(inputComponent, { target: { files: file } })

		expect(errorString).toBe("Video is too big!")
	})

	it("upload the video successfully", async () => {
		file = [
			new File(["This is a beautiful mocked video"], "successfulTestVid.mp4", {
				type: "video/mp4",
			}),
		]
		Object.defineProperty(file[0], "size", { value: 1000000 })

		render(
			<FileUploader
				fileUploaderProps={{ fileUploadFunc: videoUploadMock, disabled: false }}
			/>
		)

		const inputComponent: HTMLInputElement =
			screen.getByTitle("fileUploaderInput")

		fireEvent.change(inputComponent, { target: { files: file } })

		expect(errorString).toBe("")
		expect(uploadedFile).toBeTruthy()
	})
})

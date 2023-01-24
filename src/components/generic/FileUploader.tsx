import React, { ChangeEvent, useRef } from 'react'
import Button from './Button'

type Props = {
  fileUploadFunc: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  disabled: boolean
}

const FileUploader = (props: { fileUploaderProps: Props }) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null)
  const { fileUploadFunc, disabled } = props.fileUploaderProps

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!hiddenFileInput.current) return
    hiddenFileInput.current.click()
  }

  return (
    <div className='uploadButton'>
      <input
        title='fileUploaderInput'
        ref={hiddenFileInput}
        style={{ display: 'none' }}
        type='file'
        id='fileUploaderInput'
        name='fileUploaderInput'
        onChange={fileUploadFunc}
        disabled={disabled}
      ></input>
      <Button
        buttonProps={{
          handleClick,
          buttonName: 'Upload',
          tilt: false,
          disabled,
        }}
      />
    </div>
  )
}

export default FileUploader

import React, { ChangeEvent, useRef } from 'react'
import Button from './Button'

type Props = {
  fileUploadFunc: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  disabled: boolean
}

const FileUploader = ({ fileUploadFunc, disabled }: Props) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null)

  const handleClick = () => {
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
        accept='video/mp4'
        id='fileUploaderInput'
        name='fileUploaderInput'
        onChange={fileUploadFunc}
        disabled={disabled}
      ></input>
      <Button
        handleClick={handleClick}
        buttonName="Upload"
        tilt={false}
        disabled={disabled}
      />
    </div>
  )
}

export default FileUploader

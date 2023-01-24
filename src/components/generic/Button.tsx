import React from 'react'

type Props = {
  handleClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  buttonName: string
  tilt: boolean
  disabled: boolean
  value?: string
  isFocused?: boolean
}

const Button = (props: { buttonProps: Props }) => {
  const { handleClick, buttonName, tilt, disabled, value, isFocused } =
    props.buttonProps

  return (
    <button
      className={`buttonContainer ${tilt ? 'tilt' : ''} ${
        isFocused ? 'focusedButton' : ''
      }`}
      onMouseDown={handleClick}
      disabled={disabled}
      value={value}
      autoFocus={isFocused}
    >
      <p className='buttonText'>{buttonName}</p>
    </button>
  )
}

export default Button

import React, { ChangeEvent, SetStateAction, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  render,
  screen,
  fireEvent,
  cleanup,
  getNodeText,
  waitFor,
} from '@testing-library/react'
import FileUploader from '../../components/generic/FileUploader'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import TextColour from '../../components/Caption/TextColour'
import { VideoSettings } from '../../interfaces/types'

afterEach(cleanup)

type Props = {
  transparency: boolean
}

const TextColourWrapper = (props: { componentProps: Props }) => {
  const { transparency } = props.componentProps
  const [textOptions, setTextOptions] = useState<VideoSettings>({
    content: '',
    textColour: '#ffffff',
    font: 'times',
    fontSize: '(w-text_w)/10',
    boxColour: '#000000',
    boxTransparency: '0.5',
    boxBorderWidth: '5',
    x: '(w-text_w)/2',
    y: '(h-text_h)-(h-text_h)/20',
  })

  return (
    <div>
      <p>{textOptions.boxColour}</p>
      <p>{textOptions.boxTransparency}</p>
      <TextColour
        colourProps={{
          targetContent: 'box',
          transparency,
          textOptions,
          setTextOptions,
        }}
      />
    </div>
  )
}

describe('Simple tests on the TextColour component', () => {
  it('is correctly displayed with the transparency option off', () => {
    // Arrange
    render(<TextColourWrapper componentProps={{ transparency: false }} />)

    const colourLabel = screen.getByText('Box Colour:')
    const colourSlider = screen.getByLabelText('boxColour')
    const transparencyLabel = screen.queryByText('Box Alpha:')
    const transparencySlider = screen.queryByLabelText('boxTransparency')

    // Act

    // Assert
    expect(colourLabel).toBeInTheDocument()
    expect(colourSlider).toBeInTheDocument()
    expect(transparencyLabel).not.toBeInTheDocument()
    expect(transparencySlider).not.toBeInTheDocument()
  })

  it('is correctly displayed with the transparency option on', () => {
    // Arrange
    render(<TextColourWrapper componentProps={{ transparency: true }} />)

    const colourLabel = screen.getByText('Box Colour:')
    const colourSlider = screen.getByLabelText('boxColour')
    const transparencyLabel = screen.getByText('Box Alpha:')
    const transparencySlider = screen.getByLabelText('boxTransparency')

    // Act

    // Assert
    expect(colourLabel).toBeInTheDocument()
    expect(colourSlider).toBeInTheDocument()
    expect(transparencyLabel).toBeInTheDocument()
    expect(transparencySlider).toBeInTheDocument()

    fireEvent.change(colourSlider, { target: { value: '#ffffff' } })
    const currentColour = screen.getByText('#ffffff')

    expect(currentColour).toBeInTheDocument()
  })

  it('changes the colour value when the colour input is used', () => {
    // Arrange
    render(<TextColourWrapper componentProps={{ transparency: false }} />)

    const colourSlider = screen.getByLabelText('boxColour')

    // Act
    fireEvent.change(colourSlider, { target: { value: '#ffffff' } })
    const currentColour = screen.getByText('#ffffff')

    // Assert
    expect(currentColour).toBeInTheDocument()
  })

  it('changes the transparency value when the alpha slider is used', () => {
    // Arrange
    render(<TextColourWrapper componentProps={{ transparency: true }} />)

    const transparencySlider = screen.getByLabelText('boxTransparency')

    // Act
    fireEvent.change(transparencySlider, { target: { value: '1' } })
    const currentTransparency = screen.getByText('1')

    // Assert
    expect(currentTransparency).toBeInTheDocument()
  })
})

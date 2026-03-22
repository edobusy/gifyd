import React from 'react'
import { videoMenu } from '../interfaces/enums'
import { Callback, Colour, FilterOptionProps } from '../interfaces/types'
import FilterButton from './Filter/FilterButton'

type Props = {
  videoMenuOptions: {
    buttonName: string
    videoMenuVal: videoMenu
    callbackFunction: Callback
    CustomisationComponent: React.ElementType
    optionProps: FilterOptionProps
  }[]
  colourSettings: videoMenu | null
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
  setColourSettings: React.Dispatch<React.SetStateAction<videoMenu | null>>
  setCallback: (value: React.SetStateAction<Callback>) => void
  isFilterFocused: boolean[]
  setIsFilterFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

const FilterOptions = ({
  videoMenuOptions,
  setColourSettings,
  setCallback,
  colourSettings,
  isFilterFocused,
  setIsFilterFocused,
}: Props) => {
  return (
    <div className='filterSettings'>
      <div className='filterOptionsContainer'>
        {videoMenuOptions.map(
          ({ buttonName, videoMenuVal, callbackFunction }) => (
            <div key={buttonName} className='filterOptions'>
              <FilterButton
                buttonName={buttonName}
                videoMenuVal={videoMenuVal}
                callbackFunction={callbackFunction}
                setCallback={setCallback}
                setColourSettings={setColourSettings}
                isFilterFocused={isFilterFocused}
                setIsFilterFocused={setIsFilterFocused}
              />
            </div>
          )
        )}
      </div>
      <>
        {videoMenuOptions.map(
          ({ videoMenuVal, CustomisationComponent, optionProps }) => (
            <div key={'customisationComponent' + videoMenuVal}>
              {colourSettings === videoMenuVal && (
                <CustomisationComponent {...optionProps} />
              )}
            </div>
          )
        )}
      </>
    </div>
  )
}

export default FilterOptions

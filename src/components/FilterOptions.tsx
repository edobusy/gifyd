import React from 'react'
import { videoMenu } from '../interfaces/enums'
import { Callback, Colour, FilterLevels } from '../interfaces/types'
import FilterButton from './Filter/FilterButton'

type Props = {
  videoMenuOptions: {
    buttonName: string
    videoMenuVal: videoMenu
    callbackFunction: Callback
    CustomisationComponent: React.ElementType
    optionProps: any
  }[]
  colourSettings: string
  rgbaMod: Colour
  setRgbaMod: React.Dispatch<React.SetStateAction<Colour>>
  setColourSettings: (value: React.SetStateAction<string>) => void
  setCallback: (value: React.SetStateAction<Callback>) => void
  isFilterFocused: boolean[]
  setIsFilterFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

const FilterOptions = (props: { filterProps: Props }) => {
  const {
    videoMenuOptions,
    setColourSettings,
    setCallback,
    colourSettings,
    isFilterFocused,
    setIsFilterFocused,
  } = props.filterProps

  return (
    <div className='filterSettings'>
      <div className='filterOptionsContainer'>
        {videoMenuOptions.map(
          ({ buttonName, videoMenuVal, callbackFunction }) => (
            <div key={buttonName} className='filterOptions'>
              <FilterButton
                filterButtonProps={{
                  buttonName,
                  videoMenuVal,
                  callbackFunction,
                  setCallback,
                  setColourSettings,
                  isFilterFocused,
                  setIsFilterFocused,
                }}
              />
            </div>
          )
        )}
      </div>
      <>
        {videoMenuOptions.map(
          ({ videoMenuVal, CustomisationComponent, optionProps }) => (
            <div key={'customisationComponent' + videoMenuVal}>
              {colourSettings.includes(videoMenuVal.toString()) && (
                <CustomisationComponent optionProps={optionProps} />
              )}
            </div>
          )
        )}
      </>
    </div>
  )
}

export default FilterOptions

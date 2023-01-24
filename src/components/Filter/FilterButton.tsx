import React from 'react'
import { videoMenu } from '../../interfaces/enums'
import { Callback } from '../../interfaces/types'
import Button from '../generic/Button'

type Props = {
  buttonName: string
  videoMenuVal: videoMenu
  callbackFunction: Callback
  setCallback: (value: React.SetStateAction<Callback>) => void
  setColourSettings: (value: React.SetStateAction<string>) => void
  isFilterFocused: boolean[]
  setIsFilterFocused: React.Dispatch<React.SetStateAction<boolean[]>>
}

const FilterButton = (props: { filterButtonProps: Props }) => {
  const {
    buttonName,
    videoMenuVal,
    callbackFunction,
    setCallback,
    setColourSettings,
    isFilterFocused,
    setIsFilterFocused,
  } = props.filterButtonProps

  const handleClick = () => {
    setColourSettings((setting) => {
      const menuVal = videoMenuVal
      if (setting.includes(menuVal.toString())) {
        setIsFilterFocused((arr) => {
          arr[menuVal] = false
          return arr
        })
        return ''
      }
      setIsFilterFocused((arr) => {
        return arr.map((item, idx, arr) => {
          if (idx == menuVal) {
            return true
          } else {
            return false
          }
        })
      })
      return menuVal.toString()
    })

    setCallback(() => callbackFunction)
  }

  return (
    <Button
      buttonProps={{
        handleClick,
        buttonName,
        tilt: false,
        disabled: false,
        isFocused: isFilterFocused[videoMenuVal],
      }}
    />
  )
}

export default FilterButton

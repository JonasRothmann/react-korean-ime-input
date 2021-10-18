import React, { FC, InputHTMLAttributes } from 'react'
import { position } from 'caret-pos'
// @ts-ignore
import gksdud from 'gksdud'
// @ts-ignore
import KoreanIME from 'korean-ime-simple'
// @ts-ignore
import {
  R,
  FIRSTs, MIDDLEs, LASTs,
  DISASSAMBLED_MIDDLE,
  DISASSAMBLED_LAST,
  assamble
// @ts-ignore
} from 'korean-ime-simple/common'

const KoreanIMEInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({ value, onChange, onKeyDown, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.target.value = handleKorean(e.target.value)
    onChange && onChange(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): React.KeyboardEvent<HTMLInputElement> => {
    const target = e.target as EventTarget & HTMLInputElement
    if (e.code === 'Backspace') {
      const selection = (target.selectionStart || 0) - (target.selectionEnd || 0)
      if (selection !== 0) return e
      const { pos } = position(target)

      const newValue = String(value)

      const deletePosition = pos - 1
      const deconstructedChar = destructiveKorean(newValue.charAt(deletePosition))
      deconstructedChar.pop()

      target.value = setCharAt(newValue, deletePosition, assamble(deconstructedChar[0], deconstructedChar[1], deconstructedChar[2]))
      onChange && onChange(e as unknown as React.ChangeEvent<HTMLInputElement>)

      // If we deleted the entire character
      if (!deconstructedChar[0]) {
        target.setSelectionRange(deletePosition, deletePosition)
      } else {
        target.setSelectionRange(deletePosition + 1, deletePosition + 1)
      }

      e.preventDefault()
      return e
    }
    return e
  }

  return <input onKeyDown={e => onKeyDown ? onKeyDown(handleKeyDown(e)) : handleKeyDown(e)} value={value} onChange={e => handleChange(e)} {...props} />
}
export default KoreanIMEInput

const setCharAt = (str: string, index: number, chr: string) => {
  if (index > str.length - 1) return str
  return str.substring(0, index) + chr + str.substring(index + 1)
}

function handleKorean (str: string) {
  const cnt = str.length
  let cCode
  let stringSoFar = ''

  for (let i = 0; i < cnt; i++) {
    cCode = str.charCodeAt(i)

    // case of not korean
    if (cCode < R.S || cCode > R.E) {
      stringSoFar = KoreanIME(stringSoFar, gksdud(str.charAt(i)))
    } else {
      stringSoFar += str.charAt(i)
    }
  }

  return stringSoFar
}

function destructiveKorean (str: string) {
  let first, middle, last

  const cnt = str.length
  const chars = []
  let cCode

  for (let i = 0; i < cnt; i++) {
    cCode = str.charCodeAt(i)

    if (cCode == 32) {
      chars.push(str.charAt(i))
      continue
    }

    // case of not korean
    if (cCode < R.S || cCode > R.E) {
      chars.push(str.charAt(i))
      continue
    }

    cCode = str.charCodeAt(i) - R.S

    last = cCode % 28 // get element of last
    middle = ((cCode - last) / 28) % 21 // get element of middle
    first = (((cCode - last) / 28) - middle) / 21 // get element of first

    chars.push(
      FIRSTs[first],
      ...DISASSAMBLED_MIDDLE[MIDDLEs[middle]] ? DISASSAMBLED_MIDDLE[MIDDLEs[middle]] : [MIDDLEs[middle]]
    )
    if (LASTs[last] !== '') {
      chars.push(
        ...DISASSAMBLED_LAST[LASTs[last]] ? DISASSAMBLED_LAST[LASTs[last]] : [LASTs[last]]
      )
    }
  }

  return chars
}

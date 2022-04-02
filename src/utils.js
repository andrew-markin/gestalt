import AES from 'crypto-js/aes'
import baseX from 'base-x'
import CryptoJS from 'crypto-js/core'
import HmacSHA256 from 'crypto-js/hmac-sha256'
import pako from 'pako'
import Vue from 'vue'

const REF_SALT = '270c151d9e99f4369e898aa262f01be1d0cdce5d40501b4baf6d4ab1725f84a5'

const uint8ArrayToWordArray = (source) => {
  const sourceLength = source.length
  const words = []
  for (var i = 0; i < sourceLength; i++) {
    words[i >>> 2] |= source[i] << (24 - (i % 4) * 8)
  }
  return CryptoJS.lib.WordArray.create(words, source.length)
}

const wordArrayToUint8Array = (wordArray) => {
  var words = wordArray.words
  var sigBytes = wordArray.sigBytes
  const result = new Uint8Array(sigBytes)
  for (let i = 0; i < sigBytes; i++) {
    result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return result
}

const base62 = baseX('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

export const generateKey = () => {
  const key = CryptoJS.lib.WordArray.random(256 / 8)
  return base62.encode(wordArrayToUint8Array(key))
}

export const keyToRef = (key) => {
  return HmacSHA256(key, REF_SALT).toString()
}

export const pack = (message, key) => {
  if (!message) return undefined
  const deflated = uint8ArrayToWordArray(pako.deflate(message))
  return AES.encrypt(deflated, key).toString()
}

export const unpack = (data, key) => {
  if (!data) return undefined
  const deflated = wordArrayToUint8Array(AES.decrypt(data, key))
  return pako.inflate(deflated, { to: 'string' })
}

let timestampDiff = 0

export const timestamp = () => {
  return (Date.now() + timestampDiff) * 1000 + Math.floor(Math.random() * 1000)
}

export const adjustTimestamp = (diff) => {
  timestampDiff = diff
}

export const moveCursorToEnd = (event) => {
  const element = event.target
  const position = element.value.length
  element.setSelectionRange(position, position)
}

Vue.prototype.$moveCursorToEnd = moveCursorToEnd

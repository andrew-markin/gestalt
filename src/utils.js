import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js/core'
import HmacSHA256 from 'crypto-js/hmac-sha256'
import pako from 'pako'

const ID_SALT = '270c151d9e99f4369e898aa262f01be1d0cdce5d40501b4baf6d4ab1725f84a5'

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

export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString() // 256 bit key
}

export const getIdFromKey = (key) => {
  return HmacSHA256(key, ID_SALT).toString()
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

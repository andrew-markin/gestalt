import CryptoJS from 'crypto-js/core'
import AES from 'crypto-js/aes'

export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString() // 256 bit key
}

export const encrypt = (message, key) => {
  return AES.encrypt(message, key).toString()
}

export const decrypt = (data, key) => {
  return AES.decrypt(data, key).toString(CryptoJS.enc.Utf8)
}

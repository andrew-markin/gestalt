import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js/core'
import HmacSHA256 from 'crypto-js/hmac-sha256'

export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString() // 256 bit key
}

export const encrypt = (message, key) => {
  return message ? AES.encrypt(message, key).toString() : undefined
}

export const decrypt = (data, key) => {
  return data ? AES.decrypt(data, key).toString(CryptoJS.enc.Utf8) : undefined
}

export const hmac = (data, key) => {
  return data ? HmacSHA256(data, key).toString() : undefined
}

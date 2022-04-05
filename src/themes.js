import colors from 'vuetify/lib/util/colors'

const common = {
  primary: colors.indigo.lighten1,
  success: colors.green.lighten1,
  error: colors.red,
  pipe: colors.grey
}

export const light = {
  ...common,
  background: '#ECECEC',
  foreground: '#FFFFFF'
}

export const dark = {
  ...common,
  background: '#1E1E1E',
  foreground: '#2C2C2C'
}

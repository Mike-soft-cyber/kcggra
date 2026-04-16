import Toast from 'react-native-toast-message';

export const toast = {
  success: (title, message) => Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'bottom',
  }),
  error: (title, message) => Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
    position: 'bottom',
  }),
  info: (title, message) => Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'bottom',
  }),
}
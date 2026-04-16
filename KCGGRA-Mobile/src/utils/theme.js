// theme.js — Design tokens for KCGGRA app

export const C = {
  // Backgrounds
  bg:          '#F2F5F3',   // Off-White / Light Mint — app background
  surface:     '#FFFFFF',   // Card / modal surface
  border:      '#D0DCDC',   // Subtle borders

  // Typography
  ink:         '#021317',   // Deep Charcoal — headings, heavy text
  body:        '#495B5E',   // Slate Grey — body text
  muted:       '#9FA8A7',   // Muted Sage — hints, disabled, placeholders

  // Accents
  gold:        '#FDE9AB',   // Soft Gold — badges, highlights
  goldText:    '#7A5C00',
  terra:       '#A76059',   // Terracotta — errors, destructive
  terraLight:  '#F9EDEB',

  // Primary (keep green for branding — map to deep charcoal header)
  primary:     '#021317',   // headers
  primaryText: '#FFFFFF',

  // Status
  green:       '#1D9E75',
  greenLight:  '#E1F5EE',
  greenText:   '#0F6E56',

  blue:        '#378ADD',
  blueLight:   '#E6F1FB',
  blueText:    '#185FA5',

  amber:       '#EF9F27',
  amberLight:  '#FAEEDA',
  amberText:   '#854F0B',

  red:         '#E24B4A',
  redLight:    '#FCEBEB',
  redText:     '#A32D2D',

  purple:      '#7F77DD',
  purpleLight: '#EEEDFE',
  purpleText:  '#3C3489',
}

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
}

export const SHADOW = {
  sm: {
    shadowColor: '#021317',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#021317',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
}
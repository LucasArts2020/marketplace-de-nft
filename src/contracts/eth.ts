const weiPerEth = 10n ** 18n

export function priceInWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole + fraction.padEnd(18, '0'))
}

export function priceInEth(value: bigint): string {
  const whole = value / weiPerEth
  const fraction = (value % weiPerEth).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

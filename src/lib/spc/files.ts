/** Server-side location of a scraped file. Browsers can't open SMB, so this is shown as the file's path, and opens in Finder where the OS allows. */
export const SHARE = 'smb://mfg-file01.txie.org/FabData'
export const fileUrl = (file: string) => `${SHARE}/${file.split('/').map(encodeURIComponent).join('/')}`

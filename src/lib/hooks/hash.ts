
export const generateID = (length = 8) => {
    const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
    const CUTOFF = 256 - (256 % ALPHABET.length);

    let id = "";
    const buf = new Uint8Array(length);

    while (id.length < length) {
        crypto.getRandomValues(buf);
        for (const byte of buf) {
        if (byte >= CUTOFF) continue;
        id += ALPHABET[byte % ALPHABET.length];
        if (id.length === length) break;
        }
    }

    return id;
}

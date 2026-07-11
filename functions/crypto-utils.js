/**
 * @file crypto-utils.js
 * @description Utilidades de cifrado y descifrado AES-256-GCM para PII.
 *              La clave se obtiene de Google Secret Manager y se cachea en memoria.
 */

const crypto = require('crypto');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const smClient = new SecretManagerServiceClient();
const SECRET_NAME = process.env.PII_ENCRYPTION_KEY_SECRET || 'projects/aip-v1-3f57c/secrets/PII_ENCRYPTION_KEY/versions/latest';
let cachedKey = null;

/**
 * Obtiene la clave de cifrado de Secret Manager (con caché en memoria).
 * @returns {Promise<Buffer>} Clave de 32 bytes para AES-256.
 */
async function getEncryptionKey() {
    if (cachedKey) return cachedKey;

    try {
        const [version] = await smClient.accessSecretVersion({ name: SECRET_NAME });
        const secretString = version.payload.data.toString('utf8');
        const keyBuffer = Buffer.from(secretString, 'hex');

        if (keyBuffer.length !== 32) {
            throw new Error(`PII Key length must be 32 bytes (64 hex chars), got ${keyBuffer.length}`);
        }

        cachedKey = keyBuffer;
        return cachedKey;
    } catch (error) {
        console.error('[CryptoUtils] Error fetching PII encryption key:', error);
        throw new Error('Internal Server Error: Encryption key unavailable.');
    }
}

/**
 * Cifra un objeto JSON usando AES-256-GCM.
 * @param {Object} data - Objeto a cifrar.
 * @returns {Promise<Object>} Objeto con { iv, ciphertext, tag } en formato hex.
 */
async function encryptData(data) {
    const key = await getEncryptionKey();
    const iv = crypto.randomBytes(12); // 12 bytes para GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const jsonStr = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        ciphertext: encrypted.toString('hex'),
        tag: tag.toString('hex')
    };
}

/**
 * Descifra un objeto cifrado con AES-256-GCM.
 * @param {Object} encryptedData - Objeto { iv, ciphertext, tag }.
 * @returns {Promise<Object>} Objeto JSON original.
 */
async function decryptData(encryptedData) {
    const key = await getEncryptionKey();
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.ciphertext, 'hex')),
        decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
}

module.exports = { encryptData, decryptData };

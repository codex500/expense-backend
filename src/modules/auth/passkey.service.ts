/**
 * Passkey (WebAuthn) service — handles registration and verification of passkeys.
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { query } from '../../config/database';
import { env } from '../../config/env';
import { BadRequestError, NotFoundError } from '../../shared/errors';

// In-memory challenge store (use Redis in production for multi-instance)
const challengeStore = new Map<string, string>();

export class PasskeyService {
  private rpID = env.WEBAUTHN_RP_ID;
  private rpName = env.WEBAUTHN_RP_NAME;
  private origin = env.WEBAUTHN_ORIGIN;

  /**
   * Generate registration options for a new passkey.
   */
  async generateRegistration(userId: string, email: string) {
    // Get existing passkeys for this user
    const { rows: existing } = await query(
      'SELECT credential_id FROM passkeys WHERE user_id = $1',
      [userId]
    );

    const excludeCredentials = existing.map((row: any) => ({
      id: row.credential_id,
      type: 'public-key' as const,
    }));

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge for verification
    challengeStore.set(userId, options.challenge);

    // Auto-expire challenge after 5 minutes
    setTimeout(() => challengeStore.delete(userId), 5 * 60 * 1000);

    return options;
  }

  /**
   * Verify registration response and store the new passkey.
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    deviceName?: string
  ) {
    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) {
      throw new BadRequestError('Registration challenge expired. Please try again.');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestError('Passkey verification failed.');
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    // Store passkey in database
    await query(
      `INSERT INTO passkeys (user_id, credential_id, public_key, counter, device_name, transports)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        Buffer.from(credential.id).toString('base64url'),
        Buffer.from(credential.publicKey).toString('base64url'),
        credential.counter,
        deviceName || credentialDeviceType || 'Unknown Device',
        response.response.transports || [],
      ]
    );

    challengeStore.delete(userId);

    return { verified: true, message: 'Passkey registered successfully.' };
  }

  /**
   * Generate authentication options for passkey login.
   */
  async generateAuthentication(userId: string) {
    const { rows } = await query(
      'SELECT credential_id, transports FROM passkeys WHERE user_id = $1',
      [userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('No passkeys registered for this user.');
    }

    const allowCredentials = rows.map((row: any) => ({
      id: row.credential_id,
      type: 'public-key' as const,
      transports: row.transports || [],
    }));

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    challengeStore.set(userId, options.challenge);
    setTimeout(() => challengeStore.delete(userId), 5 * 60 * 1000);

    return options;
  }

  /**
   * Verify authentication response for passkey login.
   */
  async verifyAuthentication(userId: string, response: AuthenticationResponseJSON) {
    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) {
      throw new BadRequestError('Authentication challenge expired. Please try again.');
    }

    const credentialId = response.id;

    const { rows } = await query(
      'SELECT credential_id, public_key, counter FROM passkeys WHERE user_id = $1 AND credential_id = $2',
      [userId, credentialId]
    );

    if (rows.length === 0) {
      throw new BadRequestError('Passkey not found.');
    }

    const passkey = rows[0];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: passkey.credential_id,
        publicKey: Buffer.from(passkey.public_key, 'base64url'),
        counter: Number(passkey.counter),
      },
    });

    if (!verification.verified) {
      throw new BadRequestError('Passkey authentication failed.');
    }

    // Update counter
    await query(
      'UPDATE passkeys SET counter = $1 WHERE credential_id = $2 AND user_id = $3',
      [verification.authenticationInfo.newCounter, credentialId, userId]
    );

    challengeStore.delete(userId);

    return { verified: true, message: 'Passkey verified successfully.' };
  }

  /**
   * List all passkeys for a user.
   */
  async listPasskeys(userId: string) {
    const { rows } = await query(
      'SELECT id, device_name, created_at FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  /**
   * Remove a passkey.
   */
  async removePasskey(userId: string, passkeyId: string) {
    const { rowCount } = await query(
      'DELETE FROM passkeys WHERE id = $1 AND user_id = $2',
      [passkeyId, userId]
    );
    if (rowCount === 0) {
      throw new NotFoundError('Passkey not found.');
    }
    return { message: 'Passkey removed successfully.' };
  }
}

export const passkeyService = new PasskeyService();

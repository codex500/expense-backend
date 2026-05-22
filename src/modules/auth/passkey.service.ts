import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { query } from '../../config/database';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../shared/errors';

const rpName = 'Trackify';
const rpID = new URL(env.APP_URL).hostname;
const origin = env.APP_URL.endsWith('/') ? env.APP_URL.slice(0, -1) : env.APP_URL;

// Simple in-memory challenge store (for production, use Redis or DB)
const challengeStore = new Map<string, string>();

export class PasskeyService {
  async generateRegistrationOptions(userId: string) {
    // 1. Get user details
    const { rows } = await query('SELECT email FROM public.user_profiles WHERE id = $1', [userId]);
    if (!rows.length) throw new NotFoundError('User not found');
    const userEmail = rows[0].email as string;

    // 2. Get existing passkeys to prevent re-registering
    const { rows: existingPasskeys } = await query('SELECT credential_id FROM public.user_passkeys WHERE user_id = $1', [userId]);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(userId)),
      userName: userEmail,
      excludeCredentials: existingPasskeys.map((pk: any) => ({
        id: pk.credential_id as string,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      attestationType: 'none',
    });

    challengeStore.set(`reg_${userId}`, options.challenge);

    return options;
  }

  async verifyRegistration(userId: string, body: any) {
    const expectedChallenge = challengeStore.get(`reg_${userId}`);
    if (!expectedChallenge) {
      throw new BadRequestError('Challenge expired or not found');
    }

    challengeStore.delete(`reg_${userId}`);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error: any) {
      throw new BadRequestError(`Registration failed: ${error.message}`);
    }

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Save passkey to DB
      await query(
        `INSERT INTO public.user_passkeys 
         (user_id, credential_id, public_key, counter, device_type, backed_up, transports)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          credential.id,
          Buffer.from(credential.publicKey),
          credential.counter,
          credentialDeviceType,
          credentialBackedUp,
          credential.transports ? credential.transports.join(',') : '',
        ]
      );

      return { verified: true };
    }
    
    throw new BadRequestError('Registration verification failed');
  }

  async generateAuthenticationOptions(email: string) {
    const { rows: users } = await query('SELECT id FROM public.user_profiles WHERE email = $1', [email]);
    if (!users.length) throw new NotFoundError('User not found');
    const userId = users[0].id;

    const { rows: passkeys } = await query('SELECT credential_id, transports FROM public.user_passkeys WHERE user_id = $1', [userId]);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map((pk: any) => ({
        id: pk.credential_id,
        type: 'public-key',
        transports: pk.transports ? pk.transports.split(',') as any[] : undefined,
      })),
      userVerification: 'preferred',
    });

    challengeStore.set(`auth_${email}`, options.challenge);

    return options;
  }

  async verifyAuthentication(email: string, body: any) {
    const expectedChallenge = challengeStore.get(`auth_${email}`);
    if (!expectedChallenge) {
      throw new BadRequestError('Challenge expired or not found');
    }
    challengeStore.delete(`auth_${email}`);

    const { rows: users } = await query('SELECT id, email, full_name FROM public.user_profiles WHERE email = $1', [email]);
    if (!users.length) throw new NotFoundError('User not found');
    const user = users[0];
    const userId = user.id;

    // Get the passkey from DB
    const { rows: passkeys } = await query(
      'SELECT public_key, counter FROM public.user_passkeys WHERE credential_id = $1 AND user_id = $2',
      [body.id, userId]
    );

    if (!passkeys.length) {
      throw new UnauthorizedError('Passkey not found for this user');
    }

    const passkey = passkeys[0];

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credential_id || body.id,
          publicKey: new Uint8Array(passkey.public_key as any),
          counter: Number(passkey.counter),
          transports: passkey.transports ? (passkey.transports as string).split(',') as any[] : undefined,
        },
      });
    } catch (error: any) {
      throw new UnauthorizedError(`Authentication failed: ${error.message}`);
    }

    if (verification.verified) {
      // Update counter
      await query(
        'UPDATE public.user_passkeys SET counter = $1 WHERE credential_id = $2',
        [verification.authenticationInfo.newCounter, body.id]
      );

      // Mint a JWT
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          aud: 'authenticated',
          role: 'authenticated',
          sub: userId,
          email: user.email
        },
        process.env.JWT_SECRET || '',
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
      );

      return { 
        verified: true, 
        user: { id: user.id, email: user.email, name: user.full_name }, 
        token 
      };
    }

    throw new UnauthorizedError('Authentication verification failed');
  }
}

export const passkeyService = new PasskeyService();

import { Details } from 'express-useragent';
import { AuthUserData } from 'src/core/classes/auth-user.data';

export class JwtPayload {
  /**
   * Token issuer
   * Application ID. Provided by request header
   */
  iss?: string;

  /**
   * Token subject
   * AuthUser ID
   */
  sub?: string;

  /**
   * JWT ID
   * Unique identifier for the JWT
   * AuthToken id
   */
  jti?: string;

  /**
   * Audience Claim
   * AuthLog ID.
   */
  aud?: string;

  /**
   * Issued At
   * Timestamp
   */
  iat?: number;

  /**
   * Expiration Time Claim
   * Timestamp
   */
  exp?: number;

  /**
   * No JWT standard field
   * User login
   */
  username?: string;

  /**
   * No JWT standard field
   * Incoming request IP
   */
  ip?: string;

  /**
   * No JWT standard field
   * Incoming request User Agent Infos
   * Getting by 'express-useragent' library
   */
  useragent?: Details | undefined;

  /**
   * No JWT standard field
   * AuthUser data for audience step
   */
  userData?: AuthUserData;
}

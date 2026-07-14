import axios from "axios";
import { SSO_TOKEN_API, SSO_PROFILE_API, SSO_STATUS_API, SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_REDIRECT_URL } from "../config.ts";

export interface SSOTokenResponse {
  accessToken: string;
  email?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface SSOProfile {
  email: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  facultyName?: string;
  [key: string]: unknown;
}

export async function exchangeCodeForToken(code: string): Promise<SSOTokenResponse> {
  const body = {
    code,
    redirectUrl: SSO_REDIRECT_URL,
    clientId: SSO_CLIENT_ID,
    clientSecret: SSO_CLIENT_SECRET,
  };

  const response = await axios.post<SSOTokenResponse>(SSO_TOKEN_API, body, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

export async function fetchUserProfile(accessToken: string): Promise<SSOProfile> {
  const response = await axios.post<SSOProfile>(SSO_PROFILE_API, '', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  // console.log("[SSO] Profile response:", JSON.stringify(response.data, null, 2));
  return response.data;
}

export async function verifyAuthStatus(accessToken: string): Promise<boolean> {
  try {
    // console.log("[SSO] Status check URL:", SSO_STATUS_API);
    const response = await axios.post(SSO_STATUS_API, '', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
    // console.log("[SSO] Status response:", JSON.stringify(response.data, null, 2));
    return response.data?.valid === true || response.status === 200;
  } catch {
    return false;
  }
}

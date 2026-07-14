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
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('redirect_uri', SSO_REDIRECT_URL);
  params.append('client_id', SSO_CLIENT_ID);
  params.append('client_secret', SSO_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code'); // Standard OAuth2 parameter, just in case

  const response = await axios.post<SSOTokenResponse>(SSO_TOKEN_API, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
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

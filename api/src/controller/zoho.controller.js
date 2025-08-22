const axios = require('axios');
const TokenModel = require('../model/zoho-token'); // Import the Token model
const { zohoClientId, zohoOauthTokenUrl, zohoRedirectUrl, zohoSecrete, zohoScope } = require('../config');

class TokenController {
    constructor() { }

    async generateAuthUrl() {
        const params = new URLSearchParams({
            scope: zohoScope,
            client_id: zohoClientId,
            response_type: 'code',
            redirect_uri: zohoRedirectUrl,
            access_type: 'offline',
            state: this.generateRandomState(),
            prompt: 'consent'
        });

        const authUrl = `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
        console.log('Generated auth URL:', authUrl);
        return authUrl;
    }

    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Method to exchange authorization code for tokens
    async exchangeCodeForTokens(code) {
        try {
            const response = await axios.post(
                zohoOauthTokenUrl,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    scope: zohoScope,
                    redirect_uri: zohoRedirectUrl,
                    client_id: zohoClientId,
                    client_secret: zohoSecrete
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            console.log({ response })
            const { access_token, refresh_token, expires_in, scope } = response.data;
            console.log(access_token, refresh_token, expires_in, scope)
            const expiresAt = new Date().getTime() + expires_in * 1000; // expires_in is in seconds
            console.log({ expiresAt })

            // Save tokens and expiration
            await this.saveTokens(access_token, refresh_token, expiresAt, scope);

            return { ok: true, data: { accessToken: access_token, refreshToken: refresh_token, expiresAt }, message: 'Tokens successfully exchanged and saved.' };
        } catch (error) {
            console.error("Error exchanging code for tokens :::", error.message);
            return { ok: false, data: null, message: error.message };
        }
    }

    // Method to save tokens to the database
    async saveTokens(accessToken, refreshToken, expiresAt, scope) {
        try {
            const updatedToken = await TokenModel.findOneAndUpdate(
                {}, // Empty query to update the first document (or create if none exists)
                {
                    accessToken,
                    refreshToken,
                    expiresAt,
                    scope
                },
                {
                    upsert: true,
                    new: true,
                }
            );
            console.log('Tokens saved successfully.');
            return updatedToken;
        } catch (error) {
            console.error('Error saving tokens:', error.message);
            throw new Error('Failed to save tokens');
        }
    }

    // Method to check if the access token is expired
    async isTokenExpired() {
        try {
            const tokenDoc = await TokenModel.findOne().sort({ createdAt: -1 }); // Get the latest token
            if (!tokenDoc) {
                return true; // No token found
            }

            const currentTime = new Date().getTime();
            return currentTime >= tokenDoc.expiresAt;
        } catch (error) {
            console.error('Error checking token expiration:', error.message);
            return true; // Assume expired in case of error
        }
    }

    // Method to refresh the access token
    async refreshAccessToken() {
        try {
            const tokenDoc = await TokenModel.findOne().sort({ createdAt: -1 }); // Get the latest token
            if (!tokenDoc) {
                throw new Error('No token found to refresh.');
            }

            const { refreshToken } = tokenDoc;
            const response = await axios.post(
                zohoOauthTokenUrl,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    redirect_uri: zohoRedirectUrl,
                    client_id: zohoClientId,
                    client_secret: zohoSecrete
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const { access_token, expires_in } = response.data;
            const expiresAt = new Date().getTime() + expires_in * 1000; // expires_in is in seconds

            // Update the token with the new access token and expiration
            await this.saveTokens(access_token, refreshToken, expiresAt);

            return { ok: true, data: { accessToken: access_token, expiresAt }, message: 'Access token successfully refreshed.' };
        } catch (error) {
            console.error('Error refreshing access token:', error);
            return { ok: false, data: null, message: error.message };
        }
    }

    // Method to get a valid access token
    async getAccessToken() {
        try {
            if (await this.isTokenExpired()) {
                const result = await this.refreshAccessToken();
                if (!result.ok) {
                    throw new Error(result.message);
                }
            }

            const tokenDoc = await TokenModel.findOne().sort({ createdAt: -1 }); // Get the latest token
            if (!tokenDoc) {
                throw new Error('No valid access token found.');
            }

            return { ok: true, data: tokenDoc.accessToken, message: 'Access token retrieved successfully.' };
        } catch (error) {
            console.error('Error getting access token:', error.message);
            return { ok: false, data: null, message: error.message };
        }
    }
}

module.exports = new TokenController();
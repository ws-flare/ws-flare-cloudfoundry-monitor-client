/**
 * Defines the attributes of an access token needed to communicate with Cloud Foundry
 */
export interface Token {
    token_type: string;
    access_token: string;
}

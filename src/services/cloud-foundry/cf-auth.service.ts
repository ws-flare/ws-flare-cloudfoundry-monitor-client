import { inject } from '@loopback/core';
import { post, Response } from 'web-request';

export class CfAuthService {

    @inject('cf.user')
    private cfUser: string;

    @inject('cf.pass')
    private cfPass: string;

    async login(authorization_endpoint: string): Promise<Response<string>> {
        return await post(`${authorization_endpoint}/oauth/token`, {
            headers: {
                Authorization: 'Basic Y2Y6',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            strictSSL: false,
            throwResponseError: true,
            json: true,
            form: {
                grant_type: 'password',
                client_id: 'cf',
                username: this.cfUser,
                password: this.cfPass
            }
        });
    }
}

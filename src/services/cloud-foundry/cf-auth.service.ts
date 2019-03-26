import { inject } from '@loopback/core';
import { post, Response } from 'web-request';
import { Token } from '../../models/token.model';

export class CfAuthService {

    @inject('cf.user')
    private cfUser: string;

    @inject('cf.pass')
    private cfPass: string;

    async login(authorization_endpoint: string): Promise<Token> {
        const token = await post(`${authorization_endpoint}/oauth/token`, {
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

        return token.content as any;
    }
}

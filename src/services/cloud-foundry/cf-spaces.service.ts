import { inject } from '@loopback/core';
import { get } from 'superagent';

export class CfSpacesService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.user')
    private cfUser: string;

    @inject('cf.pass')
    private cfPass: string;

    async getSpaces() {
        return await get(`${this.cfApi}/v2/info`);
    }
}

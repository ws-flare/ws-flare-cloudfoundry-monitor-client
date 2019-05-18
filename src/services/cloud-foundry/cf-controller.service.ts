import { inject } from '@loopback/core';
import { get } from 'superagent';

/**
 * Service for communicating with the Cloud Foundry controller service
 */
export class CfControllerService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.user')
    private cfUser: string;

    @inject('cf.pass')
    private cfPass: string;

    /**
     * Gets information from cloud foundry. this is necessary in order to get the authorization endpoint
     */
    async getControllerInfo() {
        return await get(`${this.cfApi}/v2/info`);
    }
}

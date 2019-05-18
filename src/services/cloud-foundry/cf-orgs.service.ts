import { inject } from '@loopback/core';
import { Token } from '../../models/token.model';
import { json } from 'web-request';
import { Org } from '../../models/org.model';
import { Page } from '../../models/page.model';
import { find } from 'lodash';
import { Logger } from 'winston';

/**
 * Service for interacting with Cloud Foundry Organizations endpoint
 */
export class CfOrgsService {

    @inject('logger')
    private logger: Logger;

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.org')
    private cfOrg: string;

    /**
     * Get a list of organizations from Cloud Foundry
     *
     * @param token - Access token
     * @param page - Page number for pagination
     */
    async getOrgs(token: Token, page: number = 1): Promise<Page<Org>> {
        return json(`${this.cfApi}/v2/organizations`, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`,
                Accept: "application/json"
            },
            strictSSL: false,
            throwResponseError: true,
            qs: {
                page
            }
        });
    }

    /**
     * Finds the requested organization id on cloud foundry
     *
     * @param token - Access token
     */
    async findOrg(token: Token): Promise<Org> {
        return new Promise(async (resolve, reject) => {
            let orgs = await this.getOrgs(token);

            this.logger.info('Got organizations');
            this.logger.info(orgs);

            for (let i = 1; i <= orgs.total_pages; i++) {
                const org = find(orgs.resources, ['entity.name', this.cfOrg]);

                this.logger.info('Got organizations');
                this.logger.info(orgs);

                if (org) {
                    return resolve(org);
                }

                orgs = await this.getOrgs(token, i);
            }

            reject(new Error('Unable to find organization'));
        });
    }
}

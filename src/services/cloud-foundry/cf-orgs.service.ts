import { inject } from '@loopback/core';
import { Token } from '../../models/token.model';
import { json } from 'web-request';
import { Org } from '../../models/org.model';
import { Page } from '../../models/page.model';
import { find } from 'lodash';

export class CfOrgsService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.org')
    private cfOrg: string;

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

    async findOrg(token: Token): Promise<Org> {
        return new Promise(async (resolve, reject) => {
            let orgs = await this.getOrgs(token);

            for (let i = 2; i < orgs.total_pages; i++) {
                const org = find(orgs.resources, ['entity.name', this.cfOrg]);

                if (org) {
                    return resolve(org);
                }

                orgs = await this.getOrgs(token, i);
            }

            reject(new Error('Unable to find organization'));
        });
    }
}

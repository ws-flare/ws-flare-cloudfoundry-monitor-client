import { inject } from '@loopback/core';
import { Page } from '../../models/page.model';
import { Space } from '../../models/space.model';
import { Token } from '../../models/token.model';
import { json } from 'web-request';
import { find } from 'lodash';
import { Org } from '../../models/org.model';

export class CfSpacesService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.space')
    private cfSpace: string;

    async getSpaces(token: Token, orgId: string, page: number = 1): Promise<Page<Space>> {
        return json(`${this.cfApi}/v2/organizations/${orgId}/spaces`, {
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

    async findSpace(token: Token, org: Org): Promise<Space> {
        return new Promise(async (resolve, reject) => {
            let spaces = await this.getSpaces(token, org.metadata.guid);

            for (let i = 2; i < spaces.total_pages; i++) {
                const space = find(spaces.resources, ['entity.name', this.cfSpace]);

                if (space) {
                    return resolve(space);
                }

                spaces = await this.getSpaces(token, org.metadata.guid, i);
            }

            reject(new Error('Unable to find organization'));
        });
    }
}

import {inject} from '@loopback/core';
import {Page} from '../../models/page.model';
import {Space} from '../../models/space.model';
import {Token} from '../../models/token.model';
import {json} from 'web-request';
import {find} from 'lodash';
import {Org} from '../../models/org.model';

/**
 * Service for interacting with the Cloud Foundry spaces API
 */
export class CfSpacesService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.space')
    private cfSpace: string;

    /**
     * Gets a list of spaces in an organization from Cloud Foundry
     *
     * @param token - Access token
     * @param orgId - Organization id
     * @param page - Page number for pagination
     */
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

    /**
     * Finds the correct space within an organization
     *
     * @param token - Access token
     * @param org - Organization
     */
    async findSpace(token: Token, org: Org): Promise<Space> {
        return new Promise(async (resolve, reject) => {
            let spaces = await this.getSpaces(token, org.metadata.guid);

            for (let i = 1; i <= spaces.total_pages; i++) {
                const space = find(spaces.resources, ['entity.name', this.cfSpace]);

                if (space) {
                    return resolve(space);
                }

                spaces = await this.getSpaces(token, org.metadata.guid, i);
            }

            reject(new Error('Unable to find space'));
        });
    }
}

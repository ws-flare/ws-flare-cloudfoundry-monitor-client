import { inject } from '@loopback/core';
import { Token } from '../../models/token.model';
import { json } from 'web-request';
import { Space } from '../../models/space.model';
import { Page } from '../../models/page.model';
import { find } from 'lodash';
import { App } from '../../models/app.model';

/**
 * Service for interacting with the apps api on Cloud Foundry
 */
export class CfAppsService {

    @inject('cf.api')
    private cfApi: string;

    @inject('cf.apps')
    private cfApps: string[];

    /**
     * Get a list of apps within a space
     *
     * @param token - Access token
     * @param spaceId - Space id
     * @param page - Page number for pagination
     */
    async getApps(token: Token, spaceId: string, page: number = 1): Promise<Page<Space>> {
        return json(`${this.cfApi}/v2/spaces/${spaceId}/apps`, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`
            },
            throwResponseError: true,
            strictSSL: false,
            qs: {
                page
            }
        });
    }

    /**
     * Finds the apps that the user wanted to monitor on Cloud Foundry
     *
     * @param token - Access token
     * @param space - Space id
     */
    async findApps(token: Token, space: Space): Promise<App[]> {
        return new Promise(async (resolve, reject) => {
            let apps = await this.getApps(token, space.metadata.guid);
            let foundApps: App[] = [];

            for (let i = 1; i <= apps.total_pages; i++) {

                this.cfApps.forEach((app) => {
                    const foundApp: any = find(apps.resources, ['entity.name', app]);

                    if (foundApp) {
                        foundApps.push(foundApp);
                    }
                });

                if (foundApps.length === this.cfApps.length) {
                    return resolve(foundApps);
                }

                apps = await this.getApps(token, space.metadata.guid, i);
            }

            reject(new Error('Unable to find all apps'));
        });
    }
}

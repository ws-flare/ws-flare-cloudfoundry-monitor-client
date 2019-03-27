import { inject } from '@loopback/core';
import { Token } from '../models/token.model';
import { CfOrgsService } from './cloud-foundry/cf-orgs.service';
import { CfSpacesService } from './cloud-foundry/cf-spaces.service';
import { CfAppsService } from './cloud-foundry/cf-apps.service';
import { Logger } from 'winston';

export class MonitorService {

    @inject('logger')
    private logger: Logger;

    @inject('services.cfOrgs')
    private cfOrgsService: CfOrgsService;

    @inject('services.cfSpaces')
    private cfSpacesService: CfSpacesService;

    @inject('services.cfApps')
    private cfAppsService: CfAppsService;

    async monitor(token: Token) {
        const org = await this.cfOrgsService.findOrg(token);

        this.logger.info(org);

        const space = await this.cfSpacesService.findSpace(token, org);

        this.logger.info(space);

        const apps = await this.cfAppsService.findApps(token, space);

        this.logger.info(apps);
    }
}

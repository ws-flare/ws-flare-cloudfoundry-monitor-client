import { inject } from '@loopback/core';
import { Token } from '../models/token.model';
import { CfOrgsService } from './cloud-foundry/cf-orgs.service';
import { CfSpacesService } from './cloud-foundry/cf-spaces.service';

export class MonitorService {

    @inject('services.cfOrgs')
    private cfOrgsService: CfOrgsService;

    @inject('services.cfSpaces')
    private cfSpacesService: CfSpacesService;

    async monitor(token: Token) {
        const org = await this.cfOrgsService.findOrg(token);

        const space = await this.cfSpacesService.findSpace(token, org);
    }
}

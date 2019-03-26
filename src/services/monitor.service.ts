import { inject } from '@loopback/core';
import { Token } from '../models/token.model';
import { CfOrgsService } from './cloud-foundry/cf-orgs.service';

export class MonitorService {

    @inject('services.cfOrgs')
    private cfOrgsService: CfOrgsService;

    async monitor(token: Token) {
        const org = await this.cfOrgsService.findOrg(token);
    }
}

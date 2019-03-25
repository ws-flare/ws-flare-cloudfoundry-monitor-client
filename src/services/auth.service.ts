import { inject } from '@loopback/core';
import { CfControllerService } from './cloud-foundry/cf-controller.service';
import { CfAuthService } from './cloud-foundry/cf-auth.service';
import { Logger } from 'winston';

export class AuthService {

    @inject('logger')
    private logger: Logger;

    @inject('services.cfController')
    private cfController: CfControllerService;

    @inject('services.cfAuth')
    private cfAuth: CfAuthService;

    async login(): Promise<string> {
        const controller = await this.cfController.getControllerInfo();

        this.logger.info(controller.body);

        const token = await this.cfAuth.login(controller.body.authorization_endpoint);

        this.logger.info(token.content);

        return token.content;
    }
}
import { inject } from '@loopback/core';
import { json } from 'web-request';
import { AppStat } from '../../models/app-stat.model';
import { Token } from '../../models/token.model';
import { App } from '../../models/app.model';
import { each, forever, forEachOf } from 'async';
import { Logger } from 'winston';
import { CfMonitorService } from '../apis/cf-monitor.service';

export class CfStatsService {

    @inject('logger')
    private logger: Logger;

    @inject('cf.api')
    private cfApi: string;

    @inject('services.cfMonitor')
    private cfMonitorService: CfMonitorService;

    async getAppStats(token: Token, appId: string): Promise<{ [key: string]: AppStat }> {
        return await json(`${this.cfApi}/v2/apps/${appId}/stats`, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`
            },
            throwResponseError: true,
            strictSSL: false
        });
    }

    async monitor(token: Token, apps: App[]) {
        forever(next => {
            this.logger.info('In forever and monitoring');
            this.monitorInParallel(token, apps)
                .then(() => this.wait())
                .then(() => next())
                .catch(err => next(err))
        }, (err: Error) => {
            this.logger.error(err);
        });
    }

    private monitorInParallel(token: Token, apps: App[]) {
        return new Promise((resolve, reject) => {
            each(apps, (app, callback) => {
                this.getAppStats(token, app.metadata.guid)
                    .then((appStat) => this.recordUsage(app, appStat))
                    .then(() => callback())
                    .catch(err => callback(err))
            }, (err) => err ? reject(err) : resolve());
        });
    }

    private recordUsage(app: App, stats: { [key: string]: AppStat }) {
        return new Promise((resolve, reject) => {
            forEachOf(stats, (item, key, callback) => {
                this.cfMonitorService.createUsage(app, item, key as string)
                    .then(() => callback())
                    .catch((err) => callback(err));
            }, (err) => err ? reject(err) : resolve());
        });
    }

    async wait() {
        return new Promise(resolve => setTimeout(() => resolve(), 1000));
    }
}
